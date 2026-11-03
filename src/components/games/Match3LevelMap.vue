<script setup lang="ts">
import { computed } from 'vue'
import { useMatch3Level } from '@/composables/useMatch3Level'
import { getLevel } from '@/game/match3'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  select: [id: number]
}>()

const { total, currentLevel, isUnlocked, starOf, maxUnlocked } = useMatch3Level()

const levels = computed(() =>
  Array.from({ length: total }, (_, i) => {
    const id = i + 1
    return {
      id,
      name: getLevel(id).name,
      unlocked: isUnlocked(id),
      stars: starOf(id),
      current: id === currentLevel.value,
    }
  }),
)

function onPick(id: number, unlocked: boolean) {
  if (!unlocked) return
  emit('select', id)
}
</script>

<template>
  <Transition name="m3map">
    <div v-if="open" class="m3map" role="dialog" aria-label="关卡选择">
      <div class="m3map__head">
        <div>
          <p class="m3map__title">关卡地图</p>
          <p class="m3map__sub">已解锁至第 {{ maxUnlocked }} 关</p>
        </div>
        <button type="button" class="m3map__close" aria-label="关闭" @click="emit('close')">✕</button>
      </div>
      <div class="m3map__grid">
        <button
          v-for="lv in levels"
          :key="lv.id"
          type="button"
          class="m3map__cell"
          :class="{
            'is-locked': !lv.unlocked,
            'is-current': lv.current,
            'is-cleared': lv.stars > 0,
          }"
          :disabled="!lv.unlocked"
          :title="lv.name"
          @click="onPick(lv.id, lv.unlocked)"
        >
          <span class="m3map__num">{{ lv.id }}</span>
          <span v-if="lv.stars" class="m3map__stars">{{ '★'.repeat(lv.stars) }}</span>
          <span v-else-if="!lv.unlocked" class="m3map__lock">🔒</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.m3map {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 20% 0%, var(--clay-surface-soft, #faf5e8) 0%, transparent 55%),
    linear-gradient(180deg, var(--clay-surface-soft, #faf5e8) 0%, var(--clay-canvas, #fffaf0) 100%);
  padding: 12px;
  overflow: hidden;
}
.m3map__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  padding-right: 28px;
}
.m3map__title {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--clay-ink, #0a0a0a);
}
.m3map__sub {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--clay-muted, #6a6a6a);
  font-weight: 600;
}
.m3map__close {
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: color-mix(in srgb, var(--clay-surface-soft, #faf5e8) 88%, white);
  color: var(--clay-muted, #6a6a6a);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}
.m3map__grid {
  flex: 1;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding-bottom: 4px;
}
.m3map__cell {
  appearance: none;
  aspect-ratio: 1;
  border-radius: 10px;
  border: 1.5px solid #2c2c2c;
  background: linear-gradient(180deg, #fff8e8 0%, #f0e6d0 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.12);
  transition: transform 0.15s ease, background 0.15s ease;
  padding: 2px;
}
.m3map__cell:hover:not(:disabled) { transform: translateY(-1px); }
.m3map__cell:active:not(:disabled) { transform: translateY(1px); box-shadow: none; }
.m3map__cell.is-current {
  background: linear-gradient(180deg, #c8f0df 0%, #a4d4c5 100%);
  box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px #2c2c2c;
}
.m3map__cell.is-cleared {
  background: linear-gradient(180deg, #ffe9c8 0%, #ffd084 100%);
}
.m3map__cell.is-locked {
  opacity: 0.45;
  cursor: not-allowed;
  background: #e8e0d0;
}
.m3map__num {
  font-size: 12px;
  font-weight: 800;
  color: var(--clay-ink, #0a0a0a);
  line-height: 1;
}
.m3map__stars {
  font-size: 8px;
  color: #e6a800;
  letter-spacing: -1px;
  line-height: 1;
}
.m3map__lock { font-size: 9px; line-height: 1; }

.m3map-enter-active,
.m3map-leave-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.m3map-enter-from,
.m3map-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
