<script setup lang="ts">
import { computed, ref } from 'vue'

/** Warm→cool soft continuum (no deep teal / hot pink jumps) */
const VARIANTS = ['cream', 'peach', 'blush', 'sand', 'mint', 'lilac'] as const

const props = withDefaults(
  defineProps<{
    title: string
    content: string
    buttonHref: string
    colorIndex?: number
  }>(),
  { colorIndex: 0 },
)

const variant = computed(() => {
  const i = ((props.colorIndex % VARIANTS.length) + VARIANTS.length) % VARIANTS.length
  return VARIANTS[i]
})

const pressed = ref(false)
const ripples = ref<{ id: number; x: number; y: number }[]>([])
let rippleId = 0

function openButtonHref() {
  window.open(props.buttonHref, '_blank')
}

function onPointerDown(e: PointerEvent) {
  pressed.value = true
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const id = ++rippleId
  ripples.value.push({
    id,
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  })
  window.setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 520)
}

function onPointerUp() {
  pressed.value = false
}
</script>

<template>
  <div
    class="card"
    :class="[`card--${variant}`, { 'is-pressed': pressed }]"
    @click="openButtonHref"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <span
      v-for="r in ripples"
      :key="r.id"
      class="ripple"
      :style="{ left: `${r.x}px`, top: `${r.y}px` }"
    />
    <div class="card-body">
      <p class="heading">{{ title }}</p>
      <p class="desc">{{ content }}</p>
    </div>
    <button type="button" class="card-button" @click.stop="openButtonHref">跳转</button>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  width: 240px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  padding: 32px;
  border-radius: var(--clay-rounded-xl, 24px);
  border: 1px solid color-mix(in srgb, var(--clay-ink, #0a0a0a) 6%, transparent);
  color: var(--clay-ink, #0a0a0a);
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.45, 0.64, 1),
    box-shadow 0.35s ease,
    border-color 0.25s ease;
}

.card:hover {
  transform: translateY(-7px);
  box-shadow: 0 14px 28px rgba(10, 10, 10, 0.08);
  border-color: color-mix(in srgb, var(--clay-ink, #0a0a0a) 10%, transparent);
}

.card.is-pressed {
  transform: translateY(-2px) scale(0.98);
  transition-duration: 0.12s;
}

.card--cream {
  background-color: var(--clay-card-cream, #f3eee0);
}

.card--peach {
  background-color: var(--clay-card-peach, #ffd2b3);
}

.card--blush {
  background-color: var(--clay-card-blush, #ffc4c0);
}

.card--sand {
  background-color: var(--clay-card-sand, #f0d9a0);
}

.card--mint {
  background-color: var(--clay-card-mint, #c5dfd4);
}

.card--lilac {
  background-color: var(--clay-card-lilac, #d2c6ef);
}

.ripple {
  position: absolute;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 65%, transparent);
  pointer-events: none;
  animation: ripple-out 0.5s ease-out forwards;
  z-index: 0;
}

@keyframes ripple-out {
  to {
    transform: scale(28);
    opacity: 0;
  }
}

.card-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.heading {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0;
  color: var(--clay-ink, #0a0a0a);
}

.desc {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  color: var(--clay-body, #3a3a3a);
}

.card-button {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  border: 1px solid color-mix(in srgb, var(--clay-ink, #0a0a0a) 12%, transparent);
  border-radius: var(--clay-rounded-md, 12px);
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 82%, #ffffff);
  color: var(--clay-ink, #0a0a0a);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  padding: 12px 20px;
  height: 44px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.28s cubic-bezier(0.34, 1.45, 0.64, 1);
}

.card-button:hover {
  transform: scale(1.05);
  background: #ffffff;
  border-color: color-mix(in srgb, var(--clay-ink, #0a0a0a) 22%, transparent);
}

.card-button:active {
  transform: scale(0.96);
}
</style>
