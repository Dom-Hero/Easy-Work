<script setup lang="ts">
import { ref } from 'vue'
import SheepGame from '@/components/SheepGame.vue'

const open = ref(false)

function toggle() {
  open.value = !open.value
}
</script>

<template>
  <div class="floating-tv" :class="{ 'is-open': open }">
    <Transition name="ftv-panel">
      <section v-if="open" class="floating-tv__panel" role="dialog" aria-label="小电视游戏">
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
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      aria-label="小电视速览"
      @click="toggle"
    >
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
  right: 24px;
  bottom: 24px;
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

/* ===== 悬浮按钮 ===== */
.floating-tv__btn {
  appearance: none;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid var(--clay-ink, #0a0a0a);
  background: var(--clay-brand-lavender, #b8a4ed);
  color: var(--clay-ink, #0a0a0a);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--clay-ink, #0a0a0a);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.floating-tv__btn svg {
  width: 28px;
  height: 28px;
}

.floating-tv__btn:hover {
  transform: translateY(-2px);
  box-shadow: 4px 5px 0 var(--clay-ink, #0a0a0a);
}

.floating-tv__btn:active {
  transform: translateY(0);
  box-shadow: 2px 2px 0 var(--clay-ink, #0a0a0a);
}

.floating-tv__btn.is-open {
  background: var(--clay-brand-peach, #ffb084);
}

/* ===== 展开面板 ===== */
.floating-tv__panel {
  position: relative;
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

.ftv-panel-enter-from,
.ftv-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

@media (max-width: 480px) {
  .floating-tv {
    right: 16px;
    bottom: 16px;
  }

  .floating-tv__panel {
    width: min(380px, calc(100vw - 32px));
  }
}
</style>
