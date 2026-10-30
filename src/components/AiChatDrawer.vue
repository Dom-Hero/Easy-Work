<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { DIFY_CHAT_IFRAME_SRC } from '@/constants/difyChat'
import { useAiChatDrawer } from '@/composables/useAiChatDrawer'

const { isOpen, hasLoadedIframe, hide } = useAiChatDrawer()

const frameReady = ref(false)
let openedAt = 0
let acceptedLoad = false
let revealTimer = 0

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) hide()
}

function onFrameLoad(event: Event) {
  const frame = event.target as HTMLIFrameElement
  if (acceptedLoad || !frame.src) return
  acceptedLoad = true
  const elapsed = performance.now() - openedAt
  const wait = Math.max(360, 720 - elapsed)
  window.clearTimeout(revealTimer)
  revealTimer = window.setTimeout(() => {
    frameReady.value = true
  }, wait)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.clearTimeout(revealTimer)
  document.body.style.overflow = ''
})

watch(isOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  window.clearTimeout(revealTimer)
  if (open) {
    openedAt = performance.now()
    acceptedLoad = false
    frameReady.value = false
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="clay-drawer">
      <div
        v-if="isOpen"
        class="ai-drawer-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-drawer-title"
      >
        <button type="button" class="ai-drawer-mask" aria-label="关闭对话" @click="hide" />
        <aside class="ai-drawer-panel">
          <header class="ai-drawer-header">
            <div class="ai-drawer-heading">
              <span class="ai-drawer-badge">AI</span>
              <div>
                <h2 id="ai-drawer-title" class="ai-drawer-title">智能助手</h2>
                <p class="ai-drawer-sub">有问题随时问，轻松一点聊聊</p>
              </div>
            </div>
            <button type="button" class="ai-drawer-close" aria-label="关闭" @click="hide">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <div class="ai-drawer-body">
            <iframe
              v-if="hasLoadedIframe"
              class="ai-drawer-frame"
              :class="{ 'is-ready': frameReady }"
              :src="DIFY_CHAT_IFRAME_SRC"
              title="AI 对话"
              allow="fullscreen; microphone"
              @load="onFrameLoad"
            />
            <Transition name="clay-loader-fade">
              <div
                v-if="!frameReady"
                class="ai-drawer-loading"
                role="status"
                aria-live="polite"
              >
                <div class="clay-loader" aria-hidden="true">
                  <span class="clay-orb orb-peach" />
                  <span class="clay-orb orb-lilac" />
                  <span class="clay-orb orb-mint" />
                </div>
                <p class="ai-drawer-loading-text">
                  正在唤醒助手
                  <span class="loading-dots" aria-hidden="true">
                    <i /><i /><i />
                  </span>
                </p>
              </div>
            </Transition>
          </div>

          <div class="ai-drawer-decor" aria-hidden="true">
            <span class="blob blob-peach" />
            <span class="blob blob-lilac" />
            <span class="blob blob-mint" />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ai-drawer-root {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  justify-content: flex-end;
}

.ai-drawer-mask {
  position: absolute;
  inset: 0;
  border: none;
  margin: 0;
  padding: 0;
  cursor: pointer;
  background: color-mix(in srgb, var(--clay-ink, #0a0a0a) 28%, transparent);
  backdrop-filter: blur(2px);
}

.ai-drawer-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(56rem, 100vw);
  height: 100%;
  background: var(--clay-canvas, #fffaf0);
  border-left: 1px solid var(--clay-hairline, #e5e5e5);
  box-shadow: -12px 0 40px rgba(10, 10, 10, 0.08);
  overflow: hidden;
}

.ai-drawer-header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 16px;
  background: var(--clay-surface-soft, #faf5e8);
  border-bottom: 1px solid var(--clay-hairline, #e5e5e5);
}

.ai-drawer-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.ai-drawer-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 9999px;
  background: var(--clay-card-peach, #ffd2b3);
  color: var(--clay-ink, #0a0a0a);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.ai-drawer-title {
  margin: 0;
  color: var(--clay-ink, #0a0a0a);
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.ai-drawer-sub {
  margin: 4px 0 0;
  color: var(--clay-muted, #6a6a6a);
  font-size: 13px;
  line-height: 1.4;
}

.ai-drawer-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  border-radius: var(--clay-rounded-md, 12px);
  background: var(--clay-canvas, #fffaf0);
  color: var(--clay-ink, #0a0a0a);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.28s cubic-bezier(0.34, 1.45, 0.64, 1);
}

.ai-drawer-close:hover {
  background: #fff;
  transform: scale(1.04);
}

.ai-drawer-body {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  padding: 12px;
  background: var(--clay-canvas, #fffaf0);
}

.ai-drawer-frame {
  width: 100%;
  height: 100%;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  border-radius: var(--clay-rounded-lg, 16px);
  background: var(--clay-surface-soft, #faf5e8);
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.45s ease;
}

.ai-drawer-frame.is-ready {
  opacity: 1;
}

.ai-drawer-loading {
  position: absolute;
  inset: 12px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  border-radius: var(--clay-rounded-lg, 16px);
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--clay-card-peach, #ffd2b3) 42%, transparent), transparent 58%),
    var(--clay-canvas, #fffaf0);
}

.clay-loader {
  position: relative;
  width: 120px;
  height: 96px;
}

.clay-orb {
  position: absolute;
  border-radius: 40% 60% 55% 45% / 50% 45% 55% 50%;
  box-shadow:
    inset -8px -10px 16px rgba(10, 10, 10, 0.06),
    0 10px 18px rgba(10, 10, 10, 0.06);
  animation: clay-breathe 2.6s ease-in-out infinite;
}

.orb-peach {
  width: 68px;
  height: 68px;
  left: 10px;
  top: 16px;
  background: var(--clay-card-peach, #ffd2b3);
}

.orb-lilac {
  width: 50px;
  height: 50px;
  right: 4px;
  top: 4px;
  background: var(--clay-card-lilac, #d2c6ef);
  animation-delay: 0.28s;
}

.orb-mint {
  width: 38px;
  height: 38px;
  right: 22px;
  bottom: 2px;
  background: var(--clay-card-mint, #c5dfd4);
  animation-delay: 0.56s;
}

.ai-drawer-loading-text {
  display: inline-flex;
  align-items: center;
  margin: 0;
  color: var(--clay-muted, #6a6a6a);
  font-size: 14px;
  letter-spacing: 0.02em;
}

.loading-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.loading-dots i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--clay-brand-peach, #ffb084);
  animation: clay-dot 1.2s ease-in-out infinite;
}

.loading-dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.loading-dots i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes clay-breathe {
  0%,
  100% {
    transform: translateY(0) scale(1);
    border-radius: 40% 60% 55% 45% / 50% 45% 55% 50%;
  }
  50% {
    transform: translateY(-8px) scale(1.06);
    border-radius: 55% 45% 42% 58% / 46% 56% 44% 54%;
  }
}

@keyframes clay-dot {
  0%,
  80%,
  100% {
    opacity: 0.28;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.clay-loader-fade-leave-active {
  transition: opacity 0.45s ease;
}

.clay-loader-fade-leave-to {
  opacity: 0;
}

.ai-drawer-decor {
  pointer-events: none;
  position: absolute;
  inset: auto 0 0 0;
  height: 120px;
  z-index: 0;
  overflow: hidden;
  opacity: 0.45;
}

.blob {
  position: absolute;
  border-radius: 40% 60% 55% 45% / 50% 45% 55% 50%;
}

.blob-peach {
  width: 90px;
  height: 90px;
  left: -20px;
  bottom: -30px;
  background: var(--clay-card-peach, #ffd2b3);
}

.blob-lilac {
  width: 70px;
  height: 70px;
  right: 40px;
  bottom: -18px;
  background: var(--clay-card-lilac, #d2c6ef);
}

.blob-mint {
  width: 48px;
  height: 48px;
  right: -8px;
  bottom: 28px;
  background: var(--clay-card-mint, #c5dfd4);
}

.clay-drawer-enter-active,
.clay-drawer-leave-active {
  transition: opacity 0.28s ease;
}

.clay-drawer-enter-active .ai-drawer-panel,
.clay-drawer-leave-active .ai-drawer-panel {
  transition: transform 0.38s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.clay-drawer-enter-from,
.clay-drawer-leave-to {
  opacity: 0;
}

.clay-drawer-enter-from .ai-drawer-panel,
.clay-drawer-leave-to .ai-drawer-panel {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .ai-drawer-panel {
    width: 100vw;
  }
}

@media (prefers-reduced-motion: reduce) {
  .clay-orb,
  .loading-dots i {
    animation: none;
  }

  .ai-drawer-frame,
  .clay-loader-fade-leave-active {
    transition: none;
  }
}
</style>
