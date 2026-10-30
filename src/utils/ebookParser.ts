import {
  createTextDecoder,
  detectTextEncoding,
  readFileHead,
  type EbookTextEncoding,
} from '@/utils/ebookEncoding'

export type EbookHeadingLevel = 1 | 2 | 3

export interface EbookChapter {
  id: string
  title: string
  level: EbookHeadingLevel
  content: string
}

export interface EbookChapterMeta {
  id: string
  title: string
  level: EbookHeadingLevel
  /** How many stored slices this chapter was split into. Omitted on legacy books. */
  sliceCount?: number
}

export interface EbookSlice {
  chapterId: string
  index: number
  content: string
}

/** One reading slice. Keeps a single chapter body off the main-thread render path. */
export const EBOOK_SLICE_CHARS = 12_000

const MD_HEADING = /^(#{1,3})\s+(.+?)\s*$/
/** 第1章 / 第一章 / 第 1 章 / 第１章（全角数字）/ 第一章标题 */
const CN_NUM = '[零〇一二三四五六七八九十百千万两\\d０-９]+'
const CN_CHAPTER = new RegExp(`^第\\s*${CN_NUM}\\s*章(?:\\s*[:：、.\\-—-]?\\s*(.*))?$`)
const CN_SECTION = new RegExp(`^第\\s*${CN_NUM}\\s*节(?:\\s*[:：、.\\-—-]?\\s*(.*))?$`)
const CN_SPECIAL = /^(楔子|序章|序言|引子|前言|引言|prologue|终章|尾声|后记|番外(?:\s*.*)?)$/i
const CN_BRACKET_CHAPTER =
  /^[【\[]\s*(第\s*[零〇一二三四五六七八九十百千万两\d０-９]+\s*章.*?)[】\]]$/

/** Yield to the browser every N lines so huge files don't freeze the UI. */
const YIELD_EVERY_LINES = 400

function createId() {
  return crypto.randomUUID()
}

function normalizeHeadingLine(line: string): string {
  return line
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
}

function detectHeading(line: string): { title: string; level: EbookHeadingLevel } | null {
  const text = normalizeHeadingLine(line)
  if (!text) return null

  const md = text.match(MD_HEADING)
  if (md?.[1] && md[2] !== undefined) {
    return {
      title: md[2].trim() || '未命名标题',
      level: md[1].length as EbookHeadingLevel,
    }
  }

  if (CN_CHAPTER.test(text)) {
    return { title: text, level: 1 }
  }
  if (CN_SECTION.test(text)) {
    return { title: text, level: 2 }
  }

  const bracket = text.match(CN_BRACKET_CHAPTER)
  if (bracket?.[1]) {
    return { title: bracket[1].trim(), level: 1 }
  }

  if (CN_SPECIAL.test(text)) {
    return { title: text, level: 1 }
  }

  return null
}

function joinContent(lines: string[]): string {
  return lines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '')
}

type Draft = { title: string; level: EbookHeadingLevel; lines: string[] }

type SliceHandler = (slice: EbookSlice) => void | Promise<void>

interface OpenDraft {
  id: string
  title: string
  level: EbookHeadingLevel
  buf: string[]
  chars: number
  sliceIndex: number
}

/**
 * Incremental chapter parser — feed lines one by one.
 * Chapter bodies are emitted as fixed-size slices; the full chapter is never joined.
 */
export class EbookLineParser {
  private draftsMeta: EbookChapterMeta[] = []
  private loose: OpenDraft | null = null
  private current: OpenDraft | null = null
  private lineCount = 0
  private pending: EbookSlice[] = []

  get chaptersMeta(): EbookChapterMeta[] {
    return this.draftsMeta
  }

  get processedLines(): number {
    return this.lineCount
  }

  pushLine(line: string): void {
    this.lineCount += 1

    if (this.lineCount === 1 && line.charCodeAt(0) === 0xfeff) {
      line = line.slice(1)
    }

    const heading = detectHeading(line)
    if (heading) {
      this.openHeading(heading.title, heading.level)
      return
    }
    if (this.current) this.append(this.current, line)
    else this.append(this.ensureLoose(), line)
  }

  /** Close the current chapter and return metadata. Slice writes are still in `flush`. */
  finish(): EbookChapterMeta[] {
    if (this.current) this.closeDraft(this.current)
    else if (this.loose && (this.loose.buf.length > 0 || this.loose.sliceIndex > 0)) {
      this.loose.title = '全文'
      this.closeDraft(this.loose)
    }
    this.current = null
    this.loose = null

    if (this.draftsMeta.length === 0) {
      this.draftsMeta.push({ id: createId(), title: '全文', level: 1, sliceCount: 0 })
    }

    return this.draftsMeta
  }

