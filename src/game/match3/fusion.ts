/** 特殊道具融合：清格计算与分类（纯逻辑，无 DOM） */

export type SpecialKind = 'rocket' | 'bomb' | 'colorBall'

export type FusionKind =
  | 'rocket-rocket'
  | 'bomb-bomb'
  | 'bomb-rocket'
  | 'color-bomb'
  | 'color-rocket'
  | 'color-color'

export type FusionFx =
  | 'cross'
  | 'thickCross'
  | 'blast3'
  | 'clearAll'
  | 'halfRows'
  | 'halfCols'
  | 'color'

export interface FusionWave {
  /** "r,c" 格集合 */
  cells: string[]
  fx: FusionFx
  rows?: number[]
  cols?: number[]
  center?: { r: number; c: number }
}

export function classifyFusion(a: SpecialKind, b: SpecialKind): FusionKind {
  const s = new Set([a, b])
  if (a === 'rocket' && b === 'rocket') return 'rocket-rocket'
  if (a === 'bomb' && b === 'bomb') return 'bomb-bomb'
  if (a === 'colorBall' && b === 'colorBall') return 'color-color'
  if (s.has('bomb') && s.has('rocket')) return 'bomb-rocket'
  if (s.has('colorBall') && s.has('bomb')) return 'color-bomb'
  return 'color-rocket' // colorBall + rocket
}

export function fusionLabel(kind: FusionKind): string {
  switch (kind) {
    case 'rocket-rocket': return '十字冲刺!'
    case 'bomb-bomb': return '双重爆破!'
    case 'bomb-rocket': return '粗十字!'
    case 'color-bomb': return '全屏清空!'
    case 'color-rocket': return '半屏扫荡!'
    case 'color-color': return '彩虹连消!'
  }
}

function cellKey(r: number, c: number) {
  return `${r},${c}`
}

/** 靠边夹紧的相邻两行（或两列）起点 */
export function pairStart(i: number, max: number): number {
  if (max <= 1) return 0
  return i >= max - 1 ? max - 2 : i
}

export function addCross(
  out: Set<string>,
  r: number,
  c: number,
  rows: number,
  cols: number,
  blocked: (r: number, c: number) => boolean,
) {
  for (let cc = 0; cc < cols; cc++) if (!blocked(r, cc)) out.add(cellKey(r, cc))
  for (let rr = 0; rr < rows; rr++) if (!blocked(rr, c)) out.add(cellKey(rr, c))
}

/** 相邻两行 + 相邻两列粗十字 */
export function addThickCross(
  out: Set<string>,
  r: number,
  c: number,
  rows: number,
  cols: number,
  blocked: (r: number, c: number) => boolean,
) {
  const r0 = pairStart(r, rows)
  const c0 = pairStart(c, cols)
  const rowList = rows <= 1 ? [r0] : [r0, r0 + 1]
  const colList = cols <= 1 ? [c0] : [c0, c0 + 1]
  for (const rr of rowList) {
    for (let cc = 0; cc < cols; cc++) if (!blocked(rr, cc)) out.add(cellKey(rr, cc))
  }
  for (const cc of colList) {
    for (let rr = 0; rr < rows; rr++) if (!blocked(rr, cc)) out.add(cellKey(rr, cc))
  }
  return { rows: rowList, cols: colList }
}

/** 以中心为锚的 3×3，超出棋盘的部分自然裁切 */
export function addBlast3(
  out: Set<string>,
  r: number,
  c: number,
  rows: number,
  cols: number,
  blocked: (r: number, c: number) => boolean,
) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && !blocked(rr, cc)) {
        out.add(cellKey(rr, cc))
      }
    }
  }
}

export function addAllCells(
  out: Set<string>,
  rows: number,
  cols: number,
  blocked: (r: number, c: number) => boolean,
) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!blocked(r, c)) out.add(cellKey(r, c))
    }
  }
}

/** 行 [0..rInclusive] 全列 */
export function addRowBand(
  out: Set<string>,
  rInclusive: number,
  rows: number,
  cols: number,
  blocked: (r: number, c: number) => boolean,
) {
  const rMax = Math.max(0, Math.min(rows - 1, rInclusive))
  const rowList: number[] = []
  for (let r = 0; r <= rMax; r++) {
    rowList.push(r)
    for (let c = 0; c < cols; c++) if (!blocked(r, c)) out.add(cellKey(r, c))
  }
  return rowList
}

/** 列 [0..cInclusive] 全行 */
export function addColBand(
  out: Set<string>,
  cInclusive: number,
  rows: number,
  cols: number,
  blocked: (r: number, c: number) => boolean,
) {
  const cMax = Math.max(0, Math.min(cols - 1, cInclusive))
  const colList: number[] = []
  for (let c = 0; c <= cMax; c++) {
    colList.push(c)
    for (let r = 0; r < rows; r++) if (!blocked(r, c)) out.add(cellKey(r, c))
  }
  return colList
}

export function buildStaticFusionWave(
  kind: Exclude<FusionKind, 'color-rocket' | 'color-color'>,
  r: number,
  c: number,
  rows: number,
  cols: number,
  blocked: (r: number, c: number) => boolean,
): FusionWave {
  const cells = new Set<string>()
  cells.add(cellKey(r, c))

  if (kind === 'rocket-rocket') {
    addCross(cells, r, c, rows, cols, blocked)
    return { cells: [...cells], fx: 'cross', rows: [r], cols: [c], center: { r, c } }
  }
  if (kind === 'bomb-bomb') {
    addBlast3(cells, r, c, rows, cols, blocked)
    return { cells: [...cells], fx: 'blast3', center: { r, c } }
  }
  if (kind === 'bomb-rocket') {
    const { rows: rs, cols: cs } = addThickCross(cells, r, c, rows, cols, blocked)
    return { cells: [...cells], fx: 'thickCross', rows: rs, cols: cs, center: { r, c } }
  }
  // color-bomb
  addAllCells(cells, rows, cols, blocked)
  return { cells: [...cells], fx: 'clearAll', center: { r, c } }
}
