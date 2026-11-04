<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  ALL_TYPES,
  addColBand,
  addRowBand,
  blockersToGrid,
  buildStaticFusionWave,
  calcStars,
  classifyFusion,
  fusionLabel,
  getLevel,
  palette,
  parseBlockers,
  type BlockerCell,
  type FusionFx,
  type FusionKind,
  type Goal,
  type LevelConfig,
  type SpecialKind,
  type TileType,
} from '@/game/match3'

const props = withDefaults(
  defineProps<{ levelId?: number }>(),
  { levelId: 1 },
)

const emit = defineEmits<{
  ready: []
  win: [{ levelId: number; stars: number; score: number; movesLeft: number; movesTotal: number }]
  lose: [{ levelId: number; score: number }]
}>()

type Special = null | 'rocket' | 'bomb' | 'colorBall'
type Dir = 'H' | 'V'

interface Tile {
  id: number
  type: TileType
  special: Special
  dir: Dir | null
  row: number
  col: number
  ry: number
  leaving: boolean
  pop: boolean
  born: boolean
  ballTarget?: TileType
}

const TILE = 32
const GAP = 2
const CELL = TILE + GAP

const level = ref<LevelConfig>(getLevel(props.levelId))
const ROWS = computed(() => level.value.board.rows)
const COLS = computed(() => level.value.board.cols)
const TYPES = computed(() => palette(level.value.colors))
const boardW = computed(() => COLS.value * CELL - GAP)
const boardH = computed(() => ROWS.value * CELL - GAP)

let idSeq = 1
const grid = ref<(Tile | null)[][]>([])
const blockers = ref<(BlockerCell | null)[][]>([])
const tiles = computed(() => grid.value.flat().filter(Boolean) as Tile[])
const blockerList = computed(() =>
  blockers.value.flat().filter((b): b is BlockerCell => !!b && b.layers > 0),
)

const moves = ref(30)
const score = ref(0)
const combo = ref(0)
const phase = ref<'idle' | 'playing' | 'won' | 'lost'>('idle')
const busy = ref(false)
const selected = ref<{ row: number; col: number } | null>(null)
const winStars = ref(0)
const goalProgress = ref<{ score: number; collect: Record<number, number>; clear: Record<string, number> }>({
  score: 0,
  collect: {},
  clear: {},
})

const floats = ref<{ id: number; text: string; sub: string }[]>([])
let floatSeq = 1
const bursts = ref<{ id: number; x: number; y: number; color: string }[]>([])
let burstSeq = 1
const typeColor: Record<TileType, string> = {
  '🍎': '#ff8a6a',
  '🫐': '#7a9aef',
  '🥝': '#8acb5a',
  '🍋': '#ffd84a',
  '🍇': '#b27aef',
  '🍊': '#ff9f4a',
}
function pushBurst(r: number, c: number, type?: TileType) {
  const id = burstSeq++
  bursts.value.push({ id, x: c * CELL, y: r * CELL, color: typeColor[type ?? '🍎'] })
  setTimeout(() => { bursts.value = bursts.value.filter((b) => b.id !== id) }, 560)
}

const fxCanvas = ref<HTMLCanvasElement | null>(null)
let fxCtx: CanvasRenderingContext2D | null = null
let dpr = 1
let rafId = 0
interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
const pool: P[] = []
const GRAV = 0.22

function spawnParticles(r: number, c: number, type?: TileType) {
  const color = typeColor[type ?? '🍎']
  const cx = c * CELL + TILE / 2
  const cy = r * CELL + TILE / 2
  const n = 10
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.6
    const sp = 1.3 + Math.random() * 2.4
    pool.push({
      x: cx, y: cy,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 0.9,
      life: 30 + Math.random() * 16,
      max: 46,
      color,
      size: 2 + Math.random() * 2.2,
    })
  }
  if (!rafId) rafId = requestAnimationFrame(tickFx)
}

function tickFx() {
  const ctx = fxCtx
  const cv = fxCanvas.value
  if (!ctx || !cv) { rafId = 0; return }
  ctx.clearRect(0, 0, cv.width, cv.height)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i]!
    p.vy += GRAV
    p.x += p.vx
    p.y += p.vy
    p.life--
    const a = Math.max(0, p.life / p.max)
    ctx.globalAlpha = a
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
    if (p.life <= 0) pool.splice(i, 1)
  }
  rafId = pool.length ? requestAnimationFrame(tickFx) : 0
}

const dashes = ref<{ id: number; dir: Dir; axis: number; thick?: boolean }[]>([])
const shocks = ref<{ id: number; x: number; y: number; color: string; scale?: number }[]>([])
const vortex = ref<{ id: number; color: string } | null>(null)
const fusionFlash = ref<{ id: number; x: number; y: number; kind: FusionKind } | null>(null)
let dashSeq = 1
let shockSeq = 1
let vortexSeq = 1
let flashSeq = 1

function fireDash(dir: Dir, axis: number, thick = false) {
  const id = dashSeq++
  dashes.value.push({ id, dir, axis, thick })
  setTimeout(() => { dashes.value = dashes.value.filter((d) => d.id !== id) }, thick ? 620 : 520)
}

function fireShockAt(r: number, c: number, color = '#ffb347', scale = 1) {
  const id = shockSeq++
  shocks.value.push({ id, x: c * CELL, y: r * CELL, color, scale })
  setTimeout(() => { shocks.value = shocks.value.filter((s) => s.id !== id) }, 560)
}

function fireRocket(t: Tile) {
  const dir = (t.dir ?? 'H') as Dir
  fireDash(dir, dir === 'H' ? t.row : t.col)
  if (dir === 'H') for (let c = 0; c < COLS.value; c++) spawnParticles(t.row, c, t.type)
  else for (let r = 0; r < ROWS.value; r++) spawnParticles(r, t.col, t.type)
}

function fireBomb(t: Tile) {
  fireShockAt(t.row, t.col)
  for (let i = 0; i < 2; i++) spawnParticles(t.row, t.col, t.type)
}

async function fireColorBall(t: Tile) {
  if (!t.ballTarget) t.ballTarget = pickColorBallTarget(t)
  const id = vortexSeq++
  vortex.value = { id, color: typeColor[t.ballTarget] }
  await sleep(520)
  if (vortex.value?.id === id) vortex.value = null
}

