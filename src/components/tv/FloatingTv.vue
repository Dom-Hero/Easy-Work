<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import SheepGame from '@/components/games/SheepGame.vue'

const SIZE = 56 // 按钮尺寸
const MARGIN = 24 // 默认外边距
const DRAG_THRESHOLD = 6 // 超过该位移视为拖动，而非点击
const STORAGE_KEY = 'floating-tv-pos'

const open = ref(false)
const dragging = ref(false)
// 用户是否已交互过（点击或拖动），用于停止微动效提示
const hasInteracted = ref(false)

// 按钮左上角在视口中的坐标
const pos = ref({ x: 0, y: 0 })
// 视口尺寸（用于位置检测）
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

// 面板宽度（与 CSS 保持一致：桌面 380，移动端 min(380, 100vw - 32)）
const panelWidth = computed(() => Math.min(380, vw.value - 32))

// 按钮上方/下方可用空间
const spaceAbove = computed(() => pos.value.y - MARGIN)
const spaceBelow = computed(() => vh.value - pos.value.y - SIZE - MARGIN)

// 位置检测：
// - 按钮太靠近左侧 → 'right'（面板在按钮右侧，纵向再选上/下）
// - 否则面板"右对齐"在按钮上方或下方：上方放得下优先 'above'，放不下用 'below'
const placement = computed<'above' | 'below' | 'right'>(() => {
  const panelLeftEdge = pos.value.x + SIZE - panelWidth.value
  if (panelLeftEdge < MARGIN) return 'right'
  return spaceAbove.value >= spaceBelow.value ? 'above' : 'below'
})

// 'right' 模式下的纵向方向（用于内联样式与过渡动画 transform-origin）
const rightVertical = computed<'up' | 'down'>(() => {
  if (placement.value !== 'right') return 'down'
  const availableAbove = pos.value.y + SIZE - MARGIN
  const availableBelow = vh.value - pos.value.y - MARGIN
  return availableAbove > availableBelow ? 'up' : 'down'
})

// 面板内联样式：根据 placement 精确定位，并限制宽高不超出视区
const panelStyle = computed(() => {
  if (placement.value === 'right') {
    const availableRight = vw.value - pos.value.x - SIZE - 12 - MARGIN
    const width = Math.min(panelWidth.value, Math.max(240, availableRight))
    const extendUp = rightVertical.value === 'up'
    const available = extendUp ? pos.value.y + SIZE - MARGIN : vh.value - pos.value.y - MARGIN
    const maxH = Math.min(580, Math.max(220, available))
    return {
      left: 'calc(100% + 12px)',
      right: 'auto',
      bottom: extendUp ? '0' : 'auto',
      top: extendUp ? 'auto' : '0px',
      width: `${width}px`,
      maxHeight: `${maxH}px`,
    } as Record<string, string>
  }
  // 'above' 或 'below'：右对齐，纵向在按钮上方或下方
  const isAbove = placement.value === 'above'
  const available = isAbove ? spaceAbove.value : spaceBelow.value
  const maxH = Math.min(580, Math.max(220, available))
  return {
    right: '0',
    left: 'auto',
    bottom: isAbove ? 'calc(100% + 12px)' : 'auto',
    top: isAbove ? 'auto' : 'calc(100% + 12px)',
    width: `${panelWidth.value}px`,
    maxHeight: `${maxH}px`,
  } as Record<string, string>
})

function defaultPosition() {
  return {
    x: window.innerWidth - SIZE - MARGIN,
    y: window.innerHeight - SIZE - MARGIN,
  }
}

function clampPosition(x: number, y: number) {
  const maxX = window.innerWidth - SIZE
  const maxY = window.innerHeight - SIZE
  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY)),
  }
}

function loadPosition() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (typeof p.x === 'number' && typeof p.y === 'number') {
        return clampPosition(p.x, p.y)
      }
    }
  } catch {
    /* ignore */
  }
  return defaultPosition()
}

function savePosition() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos.value))
  } catch {
    /* ignore */
  }
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
  if (moved) {
    savePosition()
    hasInteracted.value = true
  } else {
    toggle()
  }
}

function toggle() {
  open.value = !open.value
  hasInteracted.value = true
}

