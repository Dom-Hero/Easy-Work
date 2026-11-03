/**
 * 开发期难度模拟：随机/贪心代理跑关卡，估通过率。
 * 简化模型：无特殊棋子动画，有基础三消、障碍损伤与重力。
 */
import { blockersToGrid, parseBlockers } from './blockers'
import { getLevel } from './index'
import type { BlockerCell, Goal, LevelConfig } from './types'

type Cell = number | null // color index；null = 空；-1 = 石头占位

interface SimState {
  cfg: LevelConfig
  grid: Cell[][]
  blockers: (BlockerCell | null)[][]
  movesLeft: number
  score: number
  collect: Record<number, number>
  clear: Record<string, number>
  rows: number
  cols: number
  colors: number
}

function key(r: number, c: number) {
  return `${r},${c}`
}

function initSim(cfg: LevelConfig): SimState {
  const { rows, cols } = cfg.board
  const blockers = blockersToGrid(parseBlockers(cfg.blockers), rows, cols)
  const grid: Cell[][] = []
  for (let r = 0; r < rows; r++) {
    grid[r] = []
    for (let c = 0; c < cols; c++) {
      if (blockers[r]![c]?.type === 'rock') {
        grid[r]![c] = -1
        continue
      }
      let color = 0
      let guard = 0
      do {
        color = (Math.random() * cfg.colors) | 0
        guard++
      } while (
        guard < 30 &&
        ((c >= 2 && grid[r]![c - 1] === color && grid[r]![c - 2] === color) ||
          (r >= 2 && grid[r - 1]![c] === color && grid[r - 2]![c] === color))
      )
      grid[r]![c] = color
    }
  }
  return {
    cfg,
    grid,
    blockers,
    movesLeft: cfg.moves,
    score: 0,
    collect: {},
    clear: {},
    rows,
    cols,
    colors: cfg.colors,
  }
}

function findMatches(s: SimState): Set<string> {
  const { grid, rows, cols } = s
  const matched = new Set<string>()
  for (let r = 0; r < rows; r++) {
    let len = 1
    for (let c = 1; c <= cols; c++) {
      const prev = grid[r]![c - 1]
      const cur = c < cols ? grid[r]![c] : null
      const same =
        typeof prev === 'number' &&
        prev >= 0 &&
        typeof cur === 'number' &&
        cur >= 0 &&
        prev === cur
      if (same) len++
      else {
        if (len >= 3) for (let i = 0; i < len; i++) matched.add(key(r, c - 1 - i))
        len = 1
      }
    }
  }
  for (let c = 0; c < cols; c++) {
    let len = 1
    for (let r = 1; r <= rows; r++) {
      const prev = grid[r - 1]![c]
      const cur = r < rows ? grid[r]![c] : null
      const same =
        typeof prev === 'number' &&
        prev >= 0 &&
        typeof cur === 'number' &&
        cur >= 0 &&
        prev === cur
      if (same) len++
      else {
        if (len >= 3) for (let i = 0; i < len; i++) matched.add(key(r - 1 - i, c))
        len = 1
      }
    }
  }
  return matched
}

function damageBlocker(s: SimState, r: number, c: number) {
  const b = s.blockers[r]?.[c]
  if (!b) return
  b.layers--
  if (b.layers <= 0) {
    s.clear[b.type] = (s.clear[b.type] ?? 0) + 1
    s.blockers[r]![c] = null
    if (b.type === 'rock') s.grid[r]![c] = null
  }
}

function applyClear(s: SimState, cells: Set<string>) {
  for (const k of cells) {
    const [r, c] = k.split(',').map(Number) as [number, number]
    const color = s.grid[r]![c]
    if (typeof color === 'number' && color >= 0) {
      s.collect[color] = (s.collect[color] ?? 0) + 1
      s.score += 30
      s.grid[r]![c] = null
      damageBlocker(s, r, c) // ice / chain on cell
    }
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= s.rows || nc < 0 || nc >= s.cols) continue
      const nb = s.blockers[nr]![nc]
      if (nb && (nb.type === 'rock' || nb.type === 'chain' || nb.type === 'ice')) {
        if (nb.type === 'rock' || nb.type === 'chain') damageBlocker(s, nr, nc)
      }
    }
  }
}

function gravity(s: SimState) {
  for (let c = 0; c < s.cols; c++) {
    const stack: number[] = []
    for (let r = s.rows - 1; r >= 0; r--) {
      const v = s.grid[r]![c]
      if (typeof v === 'number' && v >= 0) stack.push(v)
    }
    const slots: number[] = []
    for (let r = s.rows - 1; r >= 0; r--) {
      if (s.blockers[r]![c]?.type === 'rock') {
        s.grid[r]![c] = -1
      } else {
        slots.push(r)
        s.grid[r]![c] = null
      }
    }
    let si = 0
    for (const color of stack) {
      if (si >= slots.length) break
      s.grid[slots[si++]!]![c] = color
    }
    while (si < slots.length) {
      s.grid[slots[si++]!]![c] = (Math.random() * s.colors) | 0
    }
  }
}