async function playFusionMergeFX(r: number, c: number, kind: FusionKind) {
  const id = flashSeq++
  fusionFlash.value = { id, x: c * CELL + TILE / 2, y: r * CELL + TILE / 2, kind }
  fireShockAt(r, c, '#ffe08a', 1.35)
  spawnParticles(r, c, '🍋')
  spawnParticles(r, c, '🍊')
  await sleep(280)
  if (fusionFlash.value?.id === id) fusionFlash.value = null
}

async function playFusionWaveFX(
  fx: FusionFx,
  opts: { rows?: number[]; cols?: number[]; center?: { r: number; c: number }; color?: TileType },
) {
  const center = opts.center ?? { r: 0, c: 0 }
  if (fx === 'cross') {
    for (const rr of opts.rows ?? [center.r]) fireDash('H', rr)
    for (const cc of opts.cols ?? [center.c]) fireDash('V', cc)
    await sleep(180)
    return
  }
  if (fx === 'thickCross') {
    for (const rr of opts.rows ?? []) fireDash('H', rr, true)
    for (const cc of opts.cols ?? []) fireDash('V', cc, true)
    fireShockAt(center.r, center.c, '#ffd27a', 1.6)
    await sleep(220)
    return
  }
  if (fx === 'blast3') {
    fireShockAt(center.r, center.c, '#ff9f4a', 1.8)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = center.r + dr
        const cc = center.c + dc
        if (rr >= 0 && rr < ROWS.value && cc >= 0 && cc < COLS.value) spawnParticles(rr, cc, '🍊')
      }
    }
    await sleep(200)
    return
  }
  if (fx === 'clearAll') {
    const id = vortexSeq++
    vortex.value = { id, color: '#ff8a6a' }
    fireShockAt(center.r, center.c, '#ff6b5a', 2.2)
    await sleep(480)
    if (vortex.value?.id === id) vortex.value = null
    return
  }
  if (fx === 'halfRows') {
    for (const rr of opts.rows ?? []) fireDash('H', rr, true)
    await sleep(200)
    return
  }
  if (fx === 'halfCols') {
    for (const cc of opts.cols ?? []) fireDash('V', cc, true)
    await sleep(200)
    return
  }
  if (fx === 'color' && opts.color) {
    const id = vortexSeq++
    vortex.value = { id, color: typeColor[opts.color] }
    await sleep(420)
    if (vortex.value?.id === id) vortex.value = null
  }
}

async function playSpecialFX(cells: Set<string>) {
  const rockets: Tile[] = []
  const bombs: Tile[] = []
  const balls: Tile[] = []
  for (const k of cells) {
    const [r, c] = parseKey(k)
    const t = tileAt(r, c)
    if (!t?.special) continue
    if (t.special === 'rocket') rockets.push(t)
    else if (t.special === 'bomb') bombs.push(t)
    else if (t.special === 'colorBall') balls.push(t)
  }
  for (const r of rockets) fireRocket(r)
  for (const b of bombs) fireBomb(b)
  for (const b of balls) await fireColorBall(b)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const randType = (): TileType => {
  const list = TYPES.value
  return list[(Math.random() * list.length) | 0]!
}
const key = (r: number, c: number) => `${r},${c}`
function parseKey(k: string): [number, number] {
  return k.split(',').map(Number) as [number, number]
}
function tileAt(r: number, c: number): Tile | null {
  if (r < 0 || r >= ROWS.value || c < 0 || c >= COLS.value) return null
  return grid.value[r]?.[c] ?? null
}
function setCell(r: number, c: number, t: Tile | null) {
  if (r >= 0 && r < ROWS.value && c >= 0 && c < COLS.value) grid.value[r]![c] = t
}
function blockerAt(r: number, c: number): BlockerCell | null {
  return blockers.value[r]?.[c] ?? null
}
function isRock(r: number, c: number) {
  return blockerAt(r, c)?.type === 'rock'
}
function isChained(r: number, c: number) {
  return blockerAt(r, c)?.type === 'chain'
}
function makeTile(row: number, col: number, type?: TileType): Tile {
  return { id: idSeq++, type: type ?? randType(), special: null, dir: null, row, col, ry: row, leaving: false, pop: false, born: true }
}

function goalLabel(g: Goal): string {
  if (g.type === 'score') return `分数 ${Math.min(goalProgress.value.score, g.target)}/${g.target}`
  if (g.type === 'collect') {
    const emoji = ALL_TYPES[g.color] ?? '🍎'
    const cur = goalProgress.value.collect[g.color] ?? 0
    return `${emoji} ${Math.min(cur, g.target)}/${g.target}`
  }
  const name = g.blocker === 'ice' ? '冰' : g.blocker === 'rock' ? '石' : '链'
  const cur = goalProgress.value.clear[g.blocker] ?? 0
  return `${name} ${Math.min(cur, g.target)}/${g.target}`
}

function checkGoals(): boolean {
  return level.value.goals.every((g) => {
    if (g.type === 'score') return goalProgress.value.score >= g.target
    if (g.type === 'collect') return (goalProgress.value.collect[g.color] ?? 0) >= g.target
    if (g.type === 'clear') return (goalProgress.value.clear[g.blocker] ?? 0) >= g.target
    return false
  })
}

function damageBlocker(r: number, c: number, kinds?: Array<BlockerCell['type']>) {
  const b = blockerAt(r, c)
  if (!b || b.layers <= 0) return
  if (kinds && !kinds.includes(b.type)) return
  b.layers--
  if (b.layers <= 0) {
    goalProgress.value.clear[b.type] = (goalProgress.value.clear[b.type] ?? 0) + 1
    blockers.value[r]![c] = null
    if (b.type === 'rock') setCell(r, c, null)
  }
}

function onCellsCleared(cells: Set<string>, clearedTiles: Tile[]) {
  for (const t of clearedTiles) {
    if (!t.special) {
      const idx = TYPES.value.indexOf(t.type)
      if (idx >= 0) goalProgress.value.collect[idx] = (goalProgress.value.collect[idx] ?? 0) + 1
    }
  }
  for (const k of cells) {
    const [r, c] = parseKey(k)
    // 本格冰随消除受损
    damageBlocker(r, c, ['ice'])
    // 相邻石头/锁链/冰（邻接震碎）
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      damageBlocker(r + dr, c + dc, ['rock', 'chain'])
    }
  }
  goalProgress.value.score = score.value
}