onMounted(() => {
  pos.value = loadPosition()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div
    class="floating-tv"
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
    <Transition name="ftv-panel">
      <section
        v-if="open"
        class="floating-tv__panel"
        :style="panelStyle"
        role="dialog"
        aria-label="小电视游戏"
      >
        <button type="button" class="floating-tv__close" aria-label="关闭" @click="toggle">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>

        <SheepGame />
      </section>
    </Transition>

    <button
      type="button"
      class="floating-tv__btn"
      :class="{ 'is-open': open, 'is-hint': showHint, 'is-dragging': dragging }"
      :aria-expanded="open"
      aria-label="小电视速览"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <span class="floating-tv__ping" aria-hidden="true"></span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.8" />
        <path d="M8 3l4 3 4-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M8 12h8M8 15h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.floating-tv {
  position: fixed;
  left: 0;
  top: 0;
  width: 56px;
  height: 56px;
  z-index: 80;
  touch-action: none;
  will-change: transform;
}

/* ===== 悬浮按钮 ===== */
.floating-tv__btn {
  position: absolute;
  inset: 0;
  appearance: none;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid var(--clay-ink, #0a0a0a);
  background: var(--clay-brand-lavender, #b8a4ed);
  color: var(--clay-ink, #0a0a0a);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--clay-ink, #0a0a0a);
  transition:
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.floating-tv__btn svg {
  width: 28px;
  height: 28px;
  position: relative;
  z-index: 1;
}

.floating-tv__btn:hover {
  box-shadow: 4px 5px 0 var(--clay-ink, #0a0a0a);
}

.floating-tv__btn:active {
  box-shadow: 2px 2px 0 var(--clay-ink, #0a0a0a);
}

.floating-tv__btn.is-open {
  background: var(--clay-brand-peach, #ffb084);
}

.floating-tv__btn.is-dragging {
  cursor: grabbing;
  box-shadow: 5px 6px 0 var(--clay-ink, #0a0a0a);
}

/* ===== 微动效提示（首次未交互前） ===== */
.floating-tv__ping {
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 2px solid var(--clay-brand-lavender, #b8a4ed);
  opacity: 0;
  pointer-events: none;
}

.floating-tv__btn.is-hint {
  animation: ftv-bob 2.6s ease-in-out infinite;
}

.floating-tv__btn.is-hint .floating-tv__ping {
  animation: ftv-ping 2.6s ease-out infinite;
}

.floating-tv__btn.is-open.is-hint,
.floating-tv__btn.is-open.is-hint .floating-tv__ping {
  animation: none;
}

@keyframes ftv-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes ftv-ping {
  0% {
    transform: scale(1);
    opacity: 0.55;
  }
  70% {
    transform: scale(1.7);
    opacity: 0;
  }
  100% {
    transform: scale(1.7);
    opacity: 0;
  }
}

/* ===== 展开面板 ===== */
.floating-tv__panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 12px);
  width: 380px;
  max-height: 580px;
  display: flex;
  flex-direction: column;
  border-radius: var(--clay-rounded-lg, 16px);
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-soft, #faf5e8);
  box-shadow: 0 8px 28px rgba(10, 10, 10, 0.12);
  overflow: hidden;
}

/* 图标靠近左侧时，面板改到图标右侧展开 */
.floating-tv.placement-right .floating-tv__panel {
  right: auto;
  bottom: auto;
  left: calc(100% + 12px);
  top: 0;
}

.floating-tv__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
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

.floating-tv__close:hover {
  color: var(--clay-ink, #0a0a0a);
  border-color: var(--clay-muted-soft, #9a9a9a);
  background: var(--clay-surface-card, #f5f0e0);
}

/* ===== 过渡 ===== */
.ftv-panel-enter-active,
.ftv-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: bottom right;
}

.floating-tv.placement-below .ftv-panel-enter-active,
.floating-tv.placement-below .ftv-panel-leave-active {
  transform-origin: top right;
}

.floating-tv.placement-right .ftv-panel-enter-active,
.floating-tv.placement-right .ftv-panel-leave-active {
  transform-origin: left center;
}

.floating-tv.placement-right-down .ftv-panel-enter-active,
.floating-tv.placement-right-down .ftv-panel-leave-active {
  transform-origin: left top;
}

.floating-tv.placement-right-up .ftv-panel-enter-active,
.floating-tv.placement-right-up .ftv-panel-leave-active {
  transform-origin: left bottom;
}

.ftv-panel-enter-from,
.ftv-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.floating-tv.placement-below .ftv-panel-enter-from,
.floating-tv.placement-below .ftv-panel-leave-to {
  transform: translateY(-8px) scale(0.96);
}

.floating-tv.placement-right .ftv-panel-enter-from,
.floating-tv.placement-right .ftv-panel-leave-to {
  transform: translateX(-8px) scale(0.96);
}

.floating-tv.placement-right-up .ftv-panel-enter-from,
.floating-tv.placement-right-up .ftv-panel-leave-to {
  transform: translateX(-8px) translateY(8px) scale(0.96);
}

@media (max-width: 480px) {
  .floating-tv__panel {
    width: min(380px, calc(100vw - 32px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-tv__btn.is-hint,
  .floating-tv__btn.is-hint .floating-tv__ping {
    animation: none;
  }
}
</style>