  async flush(onSlice?: SliceHandler): Promise<void> {
    if (!onSlice || this.pending.length === 0) return
    const batch = this.pending
    this.pending = []
    for (const slice of batch) await onSlice(slice)
  }

  private ensureLoose(): OpenDraft {
    if (!this.loose) this.loose = this.createDraft('序言', 1)
    return this.loose
  }

  private createDraft(title: string, level: EbookHeadingLevel): OpenDraft {
    return { id: createId(), title, level, buf: [], chars: 0, sliceIndex: 0 }
  }

  private openHeading(title: string, level: EbookHeadingLevel) {
    if (this.current) this.closeDraft(this.current)
    if (this.loose) {
      if (this.loose.buf.length > 0 || this.loose.sliceIndex > 0) {
        this.loose.title = '序言'
        this.closeDraft(this.loose)
      }
      this.loose = null
    }
    this.current = this.createDraft(title, level)
  }

  private append(draft: OpenDraft, line: string) {
    let rest = line
    while (rest.length > EBOOK_SLICE_CHARS) {
      if (draft.buf.length) this.emitSlice(draft, false)
      this.pending.push({
        chapterId: draft.id,
        index: draft.sliceIndex++,
        content: rest.slice(0, EBOOK_SLICE_CHARS),
      })
      rest = rest.slice(EBOOK_SLICE_CHARS)
    }

    if (rest.length === 0) {
      const last = this.pending[this.pending.length - 1]
      if (last && last.chapterId === draft.id && !last.content.endsWith('\n')) {
        last.content += '\n'
      }
      return
    }

    draft.buf.push(rest)
    draft.chars += rest.length + 1
    if (draft.chars >= EBOOK_SLICE_CHARS) this.emitSlice(draft, false)
  }

  private emitSlice(draft: OpenDraft, isLast: boolean) {
    if (draft.buf.length === 0) return
    let content = draft.buf.join('\n')
    if (draft.sliceIndex === 0) content = content.replace(/^\n+/, '')
    if (isLast) content = content.replace(/\n+$/, '')
    else if (!content.endsWith('\n')) content += '\n'
    draft.buf = []
    draft.chars = 0
    if (!content) return
    this.pending.push({
      chapterId: draft.id,
      index: draft.sliceIndex++,
      content,
    })
  }

  private closeDraft(draft: OpenDraft) {
    this.emitSlice(draft, true)
    this.draftsMeta.push({
      id: draft.id,
      title: draft.title,
      level: draft.level,
      sliceCount: draft.sliceIndex,
    })
  }
}

export function splitTextIntoSlices(text: string, size = EBOOK_SLICE_CHARS): string[] {
  if (!text) return []
  const slices: string[] = []
  let offset = 0
  while (offset < text.length) {
    const part = takeSlice(text, offset, size)
    if (!part.text) break
    slices.push(part.text)
    if (part.next <= offset) break
    offset = part.next
  }
  return slices
}

/** Same split, but returns to the event loop so a multi-megabyte legacy chapter can paint. */
export async function splitTextIntoSlicesAsync(
  text: string,
  size = EBOOK_SLICE_CHARS,
): Promise<string[]> {
  if (!text) return []
  if (text.length <= size * 4) return splitTextIntoSlices(text, size)

  const slices: string[] = []
  let offset = 0
  let count = 0
  while (offset < text.length) {
    const part = takeSlice(text, offset, size)
    if (!part.text) break
    slices.push(part.text)
    if (part.next <= offset) break
    offset = part.next
    count += 1
    if (count % 40 === 0) await yieldToBrowser()
  }
  return slices
}