function genBoard() {
  const rows = ROWS.value
  const cols = COLS.value
  const parsed = parseBlockers(level.value.blockers)
  blockers.value = blockersToGrid(parsed, rows, cols)
  const g: (Tile | null)[][] = []
  for (let r = 0; r < rows; r++) {
    g[r] = []
    for (let c = 0; c < cols; c++) {
      if (isRock(r, c)) {
        g[r]![c] = null
        continue
      }
      let t: TileType
      let guard = 0
      do {
        t = randType()
        guard++
      } while (
        guard < 50 &&
        ((c >= 2 && g[r]![c - 1]?.type === t && g[r]![c - 2]?.type === t) ||
          (r >= 2 && g[r - 1]![c]?.type === t && g[r - 2]![c]?.type === t))
      )
      g[r]![c] = makeTile(r, c, t)
    }
  }
  grid.value = g
  let guard = 0
  while (!hasPossibleMove() && guard++ < 20) shuffleBoard()
}

interface Run { cells: { r: number; c: number }[]; dir: Dir; len: number }
function findRuns(): Run[] {
  const runs: Run[] = []
  const rows = ROWS.value
  const cols = COLS.value
  for (let r = 0; r < rows; r++) {
    let len = 1
    for (let c = 1; c <= cols; c++) {
      const prev = tileAt(r, c - 1)
      const cur = c < cols ? tileAt(r, c) : null
      const same = prev && cur && !prev.special && !cur.special && prev.type === cur.type
      if (same) len++
      else {
        if (len >= 3) {
          const cells = []
          for (let i = 0; i < len; i++) cells.push({ r, c: c - 1 - i })
          runs.push({ cells, dir: 'H', len })
        }
        len = 1
      }
    }
  }
  for (let c = 0; c < cols; c++) {
    let len = 1
    for (let r = 1; r <= rows; r++) {
      const prev = tileAt(r - 1, c)
      const cur = r < rows ? tileAt(r, c) : null
      const same = prev && cur && !prev.special && !cur.special && prev.type === cur.type
      if (same) len++
      else {
        if (len >= 3) {
          const cells = []
          for (let i = 0; i < len; i++) cells.push({ r: r - 1 - i, c })
          runs.push({ cells, dir: 'V', len })
        }
        len = 1
      }
    }
  }
  return runs
}

interface Cluster { cells: Set<string>; type: TileType; hasH: boolean; hasV: boolean; maxRun: number }
function buildClusters(runs: Run[]): Cluster[] {
  const map = new Map<string, { r: number; c: number; type: TileType }>()
  for (const run of runs) for (const cell of run.cells) {
    const t = tileAt(cell.r, cell.c)
    if (t) map.set(key(cell.r, cell.c), { r: cell.r, c: cell.c, type: t.type })
  }
  const visited = new Set<string>()
  const clusters: Cluster[] = []
  for (const [k, start] of map) {
    if (visited.has(k)) continue
    const cells = new Set<string>()
    const queue = [start]
    const type = start.type
    while (queue.length) {
      const cur = queue.pop()!
      const ck = key(cur.r, cur.c)
      if (visited.has(ck)) continue
      visited.add(ck)
      cells.add(ck)
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
        const nr = cur.r + dr, nc = cur.c + dc
        const nk = key(nr, nc)
        const nb = map.get(nk)
        if (nb && !visited.has(nk) && nb.type === type) queue.push(nb)
      }
    }
    let hasH = false, hasV = false, maxRun = 0
    for (const run of runs) {
      if (run.cells.every((cell) => cells.has(key(cell.r, cell.c)))) {
        if (run.dir === 'H') hasH = true; else hasV = true
        if (run.len > maxRun) maxRun = run.len
      }
    }
    clusters.push({ cells, type, hasH, hasV, maxRun })
  }
  return clusters
}

function decideSpecial(cluster: Cluster): { special: Special; dir: Dir | null } {
  if (!level.value.specialEnabled) return { special: null, dir: null }
  const size = cluster.cells.size
  if (size >= 5 && cluster.hasH && cluster.hasV) return { special: 'bomb', dir: null }
  if (size >= 5 && cluster.maxRun >= 5) return { special: 'colorBall', dir: null }
  if (cluster.maxRun >= 4) return { special: 'rocket', dir: cluster.hasV && !cluster.hasH ? 'V' : 'H' }
  return { special: null, dir: null }
}

function pushFloat(text: string, sub = '') {
  const id = floatSeq++
  floats.value.push({ id, text, sub })
  setTimeout(() => { floats.value = floats.value.filter((f) => f.id !== id) }, 900)
}

function markClear(r: number, c: number) {
  const t = tileAt(r, c)
  if (!t || t.leaving) return
  t.pop = true
  t.leaving = true
  pushBurst(r, c, t.type)
  spawnParticles(r, c, t.type)
}
function comboLabel(n: number): string {
  if (n >= 6) return 'Incredible!'
  if (n >= 5) return 'Awesome!'
  if (n >= 4) return 'Great!'
  if (n >= 3) return 'Good!'
  return 'Nice!'
}

function pickColorBallTarget(_ball: Tile): TileType {
  const present = new Set<TileType>()
  for (const t of tiles.value) if (!t.special && !t.leaving) present.add(t.type)
  const arr = [...present]
  if (arr.length) return arr[(Math.random() * arr.length) | 0]!
  return TYPES.value[0]!
}

function getClearFromSpecial(t: Tile): Set<string> {
  const cells = new Set<string>()
  if (t.special === 'rocket') {
    if (t.dir === 'H') for (let c = 0; c < COLS.value; c++) { if (!isRock(t.row, c)) cells.add(key(t.row, c)) }
    else for (let r = 0; r < ROWS.value; r++) { if (!isRock(r, t.col)) cells.add(key(r, t.col)) }
  } else if (t.special === 'bomb') {
    const r0 = t.row === ROWS.value - 1 ? t.row - 1 : t.row
    const c0 = t.col === COLS.value - 1 ? t.col - 1 : t.col
    for (let dr = 0; dr <= 1; dr++) for (let dc = 0; dc <= 1; dc++) {
      const r = r0 + dr, c = c0 + dc
      if (r >= 0 && r < ROWS.value && c >= 0 && c < COLS.value && !isRock(r, c)) cells.add(key(r, c))
    }
  } else if (t.special === 'colorBall') {
    if (!t.ballTarget) t.ballTarget = pickColorBallTarget(t)
    const target = t.ballTarget
    for (let r = 0; r < ROWS.value; r++) for (let c = 0; c < COLS.value; c++) {
      const o = tileAt(r, c)
      if (o && !o.special && o.type === target) cells.add(key(r, c))
    }
  }
  return cells
}

