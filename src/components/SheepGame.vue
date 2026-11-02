<script setup lang="ts">
import { computed, ref } from 'vue'

type CardType = '🥕' | '🌽' | '🔔' | '🪣' | '🧤' | '🥛' | '🌾' | '🥬' | '🐑' | '🍅' | '🥒' | '🐝' | '🐔' | '🍓' | '🍇' | '🌻'
const TYPES: CardType[] = ['🥕', '🌽', '🔔', '🪣', '🧤', '🥛', '🌾', '🥬', '🐑', '🍅', '🥒', '🐝', '🐔', '🍓', '🍇', '🌻']

type Pile = 'board' | 'left' | 'right'

interface Card {
  id: number
  type: CardType
  pile: Pile
  layer: number
  col: number
  row: number
  jx: number
  jy: number
  state: 'pile' | 'slot' | 'removed' | 'gone'
  slotIndex: number
  holdIndex: number
  removing: boolean
}

const CARD_W = 36
const CARD_H = 36
const GAP = 0
const CELL_W = CARD_W + GAP
const CELL_H = CARD_H + GAP
const OFFSET_X = CELL_W / 2
const OFFSET_Y = CELL_H / 2

// 平铺层：底层 5 层等大（8×4），顶层较少（4×3），半卡偏移制造压盖
const LAYERS = [
  { cols: 8, rows: 4 },
  { cols: 8, rows: 4 },
  { cols: 8, rows: 4 },
  { cols: 8, rows: 4 },
  { cols: 8, rows: 4 },
  { cols: 4, rows: 3 },
]

const SIDE_PILE_LEFT = 7
const SIDE_PILE_RIGHT = 7
const PILE_FAN = 6

const SLOT_COUNT = 7
const SLOT_CELL_W = 40
const SLOT_CELL_H = 36
const SLOT_GAP = 4
const SLOT_Y_OFFSET = 14

const PROPS_INIT = { shuffle: 3, undo: 3, remove: 3 }

let idSeq = 0
const cards = ref<Card[]>([])
const phase = ref<'playing' | 'won' | 'lost'>('playing')
const busy = ref(false)
const removeMode = ref(false)
const propsLeft = ref({ ...PROPS_INIT })

// 按实际包围盒计算牌面宽高（横向偏移在 0/半卡 交替，纵向逐层累加）
const playW = Math.max(...LAYERS.map((l, i) => ((i * OFFSET_X) % CELL_W) + l.cols * CELL_W - GAP))
const playH = Math.max(...LAYERS.map((l, i) => i * OFFSET_Y + l.rows * CELL_H - GAP))
const sidePileY = playH + 14
const holdY = sidePileY + CARD_H + 10
const holdCellW = CARD_W + 2
const holdMax = 3
const holdTotalW = holdMax * holdCellW
const slotTotalW = SLOT_COUNT * SLOT_CELL_W + (SLOT_COUNT - 1) * SLOT_GAP
const stageW = Math.max(playW, slotTotalW, holdTotalW)
const playOffsetX = (stageW - playW) / 2
const slotStartX = (stageW - slotTotalW) / 2
const holdStartX = (stageW - holdTotalW) / 2
const slotY = holdY + CARD_H + 14
const stageH = slotY + SLOT_CELL_H

function cardPos(card: Card) {
  if (card.state === 'slot') {
    return {
      x: slotStartX + card.slotIndex * (SLOT_CELL_W + SLOT_GAP) + (SLOT_CELL_W - CARD_W) / 2,
      y: slotY,
    }
  }
  if (card.pile === 'left') {
    return { x: playOffsetX + card.layer * PILE_FAN, y: sidePileY }
  }
  if (card.state === 'removed') {
    return { x: holdStartX + card.holdIndex * holdCellW, y: holdY }
  }
  if (card.pile === 'right') {
    return { x: playOffsetX + playW - CARD_W - card.layer * PILE_FAN, y: sidePileY }
  }
  const ox = playOffsetX + ((card.layer * OFFSET_X) % CELL_W)
  const oy = card.layer * OFFSET_Y
  return { x: ox + card.col * CELL_W + card.jx, y: oy + card.row * CELL_H + card.jy }
}

