import { buildBlockerLayout } from './blockers'
import type { Goal, GoalType, LevelConfig } from './types'

interface Tier {
  to: number
  colors: number
  rows: number
  cols: number
  moves: [number, number]
  goals: GoalType[]
  blockers: number
}

const TIERS: Tier[] = [
  { to: 10, colors: 4, rows: 7, cols: 7, moves: [32, 26], goals: ['score'], blockers: 0 },
  { to: 25, colors: 4, rows: 7, cols: 7, moves: [28, 22], goals: ['score', 'collect'], blockers: 3 },
  { to: 45, colors: 5, rows: 8, cols: 8, moves: [28, 22], goals: ['collect', 'clear'], blockers: 8 },
  { to: 70, colors: 5, rows: 8, cols: 8, moves: [24, 18], goals: ['collect', 'clear'], blockers: 16 },
  { to: 100, colors: 6, rows: 8, cols: 8, moves: [24, 18], goals: ['collect', 'clear', 'score'], blockers: 20 },
]

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)

function pickColor(colors: number, id: number): number {
  return id % colors
}

function makeGoal(type: GoalType, t: number, colors: number, moves: number, id: number): Goal {
  if (type === 'score') {
    return { type: 'score', target: Math.round(moves * lerp(40, 90, t)) }
  }
  if (type === 'collect') {
    return {
      type: 'collect',
      color: pickColor(colors, id),
      target: Math.round(moves * lerp(1.2, 2.0, t)),
    }
  }
  const blocker = t > 0.65 ? (id % 3 === 0 ? 'rock' : id % 3 === 1 ? 'chain' : 'ice') : 'ice'
  return {
    type: 'clear',
    blocker: blocker as 'ice' | 'rock' | 'chain',
    target: Math.round(lerp(6, 24, t)),
  }
}

/** 程序化生成第 id 关（用于手写关之后） */
export function generateLevel(id: number): LevelConfig {
  const tierIdx = TIERS.findIndex((tier) => id <= tier.to)
  const tier = TIERS[tierIdx === -1 ? TIERS.length - 1 : tierIdx]!
  const from = tierIdx <= 0 ? 1 : TIERS[tierIdx - 1]!.to + 1
  const t = (id - from) / Math.max(1, tier.to - from)

  const moves = lerp(tier.moves[0], tier.moves[1], t)
  const board = { rows: tier.rows, cols: tier.cols }
  const goals = tier.goals.map((type) => makeGoal(type, t, tier.colors, moves, id))

  // clear 目标量不超过实际可放障碍数
  const layout = buildBlockerLayout(board, tier.blockers, t)
  if (layout) {
    const iceLike = (layout.match(/[iI]/g) || []).length
    const rocks = (layout.match(/r/g) || []).length
    const chains = (layout.match(/c/g) || []).length
    for (const g of goals) {
      if (g.type !== 'clear') continue
      const avail =
        g.blocker === 'ice' ? iceLike : g.blocker === 'rock' ? rocks : chains
      if (avail > 0) g.target = Math.min(g.target, avail)
    }
  }

  return {
    id,
    name: `第 ${id} 关`,
    board,
    colors: tier.colors,
    moves,
    goals,
    blockers: layout,
    specialEnabled: true,
    autoShuffle: id < 60,
    hintIdleSeconds: t < 0.5 ? 5 : 10,
  }
}