async function applyGravity() {
  const newTiles: Tile[] = []
  const fallers: Tile[] = []
  for (let c = 0; c < COLS.value; c++) {
    const stack: Tile[] = []
    for (let r = ROWS.value - 1; r >= 0; r--) {
      if (isRock(r, c)) continue
      const t = tileAt(r, c)
      if (t && !t.leaving) stack.push(t)
      setCell(r, c, null)
    }
    const slots: number[] = []
    for (let r = ROWS.value - 1; r >= 0; r--) {
      if (!isRock(r, c)) slots.push(r)
    }
    let si = 0
    for (const t of stack) {
      if (si >= slots.length) break
      const writeRow = slots[si++]!
      const oldRow = t.row
      setCell(writeRow, c, t)
      t.row = writeRow
      if (oldRow !== writeRow) { t.ry = oldRow; fallers.push(t) }
    }
    while (si < slots.length) {
      const targetRow = slots[si]!
      const startRow = -(slots.length - si)
      const nt = makeTile(targetRow, c)
      nt.ry = startRow
      setCell(targetRow, c, nt)
      newTiles.push(nt)
      si++
    }
  }
  await nextTick()
  for (const t of fallers) t.ry = t.row
  if (newTiles.length) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
    for (const t of newTiles) t.ry = t.row
  }
}

function sweepLeaving() {
  for (let r = 0; r < ROWS.value; r++) for (let c = 0; c < COLS.value; c++) {
    const t = tileAt(r, c)
    if (t?.leaving) setCell(r, c, null)
  }
}

async function resolve(swapA?: Tile, swapB?: Tile) {
  combo.value = 0
  while (true) {
    const runs = findRuns()
    if (runs.length === 0) break
    combo.value++
    const clusters = buildClusters(runs)
    const allClear = new Set<string>()
    for (const cl of clusters) for (const k of cl.cells) allClear.add(k)
    const specialsToPlace: { cluster: Cluster; cell: { r: number; c: number } }[] = []
    const consumed = new Set<string>()
    for (const cl of clusters) {
      const dec = decideSpecial(cl)
      if (dec.special) {
        let place: { r: number; c: number }
        if (swapA && cl.cells.has(key(swapA.row, swapA.col))) place = { r: swapA.row, c: swapA.col }
        else if (swapB && cl.cells.has(key(swapB.row, swapB.col))) place = { r: swapB.row, c: swapB.col }
        else { const [rr, cc] = parseKey(cl.cells.values().next().value!); place = { r: rr, c: cc } }
        specialsToPlace.push({ cluster: cl, cell: place })
        consumed.add(key(place.r, place.c))
      }
    }
    const toClear = new Set<string>()
    for (const k of allClear) if (!consumed.has(k)) toClear.add(k)
    let expanded = true
    while (expanded) {
      expanded = false
      for (const k of [...toClear]) {
        const [r, c] = parseKey(k)
        const t = tileAt(r, c)
        if (t && t.special) {
          for (const sk of getClearFromSpecial(t)) {
            if (!consumed.has(sk) && !toClear.has(sk)) { toClear.add(sk); expanded = true }
          }
        }
      }
    }
    const clearedTiles: Tile[] = []
    for (const k of toClear) {
      const [r, c] = parseKey(k)
      const t = tileAt(r, c)
      if (t) clearedTiles.push(t)
    }
    score.value += toClear.size * 30 * combo.value
    onCellsCleared(toClear, clearedTiles)
    if (combo.value > 1) pushFloat(comboLabel(combo.value), `${combo.value} 连击!`)
    await playSpecialFX(toClear)
    for (const k of toClear) { const [r, c] = parseKey(k); markClear(r, c) }
    await sleep(320)
    sweepLeaving()
    for (const sp of specialsToPlace) {
      const dec = decideSpecial(sp.cluster)
      const nt = makeTile(sp.cell.r, sp.cell.c, sp.cluster.type)
      nt.special = dec.special
      nt.dir = dec.dir
      nt.born = true
      setCell(sp.cell.r, sp.cell.c, nt)
    }
    await applyGravity(); await sleep(360)
  }
  combo.value = 0
}

function swapInGrid(a: Tile, b: Tile) {
  setCell(a.row, a.col, b)
  setCell(b.row, b.col, a)
  const ar = a.row, ac = a.col
  a.row = b.row; a.col = b.col; a.ry = b.row
  b.row = ar; b.col = ac; b.ry = ar
}

function wouldMatch(a: Tile, b: Tile): boolean {
  swapInGrid(a, b)
  const ok = findRuns().length > 0
  swapInGrid(a, b)
  return ok
}

function hasPossibleMove(): boolean {
  const list = tiles.value.filter((t) => !t.leaving && !isChained(t.row, t.col))
  for (const t of list) {
    for (const [dr, dc] of [[0, 1], [1, 0]] as const) {
      const nb = tileAt(t.row + dr, t.col + dc)
      if (!nb || isChained(nb.row, nb.col)) continue
      if (t.special || nb.special || wouldMatch(t, nb)) return true
    }
  }
  return false
}

function shuffleBoard() {
  const list = tiles.value.filter((t) => !t.leaving && !t.special && !isChained(t.row, t.col))
  const types = list.map((t) => t.type)
  for (let i = types.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    const ti = types[i]!; const tj = types[j]!
    types[i] = tj; types[j] = ti
  }
  list.forEach((t, i) => (t.type = types[i]!))
  let guard = 0
  while (findRuns().length > 0 && guard++ < 30) {
    for (let i = types.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0
      const ti = types[i]!; const tj = types[j]!
      types[i] = tj; types[j] = ti
    }
    list.forEach((t, i) => (t.type = types[i]!))
  }
}

async function finishIfNeeded() {
  if (phase.value !== 'playing') return
  if (checkGoals()) {
    phase.value = 'won'
    winStars.value = calcStars(moves.value, level.value.moves)
    emit('win', {
      levelId: level.value.id,
      stars: winStars.value,
      score: score.value,
      movesLeft: moves.value,
      movesTotal: level.value.moves,
    })
    return
  }
  if (moves.value <= 0) {
    phase.value = 'lost'
    emit('lose', { levelId: level.value.id, score: score.value })
  }
}

