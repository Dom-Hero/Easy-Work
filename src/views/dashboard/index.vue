<script setup lang="ts">
import { herfList } from '@/constants/herfList'
import InfoCard from '@/components/infoCard.vue'
import { useCardFilter } from '@/composables/useCardFilter'
import { gsap } from 'gsap'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const { searchQuery } = useCardFilter()

const filteredList = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return herfList

  return herfList.filter(
    item =>
      item.title.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query),
  )
})

const CARD_WIDTH = 240
const GAP = 28
const CONTAINER_PADDING = 64

const pageRef = ref<HTMLElement | null>(null)
const heroRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const containerWidth = ref<number>()
let introReady = false

function updateLayout() {
  const page = pageRef.value
  if (!page) return

  const available = page.clientWidth - CONTAINER_PADDING
  const cols = Math.max(1, Math.floor((available + GAP) / (CARD_WIDTH + GAP)))
  containerWidth.value = cols * CARD_WIDTH + (cols - 1) * GAP + CONTAINER_PADDING
}

function playHeroIntro() {
  const hero = heroRef.value
  if (!hero) return

  const badge = hero.querySelector('.hero-badge')
  const title = hero.querySelector('.hero-title')
  const lead = hero.querySelector('.hero-lead')
  const decor = hero.querySelectorAll('.hero-blob')

  gsap.set([badge, title, lead], { opacity: 0, y: 18 })
  gsap.set(decor, { opacity: 0, scale: 0.7, rotate: -8 })

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.to(badge, { opacity: 1, y: 0, duration: 0.4 })
    .to(title, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
    .to(lead, { opacity: 1, y: 0, duration: 0.45 }, '-=0.28')
    .to(
      decor,
      { opacity: 1, scale: 1, rotate: 0, duration: 0.55, stagger: 0.08, ease: 'back.out(1.4)' },
      '-=0.35',
    )
}

function playCardsIntro() {
  const grid = gridRef.value
  if (!grid) return
  const cards = grid.querySelectorAll('.dash-card')
  if (!cards.length) return

  gsap.fromTo(
    cards,
    { opacity: 0, y: 28, scale: 0.96 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.45,
      stagger: 0.05,
      ease: 'power3.out',
      clearProps: 'transform',
    },
  )
}

let observer: ResizeObserver | null = null
let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  updateLayout()
  observer = new ResizeObserver(updateLayout)
  if (pageRef.value) observer.observe(pageRef.value)

  nextTick(() => {
    playHeroIntro()
    playCardsIntro()
    introReady = true
  })
})

onUnmounted(() => {
  observer?.disconnect()
  if (searchTimer) clearTimeout(searchTimer)
})

watch(filteredList, () => {
  if (!introReady) return
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    await nextTick()
    playCardsIntro()
  }, 100)
})
</script>

<template>
  <div ref="pageRef" class="dashboard-page">
    <header ref="heroRef" class="hero">
      <div class="hero-copy">
        <span class="hero-badge">工具导航</span>
        <h1 class="hero-title">把常用工具收进一块奶油色画布</h1>
        <p class="hero-lead">搜索、点选、跳转——用轻松一点的节奏打理你的入口。</p>
      </div>
      <div class="hero-decor" aria-hidden="true">
        <span class="hero-blob hero-blob--pink" />
        <span class="hero-blob hero-blob--peach" />
        <span class="hero-blob hero-blob--lavender" />
        <span class="hero-blob hero-blob--ochre" />
      </div>
    </header>

    <div
      ref="gridRef"
      class="dashboard-container"
      :style="containerWidth ? { width: `${containerWidth}px` } : undefined"
    >
      <InfoCard
        v-for="(item, index) in filteredList"
        :key="item.href"
        class="dash-card"
        :title="item.title"
        :content="item.content"
        :button-href="item.href"
        :color-index="index"
      />
      <p v-if="filteredList.length === 0" class="empty-tip">未找到匹配的卡片</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 48px;
  box-sizing: border-box;
}

.hero {
  width: min(100%, 960px);
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(140px, 0.55fr);
  gap: 24px;
  align-items: center;
  padding: 24px 32px 8px;
  box-sizing: border-box;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  background: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-ink, #0a0a0a);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  max-width: 14ch;
  color: var(--clay-ink, #0a0a0a);
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.hero-lead {
  margin: 0;
  max-width: 36ch;
  color: var(--clay-body, #3a3a3a);
  font-size: 16px;
  line-height: 1.55;
}

.hero-decor {
  position: relative;
  height: 160px;
}

.hero-blob {
  position: absolute;
  border-radius: 32% 68% 55% 45% / 45% 40% 60% 55%;
  display: block;
}

.hero-blob--pink {
  width: 88px;
  height: 88px;
  top: 12px;
  right: 28px;
  background: var(--clay-brand-pink, #ff4d8b);
  animation: blob-float 6s ease-in-out infinite;
}

.hero-blob--peach {
  width: 64px;
  height: 64px;
  bottom: 18px;
  right: 72px;
  background: var(--clay-brand-peach, #ffb084);
  border-radius: 40% 60% 50% 50% / 55% 45% 55% 45%;
  animation: blob-float 7s ease-in-out infinite 0.4s;
}

.hero-blob--lavender {
  width: 52px;
  height: 52px;
  top: 56px;
  right: 0;
  background: var(--clay-brand-lavender, #b8a4ed);
  animation: blob-float 5.5s ease-in-out infinite 0.8s;
}

.hero-blob--ochre {
  width: 36px;
  height: 36px;
  bottom: 40px;
  right: 18px;
  background: var(--clay-brand-ochre, #e8b94a);
  border-radius: 50%;
  animation: blob-float 6.5s ease-in-out infinite 1.1s;
}

@keyframes blob-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(4deg);
  }
}

.dashboard-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  gap: 28px;
  margin-top: 16px;
  padding: 24px 32px 32px;
  flex-shrink: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.empty-tip {
  width: 100%;
  margin: 0;
  padding: 48px 0;
  text-align: center;
  color: var(--clay-muted, #6a6a6a);
  font-size: 15px;
  animation: empty-in 0.35s ease;
}

@keyframes empty-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 767px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 16px 20px 0;
  }

  .hero-decor {
    height: 110px;
    justify-self: start;
    width: 180px;
  }

  .hero-title {
    max-width: none;
  }

  .dashboard-container {
    padding: 16px 20px 32px;
    gap: 20px;
  }
}
</style>
