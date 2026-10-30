export type EbookTextEncoding = 'utf-8' | 'gb18030' | 'utf-16le' | 'utf-16be'

export const EBOOK_ENCODING_OPTIONS: ReadonlyArray<{ value: EbookTextEncoding; label: string }> = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'gb18030', label: 'GBK/GB18030' },
  { value: 'utf-16le', label: 'UTF-16 LE' },
  { value: 'utf-16be', label: 'UTF-16 BE' },
]

export function isEbookTextEncoding(value: unknown): value is EbookTextEncoding {
  return EBOOK_ENCODING_OPTIONS.some((option) => option.value === value)
}

export function encodingLabel(encoding: string): string {
  return (
    EBOOK_ENCODING_OPTIONS.find((option) => option.value === encoding)?.label ??
    encoding.toUpperCase()
  )
}

const SAMPLE_SIZE = 64 * 1024

function countChar(text: string, re: RegExp): number {
  const m = text.match(re)
  return m ? m.length : 0
}

function tryDecode(bytes: Uint8Array, label: string, fatal = false): string | null {
  try {
    return new TextDecoder(label, { fatal }).decode(bytes)
  } catch {
    return null
  }
}

function scoreDecodedText(text: string): number {
  const chinese = countChar(text, /[\u4e00-\u9fff]/g)
  const replacement = countChar(text, /\uFFFD/g)
  const control = countChar(text, /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g)
  // Prefer more Chinese, fewer replacement/control junk
  return chinese * 4 - replacement * 50 - control * 20
}

/**
 * Detect text encoding from a byte sample.
 * Net-novel txt files are often GBK/GB2312 (use gb18030 supersets).
 */
export function detectTextEncoding(bytes: Uint8Array): EbookTextEncoding {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8'
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'utf-16le'
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'utf-16be'
  }

  const sample = bytes.byteLength > SAMPLE_SIZE ? bytes.subarray(0, SAMPLE_SIZE) : bytes

  const utf8Fatal = tryDecode(sample, 'utf-8', true)
  const utf8Loose = tryDecode(sample, 'utf-8', false) ?? ''
  const gb = tryDecode(sample, 'gb18030', false) ?? tryDecode(sample, 'gbk', false) ?? ''

  if (utf8Fatal !== null) {
    const utf8Score = scoreDecodedText(utf8Loose)
    const gbScore = scoreDecodedText(gb)
    // Valid UTF-8 that still scores much worse than GBK (mojibake) → prefer GB
    if (gbScore > utf8Score + 20) return 'gb18030'
    return 'utf-8'
  }

  const utf8Score = scoreDecodedText(utf8Loose)
  const gbScore = scoreDecodedText(gb)
  if (gbScore >= utf8Score) return 'gb18030'
  return 'utf-8'
}

export function createTextDecoder(encoding: EbookTextEncoding): TextDecoder {
  const labels: string[] = encoding === 'gb18030' ? ['gb18030', 'gbk', 'gb2312'] : [encoding]

  for (const label of labels) {
    try {
      return new TextDecoder(label)
    } catch {
      // try next
    }
  }
  return new TextDecoder('utf-8')
}

/** Peek the first bytes of a File without loading the whole file. */
export async function readFileHead(file: File, size = SAMPLE_SIZE): Promise<Uint8Array> {
  const slice = file.slice(0, Math.min(size, file.size))
  const buffer = await slice.arrayBuffer()
  return new Uint8Array(buffer)
}
