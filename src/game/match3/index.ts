import { generateLevel } from './curve'
import { LEVELS } from './levels'
import type { LevelConfig } from './types'
import { TOTAL_LEVELS } from './types'

export * from './types'
export * from './blockers'
export * from './fusion'
export { LEVELS } from './levels'
export { generateLevel } from './curve'

/** 统一入口：前 10 关用手写配置，之后程序生成 */
export function getLevel(id: number): LevelConfig {
  const clamped = Math.max(1, Math.min(TOTAL_LEVELS, id | 0))
  return LEVELS.find((l) => l.id === clamped) ?? generateLevel(clamped)
}

export function calcStars(movesLeft: number, movesTotal: number): 1 | 2 | 3 {
  if (movesLeft >= movesTotal * 0.4) return 3
  if (movesLeft >= movesTotal * 0.15) return 2
  return 1
}