function takeSlice(text: string, start: number, size: number): { text: string; next: number } {
  let end = Math.min(text.length, start + size)
  if (end < text.length) {
    const nl = text.lastIndexOf('\n', end)
    if (nl > start + Math.floor(size * 0.65)) end = nl + 1
  }
  if (end <= start) end = Math.min(text.length, start + size)
  return { text: text.slice(start, end), next: end }
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

function isThenable(value: unknown): value is Promise<void> {
  return !!value && typeof (value as Promise<void>).then === 'function'
}

/**
 * Split decoded text chunks into lines, handling \r\n / \n / \r across chunk boundaries.
 */
export class LineBreakSplitter {
  private buffer = ''
  private skipLf = false

  push(chunk: string, emit: (line: string) => void | Promise<void>): Promise<void> {
    return this.consume(chunk, emit, false)
  }

  finish(emit: (line: string) => void | Promise<void>): Promise<void> {
    return this.consume('', emit, true)
  }

  private async consume(
    chunk: string,
    emit: (line: string) => void | Promise<void>,
    flush: boolean,
  ): Promise<void> {
    let offset = 0

    if (this.skipLf) {
      if (chunk.startsWith('\n')) offset = 1
      this.skipLf = false
    }

    this.buffer += chunk.slice(offset)

    let start = 0
    for (let i = 0; i < this.buffer.length; i++) {
      const ch = this.buffer[i]
      if (ch === '\r') {
        const emitted = emit(this.buffer.slice(start, i))
        if (isThenable(emitted)) await emitted
        if (i + 1 < this.buffer.length && this.buffer[i + 1] === '\n') {
          i += 1
        } else if (i + 1 >= this.buffer.length && !flush) {
          this.skipLf = true
        }
        start = i + 1
      } else if (ch === '\n') {
        const emitted = emit(this.buffer.slice(start, i))
        if (isThenable(emitted)) await emitted
        start = i + 1
      }
    }

    this.buffer = start > 0 ? this.buffer.slice(start) : this.buffer

    if (flush && this.buffer.length > 0) {
      const emitted = emit(this.buffer)
      if (isThenable(emitted)) await emitted
      this.buffer = ''
    }
  }
}

export interface ParseEbookFileResult {
  chapters: EbookChapterMeta[]
  encoding: EbookTextEncoding
  lineCount: number
}

export interface ParseEbookFileOptions {
  /** When set, skip detection and decode the file with this encoding. */
  encoding?: EbookTextEncoding
  onSlice?: (slice: EbookSlice) => void | Promise<void>
  onProgress?: (ratio: number) => void
}

/**
 * Stream-parse a local txt File: detect encoding, decode via ReadableStream, parse line by line.
 * Chapter bodies are delivered as slices via onSlice so memory stays bounded.
 */
export async function parseEbookFile(
  file: File,
  options: ParseEbookFileOptions = {},
): Promise<ParseEbookFileResult> {
  const encoding = options.encoding ?? detectTextEncoding(await readFileHead(file))
  const decoder = createTextDecoder(encoding)
  const parser = new EbookLineParser()
  const splitter = new LineBreakSplitter()
  const total = file.size || 1
  let readBytes = 0

  const report = () => options.onProgress?.(Math.min(1, readBytes / total))

  const drain = async () => {
    await parser.flush(options.onSlice)
    report()
    await yieldToBrowser()
  }

  const handleLine = (line: string): void | Promise<void> => {
    parser.pushLine(line)
    if (parser.processedLines % YIELD_EVERY_LINES === 0) return drain()
  }

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  try {
    if (typeof file.stream === 'function') {
      reader = file.stream().getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue
        readBytes += value.byteLength
        const text = decoder.decode(value, { stream: true })
        await splitter.push(text, handleLine)
        await drain()
      }
      const tail = decoder.decode()
      if (tail) await splitter.push(tail, handleLine)
      await splitter.finish(handleLine)
    } else {
      const buffer = await file.arrayBuffer()
      readBytes = buffer.byteLength
      const text = decoder.decode(new Uint8Array(buffer))
      await splitter.push(text, handleLine)
      await splitter.finish(handleLine)
    }
  } finally {
    try {
      await reader?.cancel()
    } catch {
      // already closed or cancelled by the consumer
    }
  }

  const chapters = parser.finish()
  await parser.flush(options.onSlice)
  options.onProgress?.(1)
  return { chapters, encoding, lineCount: parser.processedLines }
}

/**
 * Parse an in-memory string (tests / small snippets). Prefer parseEbookFile for uploads.
 */
export function parseEbookText(raw: string): EbookChapter[] {
  const text = raw.replace(/^\uFEFF/, '')
  const chapters: EbookChapter[] = []
  let preface: string[] = []
  let current: Draft | null = null
  const lines = text.split(/\r\n|\n|\r/)

  const emit = (title: string, level: EbookHeadingLevel, body: string[]) => {
    chapters.push({
      id: createId(),
      title,
      level,
      content: joinContent(body),
    })
  }

  for (const line of lines) {
    const heading = detectHeading(line)
    if (heading) {
      if (current) emit(current.title, current.level, current.lines)
      else if (preface.some((l) => l.trim())) {
        emit('序言', 1, preface)
        preface = []
      }
      current = { title: heading.title, level: heading.level, lines: [] }
      continue
    }
    if (current) current.lines.push(line)
    else preface.push(line)
  }

  if (current) emit(current.title, current.level, current.lines)
  else if (preface.some((l) => l.trim())) emit('全文', 1, preface)

  if (chapters.length === 0) {
    return [{ id: createId(), title: '全文', level: 1, content: text }]
  }
  return chapters
}
