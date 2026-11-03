export const ALL_TYPES = ['🍎', '🫐', '🥝', '🍋', '🍇', '🍊'] as const
export type TileType = (typeof ALL_TYPES)[number]

export type GoalType = 'score' | 'collect' | 'clear'
export type BlockerKind = 'ice' | 'rock' | 'chain'

export interface ScoreGoal {
  type: 'score'
  target: number
}

export interface CollectGoal {
  type: 'collect'
  color: number
  target: number
}

export interface ClearGoal {
  type: 'clear'
  blocker: BlockerKind
  target: number
}

export type Goal = ScoreGoal | CollectGoal | ClearGoal

export interface BoardSize {
  rows: number
  cols: number
}

export interface BlockerCell {
  row: number
  col: number
  type: BlockerKind
  layers: number
}

export interface LevelConfig {
  id: number
  name: string
  board: BoardSize
  colors: number
  moves: number
  goals: Goal[]
  /** 字符画布；null 表示无障碍 */
  blockers: string | null
  specialEnabled: boolean
  hintIdleSeconds?: number
  autoShuffle: boolean
}

export interface LevelProgress {
  stars: Record<string, number>
  currentLevel: number
}

export const TOTAL_LEVELS = 100
export const HANDCRAFTED_COUNT = 10

export function palette(colors: number): TileType[] {
  return ALL_TYPES.slice(0, Math.max(4, Math.min(6, colors))) as TileType[]
}
