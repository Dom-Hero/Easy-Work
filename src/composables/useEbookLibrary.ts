import { computed, markRaw, shallowRef } from 'vue'
import {
  parseEbookFile,
  splitTextIntoSlices,
  splitTextIntoSlicesAsync,
  type EbookSlice,
} from '@/utils/ebookParser'
import {
  chapterSliceId,
  deleteBook,
  deleteContent,
  getChapterContent,
  getChapterSlice,
  loadBooksWithMigration,
  putBookMeta,
  putChapterContents,
  type EbookBook,
  type EbookChapterMeta,
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
/** Legacy chapters split in memory so the reader never mounts the whole blob. */
const legacySlices = new Map<string, string[]>()
const cancelledIds = new Set<string>()

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
    legacySlices.delete(ch.id)
    for (const key of contentCache.keys()) {
      if (key === ch.id || key.startsWith(`${ch.id}#`)) contentCache.delete(key)
    }
  }
}

function patchBook(id: string, patch: Partial<EbookBook>) {
  if (!books.value.some((b) => b.id === id)) return
  books.value = books.value.map((b) =>
    b.id === id ? markRaw({ ...b, ...patch, chapters: patch.chapters ?? b.chapters }) : b,
  )
}

const metaWrites = new Map<string, Promise<void>>()

function enqueueBookMeta(id: string) {
  const prev = metaWrites.get(id) ?? Promise.resolve()
  const next = prev
    .catch(() => undefined)
    .then(async () => {
      const latest = books.value.find((b) => b.id === id)
      if (!latest || latest.status === 'parsing') return
      await putBookMeta(latest)
    })
  metaWrites.set(id, next)
  return next
}

