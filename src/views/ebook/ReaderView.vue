<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { EbookBook } from '@/composables/useEbookLibrary'
import { useEbookLibrary } from '@/composables/useEbookLibrary'
import ImmersiveReader from '@/components/ebook/ImmersiveReader.vue'

const props = defineProps<{
  book: EbookBook
  chapterId: string
}>()

const emit = defineEmits<{
  back: []
  'update:chapterId': [id: string]
}>()

const { loadChapterText } = useEbookLibrary()

type ReaderMode = 'document' | 'immersive'
const MODE_KEY = 'ebook-reader-mode'

function readStoredMode(): ReaderMode {
  try {
    const value = localStorage.getItem(MODE_KEY)
    return value === 'immersive' ? 'immersive' : 'document'
  } catch {
    return 'document'
  }
}

/** How many characters to mount into the DOM per step. */
const CHUNK_CHARS = 12_000

const mode = ref<ReaderMode>(readStoredMode())
const immersiveStartAt = ref<'start' | 'end'>('start')
const fullText = ref('')
const renderLimit = ref(CHUNK_CHARS)
const loading = ref(false)
const loadFailed = ref(false)
const contentEl = ref<HTMLElement | null>(null)

let loadSeq = 0

function setMode(next: ReaderMode) {
  mode.value = next
  immersiveStartAt.value = 'start'
  try {
    localStorage.setItem(MODE_KEY, next)
  } catch {
    /* ignore quota / private mode */
  }
}

const chapters = computed(() => props.book.chapters ?? [])

const activeIndex = computed(() => {
  const idx = chapters.value.findIndex((c) => c.id === props.chapterId)
  return idx >= 0 ? idx : 0
})

const activeChapter = computed(() => chapters.value[activeIndex.value] ?? null)

const prevChapter = computed(() =>
  activeIndex.value > 0 ? chapters.value[activeIndex.value - 1] ?? null : null,
)

const nextChapter = computed(() =>
  activeIndex.value < chapters.value.length - 1
    ? chapters.value[activeIndex.value + 1] ?? null
    : null,
)

const displayText = computed(() => {
  if (fullText.value.length <= renderLimit.value) return fullText.value
  return fullText.value.slice(0, renderLimit.value)
})

const hasMore = computed(() => fullText.value.length > renderLimit.value)
const progressLabel = computed(() => {
  if (!fullText.value) return ''
  if (!hasMore.value) return `全文 ${fullText.value.length.toLocaleString()} 字`
  return `已加载 ${Math.min(renderLimit.value, fullText.value.length).toLocaleString()} / ${fullText.value.length.toLocaleString()} 字`
})

async function loadActiveChapter() {
  const chapter = activeChapter.value
  const seq = ++loadSeq
  fullText.value = ''
  renderLimit.value = CHUNK_CHARS
  loadFailed.value = false

  if (!chapter) return

  loading.value = true
  try {
    const text = await loadChapterText(chapter.id)
    if (seq !== loadSeq) return
    fullText.value = text
  } catch {
    if (seq !== loadSeq) return
    loadFailed.value = true
    fullText.value = ''
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

function revealMore() {
  if (!hasMore.value) return
  renderLimit.value += CHUNK_CHARS
}

function onContentScroll() {
  const el = contentEl.value
  if (!el || !hasMore.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 240) {
    revealMore()
  }
}

function onMobileSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value) goChapter(value, 'start')
}

function goChapter(id: string | undefined, startAt: 'start' | 'end' = 'start') {
  if (!id) return
  immersiveStartAt.value = startAt
  emit('update:chapterId', id)
}

function onImmersivePrevChapter() {
  goChapter(prevChapter.value?.id, 'end')
}

function onImmersiveNextChapter() {
  goChapter(nextChapter.value?.id, 'start')
}

function scrollContentTop() {
  const el = contentEl.value
  if (el) el.scrollTop = 0
}

watch(
  () => [props.book.id, props.chapterId] as const,
  () => {
    scrollContentTop()
    void loadActiveChapter()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  loadSeq += 1
})
</script>

