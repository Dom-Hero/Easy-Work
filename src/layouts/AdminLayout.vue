<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FloatingLines from '@/components/background/FloatingLines.vue'
import CardNav from '@/components/CardNav.vue'

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

// lineCount 按 enabledWaves 顺序对应每层：[top, middle, bottom]
const enabledWaves: Array<'top' | 'middle' | 'bottom'> = ['top', 'middle', 'bottom']
const lineCount = [4, 4, 3]
const lineDistance = [10, 8, 6]
/** Warm pastel clay lines — low contrast on cream canvas */
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
    <FloatingLines
      class="layout-bg"
      :enabled-waves="enabledWaves"
      :line-count="lineCount"
      :line-distance="lineDistance"
      :lines-gradient="linesGradient"
      :animation-speed="0.4"
      :bend-radius="6.0"
      :bend-strength="-0.25"
      :interactive="true"
      :parallax="true"
      :parallax-strength="0.08"
      interaction-scope="parent"
      mix-blend-mode="normal"
    />
    <div class="layout-header">
      <CardNav
        :items="items"
        base-color="#fffaf0"
        menu-color="#0a0a0a"
        button-bg-color="#0a0a0a"
        button-text-color="#ffffff"
        ease="power3.out"
        search-placeholder="搜索工具..."
      />
    </div>
    <div class="content">
      <RouterView />
    </div>
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

.layout-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.85;
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
</style>
