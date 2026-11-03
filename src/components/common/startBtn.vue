<script setup lang="ts">
import { useAiChatDrawer } from '@/composables/useAiChatDrawer'

const { toggle } = useAiChatDrawer()
</script>

<template>
  <button
    type="button"
    class="button"
    aria-label="打开 AI 助手"
    title="AI 助手"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M12 3c.8 2.4 2.6 4.2 5 5-2.4.8-4.2 2.6-5 5-.8-2.4-2.6-4.2-5-5 2.4-.8 4.2-2.6 5-5Z"
        fill="currentColor"
      />
      <path
        d="M18.5 14.5c.4 1.2 1.3 2.1 2.5 2.5-1.2.4-2.1 1.3-2.5 2.5-.4-1.2-1.3-2.1-2.5-2.5 1.2-.4 2.1-1.3 2.5-2.5Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M6.2 15.2c.35 1 1.05 1.7 2 2.05-.95.35-1.65 1.05-2 2.05-.35-1-1.05-1.7-2-2.05.95-.35 1.65-1.05 2-2.05Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
    <span class="text_button">AI 助手</span>
  </button>
</template>

<style scoped>
.button {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  padding: 12px 16px;
  border: 1px solid color-mix(in srgb, var(--clay-ink, #0a0a0a) 10%, transparent);
  border-radius: var(--clay-rounded-md, 12px);
  background: var(--clay-card-peach, #ffd2b3);
  color: var(--clay-ink, #0a0a0a);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  transition:
    background-color 0.2s ease,
    transform 0.28s cubic-bezier(0.34, 1.45, 0.64, 1),
    box-shadow 0.2s ease;
}

.button:hover,
.button:focus-visible {
  background: var(--clay-brand-peach, #ffb084);
  box-shadow: 0 6px 16px rgba(10, 10, 10, 0.08);
  transform: translateY(-1px) scale(1.03);
  outline: none;
}

.button:active {
  transform: scale(0.97);
}

.text_button {
  color: inherit;
}

@media (max-width: 480px) {
  .text_button {
    display: none;
  }

  .button {
    min-width: 44px;
    padding: 0 12px;
  }
}
</style>
