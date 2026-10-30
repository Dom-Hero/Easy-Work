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
}

const MD_HEADING = /^(#{1,3})\s+(.+?)\s*$/
/** 第1章 / 第一章 / 第 1 章 / 第１章（全角数字）/ 第一章标题 */
const CN_NUM = '[零〇一二三四五六七八九十百千万两\\d０-９]+'
const CN_CHAPTER = new RegExp(`^第\\s*${CN_NUM}\\s*章(?:\\s*[:：、.\\-—-]?\\s*(.*))?$`)
const CN_SECTION = new RegExp(`^第\\s*${CN_NUM}\\s*节(?:\\s*[:：、.\\-—-]?\\s*(.*))?$`)
const CN_SPECIAL =
  /^(楔子|序章|序言|引子|前言|引言|prologue|终章|尾声|后记|番外(?:\s*.*)?)$/i
const CN_BRACKET_CHAPTER = /^[【\[]\s*(第\s*[零〇一二三四五六七八九十百千万两\d０-９]+\s*章.*?)[】\]]$/

/** Yield to the browser every N lines so huge files don't freeze the UI. */
const YIELD_EVERY_LINES = 1500

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

export type ClosedChapterHandler = (chapter: EbookChapter) => void | Promise<void>

/**
 * Incremental chapter parser — feed lines one by one, no full-text string required.
 */
export class EbookLineParser {
  private draftsMeta: EbookChapterMeta[] = []
  private preface: string[] = []
  private current: Draft | null = null
  private lineCount = 0
  private closed: ClosedChapterHandler | null

  constructor(onChapterClosed?: ClosedChapterHandler) {
    this.closed = onChapterClosed ?? null
  }

  get chaptersMeta(): EbookChapterMeta[] {
    return this.draftsMeta
  }

  get processedLines(): number {
    return this.lineCount
  }

  async pushLine(line: string): Promise<void> {
    this.lineCount += 1

    if (this.lineCount === 1 && line.charCodeAt(0) === 0xfeff) {
      line = line.slice(1)
    }

    const heading = detectHeading(line)
    if (heading) {
      await this.openHeading(heading.title, heading.level)
    } else if (this.current) {
      this.current.lines.push(line)
    } else {
      this.preface.push(line)
    }

    if (this.lineCount % YIELD_EVERY_LINES === 0) {
      await yieldToBrowser()
    }
  }

  async finish(): Promise<EbookChapterMeta[]> {
    if (this.current) {
      await this.closeCurrent()
    } else if (this.preface.some((l) => l.trim())) {
      await this.emitChapter('全文', 1, this.preface)
      this.preface = []
    }

    if (this.draftsMeta.length === 0) {
      await this.emitChapter('全文', 1, [])
    }

    return this.draftsMeta
  }

  private async openHeading(title: string, level: EbookHeadingLevel) {
    if (this.current) {
      await this.closeCurrent()
    } else if (this.preface.some((l) => l.trim())) {
      await this.emitChapter('序言', 1, this.preface)
      this.preface = []
    }
    this.current = { title, level, lines: [] }
  }

  private async closeCurrent() {
    if (!this.current) return
    await this.emitChapter(this.current.title, this.current.level, this.current.lines)
    this.current = null
  }

  private async emitChapter(title: string, level: EbookHeadingLevel, lines: string[]) {
    const chapter: EbookChapter = {
      id: createId(),
      title,
      level,
      content: joinContent(lines),
    }
    this.draftsMeta.push({ id: chapter.id, title: chapter.title, level: chapter.level })
    if (this.closed) {
      await this.closed(chapter)
    }
  }
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
    } else {
      setTimeout(resolve, 0)
    }
  })
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
        await emit(this.buffer.slice(start, i))
        if (i + 1 < this.buffer.length && this.buffer[i + 1] === '\n') {
          i += 1
        } else if (i + 1 >= this.buffer.length && !flush) {
          this.skipLf = true
        }
        start = i + 1
      } else if (ch === '\n') {
        await emit(this.buffer.slice(start, i))
        start = i + 1
      }
    }

    this.buffer = this.buffer.slice(start)

    if (flush && this.buffer.length > 0) {
      await emit(this.buffer)
      this.buffer = ''
    }
  }
}

export interface ParseEbookFileResult {
  chapters: EbookChapterMeta[]
  encoding: EbookTextEncoding
  lineCount: number
}

/**
 * Stream-parse a local txt File: detect encoding, decode via ReadableStream, parse line by line.
 * Chapter bodies are delivered via onChapter (caller can write to IDB to bound memory).
 */
export async function parseEbookFile(
  file: File,
  onChapter?: ClosedChapterHandler,
): Promise<ParseEbookFileResult> {
  const head = await readFileHead(file)
  const encoding = detectTextEncoding(head)
  const decoder = createTextDecoder(encoding)
  const parser = new EbookLineParser(onChapter)
  const splitter = new LineBreakSplitter()

  if (typeof file.stream === 'function') {
    const reader = file.stream().getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      const text = decoder.decode(value, { stream: true })
      await splitter.push(text, (line) => parser.pushLine(line))
    }
    const tail = decoder.decode()
    if (tail) await splitter.push(tail, (line) => parser.pushLine(line))
    await splitter.finish((line) => parser.pushLine(line))
  } else {
    const buffer = await file.arrayBuffer()
    const text = decoder.decode(new Uint8Array(buffer))
    await splitter.push(text, (line) => parser.pushLine(line))
    await splitter.finish((line) => parser.pushLine(line))
  }

  const chapters = await parser.finish()
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
