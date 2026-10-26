<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FloatingLines from '@/components/background/FloatingLines.vue'
import CardNav from '@/components/CardNav.vue'
import AiChatDrawer from '@/components/AiChatDrawer.vue'
import clayOilLandscape from '@/assets/backgrounds/clay-oil-landscape.jpg'

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)

const items = [
  {
    label: "About",
    bgColor: "var(--clay-surface-soft)",
    textColor: "var(--clay-ink)",
    links: [
      { label: "Company", ariaLabel: "About Company" },
      { label: "Careers", ariaLabel: "About Careers" }
    ]
  },
  {
    label: "Projects",
    bgColor: "var(--clay-surface-card)",
    textColor: "var(--clay-ink)",
    links: [
      { label: "Featured", ariaLabel: "Featured Projects" },
      { label: "Case Studies", ariaLabel: "Project Case Studies" }
    ]
  },
  {
    label: "Contact",
    bgColor: "var(--clay-brand-peach)",
    textColor: "var(--clay-ink)",
    links: [
      { label: "Email", ariaLabel: "Email us" },
      { label: "Twitter", ariaLabel: "Twitter" },
      { label: "LinkedIn", ariaLabel: "LinkedIn" }
    ]
  }
]

const enabledWaves: Array<'top' | 'middle' | 'bottom'> = ['top', 'middle', 'bottom']
const lineCount = [3, 3, 2]
const lineDistance = [12, 10, 8]
const linesGradient = ['#ffb084', '#e8b94a', '#b8a4ed', '#a4d4c5']

const activePath = computed(() => route.path)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function navigate(path: string) {
  router.push(path)
  menuOpen.value = false
}
</script>

<template>
  <div class="layout">
    <div
      class="layout-paint"
      :style="{ backgroundImage: `url(${clayOilLandscape})` }"
      aria-hidden="true"
    />
    <div class="layout-paint-veil" aria-hidden="true" />
    <FloatingLines
      class="layout-bg"
      :enabled-waves="enabledWaves"
      :line-count="lineCount"
      :line-distance="lineDistance"
      :lines-gradient="linesGradient"
      :animation-speed="0.28"
      :bend-radius="5.5"
      :bend-strength="-0.14"
      :interactive="true"
      :parallax="true"
      :parallax-strength="0.04"
      interaction-scope="parent"
      mix-blend-mode="soft-light"
    />
    <div class="layout-header">
      <CardNav
        :items="items"
        base-color="#fffaf0"
        menu-color="#0a0a0a"
        button-bg-color="#0a0a0a"
        button-text-color="#ffffff"
        ease="back.out(1.2)"
        search-placeholder="搜索工具..."
      />
    </div>
    <div class="content">
      <RouterView />
    </div>
    <AiChatDrawer />
  </div>
</template>

<style scoped>
.layout {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  background-color: var(--clay-canvas, #fffaf0);
}

.layout-paint {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-color: var(--clay-canvas, #fffaf0);
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: cover;
  transform: scale(1.02);
  animation: paint-drift 28s ease-in-out infinite alternate;
}

.layout-paint-veil {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--clay-canvas, #fffaf0) 78%, transparent) 0%,
      color-mix(in srgb, var(--clay-canvas, #fffaf0) 42%, transparent) 42%,
      color-mix(in srgb, var(--clay-canvas, #fffaf0) 18%, transparent) 72%,
      color-mix(in srgb, var(--clay-canvas, #fffaf0) 8%, transparent) 100%
    ),
    radial-gradient(
      ellipse 90% 55% at 50% 12%,
      color-mix(in srgb, var(--clay-canvas, #fffaf0) 70%, transparent) 0%,
      transparent 70%
    );
}

.layout-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.28;
  pointer-events: none;
}

@keyframes paint-drift {
  from {
    transform: scale(1.02) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.06) translate3d(0, -1.2%, 0);
  }
}

.layout-header {
  position: relative;
  flex-shrink: 0;
  z-index: 2;
  min-height: calc(1.2em + 60px + 1em);
  background-color: transparent;
}

@media (min-width: 768px) {
  .layout-header {
    min-height: calc(2em + 60px + 1em);
  }
}

.content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 32px 32px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.content::-webkit-scrollbar {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .layout-paint {
    animation: none;
  }
}
</style>
