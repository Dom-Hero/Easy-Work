<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Match3Game from '@/components/games/Match3Game.vue'
import Match3LevelMap from '@/components/games/Match3LevelMap.vue'
import { useMatch3Level } from '@/composables/useMatch3Level'

const SIZE = 56
const MARGIN = 24
const DRAG_THRESHOLD = 6
const STORAGE_KEY = 'floating-match3-pos'

const { currentLevel, setCurrentLevel, saveWin, totalStars } = useMatch3Level()
const playingLevel = ref(currentLevel.value)
const showMap = ref(false)

const open = ref(false)
const dragging = ref(false)
const hasInteracted = ref(false)
const loading = ref(true)
const gameReady = ref(false)

const pos = ref({ x: 0, y: 0 })
const vw = ref(typeof window === 'undefined' ? 0 : window.innerWidth)
const vh = ref(typeof window === 'undefined' ? 0 : window.innerHeight)

let pointerId: number | null = null
let startX = 0
let startY = 0
let startPosX = 0
let startPosY = 0
let moved = false

const showHint = computed(() => !hasInteracted.value && !open.value && !dragging.value)
const containerStyle = computed(() => ({
  transform: `translate3d(${pos.value.x}px, ${pos.value.y}px, 0)`,
}))
const panelWidth = computed(() => Math.min(440, vw.value - 32))
const spaceAbove = computed(() => pos.value.y - MARGIN)
const spaceBelow = computed(() => vh.value - pos.value.y - SIZE - MARGIN)

const placement = computed<'above' | 'below' | 'right'>(() => {
  const panelLeftEdge = pos.value.x - panelWidth.value
  if (panelLeftEdge < MARGIN) return 'right'
  return spaceAbove.value >= spaceBelow.value ? 'above' : 'below'
})

const rightVertical = computed<'up' | 'down'>(() => {
  if (placement.value !== 'right') return 'down'
  const availableAbove = pos.value.y + SIZE - MARGIN
  const availableBelow = vh.value - pos.value.y - MARGIN
  return availableAbove > availableBelow ? 'up' : 'down'
})

const panelStyle = computed(() => {
  if (placement.value === 'right') {
    const availableRight = pos.value.x - 12 - MARGIN
    const width = Math.min(panelWidth.value, Math.max(240, availableRight))
    const extendUp = rightVertical.value === 'up'
    const available = extendUp ? pos.value.y + SIZE - MARGIN : vh.value - pos.value.y - MARGIN
    const maxH = Math.min(620, Math.max(220, available))
    return {
      right: 'calc(100% + 12px)',
      left: 'auto',
      bottom: extendUp ? '0' : 'auto',
      top: extendUp ? 'auto' : '0px',
      width: `${width}px`,
      maxHeight: `${maxH}px`,
    } as Record<string, string>
  }
  const isAbove = placement.value === 'above'
  const available = isAbove ? spaceAbove.value : spaceBelow.value
  const maxH = Math.min(620, Math.max(220, available))
  return {
    left: '0',
    right: 'auto',
    bottom: isAbove ? 'calc(100% + 12px)' : 'auto',
    top: isAbove ? 'auto' : 'calc(100% + 12px)',
    width: `${panelWidth.value}px`,
    maxHeight: `${maxH}px`,
  } as Record<string, string>
})

