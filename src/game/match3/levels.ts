import type { LevelConfig } from './types'

/** 前 10 关手写教学关，必须精调 */
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '初试身手',
    board: { rows: 7, cols: 7 },
    colors: 4,
    moves: 30,
    goals: [{ type: 'score', target: 800 }],
    blockers: null,
    specialEnabled: false,
    hintIdleSeconds: 5,
    autoShuffle: true,
  },
  {
    id: 2,
    name: '多多益善',
    board: { rows: 7, cols: 7 },
    colors: 4,
    moves: 28,
    goals: [{ type: 'score', target: 1200 }],
    blockers: null,
    specialEnabled: false,
    hintIdleSeconds: 5,
    autoShuffle: true,
  },
  {
    id: 3,
    name: '收集苹果',
    board: { rows: 7, cols: 7 },
    colors: 4,
    moves: 26,
    goals: [{ type: 'collect', color: 0, target: 28 }],
    blockers: null,
    specialEnabled: true,
    hintIdleSeconds: 5,
    autoShuffle: true,
  },
  {
    id: 4,
    name: '冰雪初现',
    board: { rows: 7, cols: 7 },
    colors: 4,
    moves: 26,
    goals: [{ type: 'clear', blocker: 'ice', target: 8 }],
    blockers: `
      . . . . . . .
      . . i i i . .
      . . i i i . .
      . . i i . . .
      . . . . . . .
      . . . . . . .
      . . . . . . .
    `,
    specialEnabled: true,
    hintIdleSeconds: 5,
    autoShuffle: true,
  },
  {
    id: 5,
    name: '双线作战',
    board: { rows: 7, cols: 7 },
    colors: 4,
    moves: 25,
    goals: [
      { type: 'score', target: 1000 },
      { type: 'collect', color: 1, target: 20 },
    ],
    blockers: null,
    specialEnabled: true,
    hintIdleSeconds: 5,
    autoShuffle: true,
  },
  {
    id: 6,
    name: '厚冰考验',
    board: { rows: 7, cols: 7 },
    colors: 4,
    moves: 24,
    goals: [{ type: 'clear', blocker: 'ice', target: 10 }],
    blockers: `
      . . . . . . .
      . I i i I . .
      . i . . i . .
      . i . . i . .
      . I i i I . .
      . . . . . . .
      . . . . . . .
    `,
    specialEnabled: true,
    hintIdleSeconds: 5,
    autoShuffle: true,
  },
  {
    id: 7,
    name: '锁链初见',
    board: { rows: 7, cols: 7 },
    colors: 4,
    moves: 24,
    goals: [
      { type: 'clear', blocker: 'chain', target: 6 },
      { type: 'score', target: 900 },
    ],
    blockers: `
      . . . . . . .
      . . c . c . .
      . c . . . c .
      . . . . . . .
      . c . . . c .
      . . c . c . .
      . . . . . . .
    `,
    specialEnabled: true,
    hintIdleSeconds: 5,
    autoShuffle: true,
  },
  {
    id: 8,
    name: '石头挡路',
    board: { rows: 8, cols: 8 },
    colors: 5,
    moves: 26,
    goals: [{ type: 'clear', blocker: 'rock', target: 5 }],
    blockers: `
      . . . . . . . .
      . . r . . r . .
      . . . . . . . .
      . r . . . . r .
      . . . . . . . .
      . . r . . . . .
      . . . . . . . .
      . . . . . . . .
    `,
    specialEnabled: true,
    hintIdleSeconds: 5,
    autoShuffle: true,
  },
  {
    id: 9,
    name: '五色挑战',
    board: { rows: 8, cols: 8 },
    colors: 5,
    moves: 24,
    goals: [
      { type: 'collect', color: 2, target: 30 },
      { type: 'score', target: 1400 },
    ],
    blockers: `
      . . . . . . . .
      . . i i i . . .
      . . . . . . . .
      . i . . . i . .
      . . . . . . . .
      . . i i i . . .
      . . . . . . . .
      . . . . . . . .
    `,
    specialEnabled: true,
    hintIdleSeconds: 6,
    autoShuffle: true,
  },
  {
    id: 10,
    name: '综合测验',
    board: { rows: 8, cols: 8 },
    colors: 5,
    moves: 22,
    goals: [
      { type: 'clear', blocker: 'ice', target: 8 },
      { type: 'score', target: 1200 },
    ],
    blockers: `
      . . . . . . . .
      . c i i i c . .
      . i . . . i . .
      . i . r . i . .
      . i . . . i . .
      . c i i i c . .
      . . . . . . . .
      . . . . . . . .
    `,
    specialEnabled: true,
    hintIdleSeconds: 6,
    autoShuffle: true,
  },
]