function resolve(s: SimState) {
  let guard = 0
  while (guard++ < 40) {
    const m = findMatches(s)
    if (!m.size) break
    applyClear(s, m)
    gravity(s)
  }
}

function swap(s: SimState, a: { r: number; c: number }, b: { r: number; c: number }) {
  const t = s.grid[a.r]![a.c] ?? null
  s.grid[a.r]![a.c] = s.grid[b.r]![b.c] ?? null
  s.grid[b.r]![b.c] = t
}

function chained(s: SimState, r: number, c: number) {
  return s.blockers[r]![c]?.type === 'chain'
}

function validMoves(s: SimState): { a: { r: number; c: number }; b: { r: number; c: number }; score: number }[] {
  const out: { a: { r: number; c: number }; b: { r: number; c: number }; score: number }[] = []
  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.cols; c++) {
      const v = s.grid[r]![c]
      if (typeof v !== 'number' || v < 0 || chained(s, r, c)) continue
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
      ] as const) {
        const nr = r + dr
        const nc = c + dc
        if (nr >= s.rows || nc >= s.cols) continue
        const nv = s.grid[nr]![nc]
        if (typeof nv !== 'number' || nv < 0 || chained(s, nr, nc)) continue
        swap(s, { r, c }, { r: nr, c: nc })
        const m = findMatches(s)
        swap(s, { r, c }, { r: nr, c: nc })
        if (m.size) out.push({ a: { r, c }, b: { r: nr, c: nc }, score: m.size })
      }
    }
  }
  return out
}

function goalsMet(s: SimState, goals: Goal[]) {
  return goals.every((g) => {
    if (g.type === 'score') return s.score >= g.target
    if (g.type === 'collect') return (s.collect[g.color] ?? 0) >= g.target
    if (g.type === 'clear') return (s.clear[g.blocker] ?? 0) >= g.target
    return false
  })
}

function shuffle(s: SimState) {
  const cells: { r: number; c: number }[] = []
  const colors: number[] = []
  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.cols; c++) {
      const v = s.grid[r]![c]
      if (typeof v === 'number' && v >= 0 && !chained(s, r, c)) {
        cells.push({ r, c })
        colors.push(v)
      }
    }
  }
  for (let i = colors.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[colors[i], colors[j]] = [colors[j]!, colors[i]!]
  }
  cells.forEach((p, i) => {
    s.grid[p.r]![p.c] = colors[i]!
  })
}

export function playGreedy(cfg: LevelConfig) {
  const s = initSim(cfg)
  let turns = 0
  while (s.movesLeft > 0 && turns++ < 500) {
    if (goalsMet(s, cfg.goals)) return { win: true, movesUsed: cfg.moves - s.movesLeft }
    let moves = validMoves(s)
    if (!moves.length) {
      if (cfg.autoShuffle) {
        shuffle(s)
        moves = validMoves(s)
      }
      if (!moves.length) break
    }
    moves.sort((a, b) => b.score - a.score)
    const pick = moves[0]!
    swap(s, pick.a, pick.b)
    s.movesLeft--
    resolve(s)
  }
  return { win: goalsMet(s, cfg.goals), movesUsed: cfg.moves - s.movesLeft }
}

export function playRandom(cfg: LevelConfig) {
  const s = initSim(cfg)
  let turns = 0
  while (s.movesLeft > 0 && turns++ < 500) {
    if (goalsMet(s, cfg.goals)) return { win: true, movesUsed: cfg.moves - s.movesLeft }
    let moves = validMoves(s)
    if (!moves.length) {
      if (cfg.autoShuffle) {
        shuffle(s)
        moves = validMoves(s)
      }
      if (!moves.length) break
    }
    const pick = moves[(Math.random() * moves.length) | 0]!
    swap(s, pick.a, pick.b)
    s.movesLeft--
    resolve(s)
  }
  return { win: goalsMet(s, cfg.goals), movesUsed: cfg.moves - s.movesLeft }
}

export function simulate(
  cfg: LevelConfig,
  agent: typeof playGreedy = playGreedy,
  trials = 200,
) {
  let win = 0
  let used = 0
  for (let i = 0; i < trials; i++) {
    const r = agent(cfg)
    if (r.win) {
      win++
      used += r.movesUsed
    }
  }
  return {
    winRate: win / trials,
    avgMovesUsed: win ? used / win : null,
  }
}

export function simulateLevel(id: number, trials = 200) {
  return simulate(getLevel(id), playGreedy, trials)
}
