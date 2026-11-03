import type { BlockerCell, BlockerKind, BoardSize } from './types'

const CHAR_MAP: Record<string, { type: BlockerKind; layers: number }> = {
  i: { type: 'ice', layers: 1 },
  I: { type: 'ice', layers: 2 },
  r: { type: 'rock', layers: 1 },
  c: { type: 'chain', layers: 1 },
}

/** 解析关卡配置中的字符画布 */
export function parseBlockers(blockers: string | null | undefined): BlockerCell[] {
  if (!blockers) return []
  const out: BlockerCell[] = []
  blockers
    .trim()
    .split('\n')
    .forEach((line, r) => {
      line
        .trim()
        .split(/\s+/)
        .forEach((ch, c) => {
          const m = CHAR_MAP[ch]
          if (m) out.push({ row: r, col: c, type: m.type, layers: m.layers })
        })
    })
  return out
}

export function blockersToGrid(
  cells: BlockerCell[],
  rows: number,
  cols: number,
): (BlockerCell | null)[][] {
  const g: (BlockerCell | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  )
  for (const b of cells) {
    if (b.row >= 0 && b.row < rows && b.col >= 0 && b.col < cols) {
      g[b.row]![b.col] = { ...b }
    }
  }
  return g
}

/** 程序化布局：在棋盘中部撒障碍，总量不超过格子 25% */
export function buildBlockerLayout(
  board: BoardSize,
  count: number,
  t: number,
): string | null {
  const n = Math.round(count * (0.4 + 0.6 * t))
  if (n <= 0) return null
  const { rows, cols } = board
  const max = Math.floor(rows * cols * 0.25)
  const target = Math.min(n, max)
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => '.'),
  )

  // 优先中部区域
  const candidates: { r: number; c: number }[] = []
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      candidates.push({ r, c })
    }
  }
  // 洗牌
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!]
  }

  let placed = 0
  for (const { r, c } of candidates) {
    if (placed >= target) break
    // 随难度提高双层冰/石头/锁链比例
    let ch = 'i'
    const roll = Math.random()
    if (t > 0.7 && roll < 0.2) ch = 'r'
    else if (t > 0.5 && roll < 0.35) ch = 'c'
    else if (t > 0.4 && roll < 0.25) ch = 'I'
    else ch = 'i'
    grid[r]![c] = ch
    placed++
  }

  return grid.map((row) => row.join(' ')).join('\n')
}