async function afterMoveCleanup() {
  if (phase.value === 'playing' && !hasPossibleMove()) {
    if (level.value.autoShuffle) {
      pushFloat('洗牌', '无解')
      await sleep(300)
      shuffleBoard()
    } else {
      phase.value = 'lost'
      emit('lose', { levelId: level.value.id, score: score.value })
      return
    }
  }
  await finishIfNeeded()
}

async function clearCellsWave(
  cells: Set<string>,
  fx: FusionFx,
  fxOpts: { rows?: number[]; cols?: number[]; center?: { r: number; c: number }; color?: TileType } = {},
  scoreMul = 120,
) {
  const clearedTiles: Tile[] = []
  for (const k of cells) {
    const [r, c] = parseKey(k)
    const o = tileAt(r, c)
    if (o && !o.leaving) clearedTiles.push(o)
  }
  score.value += Math.max(1, cells.size) * scoreMul * Math.max(1, combo.value)
  onCellsCleared(cells, clearedTiles)
  await playFusionWaveFX(fx, fxOpts)
  for (const k of cells) {
    const [r, c] = parseKey(k)
    markClear(r, c)
  }
  await sleep(300)
  sweepLeaving()
  await applyGravity()
  await sleep(340)
}

async function runFusion(a: Tile, b: Tile) {
  const sa = a.special as SpecialKind
  const sb = b.special as SpecialKind
  const kind = classifyFusion(sa, sb)
  const fr = a.row
  const fc = a.col
  combo.value = 1
  pushFloat(comboLabel(combo.value), fusionLabel(kind))
  await playFusionMergeFX(fr, fc, kind)

  const blocked = (r: number, c: number) => isRock(r, c)

  if (kind === 'color-rocket') {
    const rowCells = new Set<string>()
    rowCells.add(key(a.row, a.col))
    rowCells.add(key(b.row, b.col))
    const rowList = addRowBand(rowCells, fr, ROWS.value, COLS.value, blocked)
    await clearCellsWave(rowCells, 'halfRows', { rows: rowList, center: { r: fr, c: fc } }, 100)

    const colCells = new Set<string>()
    const colList = addColBand(colCells, fc, ROWS.value, COLS.value, blocked)
    if (colCells.size) {
      combo.value++
      pushFloat(comboLabel(combo.value), '纵向扫荡!')
      await clearCellsWave(colCells, 'halfCols', { cols: colList, center: { r: fr, c: fc } }, 100)
    }
    await resolve()
    return
  }

  if (kind === 'color-color') {
    // 先吃掉两颗彩虹（短促汇聚，再逐色扫）
    const seed = new Set<string>([key(a.row, a.col), key(b.row, b.col)])
    await clearCellsWave(seed, 'blast3', { center: { r: fr, c: fc } }, 80)

    const order = TYPES.value.filter((type) =>
      tiles.value.some((t) => !t.leaving && !t.special && t.type === type),
    )
    for (const color of order) {
      const cells = new Set<string>()
      for (let r = 0; r < ROWS.value; r++) {
        for (let c = 0; c < COLS.value; c++) {
          if (blocked(r, c)) continue
          const t = tileAt(r, c)
          if (t && !t.leaving && !t.special && t.type === color) cells.add(key(r, c))
        }
      }
      if (!cells.size) continue
      combo.value++
      pushFloat(comboLabel(combo.value), `${color} 消除!`)
      await clearCellsWave(cells, 'color', { color, center: { r: fr, c: fc } }, 90)
    }
    await resolve()
    return
  }

  const wave = buildStaticFusionWave(kind, fr, fc, ROWS.value, COLS.value, blocked)
  wave.cells.push(key(b.row, b.col))
  const cells = new Set(wave.cells)
  await clearCellsWave(cells, wave.fx, {
    rows: wave.rows,
    cols: wave.cols,
    center: wave.center ?? { r: fr, c: fc },
  })
  await resolve()
}

async function trySwap(a: Tile, b: Tile) {
  if (busy.value || phase.value !== 'playing') return
  if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) !== 1) return
  if (isChained(a.row, a.col) || isChained(b.row, b.col)) {
    pushFloat('锁住了', '先解开锁链')
    return
  }
  busy.value = true

  // 两个特殊道具互换 → 融合（无需三连）
  if (a.special && b.special) {
    swapInGrid(a, b)
    await nextTick()
    moves.value--
    await runFusion(a, b)
    await afterMoveCleanup()
    busy.value = false
    return
  }

  swapInGrid(a, b)
  await nextTick()
  const hasMatch = findRuns().length > 0
  if (!hasMatch) {
    await sleep(120)
    swapInGrid(a, b)
    await nextTick()
    busy.value = false
    return
  }
  moves.value--
  await resolve(a, b)
  await afterMoveCleanup()
  busy.value = false
}

function onTileClick(t: Tile) {
  if (busy.value || phase.value !== 'playing') return
  if (!selected.value) {
    selected.value = { row: t.row, col: t.col }
    return
  }
  const s = selected.value
  const st = tileAt(s.row, s.col)
  selected.value = null
  if (!st || st === t) return
  if (Math.abs(s.row - t.row) + Math.abs(s.col - t.col) === 1) {
    trySwap(st, t)
  } else {
    selected.value = { row: t.row, col: t.col }
  }
}

async function onTileDblClick(t: Tile) {
  if (busy.value || phase.value !== 'playing' || !t.special) return
  if (isChained(t.row, t.col)) {
    pushFloat('锁住了', '先解开锁链')
    return
  }
  selected.value = null
  busy.value = true
  moves.value--
  combo.value = 0
  combo.value++
  const cells = getClearFromSpecial(t)
  cells.add(key(t.row, t.col))
  const clearedTiles: Tile[] = []
  for (const k of cells) {
    const [r, c] = parseKey(k)
    const o = tileAt(r, c)
    if (o) clearedTiles.push(o)
  }
  score.value += 120 * combo.value
  onCellsCleared(cells, clearedTiles)
  pushFloat(comboLabel(combo.value), t.special === 'rocket' ? '冲刺!' : t.special === 'bomb' ? '爆炸!' : '彩虹!')
  await playSpecialFX(cells)
  for (const k of cells) { const [r, c] = parseKey(k); markClear(r, c) }
  await sleep(320); sweepLeaving(); await applyGravity(); await sleep(360)
  await resolve()
  await afterMoveCleanup()
  busy.value = false
}

