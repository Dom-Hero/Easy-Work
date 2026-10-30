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

const { loadChapterPiece } = useEbookLibrary()

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

/** Document mode keeps at most this much text in the DOM, then slides forward. */
const DOC_WINDOW_CHARS = 48_000

const mode = ref<ReaderMode>(readStoredMode())
const immersiveStartAt = ref<'start' | 'end'>('start')
const pieceText = ref('')
const pieceIndex = ref(0)
const pieceCount = ref(0)
const docText = ref('')
const docFrom = ref(0)
const docPieces = ref(0)
const foldedEarlier = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
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
  if (next === 'document') scheduleFill()
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

const displayText = computed(() =>
  docText.value.endsWith('\n') ? docText.value.slice(0, -1) : docText.value,
)

const hasMore = computed(() => docFrom.value + docPieces.value < pieceCount.value)

const progressLabel = computed(() => {
  if (pieceCount.value <= 1) return ''
  const from = docFrom.value + 1
  const to = docFrom.value + Math.max(docPieces.value, 1)
  if (from === to) return `第 ${from} / ${pieceCount.value} 段`
  return `第 ${from}–${to} / ${pieceCount.value} 段`
})

const immersiveHasPrev = computed(() => pieceIndex.value > 0 || !!prevChapter.value)
const immersiveHasNext = computed(
  () => pieceIndex.value + 1 < pieceCount.value || !!nextChapter.value,
)
const immersivePrevLabel = computed(() => (pieceIndex.value > 0 ? '上一段' : '上一章'))
const immersiveNextLabel = computed(() =>
  pieceIndex.value + 1 < pieceCount.value ? '下一段' : '下一章',
)

function applyPiece(index: number, text: string, sliceCount: number, how: 'replace' | 'append') {
  pieceCount.value = Math.max(0, sliceCount)
  pieceIndex.value = index
  pieceText.value = text.endsWith('\n') ? text.slice(0, -1) : text
  if (how === 'replace') {
    docFrom.value = index
    docPieces.value = 1
    docText.value = text
    foldedEarlier.value = index > 0
  } else {
    docText.value += text
    docPieces.value += 1
  }
}

function scheduleFill() {
  if (mode.value !== 'document') return
  requestAnimationFrame(() => maybeFill())
}

async function loadPiece(index: number, how: 'replace' | 'append', keepVisible = false) {
  const chapter = activeChapter.value
  if (!chapter) return
  const seq = ++loadSeq
  loadFailed.value = false
  const block = how === 'replace' && !keepVisible
  if (block) {
    loading.value = true
    pieceText.value = ''
    docText.value = ''
  } else {
    loadingMore.value = true
  }

  try {
    const piece = await loadChapterPiece(chapter, index)
    if (seq !== loadSeq) return
    applyPiece(index, piece.text, piece.sliceCount, how)
    if (how === 'replace') requestAnimationFrame(() => scrollContentTop())
  } catch {
    if (seq !== loadSeq) return
    if (block) loadFailed.value = true
  } finally {
    if (seq === loadSeq) {
      loading.value = false
      loadingMore.value = false
      scheduleFill()
    }
  }
}

async function openChapter(startAt: 'start' | 'end') {
  const chapter = activeChapter.value
  if (!chapter) {
    pieceText.value = ''
    docText.value = ''
    pieceCount.value = 0
    pieceIndex.value = 0
    return
  }

  if (startAt === 'end' && typeof chapter.sliceCount === 'number' && chapter.sliceCount > 1) {
    await loadPiece(chapter.sliceCount - 1, 'replace')
    return
  }

  if (startAt === 'end' && typeof chapter.sliceCount !== 'number') {
    const seq = ++loadSeq
    loading.value = true
    pieceText.value = ''
    docText.value = ''
    loadFailed.value = false
    try {
      const head = await loadChapterPiece(chapter, 0)
      if (seq !== loadSeq) return
      const last = Math.max(0, head.sliceCount - 1)
      if (last === 0) {
        applyPiece(0, head.text, head.sliceCount, 'replace')
        return
      }
      const piece = await loadChapterPiece(chapter, last)
      if (seq !== loadSeq) return
      applyPiece(last, piece.text, piece.sliceCount, 'replace')
      scrollContentTop()
    } catch {
      if (seq !== loadSeq) return
      loadFailed.value = true
    } finally {
      if (seq === loadSeq) {
        loading.value = false
        loadingMore.value = false
        scheduleFill()
      }
    }
    return
  }

  await loadPiece(0, 'replace')
}

