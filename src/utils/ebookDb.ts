import { isEbookTextEncoding, type EbookTextEncoding } from '@/utils/ebookEncoding'
import type { EbookHeadingLevel } from '@/utils/ebookParser'

export interface EbookChapterMeta {
  id: string
  title: string
  level: EbookHeadingLevel
  /** Set when the chapter body is stored as slices. Absent on legacy single-blob chapters. */
  sliceCount?: number
}

/** Book list / TOC only — no chapter bodies. */
export interface EbookBook {
  id: string
  title: string
  owner: string
  location: string
  createdAt: string
  lastVisitedAt: string
  chapters: EbookChapterMeta[]
  /**
   * `parsing` is persisted only so a refresh mid-import can be discarded.
   * `ready` books omit it. Progress stays in memory.
   */
  status?: 'parsing' | 'ready'
  parseProgress?: number
  /** Encoding used for the stored chapter text. */
  encoding?: EbookTextEncoding
  /** True when the original txt bytes are kept in the sources store. */
  hasSource?: boolean
}

export interface EbookSourceRecord {
  bookId: string
  blob: Blob
  fileName: string
}

interface EbookChapterContentRow {
  id: string
  bookId: string
  content: string
}

/** Legacy v1 shape (content embedded in chapters). */
interface LegacyEbookBook {
  id: string
  title: string
  owner: string
  location: string
  createdAt: string
  lastVisitedAt: string
  chapters: Array<EbookChapterMeta & { content?: string }>
}

const DB_NAME = 'bighead-ebook'
const DB_VERSION = 3
const BOOK_STORE = 'books'
const CONTENT_STORE = 'contents'
const SOURCE_STORE = 'sources'
const LEGACY_LS_KEY = 'bighead-ebook-library'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = request.result
      const tx = request.transaction
      if (!tx) return

      if (!db.objectStoreNames.contains(BOOK_STORE)) {
        const store = db.createObjectStore(BOOK_STORE, { keyPath: 'id' })
        store.createIndex('lastVisitedAt', 'lastVisitedAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        const store = db.createObjectStore(CONTENT_STORE, { keyPath: 'id' })
        store.createIndex('bookId', 'bookId', { unique: false })
      }

      if (!db.objectStoreNames.contains(SOURCE_STORE)) {
        db.createObjectStore(SOURCE_STORE, { keyPath: 'bookId' })
      }

      if (event.oldVersion < 2 && db.objectStoreNames.contains(BOOK_STORE)) {
        const bookStore = tx.objectStore(BOOK_STORE)
        const contentStore = tx.objectStore(CONTENT_STORE)

        bookStore.openCursor().onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result
          if (!cursor) return

          const book = cursor.value as LegacyEbookBook
          const chapters = Array.isArray(book.chapters) ? book.chapters : []
          const hasEmbedded = chapters.some((ch) => typeof ch.content === 'string')

          if (hasEmbedded) {
            for (const ch of chapters) {
              contentStore.put({
                id: ch.id,
                bookId: book.id,
                content: typeof ch.content === 'string' ? ch.content : '',
              } satisfies EbookChapterContentRow)
            }
            cursor.update({
              id: book.id,
              title: book.title,
              owner: book.owner,
              location: book.location,
              createdAt: book.createdAt,
              lastVisitedAt: book.lastVisitedAt,
              chapters: chapters.map(({ id, title, level }) => ({ id, title, level })),
            } satisfies EbookBook)
          }

          cursor.continue()
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('打开 IndexedDB 失败'))
  })
}

function runTx(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  execute: (tx: IDBTransaction) => void,
): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeNames, mode)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 事务失败'))
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB 事务中止'))
        try {
          execute(tx)
        } catch (error) {
          reject(error)
        }
      }),
  )
}

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 请求失败'))
  })
}

function toChapterMeta(ch: EbookChapterMeta & { content?: string }): EbookChapterMeta {
  const meta: EbookChapterMeta = { id: ch.id, title: ch.title, level: ch.level }
  if (typeof ch.sliceCount === 'number' && Number.isFinite(ch.sliceCount)) {
    meta.sliceCount = ch.sliceCount
  }
  return meta
}

function normalizeBook(raw: LegacyEbookBook | EbookBook): EbookBook {
  const book: EbookBook = {
    id: raw.id,
    title: raw.title,
    owner: raw.owner,
    location: raw.location,
    createdAt: raw.createdAt,
    lastVisitedAt: raw.lastVisitedAt,
    chapters: (raw.chapters ?? []).map((ch) => toChapterMeta(ch)),
  }
  if ('status' in raw && raw.status === 'parsing') book.status = 'parsing'
  if ('encoding' in raw && isEbookTextEncoding(raw.encoding)) book.encoding = raw.encoding
  if ('hasSource' in raw && raw.hasSource === true) book.hasSource = true
  return book
}

export function chapterSliceId(chapterId: string, index: number) {
  return `${chapterId}#${index}`
}

/** Legacy blob id plus every slice id. Missing keys are safe to delete. */
export function chapterContentIds(chapter: EbookChapterMeta): string[] {
  const ids = [chapter.id]
  const count = chapter.sliceCount ?? 0
  for (let index = 0; index < count; index += 1) ids.push(chapterSliceId(chapter.id, index))
  return ids
}

export async function getAllBooks(): Promise<EbookBook[]> {
  const db = await openDb()
  const tx = db.transaction(BOOK_STORE, 'readonly')
  const rows = await req(tx.objectStore(BOOK_STORE).getAll())
  return (Array.isArray(rows) ? rows : []).map(normalizeBook)
}