function scheduleLegacyPersist(bookId: string, chapterId: string, slices: string[]) {
  void (async () => {
    try {
      for (let i = 0; i < slices.length; i += CONTENT_FLUSH_BATCH) {
        if (cancelledIds.has(bookId) || !books.value.some((b) => b.id === bookId)) return
        const batch = slices.slice(i, i + CONTENT_FLUSH_BATCH).map((content, offset) => ({
          id: chapterSliceId(chapterId, i + offset),
          content,
        }))
        await putChapterContents(bookId, batch)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
      if (cancelledIds.has(bookId) || !books.value.some((b) => b.id === bookId)) return
      const book = books.value.find((b) => b.id === bookId)
      if (!book) return
      const chapters = book.chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, sliceCount: slices.length } : ch,
      )
      books.value = books.value.map((b) => (b.id === bookId ? markRaw({ ...b, chapters }) : b))
      await enqueueBookMeta(bookId)
      await deleteContent(chapterId)
    } catch {
      // memory slices still serve this session
    }
  })()
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

  async function loadChapterPiece(
    chapter: EbookChapterMeta,
    index: number,
  ): Promise<{ text: string; sliceCount: number }> {
    await boot()

    const memory = legacySlices.get(chapter.id)
    if (memory) {
      return { text: memory[index] ?? '', sliceCount: memory.length }
    }

    if (typeof chapter.sliceCount === 'number') {
      const key = chapterSliceId(chapter.id, index)
      const cached = contentCache.get(key)
      if (cached !== undefined) return { text: cached, sliceCount: chapter.sliceCount }
      const text = (await getChapterSlice(chapter.id, index)) ?? ''
      contentCache.set(key, text)
      return { text, sliceCount: chapter.sliceCount }
    }

    const full = await getChapterContent(chapter.id)
    const slices =
      full.length > 200_000
        ? await splitTextIntoSlicesAsync(full)
        : splitTextIntoSlices(full)
    const stored = slices.length > 0 ? slices : ['']
    legacySlices.set(chapter.id, stored)

    const book = books.value.find((b) => b.chapters.some((ch) => ch.id === chapter.id))
    if (book) scheduleLegacyPersist(book.id, chapter.id, stored)

    return { text: stored[index] ?? '', sliceCount: stored.length }
  }

  async function touchVisited(id: string) {
    await boot()
    const book = books.value.find((b) => b.id === id)
    if (!book || book.status === 'parsing') return

    const lastVisitedAt = new Date().toISOString()
    books.value = books.value.map((b) => (b.id === id ? markRaw({ ...b, lastVisitedAt }) : b))

    try {
      await enqueueBookMeta(id)
    } catch {
      // keep memory update
    }
  }

  async function importTxtFile(
    file: File,
  ): Promise<
    | { ok: true; book: EbookBook; encoding: string }
    | { ok: false; message: string; cancelled?: boolean }
  > {
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
    let sawText = false
    const firstSlice: { current: EbookSlice | null } = { current: null }
    let lastProgressAt = 0
    let lastPct = -1

    const placeholder = markRaw({
      id: bookId,
      title: titleFromFileName(file.name),
      owner: '我',
      location: '本地',
      createdAt: now,
      lastVisitedAt: now,
      chapters: [],
      status: 'parsing' as const,
      parseProgress: 0,
    } satisfies EbookBook)

    books.value = [placeholder, ...books.value.filter((b) => b.id !== bookId)]

    const ensureActive = () => {
      if (cancelledIds.has(bookId)) throw new Error('CANCELLED')
    }

    const flushPending = async () => {
      ensureActive()
      if (pending.length === 0) return
      const batch = pending.splice(0, pending.length)
      await putChapterContents(bookId, batch)
    }

    const reportProgress = (ratio: number) => {
      const pct = Math.max(0, Math.min(99, Math.round(ratio * 100)))
      const nowMs = Date.now()
      if (pct === lastPct) return
      if (pct < 99 && nowMs - lastProgressAt < 200) return
      lastPct = pct
      lastProgressAt = nowMs
      patchBook(bookId, { parseProgress: pct, status: 'parsing' })
    }

    try {
      await putBookMeta(placeholder)

      const result = await parseEbookFile(file, {
        onSlice: async (slice) => {
          ensureActive()
          if (slice.content.trim()) sawText = true
          if (!firstSlice.current && slice.index === 0) firstSlice.current = slice
          pending.push({ id: chapterSliceId(slice.chapterId, slice.index), content: slice.content })
          if (pending.length >= CONTENT_FLUSH_BATCH) await flushPending()
        },
        onProgress: reportProgress,
      })

      ensureActive()

      const hasHeading = result.chapters.some((ch) => ch.title !== '全文' && ch.title !== '序言')
      if ((!sawText && !hasHeading) || result.chapters.length === 0) {
        books.value = books.value.filter((b) => b.id !== bookId)
        await deleteBook(bookId)
        return { ok: false, message: '文件内容为空' }
      }

      await flushPending()
      ensureActive()

      const book = markRaw({
        id: bookId,
        title: placeholder.title,
        owner: '我',
        location: '本地',
        createdAt: now,
        lastVisitedAt: now,
        chapters: result.chapters.map((ch) => ({ ...ch })),
      } satisfies EbookBook)

      const readyBook = markRaw({ ...book, status: 'ready' as const, parseProgress: 100 })
      books.value = books.value.some((b) => b.id === bookId)
        ? books.value.map((b) => (b.id === bookId ? readyBook : b))
        : [readyBook, ...books.value]
      await enqueueBookMeta(bookId)
      if (firstSlice.current) {
        const slice = firstSlice.current
        contentCache.set(chapterSliceId(slice.chapterId, slice.index), slice.content)
      }
      return { ok: true, book: readyBook, encoding: encodingLabel(result.encoding) }
    } catch (error) {
      books.value = books.value.filter((b) => b.id !== bookId)
      try {
        await deleteBook(bookId)
      } catch {
        // ignore cleanup failure
      }
      if (error instanceof Error && error.message === 'CANCELLED') {
        return { ok: false, message: '已取消', cancelled: true }
      }
      return { ok: false, message: storageFailMessage(error) }
    } finally {
      cancelledIds.delete(bookId)
    }
  }

  async function removeBook(id: string) {
    await boot()
    cancelledIds.add(id)
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
    loadChapterPiece,
    touchVisited,
    importTxtFile,
    removeBook,
  }
}