async function revealMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return
  const next = docFrom.value + Math.max(docPieces.value, 1)
  if (next >= pieceCount.value) return
  if (docText.value.length >= DOC_WINDOW_CHARS) {
    await loadPiece(next, 'replace', true)
    return
  }
  await loadPiece(next, 'append')
}

function maybeFill() {
  const el = contentEl.value
  if (!el || mode.value !== 'document' || loading.value || loadingMore.value || !hasMore.value) return
  if (el.clientHeight === 0 || docText.value.length >= DOC_WINDOW_CHARS) return
  if (el.scrollHeight <= el.clientHeight + 80) void revealMore()
}

function onContentScroll() {
  const el = contentEl.value
  if (!el || !hasMore.value || loading.value || loadingMore.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 240) {
    void revealMore()
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
  if (pieceIndex.value > 0) {
    immersiveStartAt.value = 'end'
    void loadPiece(pieceIndex.value - 1, 'replace', true)
    return
  }
  goChapter(prevChapter.value?.id, 'end')
}

function onImmersiveNextChapter() {
  if (pieceIndex.value + 1 < pieceCount.value) {
    immersiveStartAt.value = 'start'
    void loadPiece(pieceIndex.value + 1, 'replace', true)
    return
  }
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
    void openChapter(immersiveStartAt.value)
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
      <label v-if="chapters.length <= 200" class="reader__mobile-toc">
        <span class="sr-only">选择章节</span>
        <select :value="chapterId" @change="onMobileSelect">
          <option v-for="chapter in book.chapters" :key="chapter.id" :value="chapter.id">
            {{ chapter.title }}
          </option>
        </select>
      </label>
      <p v-else class="reader__mobile-toc reader__mobile-pos">
        {{ activeIndex + 1 }} / {{ chapters.length }} {{ activeChapter?.title }}
      </p>
    </header>

    <ImmersiveReader
      v-if="mode === 'immersive'"
      :text="pieceText"
      :title="activeChapter?.title || book.title"
      :has-prev-chapter="immersiveHasPrev"
      :has-next-chapter="immersiveHasNext"
      :prev-text="immersivePrevLabel"
      :next-text="immersiveNextLabel"
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

      <p v-if="loading && !displayText" class="reader__status">
        <i class="reader__spinner" aria-hidden="true" />
        正在加载正文…
      </p>
      <p v-else-if="loadFailed" class="reader__status">正文加载失败，请返回重试</p>
      <template v-else>
        <p v-if="foldedEarlier" class="reader__folded">更早的内容已收起，当前从本段继续</p>
        <pre class="reader__text">{{ displayText || '（本章暂无正文）' }}</pre>
        <div v-if="hasMore" class="reader__more">
          <p class="reader__progress">{{ progressLabel }}</p>
          <button type="button" class="reader__more-btn" :disabled="loadingMore" @click="revealMore">
            {{ loadingMore ? '加载中…' : '继续加载' }}
          </button>
        </div>
        <p v-else-if="progressLabel" class="reader__progress">{{ progressLabel }}</p>
        <p v-if="loadingMore" class="reader__progress">正在加载后续…</p>

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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--clay-muted, #6a6a6a);
  font-size: 14px;
}

.reader__spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--clay-muted, #6a6a6a) 35%, transparent);
  border-top-color: var(--clay-ink, #0a0a0a);
  animation: reader-spin 0.8s linear infinite;
}

@keyframes reader-spin {
  to {
    transform: rotate(360deg);
  }
}

.reader__folded {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
}

.reader__mobile-pos {
  margin: 0;
  font-size: 13px;
  color: var(--clay-muted, #6a6a6a);
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