function rectOverlap(a: Card, b: Card) {
  const pa = cardPos(a)
  const pb = cardPos(b)
  return (
    pa.x < pb.x + CARD_W &&
    pa.x + CARD_W > pb.x &&
    pa.y < pb.y + CARD_H &&
    pa.y + CARD_H > pb.y
  )
}

function isCovered(card: Card) {
  if (card.state !== 'pile') return false
  for (const o of cards.value) {
    if (o.state !== 'pile') continue
    if (o.pile !== card.pile) continue
    if (o.layer <= card.layer) continue
    if (card.pile === 'board' && !rectOverlap(card, o)) continue
    return true
  }
  return false
}

const clickableMap = computed(() => {
  const m = new Map<number, boolean>()
  for (const c of cards.value) {
    if (c.state === 'pile') m.set(c.id, !isCovered(c))
  }
  return m
})

const pileCount = computed(() => cards.value.filter(c => c.state === 'pile').length)
const slotCount = computed(() => cards.value.filter(c => c.state === 'slot').length)

// ===== 位置生成 =====
function genSlots() {
  const list: { pile: Pile; layer: number; col: number; row: number; jx: number; jy: number }[] = []
  LAYERS.forEach((layer, li) => {
    for (let r = 0; r < layer.rows; r++) {
      for (let c = 0; c < layer.cols; c++) {
        list.push({
          pile: 'board' as Pile,
          layer: li,
          col: c,
          row: r,
          jx: (Math.random() * 2 - 1) * 3,
          jy: (Math.random() * 2 - 1) * 3,
        })
      }
    }
  })
  for (let i = 0; i < SIDE_PILE_LEFT; i++) {
    list.push({ pile: 'left' as Pile, layer: i, col: 0, row: 0, jx: 0, jy: 0 })
  }
  for (let i = 0; i < SIDE_PILE_RIGHT; i++) {
    list.push({ pile: 'right' as Pile, layer: i, col: 0, row: 0, jx: 0, jy: 0 })
  }
  return list
}

// ===== 求解器 =====
function coveredInList(card: Card, list: Card[]) {
  if (card.state !== 'pile') return false
  for (const o of list) {
    if (o.state !== 'pile') continue
    if (o.pile !== card.pile) continue
    if (o.layer <= card.layer) continue
    if (card.pile === 'board' && !rectOverlap(card, o)) continue
    return true
  }
  return false
}