export async function putBookWithContents(
  book: EbookBook,
  contents: Array<{ id: string; content: string }>,
): Promise<void> {
  const meta = normalizeBook(book)
  await runTx([BOOK_STORE, CONTENT_STORE], 'readwrite', (tx) => {
    tx.objectStore(BOOK_STORE).put(meta)
    const contentStore = tx.objectStore(CONTENT_STORE)
    for (const row of contents) {
      contentStore.put({
        id: row.id,
        bookId: meta.id,
        content: row.content,
      } satisfies EbookChapterContentRow)
    }
  })
}

export async function putBookMeta(book: EbookBook): Promise<void> {
  const meta = normalizeBook(book)
  await runTx(BOOK_STORE, 'readwrite', (tx) => {
    tx.objectStore(BOOK_STORE).put(meta)
  })
}

/** Write one or more chapter bodies (streaming import batches). */
export async function putChapterContents(
  bookId: string,
  rows: Array<{ id: string; content: string }>,
): Promise<void> {
  if (rows.length === 0) return
  await runTx(CONTENT_STORE, 'readwrite', (tx) => {
    const store = tx.objectStore(CONTENT_STORE)
    for (const row of rows) {
      store.put({
        id: row.id,
        bookId,
        content: row.content,
      } satisfies EbookChapterContentRow)
    }
  })
}

export async function getChapterContent(chapterId: string): Promise<string> {
  const db = await openDb()
  const tx = db.transaction(CONTENT_STORE, 'readonly')
  const row = await req<EbookChapterContentRow | undefined>(
    tx.objectStore(CONTENT_STORE).get(chapterId),
  )
  return row?.content ?? ''
}

export async function getChapterSlice(chapterId: string, index: number): Promise<string | null> {
  const db = await openDb()
  const tx = db.transaction(CONTENT_STORE, 'readonly')
  const row = await req<EbookChapterContentRow | undefined>(
    tx.objectStore(CONTENT_STORE).get(chapterSliceId(chapterId, index)),
  )
  return row?.content ?? null
}

export async function deleteContent(id: string): Promise<void> {
  await runTx(CONTENT_STORE, 'readwrite', (tx) => {
    tx.objectStore(CONTENT_STORE).delete(id)
  })
}

export async function deleteContents(ids: string[]): Promise<void> {
  const size = 200
  for (let i = 0; i < ids.length; i += size) {
    const batch = ids.slice(i, i + size)
    await runTx(CONTENT_STORE, 'readwrite', (tx) => {
      const store = tx.objectStore(CONTENT_STORE)
      for (const id of batch) store.delete(id)
    })
  }
}

export async function putBookSource(bookId: string, blob: Blob, fileName: string): Promise<void> {
  await runTx(SOURCE_STORE, 'readwrite', (tx) => {
    tx.objectStore(SOURCE_STORE).put({
      bookId,
      blob,
      fileName,
    } satisfies EbookSourceRecord)
  })
}

export async function getBookSource(bookId: string): Promise<EbookSourceRecord | null> {
  const db = await openDb()
  const tx = db.transaction(SOURCE_STORE, 'readonly')
  const row = await req<EbookSourceRecord | undefined>(tx.objectStore(SOURCE_STORE).get(bookId))
  return row ?? null
}

export async function deleteBook(id: string): Promise<void> {
  await runTx([BOOK_STORE, CONTENT_STORE, SOURCE_STORE], 'readwrite', (tx) => {
    const contentStore = tx.objectStore(CONTENT_STORE)
    const index = contentStore.index('bookId')
    const bookStore = tx.objectStore(BOOK_STORE)

    index.openCursor(IDBKeyRange.only(id)).onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result
      if (!cursor) return
      cursor.delete()
      cursor.continue()
    }
    bookStore.delete(id)
    tx.objectStore(SOURCE_STORE).delete(id)
  })
}

function readLegacyLocalStorage(): LegacyEbookBook[] {
  try {
    const raw = localStorage.getItem(LEGACY_LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LegacyEbookBook[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Load book metas; migrate legacy localStorage once if IDB books are empty. */
export async function loadBooksWithMigration(): Promise<EbookBook[]> {
  const existing = await getAllBooks()
  const stuck = existing.filter((book) => book.status === 'parsing')
  if (stuck.length > 0) {
    for (const book of stuck) {
      try {
        await deleteBook(book.id)
      } catch {
        // keep going; a stuck import should not block the shelf
      }
    }
  }
  const ready = existing.filter((book) => book.status !== 'parsing')
  if (ready.length > 0 || stuck.length > 0) return ready

  const legacy = readLegacyLocalStorage()
  if (legacy.length === 0) return []

  for (const book of legacy) {
    const meta: EbookBook = {
      id: book.id,
      title: book.title,
      owner: book.owner,
      location: book.location,
      createdAt: book.createdAt,
      lastVisitedAt: book.lastVisitedAt,
      chapters: (book.chapters ?? []).map((ch) => toChapterMeta(ch)),
    }
    const contents = (book.chapters ?? []).map((ch) => ({
      id: ch.id,
      content: typeof ch.content === 'string' ? ch.content : '',
    }))
    await putBookWithContents(meta, contents)
  }

  try {
    localStorage.removeItem(LEGACY_LS_KEY)
  } catch {
    // ignore
  }

  return getAllBooks()
}
