import { computed, markRaw, shallowRef } from 'vue'
import { parseEbookFile } from '@/utils/ebookParser'
import {
  deleteBook,
  getChapterContent,
  loadBooksWithMigration,
  putBookMeta,
  putChapterContents,
  type EbookBook,
} from '@/utils/ebookDb'

export type { EbookBook }

function createId() {
  return crypto.randomUUID()
}

/** Metadata only — chapter bodies stay in IDB / content cache. */
const books = shallowRef<EbookBook[]>([])
const ready = shallowRef(false)
const loadError = shallowRef<string | null>(null)

const contentCache = new Map<string, string>()

/** Flush chapter bodies to IDB in small batches during stream parse. */
const CONTENT_FLUSH_BATCH = 24

let bootPromise: Promise<void> | null = null

function boot() {
  if (!bootPromise) {
    bootPromise = loadBooksWithMigration()
      .then((rows) => {
        books.value = rows.map((b) => markRaw(b))
        loadError.value = null
      })
      .catch(() => {
        loadError.value = '无法打开本地书库（IndexedDB）'
        books.value = []
      })
      .finally(() => {
        ready.value = true
      })
  }
  return bootPromise
}

boot()

function titleFromFileName(name: string) {
  return name.replace(/\.txt$/i, '').trim() || '未命名电子书'
}

function isTxtFile(file: File) {
  const lower = file.name.toLowerCase()
  return lower.endsWith('.txt') || file.type === 'text/plain'
}

function storageFailMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'QuotaExceededError') {
    return '本地存储空间不足，保存失败'
  }
  return '保存到本地失败'
}

function clearContentCacheForBook(book: EbookBook) {
  for (const ch of book.chapters) {
    contentCache.delete(ch.id)
  }
}

function encodingLabel(encoding: string) {
  if (encoding === 'gb18030') return 'GBK/GB18030'
  if (encoding === 'utf-8') return 'UTF-8'
  return encoding.toUpperCase()
}

export function useEbookLibrary() {
  const sortedBooks = computed(() =>
    [...books.value].sort(
      (a, b) => new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime(),
    ),
  )

  function getBook(id: string) {
    return books.value.find((b) => b.id === id) ?? null
  }

  async function loadChapterText(chapterId: string): Promise<string> {
    await boot()
    const cached = contentCache.get(chapterId)
    if (cached !== undefined) return cached

    const content = await getChapterContent(chapterId)
    contentCache.set(chapterId, content)
    return content
  }

  async function touchVisited(id: string) {
    await boot()
    const book = books.value.find((b) => b.id === id)
    if (!book) return

    const next = markRaw({
      ...book,
      chapters: book.chapters,
      lastVisitedAt: new Date().toISOString(),
    })
    books.value = books.value.map((b) => (b.id === id ? next : b))

    try {
      await putBookMeta(next)
    } catch {
      // keep memory update
    }
  }

  async function importTxtFile(
    file: File,
  ): Promise<{ ok: true; book: EbookBook; encoding: string } | { ok: false; message: string }> {
    await boot()

    if (!isTxtFile(file)) {
      return { ok: false, message: '仅支持 .txt 文本文件' }
    }
    if (file.size === 0) {
      return { ok: false, message: '文件内容为空' }
    }

    const bookId = createId()
    const now = new Date().toISOString()
    const pending: Array<{ id: string; content: string }> = []
    let firstChapterId = ''
    let firstChapterContent = ''
    let wroteAnyContent = false

    const flushPending = async () => {
      if (pending.length === 0) return
      const batch = pending.splice(0, pending.length)
      await putChapterContents(bookId, batch)
      wroteAnyContent = true
    }

    try {
      const result = await parseEbookFile(file, async (chapter) => {
        if (!firstChapterId) {
          firstChapterId = chapter.id
          firstChapterContent = chapter.content
        }
        pending.push({ id: chapter.id, content: chapter.content })
        if (pending.length >= CONTENT_FLUSH_BATCH) {
          await flushPending()
        }
      })

      if (result.chapters.length === 0) {
        if (wroteAnyContent) await deleteBook(bookId)
        return { ok: false, message: '文件内容为空' }
      }

      const onlyEmptyFullText =
        result.chapters.length === 1 &&
        result.chapters[0]?.title === '全文' &&
        !firstChapterContent.trim()

      if (onlyEmptyFullText) {
        if (wroteAnyContent) await deleteBook(bookId)
        return { ok: false, message: '文件内容为空' }
      }

      await flushPending()

      const book = markRaw({
        id: bookId,
        title: titleFromFileName(file.name),
        owner: '我',
        location: '本地',
        createdAt: now,
        lastVisitedAt: now,
        // Copy metas so later parser/state mutations cannot clear the library entry
        chapters: result.chapters.map((ch) => ({ ...ch })),
      } satisfies EbookBook)

      await putBookMeta(book)

      if (firstChapterId) contentCache.set(firstChapterId, firstChapterContent)
      books.value = [book, ...books.value]
      return { ok: true, book, encoding: encodingLabel(result.encoding) }
    } catch (error) {
      try {
        await deleteBook(bookId)
      } catch {
        // ignore cleanup failure
      }
      return { ok: false, message: storageFailMessage(error) }
    }
  }

  async function removeBook(id: string) {
    await boot()
    const target = books.value.find((b) => b.id === id)
    const prev = books.value
    books.value = books.value.filter((b) => b.id !== id)
    if (target) clearContentCacheForBook(target)

    try {
      await deleteBook(id)
    } catch {
      books.value = prev
    }
  }

  return {
    books: sortedBooks,
    ready,
    loadError,
    getBook,
    loadChapterText,
    touchVisited,
    importTxtFile,
    removeBook,
  }
}
