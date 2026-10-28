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
const decorRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const containerWidth = ref<number>()
const decorExpanded = ref(false)
const mascotSrc = `${import.meta.env.BASE_URL}favicon.ico`
let introReady = false
let spinTweens: gsap.core.Tween[] = []

const BLOB_EXPAND = [
  { x: 40, y: -56, scale: 1.05, spinDuration: 14 },
  { x: -48, y: 38, scale: 1.05, spinDuration: -16 },
  { x: 56, y: 18, scale: 1.06, spinDuration: 12 },
  { x: 36, y: 46, scale: 1.08, spinDuration: -18 },
] as const

function getDecorBlobs() {
  return decorRef.value?.querySelectorAll<HTMLElement>('.hero-blob') ?? []
}

function getDecorMascot() {
  return decorRef.value?.querySelector<HTMLElement>('.hero-mascot') ?? null
}

function expandDecor() {
  if (decorExpanded.value) return
  const blobs = [...getDecorBlobs()]
  if (!blobs.length) return

  decorExpanded.value = true
  spinTweens.forEach(tween => tween.kill())
  spinTweens = []

  const mascot = getDecorMascot()
  if (mascot) {
    gsap.to(mascot, {
      scale: 1.12,
      duration: 1.2,
      ease: 'back.out(1.6)',
      overwrite: 'auto',
    })
  }

  blobs.forEach((blob, index) => {
    const cfg = BLOB_EXPAND[index]
    if (!cfg) return

    // CSS @keyframes 会覆盖 inline transform，必须关掉 animation 才能交给 GSAP
    blob.style.animation = 'none'
    gsap.set(blob, { x: 0, y: 0, scale: 1, rotation: 0 })
    gsap.to(blob, {
      x: cfg.x,
      y: cfg.y,
      scale: cfg.scale,
      duration: 1.4,
      ease: 'power2.out',
      overwrite: 'auto',
    })

    const direction = cfg.spinDuration > 0 ? '+=360' : '-=360'
    spinTweens.push(
      gsap.to(blob, {
        rotation: direction,
        duration: Math.abs(cfg.spinDuration),
        ease: 'none',
        repeat: -1,
        delay: 0.35,
      }),
    )
  })
}

function collapseDecor() {
  if (!decorExpanded.value) return
  decorExpanded.value = false

  spinTweens.forEach(tween => tween.kill())
  spinTweens = []

  const mascot = getDecorMascot()
  if (mascot) {
    gsap.to(mascot, {
      scale: 1,
      duration: 1.15,
      ease: 'power2.inOut',
      overwrite: 'auto',
    })
  }

  const blobs = [...getDecorBlobs()]
  gsap.to(blobs, {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    duration: 1.25,
    ease: 'power2.inOut',
    overwrite: 'auto',
    stagger: 0.04,
    onComplete: () => {
      blobs.forEach(blob => {
        gsap.set(blob, { clearProps: 'transform' })
        blob.style.animation = ''
      })
    },
  })
}

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
  const mascot = hero.querySelector('.hero-mascot')

  gsap.set([badge, title, lead], { opacity: 0, y: 18 })
  gsap.set(decor, { opacity: 0, scale: 0.7, rotate: -8 })
  gsap.set(mascot, { opacity: 0, scale: 0.85 })

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.to(badge, { opacity: 1, y: 0, duration: 0.4 })
    .to(title, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
    .to(lead, { opacity: 1, y: 0, duration: 0.45 }, '-=0.28')
    .to(
      decor,
      { opacity: 1, scale: 1, rotate: 0, duration: 0.55, stagger: 0.08, ease: 'back.out(1.4)' },
      '-=0.35',
    )
    .to(
      mascot,
      { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
      '-=0.12',
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
  spinTweens.forEach(tween => tween.kill())
  spinTweens = []
  const blobs = getDecorBlobs()
  if (blobs.length) gsap.killTweensOf(blobs)
  const mascot = getDecorMascot()
  if (mascot) gsap.killTweensOf(mascot)
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
      <div
        ref="decorRef"
        class="hero-decor"
        aria-hidden="true"
        @click="expandDecor"
        @mouseleave="collapseDecor"
      >
        <img class="hero-mascot" :src="mascotSrc" alt="" draggable="false" />
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
  cursor: pointer;
}

.hero-mascot {
  position: absolute;
  z-index: 0;
  top: 58px;
  right: 48px;
  width: 42px;
  height: 42px;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  transform-origin: center center;
  opacity: 0;
  filter: drop-shadow(0 2px 6px rgb(0 0 0 / 12%));
}

.hero-blob {
  position: absolute;
  z-index: 1;
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

  .hero-mascot {
    top: 38px;
    right: 36px;
    width: 32px;
    height: 32px;
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