function isSolvable(initial: Card[]): boolean {
  const list: Card[] = initial.map(c => ({ ...c, state: 'pile', slotIndex: -1, removing: false }))
  const slot: Card[] = []
  let guard = 0
  while (guard++ < 6000) {
    if (list.every(c => c.state === 'gone')) return true
    const uncovered = list.filter(c => c.state === 'pile' && !coveredInList(c, list))
    if (uncovered.length === 0) return false
    const countType = (arr: Card[], t: CardType) => arr.filter(c => c.type === t).length
    let best: Card | null = null
    let bestScore = -1
    for (const c of uncovered) {
      const score = countType(uncovered, c.type) + countType(slot, c.type)
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
    if (!best) return false
    best.state = 'slot'
    best.slotIndex = slot.length
    slot.push(best)
    const t = best.type
    const same = slot.filter(c => c.type === t)
    if (same.length >= 3) {
      same.slice(0, 3).forEach(c => (c.state = 'gone'))
      slot.splice(0, slot.length, ...slot.filter(c => c.state === 'slot'))
      slot.forEach((c, i) => (c.slotIndex = i))
    }
    if (slot.length >= SLOT_COUNT) {
      const byType = new Map<CardType, number>()
      slot.forEach(c => byType.set(c.type, (byType.get(c.type) ?? 0) + 1))
      if (![...byType.values()].some(v => v >= 3)) return false
    }
  }
  return false
}

// ===== 生成可解关卡（同类型尽量跨层分散，避免一层同色） =====
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

function buildDeck(): Card[] {
  const positions = genSlots()
  const total = positions.length
  const groupCount = total / 3
  // 类型池：每组 3 张同类型
  function makePool(): CardType[] {
    const pool: CardType[] = []
    for (let g = 0; g < groupCount; g++) {
      const t = TYPES[g % TYPES.length]!
      pool.push(t, t, t)
    }
    return shuffle(pool)
  }
  // 多次随机分配 + 求解器校验，命中即采用
  for (let attempt = 0; attempt < 60; attempt++) {
    const pool = makePool()
    const deck: Card[] = positions.map((p, i) => ({
      id: idSeq++,
      type: pool[i]!,
      pile: p.pile,
      layer: p.layer,
      col: p.col,
      row: p.row,
      jx: p.jx,
      jy: p.jy,
      state: 'pile',
      slotIndex: -1,
      holdIndex: -1,
      removing: false,
    }))
    if (isSolvable(deck)) return deck
  }
  // 兜底：返回最后一次随机分配（同类型已跨层分散，大概率可解）
  const pool = makePool()
  return positions.map((p, i) => ({
    id: idSeq++,
    type: pool[i]!,
    pile: p.pile,
    layer: p.layer,
    col: p.col,
    row: p.row,
    jx: p.jx,
    jy: p.jy,
    state: 'pile' as const,
    slotIndex: -1,
    holdIndex: -1,
    removing: false,
  }))
}

function start() {
  cards.value = buildDeck()
  phase.value = 'playing'
  busy.value = false
  removeMode.value = false
  propsLeft.value = { ...PROPS_INIT }
}
start()

// ===== 点击 / 消除 / 判定 =====
function clickCard(card: Card) {
  if (phase.value !== 'playing' || busy.value) return
  // 暂放区卡片：点击回到底部卡片栏（不消耗道具次数）
  if (card.state === 'removed') {
    const slotIndex = cards.value.filter(c => c.state === 'slot').length
    if (slotIndex >= SLOT_COUNT) return
    card.state = 'slot'
    card.slotIndex = slotIndex
    card.holdIndex = -1
    reindexHold()
    busy.value = true
    window.setTimeout(() => checkEliminate(), 280)
    return
  }
  // 移出道具：把选中卡片移到暂放区（不删除、不进卡片栏），对卡堆和卡片栏均可使用
  if (removeMode.value) {
    if (propsLeft.value.remove <= 0) return
    if (card.state !== 'pile' && card.state !== 'slot') return
    if (card.state === 'pile' && !clickableMap.value.get(card.id)) return
    if (card.state === 'slot') {
      card.state = 'removed'
      card.slotIndex = -1
      reindexSlot()
    } else {
      card.state = 'removed'
    }
    card.holdIndex = cards.value.filter(c => c.state === 'removed').length - 1
    propsLeft.value.remove -= 1
    removeMode.value = false
    checkEnd()
    return
  }
  if (card.state !== 'pile') return
  if (!clickableMap.value.get(card.id)) return
  const slotIndex = cards.value.filter(c => c.state === 'slot').length
  if (slotIndex >= SLOT_COUNT) return
  card.state = 'slot'
  card.slotIndex = slotIndex
  busy.value = true
  window.setTimeout(() => checkEliminate(), 280)
}

function reindexHold() {
  const remaining = cards.value.filter(c => c.state === 'removed').sort((a, b) => a.holdIndex - b.holdIndex)
  remaining.forEach((c, i) => (c.holdIndex = i))
}

function checkEliminate() {
  const byType = new Map<CardType, Card[]>()
  for (const c of cards.value) {
    if (c.state !== 'slot') continue
    const arr = byType.get(c.type) ?? []
    arr.push(c)
    byType.set(c.type, arr)
  }
  let toRemove: Card[] | null = null
  for (const arr of byType.values()) {
    if (arr.length >= 3) {
      toRemove = arr.slice(0, 3)
      break
    }
  }
  if (toRemove) {
    toRemove.forEach(c => (c.removing = true))
    window.setTimeout(() => {
      toRemove!.forEach(c => (c.state = 'gone'))
      reindexSlot()
      busy.value = false
      checkEnd()
    }, 420)
  } else {
    busy.value = false
    checkEnd()
  }
}

function reindexSlot() {
  const remaining = cards.value.filter(c => c.state === 'slot').sort((a, b) => a.slotIndex - b.slotIndex)
  remaining.forEach((c, i) => (c.slotIndex = i))
}

function checkEnd() {
  const inPlay = cards.value.filter(c => c.state === 'pile' || c.state === 'slot')
  if (inPlay.length === 0) {
    phase.value = 'won'
    return
  }
  const slot = cards.value.filter(c => c.state === 'slot')
  if (slot.length >= SLOT_COUNT) {
    const byType = new Map<CardType, number>()
    slot.forEach(c => byType.set(c.type, (byType.get(c.type) ?? 0) + 1))
    if (![...byType.values()].some(v => v >= 3)) phase.value = 'lost'
  }
}

// ===== 道具 =====
function propUndo() {
  if (phase.value !== 'playing' || busy.value) return
  if (propsLeft.value.undo <= 0) return
  const slot = cards.value.filter(c => c.state === 'slot').sort((a, b) => a.slotIndex - b.slotIndex)
  const last = slot[slot.length - 1]
  if (!last) return
  last.state = 'pile'
  last.slotIndex = -1
  reindexSlot()
  propsLeft.value.undo -= 1
}

function propShuffle() {
  if (phase.value !== 'playing' || busy.value) return
  if (propsLeft.value.shuffle <= 0) return
  const board = cards.value.filter(c => c.state === 'pile')
  if (board.length === 0) return
  for (let attempt = 0; attempt < 30; attempt++) {
    const types = shuffle(board.map(c => c.type))
    const snapshot = board.map((c, i) => ({ ...c, type: types[i]! }))
    if (isSolvable([...snapshot, ...cards.value.filter(c => c.state === 'slot')])) {
      board.forEach((c, i) => (c.type = types[i]!))
      propsLeft.value.shuffle -= 1
      return
    }
  }
  const types = shuffle(board.map(c => c.type))
  board.forEach((c, i) => (c.type = types[i]!))
  propsLeft.value.shuffle -= 1
}

function propRemove() {
  if (phase.value !== 'playing' || busy.value) return
  if (propsLeft.value.remove <= 0) return
  removeMode.value = !removeMode.value
}

// 草地纹理随机位置（固定种子避免重渲染跳动）
const grassTufts = Array.from({ length: 14 }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  scale: 0.7 + Math.random() * 0.6,
}))
function grassStyle(i: number) {
  const t = grassTufts[i - 1] ?? { left: 50, top: 50, scale: 1 }
  return {
    left: t.left + '%',
    top: t.top + '%',
    transform: `scale(${t.scale})`,
  }
}
</script>