<template>
  <div class="reader">
    <header class="reader__header">
      <button type="button" class="reader__back" @click="emit('back')">← 返回主页</button>
      <nav class="reader__crumb" aria-label="面包屑">
        <span>电子书</span>
        <span class="reader__crumb-sep">/</span>
        <span>{{ book.title }}</span>
        <template v-if="activeChapter">
          <span class="reader__crumb-sep">/</span>
          <span class="reader__crumb-current">{{ activeChapter.title }}</span>
        </template>
      </nav>
      <div class="reader__mode" role="group" aria-label="阅读模式">
        <button
          type="button"
          class="reader__mode-btn"
          :class="{ 'is-active': mode === 'document' }"
          @click="setMode('document')"
        >
          文档
        </button>
        <button
          type="button"
          class="reader__mode-btn"
          :class="{ 'is-active': mode === 'immersive' }"
          @click="setMode('immersive')"
        >
          沉浸
        </button>
      </div>
      <label class="reader__mobile-toc">
        <span class="sr-only">选择章节</span>
        <select :value="chapterId" @change="onMobileSelect">
          <option v-for="chapter in book.chapters" :key="chapter.id" :value="chapter.id">
            {{ chapter.title }}
          </option>
        </select>
      </label>
    </header>

    <ImmersiveReader
      v-if="mode === 'immersive'"
      :text="fullText"
      :title="activeChapter?.title || book.title"
      :has-prev-chapter="!!prevChapter"
      :has-next-chapter="!!nextChapter"
      :loading="loading"
      :failed="loadFailed"
      :start-at="immersiveStartAt"
      @prev-chapter="onImmersivePrevChapter"
      @next-chapter="onImmersiveNextChapter"
    />

    <article
      v-else
      ref="contentEl"
      class="reader__content"
      @scroll.passive="onContentScroll"
    >
      <h1 class="reader__chapter-title">{{ activeChapter?.title || book.title }}</h1>

      <p v-if="loading" class="reader__status">正在加载正文…</p>
      <p v-else-if="loadFailed" class="reader__status">正文加载失败，请返回重试</p>
      <template v-else>
        <pre class="reader__text">{{ displayText || '（本章暂无正文）' }}</pre>
        <div v-if="hasMore" class="reader__more">
          <p class="reader__progress">{{ progressLabel }}</p>
          <button type="button" class="reader__more-btn" @click="revealMore">继续加载</button>
        </div>
        <p v-else-if="fullText" class="reader__progress">{{ progressLabel }}</p>

        <nav v-if="chapters.length > 1" class="reader__pager" aria-label="章节翻页">
          <button
            type="button"
            class="reader__pager-btn reader__pager-btn--prev"
            :disabled="!prevChapter"
            :title="prevChapter?.title || '已是第一章'"
            @click="goChapter(prevChapter?.id)"
          >
            <span class="reader__pager-arrow" aria-hidden="true">←</span>
            <span class="reader__pager-label">
              <span class="reader__pager-action">上一章</span>
              <span v-if="prevChapter" class="reader__pager-title">{{ prevChapter.title }}</span>
            </span>
          </button>
          <button
            type="button"
            class="reader__pager-btn reader__pager-btn--next"
            :disabled="!nextChapter"
            :title="nextChapter?.title || '已是最后一章'"
            @click="goChapter(nextChapter?.id)"
          >
            <span class="reader__pager-label">
              <span class="reader__pager-action">下一章</span>
              <span v-if="nextChapter" class="reader__pager-title">{{ nextChapter.title }}</span>
            </span>
            <span class="reader__pager-arrow" aria-hidden="true">→</span>
          </button>
        </nav>
      </template>
    </article>
  </div>
</template>

<style scoped>
.reader {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.reader__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
}

.reader__back {
  appearance: none;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-ink, #0a0a0a);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.reader__back:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(10, 10, 10, 0.08);
}

.reader__crumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--clay-muted, #6a6a6a);
}

.reader__crumb-sep {
  opacity: 0.5;
}

.reader__crumb-current {
  color: var(--clay-ink, #0a0a0a);
  font-weight: 600;
}

.reader__mode {
  margin-left: auto;
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-card, #f5f0e0);
  gap: 2px;
}

.reader__mode-btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--clay-muted, #6a6a6a);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.reader__mode-btn.is-active {
  background: var(--clay-brand-peach, #ffb084);
  color: var(--clay-ink, #0a0a0a);
}

.reader__mobile-toc {
  display: none;
  width: 100%;
}

.reader__mobile-toc select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-ink, #0a0a0a);
  font-size: 13px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.reader__content {
  border: 1px solid var(--clay-hairline, #e5e5e5);
  border-radius: var(--clay-rounded-lg, 16px);
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 92%, white);
  padding: 28px 32px 40px;
  overflow: auto;
  flex: 1;
  min-height: 0;
  content-visibility: auto;
}

.reader__chapter-title {
  margin: 0 0 20px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--clay-ink, #0a0a0a);
}

.reader__status {
  margin: 0;
  color: var(--clay-muted, #6a6a6a);
  font-size: 14px;
}

.reader__text {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  font-family:
    'Songti SC',
    'Noto Serif SC',
    'Source Han Serif SC',
    Georgia,
    serif;
  font-size: 16px;
  line-height: 1.85;
  color: var(--clay-body-strong, #1a1a1a);
}

.reader__more {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.reader__more-btn {
  appearance: none;
  border: 1px solid var(--clay-ink, #0a0a0a);
  background: var(--clay-brand-peach, #ffb084);
  color: var(--clay-ink, #0a0a0a);
  font-size: 13px;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
}

.reader__progress {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
}

.reader__pager {
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid var(--clay-hairline, #e5e5e5);
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.reader__pager-btn {
  appearance: none;
  max-width: calc(50% - 8px);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  border-radius: 12px;
  background: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-ink, #0a0a0a);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    opacity 0.2s ease;
}

.reader__pager-btn--prev {
  margin-right: auto;
  text-align: left;
}

.reader__pager-btn--next {
  margin-left: auto;
  text-align: right;
  flex-direction: row;
}

.reader__pager-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(10, 10, 10, 0.08);
  border-color: color-mix(in srgb, var(--clay-brand-peach, #ffb084) 55%, var(--clay-hairline, #e5e5e5));
}

.reader__pager-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.reader__pager-arrow {
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--clay-muted, #6a6a6a);
}

.reader__pager-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.reader__pager-btn--next .reader__pager-label {
  align-items: flex-end;
}

.reader__pager-action {
  font-size: 13px;
  font-weight: 700;
}

.reader__pager-title {
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}

@media (max-width: 800px) {
  .reader__mode {
    margin-left: 0;
  }

  .reader__mobile-toc {
    display: block;
  }

  .reader__content {
    padding: 20px 16px 32px;
  }

  .reader__pager-title {
    max-width: 110px;
  }
}
</style>
