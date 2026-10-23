<script setup lang="ts">  
import { herfList } from '@/constants/herfList'
import InfoCard from '@/components/infoCard.vue'
import { useCardFilter } from '@/composables/useCardFilter'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const { searchQuery } = useCardFilter()

const filteredList = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return herfList

  return herfList.filter(
    item =>
      item.title.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query)
  )
})

const CARD_WIDTH = 220
const GAP = 28
const CONTAINER_PADDING = 64

const pageRef = ref<HTMLElement | null>(null)
const containerWidth = ref<number>()

function updateLayout() {
  const page = pageRef.value
  if (!page) return

  const available = page.clientWidth - CONTAINER_PADDING
  const cols = Math.max(1, Math.floor((available + GAP) / (CARD_WIDTH + GAP)))
  containerWidth.value = cols * CARD_WIDTH + (cols - 1) * GAP + CONTAINER_PADDING
}

let observer: ResizeObserver | null = null

onMounted(() => {
  updateLayout()
  observer = new ResizeObserver(updateLayout)
  if (pageRef.value) observer.observe(pageRef.value)
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div ref="pageRef" class="dashboard-page">
    <div
      class="dashboard-container"
      :style="containerWidth ? { width: `${containerWidth}px` } : undefined"
    >
      <InfoCard
        v-for="(item, index) in filteredList"
        :key="item.href"
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
  padding: 16px 0 32px;
  box-sizing: border-box;
}

.dashboard-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  gap: 28px;
  margin-top: auto;
  margin-bottom: auto;
  padding: 32px;
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
}
</style>