function resizeFx() {
  const cv = fxCanvas.value
  if (!cv) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  cv.width = boardW.value * dpr
  cv.height = boardH.value * dpr
  fxCtx = cv.getContext('2d')
}

function start() {
  level.value = getLevel(props.levelId)
  moves.value = level.value.moves
  score.value = 0
  combo.value = 0
  winStars.value = 0
  goalProgress.value = { score: 0, collect: {}, clear: {} }
  selected.value = null
  floats.value = []
  bursts.value = []
  dashes.value = []
  shocks.value = []
  vortex.value = null
  fusionFlash.value = null
  pool.length = 0
  if (fxCtx && fxCanvas.value) fxCtx.clearRect(0, 0, fxCanvas.value.width, fxCanvas.value.height)
  phase.value = 'playing'
  genBoard()
  nextTick(resizeFx)
}

watch(() => props.levelId, () => start())

onMounted(() => {
  start()
  resizeFx()
  emit('ready')
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
})
</script>

<template>
  <div class="m3">
    <div class="m3__title">
      <span class="m3__title-emoji">🏠</span>
      <span class="m3__title-text">第 {{ level.id }} 关 · {{ level.name }}</span>
    </div>
    <div class="m3__head">
      <div class="m3__stat m3__stat--goals">
        <span
          v-for="(g, i) in level.goals"
          :key="i"
          class="m3__goal"
        >{{ goalLabel(g) }}</span>
      </div>
      <div class="m3__stat">
        <span class="m3__stat-label">步数</span>
        <span class="m3__stat-value" :class="{ 'is-low': moves <= 5 }">{{ moves }}</span>
      </div>
      <button type="button" class="m3__restart" @click="start">重开</button>
    </div>

    <div class="m3__board" :style="{ width: boardW + 'px', height: boardH + 'px' }">
      <!-- 障碍物层：石头占格；冰/锁链叠在格子上 -->
      <div
        v-for="b in blockerList"
        :key="`b-${b.row}-${b.col}-${b.type}`"
        class="m3__blocker"
        :class="[`is-${b.type}`, { 'is-thick': b.layers > 1 }]"
        :style="{ transform: `translate(${b.col * CELL}px, ${b.row * CELL}px)` }"
      >
        <span v-if="b.type === 'ice'">❄️</span>
        <span v-else-if="b.type === 'rock'">🪨</span>
        <span v-else>🔗</span>
      </div>

      <button
        v-for="t in tiles"
        :key="t.id"
        type="button"
        class="m3__tile"
        :class="[
          `m3__tile--${t.type}`,
          {
            'is-selected': selected && selected.row === t.row && selected.col === t.col,
            'is-leaving': t.leaving,
            'is-rocket': t.special === 'rocket',
            'is-bomb': t.special === 'bomb',
            'is-colorball': t.special === 'colorBall',
            'is-chained': isChained(t.row, t.col),
          },
        ]"
        :style="{ transform: `translate(${t.col * CELL}px, ${t.ry * CELL}px)` }"
        @click="onTileClick(t)"
        @dblclick="onTileDblClick(t)"
      >
        <span class="m3__tile-inner" :class="{ 'is-leaving': t.leaving, 'is-born': t.born }">
          <span class="m3__tile-face">
            <template v-if="t.special === 'rocket'"><span class="m3__rocket" :class="`is-${t.dir}`">🚀</span></template>
            <template v-else-if="t.special === 'bomb'">💣</template>
            <template v-else-if="t.special === 'colorBall'">🌈</template>
            <template v-else>{{ t.type }}</template>
          </span>
        </span>
      </button>

      <div class="m3__bursts">
        <span
          v-for="b in bursts"
          :key="b.id"
          class="m3__burst"
          :style="{ left: b.x + 'px', top: b.y + 'px', '--bc': b.color }"
        />
      </div>

      <canvas
        ref="fxCanvas"
        class="m3__fx"
        :style="{ width: boardW + 'px', height: boardH + 'px' }"
      />

      <div class="m3__dashes">
        <span
          v-for="d in dashes"
          :key="d.id"
          class="m3__dash"
          :class="[`is-${d.dir}`, { 'is-thick': d.thick }]"
          :style="d.dir === 'H' ? { top: d.axis * CELL + 'px' } : { left: d.axis * CELL + 'px' }"
        />
      </div>

      <div class="m3__shocks">
        <span
          v-for="s in shocks"
          :key="s.id"
          class="m3__shock"
          :style="{ left: s.x + 'px', top: s.y + 'px', '--sc': s.color, '--ss': s.scale ?? 1 }"
        />
      </div>

      <div
        v-if="fusionFlash"
        class="m3__fusion-flash"
        :class="`is-${fusionFlash.kind}`"
        :style="{ left: fusionFlash.x + 'px', top: fusionFlash.y + 'px' }"
      />

      <div v-if="vortex" class="m3__vortex" :style="{ '--vc': vortex.color }">
        <span class="m3__vortex-ring" />
        <span class="m3__vortex-ring" />
        <span class="m3__vortex-core" />
      </div>

      <Transition-group name="m3-float" tag="div" class="m3__floats">
        <div v-for="f in floats" :key="f.id" class="m3__float">
          <span class="m3__float-text">{{ f.text }}</span>
          <span v-if="f.sub" class="m3__float-sub">{{ f.sub }}</span>
        </div>
      </Transition-group>

      <Transition name="m3-result">
        <div v-if="phase !== 'playing' && phase !== 'idle'" class="m3__overlay">
          <p class="m3__overlay-title">
            {{ phase === 'won' ? `🎉 通关！${'⭐'.repeat(winStars)}` : '💦 步数用尽' }}
          </p>
          <p class="m3__overlay-score">得分 {{ score }}</p>
          <button type="button" class="m3__restart" @click="start">再来一局</button>
        </div>
      </Transition>
    </div>

    <p class="m3__tip">交换相邻方块完成目标；4 连出火箭，L/T 出炸弹，5 连出彩虹球。两个特殊道具互换可融合。冰块需消除覆盖，锁链限制移动，石头靠相邻消除震碎。</p>
  </div>
</template>

