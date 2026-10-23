<script setup lang="ts">
import { computed, ref } from 'vue'

const VARIANTS = ['pink', 'teal', 'lavender', 'peach', 'ochre', 'cream'] as const

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
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.45, 0.64, 1),
    box-shadow 0.35s ease;
}

.card:hover {
  transform: translateY(-7px);
  box-shadow: 0 14px 28px rgba(10, 10, 10, 0.1);
}

.card.is-pressed {
  transform: translateY(-2px) scale(0.98);
  transition-duration: 0.12s;
}

.card--pink {
  background-color: var(--clay-brand-pink, #ff4d8b);
  color: var(--clay-on-primary, #fff);
}

.card--teal {
  background-color: var(--clay-brand-teal, #1a3a3a);
  color: var(--clay-on-dark, #fff);
}

.card--lavender {
  background-color: var(--clay-brand-lavender, #b8a4ed);
  color: var(--clay-ink, #0a0a0a);
}

.card--peach {
  background-color: var(--clay-brand-peach, #ffb084);
  color: var(--clay-ink, #0a0a0a);
}

.card--ochre {
  background-color: var(--clay-brand-ochre, #e8b94a);
  color: var(--clay-ink, #0a0a0a);
}

.card--cream {
  background-color: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-ink, #0a0a0a);
  border: 1px solid var(--clay-hairline, #e5e5e5);
}

.ripple {
  position: absolute;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 55%, transparent);
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
}

.desc {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  opacity: 0.88;
}

.card-button {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  border: none;
  border-radius: var(--clay-rounded-md, 12px);
  background: var(--clay-canvas, #fffaf0);
  color: var(--clay-ink, #0a0a0a);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  padding: 12px 20px;
  height: 44px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.28s cubic-bezier(0.34, 1.45, 0.64, 1);
}

.card--cream .card-button {
  background: var(--clay-primary, #0a0a0a);
  color: var(--clay-on-primary, #fff);
}

.card-button:hover {
  transform: scale(1.05);
  background: #ffffff;
}

.card--cream .card-button:hover {
  background: var(--clay-primary-active, #1f1f1f);
}

.card-button:active {
  transform: scale(0.96);
}
</style>
