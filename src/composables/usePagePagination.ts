export type PagePaginationOptions = {
  width: number
  height: number
  fontSize?: string
  lineHeight?: string
  fontFamily?: string
  padding?: string
}

const DEFAULT_FONT =
  "'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', Georgia, serif"

/**
 * Split plain text into page-sized chunks by measuring against an offscreen box
 * that mirrors the real page typography.
 */
export function paginateText(text: string, options: PagePaginationOptions): string[] {
  const width = Math.floor(options.width)
  const height = Math.floor(options.height)
  if (width <= 0 || height <= 0) return text ? [text] : ['']

  const source = text ?? ''
  if (!source.trim()) return ['']

  const measure = document.createElement('div')
  measure.setAttribute('aria-hidden', 'true')
  Object.assign(measure.style, {
    position: 'absolute',
    left: '-99999px',
    top: '0',
    visibility: 'hidden',
    width: `${width}px`,
    height: 'auto',
    overflow: 'visible',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    fontSize: options.fontSize || '16px',
    lineHeight: options.lineHeight || '1.85',
    fontFamily: options.fontFamily || DEFAULT_FONT,
    padding: options.padding || '0',
    boxSizing: 'border-box',
  } as CSSStyleDeclaration)

  document.body.appendChild(measure)

  const pages: string[] = []
  try {
    let offset = 0
    const total = source.length

    while (offset < total) {
      // Skip leading newlines between pages so pages don't start blank.
      while (offset < total && source[offset] === '\n') offset += 1
      if (offset >= total) break

      const end = findMaxFit(measure, source, offset, total, height)
      if (end <= offset) {
        // Safety: force at least one character so we never infinite-loop.
        pages.push(source.slice(offset, offset + 1))
        offset += 1
        continue
      }

      const cut = preferBreak(source, offset, end)
      const chunk = source.slice(offset, cut)
      if (chunk.length) pages.push(chunk)
      offset = cut
    }
  } finally {
    measure.remove()
  }

  return pages.length ? pages : ['']
}

function fits(measure: HTMLElement, content: string, maxHeight: number): boolean {
  measure.textContent = content
  // height:auto → scrollHeight reflects content height (not the box height)
  return measure.scrollHeight <= maxHeight + 1
}

/** Binary search the largest end index (exclusive) that still fits. */
function findMaxFit(
  measure: HTMLElement,
  source: string,
  start: number,
  total: number,
  maxHeight: number,
): number {
  let lo = start + 1
  let hi = total
  let best = start

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (fits(measure, source.slice(start, mid), maxHeight)) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return best
}

/** Prefer cutting at paragraph or whitespace when near the fit boundary. */
function preferBreak(source: string, start: number, end: number): number {
  if (end >= source.length) return end

  const windowStart = Math.max(start + 1, end - 80)
  const slice = source.slice(windowStart, end)

  const para = slice.lastIndexOf('\n\n')
  if (para >= 0) return windowStart + para + 2

  const nl = slice.lastIndexOf('\n')
  if (nl >= 0) return windowStart + nl + 1

  let lastWs = -1
  for (let i = slice.length - 1; i >= 0; i -= 1) {
    if (/\s/.test(slice[i]!)) {
      lastWs = i
      break
    }
  }
  if (lastWs >= 0) return windowStart + lastWs + 1

  return end
}

/**
 * Map a character offset in the original text to the page index that contains it.
 */
export function pageIndexForOffset(pages: string[], offset: number): number {
  if (!pages.length) return 0
  let cursor = 0
  for (let i = 0; i < pages.length; i += 1) {
    const next = cursor + pages[i]!.length
    if (offset < next || i === pages.length - 1) return i
    cursor = next
    // Account for skipped newlines between pages roughly by not adding them;
    // offset mapping is approximate after re-paginate.
  }
  return pages.length - 1
}

export function offsetForPageIndex(pages: string[], pageIndex: number): number {
  let offset = 0
  const limit = Math.max(0, Math.min(pageIndex, pages.length))
  for (let i = 0; i < limit; i += 1) {
    offset += pages[i]!.length
  }
  return offset
}
