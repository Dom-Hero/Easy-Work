import { simulateLevel } from '../src/game/match3/rate'

const trials = Number(process.argv[2] || 80)
const from = Number(process.argv[3] || 1)
const to = Number(process.argv[4] || 100)

console.log(`id,winRate,avgMovesUsed (trials=${trials})`)
for (let id = from; id <= to; id++) {
  const { winRate, avgMovesUsed } = simulateLevel(id, trials)
  console.log(`${id},${winRate.toFixed(2)},${avgMovesUsed == null ? '' : avgMovesUsed.toFixed(1)}`)
}