<style scoped>
.m3 {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px 12px;
  background:
    radial-gradient(circle at 20% 0%, var(--clay-surface-soft, #faf5e8) 0%, transparent 55%),
    linear-gradient(180deg, var(--clay-surface-soft, #faf5e8) 0%, var(--clay-canvas, #fffaf0) 100%);
  border-radius: 0 0 var(--clay-rounded-lg, 16px) var(--clay-rounded-lg, 16px);
}
.m3__title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px 0;
  padding-right: 80px;
}
.m3__title-emoji {
  font-size: 18px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
}
.m3__title-text {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--clay-ink, #0a0a0a);
}
.m3__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px 4px;
  padding-right: 80px;
  flex-wrap: wrap;
}
.m3__stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
}
.m3__stat--goals {
  flex: 1;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
.m3__goal {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: color-mix(in srgb, var(--clay-surface-card, #f5f0e0) 80%, white);
  font-size: 11px;
  font-weight: 700;
  color: var(--clay-ink, #0a0a0a);
  white-space: nowrap;
}
.m3__stat-label {
  font-weight: 600;
}
.m3__stat-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--clay-ink, #0a0a0a);
}
.m3__stat-value.is-low {
  color: var(--clay-brand-coral, #ff6b5a);
}
.m3__stat-target {
  font-size: 11px;
  color: var(--clay-muted-soft, #9a9a9a);
}
.m3__restart {
  margin-left: auto;
  appearance: none;
  border: 1px solid rgba(0, 0, 0, 0.25);
  background: #3b82f6;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}
.m3__restart:hover { transform: translateY(-1px); }
.m3__restart:active { transform: translateY(1px); box-shadow: none; }

.m3__board {
  position: relative;
  margin: 0 auto;
  border-radius: 12px;
  background: linear-gradient(180deg, #f0e6d0 0%, #e8dcc0 100%);
  border: 1.5px solid #2c2c2c;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.m3__blocker {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 5;
  font-size: 15px;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.m3__blocker.is-ice {
  background: color-mix(in srgb, #a8d8ff 55%, transparent);
  box-shadow: inset 0 0 0 1.5px rgba(120, 180, 230, 0.7);
  z-index: 3;
}
.m3__blocker.is-ice.is-thick {
  background: color-mix(in srgb, #7ec0ff 70%, transparent);
}
.m3__blocker.is-rock {
  background: linear-gradient(180deg, #c4b8a0 0%, #8a7a60 100%);
  border: 1.5px solid #2c2c2c;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.18);
  z-index: 4;
}
.m3__blocker.is-chain {
  background: transparent;
  z-index: 7;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.m3__tile {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid #2c2c2c;
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
  transition: transform 0.38s cubic-bezier(0.3, 1.45, 0.5, 1), box-shadow 0.15s ease;
  will-change: transform;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.18);
  z-index: 2;
}
.m3__tile.is-chained {
  filter: saturate(0.75);
}
.m3__tile-inner {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  transition: transform 0.18s ease, opacity 0.18s ease, filter 0.18s ease;
}
.m3__tile-face {
  font-size: 17px;
  line-height: 1;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
}
.m3__tile--🍎 { background: linear-gradient(180deg, #ffd1c4 0%, #ff8a6a 100%); --pop: #ff8a6a; }
.m3__tile--🫐 { background: linear-gradient(180deg, #cdd9ff 0%, #7a9aef 100%); --pop: #7a9aef; }
.m3__tile--🥝 { background: linear-gradient(180deg, #d4f0b8 0%, #8acb5a 100%); --pop: #8acb5a; }
.m3__tile--🍋 { background: linear-gradient(180deg, #fff3c4 0%, #ffd84a 100%); --pop: #ffd84a; }
.m3__tile--🍇 { background: linear-gradient(180deg, #e6c4ff 0%, #b27aef 100%); --pop: #b27aef; }
.m3__tile--🍊 { background: linear-gradient(180deg, #ffe0c4 0%, #ff9f4a 100%); --pop: #ff9f4a; }

.m3__tile:hover .m3__tile-inner {
  transform: scale(1.06);
  filter: brightness(1.08);
}
.m3__tile:active .m3__tile-inner { transform: scale(0.94); }
.m3__tile.is-selected {
  box-shadow: 0 0 0 3px #fff, 0 0 0 5px #2c2c2c, 0 4px 6px rgba(0, 0, 0, 0.3);
  z-index: 6;
}
.m3__tile.is-selected .m3__tile-inner {
  animation: m3-sel 1.1s ease-in-out infinite;
}

.m3__tile.is-rocket,
.m3__tile.is-bomb,
.m3__tile.is-colorball {
  background: linear-gradient(135deg, #fff8e0 0%, #ffe9a8 100%);
  z-index: 4;
}
.m3__tile.is-colorball .m3__tile-face { animation: m3-spin 3s linear infinite; }

.m3__tile.is-leaving {
  z-index: 8;
  pointer-events: none;
}
.m3__tile-inner.is-leaving {
  animation: m3-pop 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.m3__tile-inner.is-born {
  animation: m3-born 0.34s cubic-bezier(0.34, 1.4, 0.64, 1);
}

@keyframes m3-sel {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}
@keyframes m3-pop {
  0% { transform: scale(1); opacity: 1; filter: none; }
  20% { transform: scale(1.32); opacity: 1; filter: brightness(1.4) drop-shadow(0 0 6px var(--pop, rgba(255, 224, 140, 0.9))); }
  55% { transform: scale(1.18); opacity: 0.95; filter: brightness(1.6) drop-shadow(0 0 10px var(--pop, rgba(255, 224, 140, 0.95))); }
  100% { transform: scale(0); opacity: 0; filter: blur(3px) brightness(2); }
}
@keyframes m3-born {
  0% { transform: scale(0.85); opacity: 0.5; }
  60% { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); }
}
@keyframes m3-spin {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

.m3__bursts {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}
.m3__fx {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 25;
}
.m3__burst {
  position: absolute;
  width: 32px;
  height: 32px;
  pointer-events: none;
}
.m3__burst::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--bc);
  box-shadow: 0 0 8px var(--bc);
  animation: m3-ring 0.56s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.m3__burst::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, var(--bc) 55%, transparent 100%);
  animation: m3-flash 0.5s ease-out forwards;
}
@keyframes m3-ring {
  0% { transform: scale(0.5); opacity: 1; }
  60% { transform: scale(1.8); opacity: 0.5; }
  100% { transform: scale(2.6); opacity: 0; }
}
@keyframes m3-flash {
  0% { transform: scale(0.5); opacity: 0.95; }
  35% { transform: scale(1.15); opacity: 0.85; }
  100% { transform: scale(0.2); opacity: 0; }
}

.m3__rocket { display: inline-block; line-height: 1; }
.m3__rocket.is-H { transform: rotate(90deg); }
.m3__rocket.is-V { transform: rotate(0deg); }
.m3__tile.is-rocket .m3__tile-face { animation: m3-rocket-bob 1.4s ease-in-out infinite; }
@keyframes m3-rocket-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
}

.m3__dashes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 28;
  overflow: hidden;
}
.m3__dash {
  position: absolute;
  pointer-events: none;
}
.m3__dash.is-H {
  left: 0;
  width: 100%;
  height: 32px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 220, 140, 0.15) 20%, rgba(255, 240, 200, 0.95) 50%, rgba(255, 220, 140, 0.15) 80%, transparent 100%);
  box-shadow: 0 0 12px rgba(255, 220, 140, 0.8);
  animation: m3-dash-h 0.5s cubic-bezier(0.3, 0.7, 0.4, 1) forwards;
}
.m3__dash.is-V {
  top: 0;
  width: 32px;
  height: 100%;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 220, 140, 0.15) 20%, rgba(255, 240, 200, 0.95) 50%, rgba(255, 220, 140, 0.15) 80%, transparent 100%);
  box-shadow: 0 0 12px rgba(255, 220, 140, 0.8);
  animation: m3-dash-v 0.5s cubic-bezier(0.3, 0.7, 0.4, 1) forwards;
}
.m3__dash.is-H.is-thick {
  height: 36px;
  margin-top: -2px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 180, 90, 0.25) 15%, rgba(255, 245, 200, 1) 50%, rgba(255, 180, 90, 0.25) 85%, transparent 100%);
  box-shadow: 0 0 18px rgba(255, 190, 100, 0.95);
  animation-duration: 0.58s;
}
.m3__dash.is-V.is-thick {
  width: 36px;
  margin-left: -2px;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 180, 90, 0.25) 15%, rgba(255, 245, 200, 1) 50%, rgba(255, 180, 90, 0.25) 85%, transparent 100%);
  box-shadow: 0 0 18px rgba(255, 190, 100, 0.95);
  animation-duration: 0.58s;
}
@keyframes m3-dash-h {
  0% { transform: translateX(-60%); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0.9; }
}
@keyframes m3-dash-v {
  0% { transform: translateY(-60%); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0.9; }
}

.m3__shocks {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 28;
}
.m3__shock {
  position: absolute;
  width: 32px;
  height: 32px;
  pointer-events: none;
}
.m3__shock::before,
.m3__shock::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid var(--sc);
  box-shadow: 0 0 14px var(--sc);
  animation: m3-shock 0.56s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.m3__shock::after { animation-delay: 0.08s; }
@keyframes m3-shock {
  0% { transform: scale(calc(0.4 * var(--ss, 1))); opacity: 1; }
  100% { transform: scale(calc(3.4 * var(--ss, 1))); opacity: 0; }
}

.m3__fusion-flash {
  position: absolute;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 35;
  background: radial-gradient(circle, #fff 0%, #ffe08a 40%, transparent 72%);
  box-shadow: 0 0 22px rgba(255, 220, 120, 0.9);
  animation: m3-fusion-flash 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.m3__fusion-flash.is-color-bomb,
.m3__fusion-flash.is-color-color {
  background: radial-gradient(circle, #fff 0%, #ff8a6a 35%, #b27aef 70%, transparent 78%);
  box-shadow: 0 0 28px rgba(178, 122, 239, 0.85);
}
.m3__fusion-flash.is-bomb-rocket,
.m3__fusion-flash.is-rocket-rocket {
  background: radial-gradient(circle, #fff 0%, #ffd84a 45%, transparent 75%);
}
@keyframes m3-fusion-flash {
  0% { transform: scale(0.4); opacity: 0.4; }
  45% { transform: scale(2.4); opacity: 1; }
  100% { transform: scale(3.2); opacity: 0; }
}

.m3__vortex {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 40;
  display: grid;
  place-items: center;
}
.m3__vortex-ring,
.m3__vortex-core {
  position: absolute;
  border-radius: 50%;
}
.m3__vortex-ring {
  width: 260px;
  height: 260px;
  border: 4px dashed var(--vc);
  box-shadow: 0 0 24px var(--vc), inset 0 0 24px var(--vc);
  animation: m3-vortex-spin 0.52s cubic-bezier(0.4, 0.1, 0.6, 1) forwards;
}
.m3__vortex-ring:nth-child(2) {
  width: 180px;
  height: 180px;
  border-style: solid;
  border-width: 3px;
  animation-duration: 0.5s;
  animation-direction: reverse;
}
.m3__vortex-core {
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, #fff 0%, var(--vc) 45%, transparent 75%);
  animation: m3-vortex-core 0.52s ease-out forwards;
}
@keyframes m3-vortex-spin {
  0% { transform: scale(0.2) rotate(0deg); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: scale(1.15) rotate(360deg); opacity: 0; }
}
@keyframes m3-vortex-core {
  0% { transform: scale(0.3); opacity: 0.2; }
  50% { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(2.2); opacity: 0; }
}

.m3__floats {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.m3__float {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px solid #2c2c2c;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
.m3__float-text {
  font-size: 16px;
  font-weight: 800;
  color: var(--clay-brand-coral, #ff6b5a);
}
.m3__float-sub {
  font-size: 11px;
  font-weight: 700;
  color: var(--clay-muted, #6a6a6a);
}
.m3-float-enter-active { transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
.m3-float-leave-active { transition: all 0.4s ease; }
.m3-float-enter-from { opacity: 0; transform: translateY(10px) scale(0.7); }
.m3-float-leave-to { opacity: 0; transform: translateY(-16px) scale(1.1); }

.m3__overlay {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(180deg, rgba(250, 245, 232, 0.92) 0%, rgba(255, 250, 240, 0.95) 100%);
  backdrop-filter: blur(4px);
  border-radius: 11px;
}
.m3__overlay-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #2c2c2c;
}
.m3__overlay-score {
  margin: 0;
  font-size: 13px;
  color: var(--clay-muted, #6a6a6a);
  font-weight: 600;
}
.m3-result-enter-active,
.m3-result-leave-active { transition: opacity 0.25s ease; }
.m3-result-enter-from,
.m3-result-leave-to { opacity: 0; }

.m3__tip {
  margin: 0;
  padding: 0 4px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--clay-muted, #6a6a6a);
  text-align: center;
}
</style>