<template>
  <div class="sheep">
    <!-- 顶部栏：重开按钮（左上，避开右上角的关闭按钮） -->
    <div class="sheep__head">
      <button type="button" class="sheep__restart" @click="start">重开</button>
    </div>

    <!-- 草地舞台 -->
    <div class="sheep__stage" :style="{ width: stageW + 'px', height: stageH + 'px' }">
      <!-- 草地背景纹理 -->
      <div class="sheep__grass" aria-hidden="true">
        <span v-for="i in 14" :key="i" class="sheep__grass-tuft" :style="grassStyle(i)" />
      </div>

      <!-- 牌面卡片 -->
      <button
        v-for="card in cards"
        :key="card.id"
        type="button"
        class="sheep__card"
        :class="{
          'is-covered': card.state === 'pile' && !clickableMap.get(card.id),
          'is-slot': card.state === 'slot',
          'is-removed': card.state === 'removed',
          'is-gone': card.state === 'gone',
          'is-removing': card.removing,
          'is-remove-mode': removeMode && ((card.state === 'pile' && clickableMap.get(card.id)) || card.state === 'slot'),
        }"
        :style="{
          transform: `translate(${cardPos(card).x}px, ${cardPos(card).y}px)`,
          zIndex: card.state === 'slot' ? 200 + card.slotIndex : card.state === 'removed' ? 150 + card.holdIndex : card.pile === 'board' ? 10 + card.layer : 10 + card.layer,
        }"
        :disabled="
          busy ||
          card.state === 'gone' ||
          (removeMode
            ? card.state === 'removed' || (card.state === 'pile' && !clickableMap.get(card.id))
            : card.state === 'pile' && !clickableMap.get(card.id))
        "
        @click="clickCard(card)"
      >
        <span class="sheep__card-face">{{ card.type }}</span>
      </button>

      <!-- 暂放区（移出卡片存放处，位于卡堆与卡片栏之间） -->
      <div
        class="sheep__hold"
        :class="{ 'is-active': removeMode }"
        :style="{
          left: holdStartX - 6 + 'px',
          top: holdY - 6 + 'px',
          width: holdTotalW + 12 + 'px',
          height: CARD_H + 12 + 'px',
        }"
        aria-hidden="true"
      >
        <span class="sheep__hold-label">暂放</span>
      </div>

      <!-- 槽位占位（棕色木质托盘） -->
      <div
        v-for="i in SLOT_COUNT"
        :key="'slot-' + i"
        class="sheep__slot-cell"
        :style="{
          left: slotStartX + (i - 1) * (SLOT_CELL_W + SLOT_GAP) + 'px',
          top: slotY + 'px',
          width: SLOT_CELL_W + 'px',
          height: SLOT_CELL_H + 'px',
        }"
      />
      <div
        class="sheep__tray"
        :style="{
          left: slotStartX - 8 + 'px',
          top: slotY - 8 + 'px',
          width: slotTotalW + 16 + 'px',
          height: SLOT_CELL_H + 16 + 'px',
        }"
        aria-hidden="true"
      />
    </div>

    <!-- 道具栏：蓝色方形按钮 -->
    <div class="sheep__tools">
      <button
        type="button"
        class="sheep__tool"
        :class="{ 'is-active': removeMode }"
        :disabled="busy || propsLeft.remove <= 0"
        @click="propRemove"
      >
        <span class="sheep__tool-icon">🃏</span>
        <span class="sheep__tool-label">移出</span>
        <span class="sheep__tool-badge">{{ propsLeft.remove }}</span>
      </button>
      <button
        type="button"
        class="sheep__tool"
        :disabled="busy || propsLeft.undo <= 0"
        @click="propUndo"
      >
        <span class="sheep__tool-icon">↩</span>
        <span class="sheep__tool-label">撤回</span>
        <span class="sheep__tool-badge">{{ propsLeft.undo }}</span>
      </button>
      <button
        type="button"
        class="sheep__tool"
        :disabled="busy || propsLeft.shuffle <= 0"
        @click="propShuffle"
      >
        <span class="sheep__tool-icon">⇄</span>
        <span class="sheep__tool-label">洗牌</span>
        <span class="sheep__tool-badge">{{ propsLeft.shuffle }}</span>
      </button>
    </div>

    <Transition name="sheep-result">
      <div v-if="phase !== 'playing'" class="sheep__overlay">
        <p class="sheep__overlay-title">
          {{ phase === 'won' ? '🎉 你赢了！' : '💥 再来一局' }}
        </p>
        <button type="button" class="sheep__restart" @click="start">再来一局</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sheep {
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

/* 顶部栏 */
.sheep__head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 4px;
  /* 右上角留给 FloatingTv 的关闭按钮，避免重叠 */
  padding-right: 44px;
}