function defaultPosition() {
  return { x: MARGIN, y: window.innerHeight - SIZE - MARGIN }
}
function clampPosition(x: number, y: number) {
  const maxX = window.innerWidth - SIZE
  const maxY = window.innerHeight - SIZE
  return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) }
}
function loadPosition() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (typeof p.x === 'number' && typeof p.y === 'number') return clampPosition(p.x, p.y)
    }
  } catch { /* ignore */ }
  return defaultPosition()
}
function savePosition() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos.value)) } catch { /* ignore */ }
}
function onResize() {
  vw.value = window.innerWidth
  vh.value = window.innerHeight
  pos.value = clampPosition(pos.value.x, pos.value.y)
}

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  pointerId = e.pointerId
  dragging.value = true
  moved = false
  startX = e.clientX
  startY = e.clientY
  startPosX = pos.value.x
  startPosY = pos.value.y
  ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!moved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return
  moved = true
  pos.value = clampPosition(startPosX + dx, startPosY + dy)
}
function onPointerUp(e: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  ;(e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
  pointerId = null
  if (moved) { savePosition(); hasInteracted.value = true }
  else toggle()
}
function toggle() {
  open.value = !open.value
  hasInteracted.value = true
}

async function onGameReady() {
  gameReady.value = true
  await nextTick()
  setTimeout(() => { loading.value = false }, 350)
}

function onGameWin(payload: {
  levelId: number
  stars: number
  score: number
  movesLeft: number
  movesTotal: number
}) {
  saveWin(payload.levelId, payload.movesLeft, payload.movesTotal)
  playingLevel.value = currentLevel.value
}

function onSelectLevel(id: number) {
  setCurrentLevel(id)
  playingLevel.value = id
  showMap.value = false
}

onMounted(() => {
  playingLevel.value = currentLevel.value
  pos.value = loadPosition()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div
    class="fm3"
    :class="{
      'is-open': open,
      'is-dragging': dragging,
      'is-hint': showHint,
      'placement-above': placement === 'above',
      'placement-below': placement === 'below',
      'placement-right': placement === 'right',
      'placement-right-up': placement === 'right' && rightVertical === 'up',
      'placement-right-down': placement === 'right' && rightVertical === 'down',
    }"
    :style="containerStyle"
  >
    <Transition name="fm3-panel">
      <section
        v-if="open"
        class="fm3__panel"
        :style="panelStyle"
        role="dialog"
        aria-label="我的小家"
      >
        <button type="button" class="fm3__map-btn" aria-label="关卡地图" title="关卡地图" @click="showMap = !showMap">
          🗺️
        </button>
        <button type="button" class="fm3__close" aria-label="关闭" @click="toggle">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>

        <div v-if="loading" class="fm3__loader">
          <div class="fm3__loader-emoji">🏠</div>
          <div class="fm3__loader-bar"><span></span></div>
          <p class="fm3__loader-text">正在布置我的小家…</p>
        </div>

        <div class="fm3__meta" v-show="!loading">
          <span>继续第 {{ playingLevel }} 关</span>
          <span class="fm3__stars">★ {{ totalStars }}</span>
        </div>

        <Match3Game
          :key="playingLevel"
          :level-id="playingLevel"
          :class="{ 'fm3__game--hidden': loading }"
          @ready="onGameReady"
          @win="onGameWin"
        />

        <Match3LevelMap :open="showMap" @close="showMap = false" @select="onSelectLevel" />
      </section>
    </Transition>

    <button
      type="button"
      class="fm3__btn"
      :class="{ 'is-open': open, 'is-hint': showHint, 'is-dragging': dragging }"
      :aria-expanded="open"
      aria-label="我的小家"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <span class="fm3__ping" aria-hidden="true"></span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 11l8-6 8 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M6 10v9h12v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M10 19v-5h4v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.fm3 {
  position: fixed;
  left: 0;
  top: 0;
  width: 56px;
  height: 56px;
  z-index: 81;
  touch-action: none;
  will-change: transform;
}
.fm3__btn {
  position: absolute;
  inset: 0;
  appearance: none;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid var(--clay-ink, #0a0a0a);
  background: var(--clay-brand-mint, #a4d4c5);
  color: var(--clay-ink, #0a0a0a);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--clay-ink, #0a0a0a);
  transition: box-shadow 0.2s ease, background 0.2s ease;
}
.fm3__btn svg { width: 28px; height: 28px; position: relative; z-index: 1; }
.fm3__btn:hover { box-shadow: 4px 5px 0 var(--clay-ink, #0a0a0a); }
.fm3__btn:active { box-shadow: 2px 2px 0 var(--clay-ink, #0a0a0a); }
.fm3__btn.is-open { background: var(--clay-brand-coral, #ff6b5a); }
.fm3__btn.is-dragging { cursor: grabbing; box-shadow: 5px 6px 0 var(--clay-ink, #0a0a0a); }
.fm3__ping {
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 2px solid var(--clay-brand-mint, #a4d4c5);
  opacity: 0;
  pointer-events: none;
}
.fm3__btn.is-hint { animation: fm3-bob 2.6s ease-in-out infinite; }
.fm3__btn.is-hint .fm3__ping { animation: fm3-ping 2.6s ease-out infinite; }
.fm3__btn.is-open.is-hint,
.fm3__btn.is-open.is-hint .fm3__ping { animation: none; }
@keyframes fm3-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes fm3-ping {
  0% { transform: scale(1); opacity: 0.55; }
  70% { transform: scale(1.7); opacity: 0; }
  100% { transform: scale(1.7); opacity: 0; }
}

.fm3__panel {
  position: absolute;
  left: 0;
  bottom: calc(100% + 12px);
  width: 440px;
  max-height: 620px;
  display: flex;
  flex-direction: column;
  border-radius: var(--clay-rounded-lg, 16px);
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-soft, #faf5e8);
  box-shadow: 0 8px 28px rgba(10, 10, 10, 0.12);
  overflow: hidden;
}
.fm3.placement-right .fm3__panel {
  left: auto;
  bottom: auto;
  right: calc(100% + 12px);
  top: 0;
}
.fm3__map-btn {
  position: absolute;
  top: 10px;
  right: 44px;
  z-index: 9;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: color-mix(in srgb, var(--clay-surface-soft, #faf5e8) 88%, white);
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  backdrop-filter: blur(6px);
}
.fm3__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 48px 0 14px;
  font-size: 11px;
  font-weight: 700;
  color: var(--clay-muted, #6a6a6a);
}
.fm3__stars { color: #e6a800; }
.fm3__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 9;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: color-mix(in srgb, var(--clay-surface-soft, #faf5e8) 88%, white);
  color: var(--clay-muted, #6a6a6a);
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  backdrop-filter: blur(6px);
}
.fm3__close:hover {
  color: var(--clay-ink, #0a0a0a);
  border-color: var(--clay-muted-soft, #9a9a9a);
  background: var(--clay-surface-card, #f5f0e0);
}

.fm3__loader {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background:
    radial-gradient(circle at 30% 20%, var(--clay-surface-soft, #faf5e8) 0%, transparent 60%),
    linear-gradient(180deg, var(--clay-surface-soft, #faf5e8) 0%, var(--clay-canvas, #fffaf0) 100%);
}
.fm3__loader-emoji {
  font-size: 34px;
  animation: fm3-wobble 1.2s ease-in-out infinite;
}
.fm3__loader-bar {
  width: 140px;
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid var(--clay-hairline, #e5e5e5);
}
.fm3__loader-bar span {
  display: block;
  height: 100%;
  width: 40%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--clay-brand-mint, #a4d4c5), var(--clay-brand-lavender, #b8a4ed));
  animation: fm3-load 1.1s ease-in-out infinite;
}
.fm3__loader-text {
  margin: 0;
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
  font-weight: 600;
}
@keyframes fm3-wobble {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
}
@keyframes fm3-load {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(320%); }
}

.fm3__game--hidden {
  visibility: hidden;
  position: absolute;
  inset: 0;
}

.fm3-panel-enter-active,
.fm3-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: bottom left;
}
.fm3.placement-below .fm3-panel-enter-active,
.fm3.placement-below .fm3-panel-leave-active { transform-origin: top left; }
.fm3.placement-right .fm3-panel-enter-active,
.fm3.placement-right .fm3-panel-leave-active { transform-origin: right center; }
.fm3.placement-right-down .fm3-panel-enter-active,
.fm3.placement-right-down .fm3-panel-leave-active { transform-origin: right top; }
.fm3.placement-right-up .fm3-panel-enter-active,
.fm3.placement-right-up .fm3-panel-leave-active { transform-origin: right bottom; }
.fm3-panel-enter-from,
.fm3-panel-leave-to { opacity: 0; transform: translateY(8px) scale(0.96); }
.fm3.placement-below .fm3-panel-enter-from,
.fm3.placement-below .fm3-panel-leave-to { transform: translateY(-8px) scale(0.96); }
.fm3.placement-right .fm3-panel-enter-from,
.fm3.placement-right .fm3-panel-leave-to { transform: translateX(8px) scale(0.96); }

@media (max-width: 480px) {
  .fm3__panel { width: min(440px, calc(100vw - 32px)); }
}
@media (prefers-reduced-motion: reduce) {
  .fm3__btn.is-hint,
  .fm3__btn.is-hint .fm3__ping { animation: none; }
}
</style>
