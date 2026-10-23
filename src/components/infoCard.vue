<script setup lang="ts">
import { computed } from 'vue'

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

function openButtonHref() {
  window.open(props.buttonHref, '_blank')
}
</script>

<template>
  <div class="card" :class="`card--${variant}`" @click="openButtonHref">
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
  width: 220px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: var(--clay-rounded-xl, 24px);
  cursor: pointer;
  box-sizing: border-box;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(10, 10, 10, 0.08);
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

.card-body {
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
  text-transform: none;
}

.desc {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.55;
  opacity: 0.88;
}

.card-button {
  align-self: flex-start;
  border: none;
  border-radius: var(--clay-rounded-md, 12px);
  background: var(--clay-canvas, #fffaf0);
  color: var(--clay-ink, #0a0a0a);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  padding: 12px 20px;
  height: 40px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.card--cream .card-button {
  background: var(--clay-primary, #0a0a0a);
  color: var(--clay-on-primary, #fff);
}

.card-button:hover {
  transform: translateY(-1px);
  background: #ffffff;
}

.card--cream .card-button:hover {
  background: var(--clay-primary-active, #1f1f1f);
}
</style>