.sheep__restart {
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
.sheep__restart:hover { transform: translateY(-1px); }
.sheep__restart:active { transform: translateY(1px); box-shadow: none; }

/* 草地舞台 */
.sheep__stage {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 12px;
}

.sheep__grass {
  display: none;
}

.sheep__grass-tuft {
  position: absolute;
  width: 14px;
  height: 10px;
  background:
    radial-gradient(circle at 30% 100%, #9bc56a 0 4px, transparent 5px),
    radial-gradient(circle at 70% 100%, #9bc56a 0 4px, transparent 5px),
    radial-gradient(circle at 50% 100%, #8ab45a 0 5px, transparent 6px);
  opacity: 0.5;
}

/* 卡牌：3D 立体感（厚底边 + 阴影） */
.sheep__card {
  position: absolute;
  top: 0;
  left: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1.5px solid #2c2c2c;
  border-bottom: 4px solid #5a7a3a;
  background: linear-gradient(180deg, #fffdf6 0%, #f4ecd8 100%);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.25);
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  transition:
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease,
    filter 0.15s ease;
  will-change: transform;
}

.sheep__card-face {
  font-size: 18px;
  line-height: 1;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
}

.sheep__card:hover:not(:disabled) {
  filter: brightness(1.08);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.sheep__card:active:not(:disabled) {
  filter: brightness(0.95);
}

/* 被压住的卡：半透明黑遮罩 + 灰化 */
.sheep__card.is-covered {
  filter: grayscale(0.7) brightness(0.62);
  cursor: not-allowed;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.sheep__card.is-covered::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.32);
  pointer-events: none;
}

.sheep__card.is-slot {
  border-bottom-color: #8a6a3a;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.28);
}

.sheep__card.is-remove-mode {
  animation: sheep-pulse 1s ease-in-out infinite;
}

.sheep__card.is-removing {
  animation: sheep-pop 0.42s ease forwards;
  z-index: 300;
}

.sheep__card.is-gone {
  opacity: 0;
  pointer-events: none;
}

@keyframes sheep-pulse {
  0%, 100% { box-shadow: 0 2px 3px rgba(0, 0, 0, 0.25), 0 0 0 0 rgba(255, 107, 90, 0.5); }
  50% { box-shadow: 0 2px 3px rgba(0, 0, 0, 0.25), 0 0 0 5px rgba(255, 107, 90, 0.4); }
}

@keyframes sheep-pop {
  0% { opacity: 1; filter: none; }
  35% { opacity: 1; filter: brightness(1.4) drop-shadow(0 0 6px rgba(255, 200, 80, 0.9)); }
  100% { opacity: 0; filter: blur(4px) brightness(2); }
}

/* 槽位占位格 */
.sheep__slot-cell {
  position: absolute;
  border-radius: 6px;
  border: 1px dashed rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0.18);
}

/* 棕色木质托盘 */
.sheep__tray {
  position: absolute;
  border-radius: 10px;
  background:
    repeating-linear-gradient(
      90deg,
      #8a5a2a 0 4px,
      #7a4a22 4px 8px
    );
  border: 2px solid #5a3a1a;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 0;
  pointer-events: none;
}

/* 暂放区（移出卡片存放处） */
.sheep__hold {
  position: absolute;
  border-radius: 10px;
  border: 1.5px dashed rgba(0, 0, 0, 0.35);
  background: rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
  z-index: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.sheep__hold.is-active {
  border-color: var(--clay-brand-coral, #ff6b5a);
  background: rgba(255, 107, 90, 0.12);
}

.sheep__hold-label {
  font-size: 10px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.3);
  letter-spacing: 0.1em;
}

.sheep__card.is-removed {
  border-bottom-color: #8a6a3a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.22);
  cursor: pointer;
}

.sheep__card.is-removed:hover {
  filter: brightness(1.08);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.28);
}

/* 道具栏：蓝色方形按钮 */
.sheep__tools {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding-top: 2px;
}

.sheep__tool {
  position: relative;
  appearance: none;
  width: 64px;
  height: 56px;
  border-radius: 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.3);
  border-bottom: 4px solid #1e3a8a;
  background: linear-gradient(180deg, #4b91f6 0%, #3b7ae0 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.sheep__tool:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.08);
}

.sheep__tool:active:not(:disabled) {
  transform: translateY(1px);
  border-bottom-width: 2px;
}

.sheep__tool:disabled {
  opacity: 0.45;
  cursor: default;
}

.sheep__tool.is-active {
  background: linear-gradient(180deg, #ff8a5a 0%, #f56a3a 100%);
  border-bottom-color: #b04a1a;
}

.sheep__tool-icon {
  font-size: 18px;
  color: #ffd84a;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

.sheep__tool-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.sheep__tool-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #ffd84a;
  color: #2c2c2c;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  border: 1.5px solid #2c2c2c;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

/* 胜负遮罩 */
.sheep__overlay {
  position: absolute;
  inset: 0;
  z-index: 400;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background:
    radial-gradient(circle at 20% 0%, var(--clay-surface-soft, #faf5e8) 0%, transparent 55%),
    linear-gradient(180deg, rgba(250, 245, 232, 0.92) 0%, rgba(255, 250, 240, 0.94) 100%);
  backdrop-filter: blur(4px);
  border-radius: var(--clay-rounded-lg, 16px);
}

.sheep__overlay-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #2c2c2c;
}

.sheep-result-enter-active,
.sheep-result-leave-active {
  transition: opacity 0.25s ease;
}
.sheep-result-enter-from,
.sheep-result-leave-to {
  opacity: 0;
}
</style>
