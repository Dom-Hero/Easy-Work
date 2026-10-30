<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PageFlip } from 'page-flip'
import {
  offsetForPageIndex,
  pageIndexForOffset,
  paginateText,
} from '@/composables/usePagePagination'

const props = withDefaults(
  defineProps<{
    text: string
    title: string
    hasPrevChapter: boolean
    hasNextChapter: boolean
    loading?: boolean
    failed?: boolean
    startAt?: 'start' | 'end'
  }>(),
  {
    loading: false,
    failed: false,
    startAt: 'start',
  },
)

const emit = defineEmits<{
  'prev-chapter': []
  'next-chapter': []
}>()

const PAGE_FONT =
  "'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', Georgia, serif"

const rootEl = ref<HTMLElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
/** Stable wrapper that survives PageFlip.destroy() (which removes its root node). */
const bookWrapEl = ref<HTMLElement | null>(null)
const bookHostEl = ref<HTMLElement | null>(null)

const pages = ref<string[]>([''])
const currentPage = ref(0)
const spread = ref<'portrait' | 'landscape'>('landscape')
const pageWidth = ref(420)
const pageHeight = ref(600)
const ready = ref(false)

let pageFlip: PageFlip | null = null
let charOffset = 0
let buildSeq = 0

const statusText = computed(() => {
  if (props.loading) return '正在加载正文…'
  if (props.failed) return '正文加载失败，请返回重试'
  if (!props.text.trim()) return '（本章暂无正文）'
  return ''
})

const canFlip = computed(
  () => !props.loading && !props.failed && !!props.text.trim() && ready.value,
)

const pageLabel = computed(() => {
  const total = Math.max(1, pages.value.length)
  return `${Math.min(currentPage.value + 1, total)} / ${total}`
})

function chapterEdge(idx: number, count: number, orientation: 'portrait' | 'landscape') {
  const total = Math.max(1, count)
  const lastStart =
    orientation === 'portrait' || total <= 1
      ? total - 1
      : total % 2 === 0
        ? total - 2
        : total - 1
  return {
    atStart: idx <= 0,
    atEnd: idx >= lastStart,
  }
}

const atStart = computed(() => {
  const edge = chapterEdge(currentPage.value, pages.value.length, spread.value)
  return edge.atStart
})
const atEnd = computed(() => {
  const edge = chapterEdge(currentPage.value, pages.value.length, spread.value)
  return edge.atEnd
})

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function calcPageSize() {
  const stage = stageEl.value
  if (!stage) return { width: 420, height: 600 }

  const availW = Math.max(280, stage.clientWidth - 24)
  const availH = Math.max(360, stage.clientHeight - 8)
  const aspect = 1 / 1.42

  let width = Math.min(520, Math.floor(availW / 2))
  let height = Math.floor(width / aspect)

  if (height > availH) {
    height = Math.floor(availH)
    width = Math.floor(height * aspect)
  }

  if (availW < 720) {
    width = Math.min(460, availW)
    height = Math.floor(width / aspect)
    if (height > availH) {
      height = Math.floor(availH)
      width = Math.floor(height * aspect)
    }
  }

  return {
    width: Math.max(240, width),
    height: Math.max(340, height),
  }
}

/** Text box inside a page after padding + header/footer. */
function contentBoxSize() {
  return {
    width: Math.max(120, pageWidth.value - 60),
    height: Math.max(160, pageHeight.value - 28 - 22 - 12 - 28 - 24),
  }
}

function paginateFromText(preserveOffset: boolean) {
  const size = calcPageSize()
  pageWidth.value = size.width
  pageHeight.value = size.height

  if (preserveOffset) {
    charOffset = offsetForPageIndex(pages.value, currentPage.value)
  }

  const box = contentBoxSize()
  const nextPages = paginateText(props.text, {
    width: box.width,
    height: box.height,
    fontSize: '16px',
    lineHeight: '1.85',
    fontFamily: PAGE_FONT,
    padding: '0',
  })

  pages.value = nextPages.length ? nextPages : ['']

  if (!preserveOffset) {
    if (props.startAt === 'end') {
      currentPage.value = Math.max(0, pages.value.length - 1)
      charOffset = offsetForPageIndex(pages.value, currentPage.value)
    } else {
      currentPage.value = 0
      charOffset = 0
    }
  } else {
    currentPage.value = pageIndexForOffset(pages.value, charOffset)
  }
}

/** Ensure a live `.flip-book` host exists under the stable wrap (destroy() removes it). */
function ensureHost(): HTMLElement | null {
  const wrap = bookWrapEl.value
  if (!wrap) return null
  let host = bookHostEl.value
  if (!host || !wrap.contains(host)) {
    host = document.createElement('div')
    host.className = 'flip-book'
    wrap.replaceChildren(host)
    bookHostEl.value = host
  }
  return host
}

function teardownFlip() {
  ready.value = false
  if (pageFlip) {
    try {
      pageFlip.off('flip')
    } catch {
      /* ignore */
    }
    try {
      // destroy() removes the PageFlip root element from the DOM
      pageFlip.destroy()
    } catch {
      /* ignore */
    }
    pageFlip = null
  }
  bookHostEl.value = null
  ensureHost()
}

function renderPageElements(host: HTMLElement): HTMLElement[] {
  const title = escapeHtml(props.title || '')
  const total = pages.value.length
  host.innerHTML = pages.value
    .map((page, index) => {
      const body = escapeHtml(page || '')
      return `<div class="book-page" data-density="soft">
        <div class="book-page__inner">
          ${title ? `<header class="book-page__header">${title}</header>` : ''}
          <pre class="book-page__text">${body}</pre>
          <footer class="book-page__footer">${index + 1} / ${total}</footer>
        </div>
      </div>`
    })
    .join('')
  return Array.from(host.querySelectorAll<HTMLElement>('.book-page'))
}

async function mountFlip() {
  if (statusText.value) {
    teardownFlip()
    return
  }

  const seq = ++buildSeq
  teardownFlip()

  await nextTick()
  if (seq !== buildSeq) return

  const mountNode = ensureHost()
  if (!mountNode || seq !== buildSeq) return

  const items = renderPageElements(mountNode)
  if (!items.length || seq !== buildSeq) return

  const startPage = Math.max(0, Math.min(currentPage.value, items.length - 1))

  try {
    pageFlip = new PageFlip(mountNode, {
      width: pageWidth.value,
      height: pageHeight.value,
      size: 'stretch',
      minWidth: 220,
      maxWidth: pageWidth.value,
      minHeight: 320,
      maxHeight: pageHeight.value,
      drawShadow: true,
      flippingTime: 800,
      usePortrait: true,
      startPage,
      autoSize: true,
      maxShadowOpacity: 0.45,
      showCover: false,
      mobileScrollSupport: true,
      useMouseEvents: true,
      // Hover-fold fights click flips and looks like a broken animation.
      showPageCorners: false,
      disableFlipByClick: false,
      startZIndex: 10,
    })

    pageFlip.on('flip', (e) => {
      if (typeof e.data === 'number') {
        currentPage.value = e.data
        charOffset = offsetForPageIndex(pages.value, currentPage.value)
      }
    })

    pageFlip.on('init', (e) => {
      if (seq !== buildSeq) return
      ready.value = true
      const mode = e.data && typeof e.data === 'object' && 'mode' in e.data ? e.data.mode : null
      if (mode === 'portrait' || mode === 'landscape') spread.value = mode
    })

    pageFlip.on('changeOrientation', (e) => {
      if (e.data === 'portrait' || e.data === 'landscape') spread.value = e.data
    })

    pageFlip.loadFromHTML(items)
    currentPage.value = startPage
  } catch (err) {
    console.error('[ImmersiveReader] page-flip init failed', err)
    ready.value = false
  }
}

async function rebuild(preserveOffset: boolean) {
  if (props.loading || props.failed) {
    teardownFlip()
    pages.value = ['']
    return
  }
  if (!props.text.trim()) {
    teardownFlip()
    pages.value = ['']
    return
  }
  paginateFromText(preserveOffset)
  await mountFlip()
}

function isIdle() {
  if (!pageFlip || !ready.value) return false
  try {
    return pageFlip.getState() === 'read'
  } catch {
    return false
  }
}

function readingEdge() {
  if (!pageFlip) return { atStart: true, atEnd: true }
  const orientation = pageFlip.getOrientation() === 'portrait' ? 'portrait' : 'landscape'
  return chapterEdge(pageFlip.getCurrentPageIndex(), pageFlip.getPageCount(), orientation)
}

function goNext() {
  if (!canFlip.value || !pageFlip || !isIdle()) {
    if (!pageFlip && !props.loading && !props.failed && props.hasNextChapter) {
      emit('next-chapter')
    }
    return
  }
  if (readingEdge().atEnd) {
    if (props.hasNextChapter) emit('next-chapter')
    return
  }
  pageFlip.flipNext('bottom')
}

function goPrev() {
  if (!canFlip.value || !pageFlip || !isIdle()) {
    if (!pageFlip && !props.loading && !props.failed && props.hasPrevChapter) {
      emit('prev-chapter')
    }
    return
  }
  if (readingEdge().atStart) {
    if (props.hasPrevChapter) emit('prev-chapter')
    return
  }
  pageFlip.flipPrev('bottom')
}

/** Page-flip ignores the last spread click; turn that click into a chapter change. */
function onPagesClick(event: MouseEvent) {
  if (!pageFlip || !isIdle()) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (rect.width <= 0) return
  const ratio = (event.clientX - rect.left) / rect.width
  const edge = readingEdge()
  if (ratio >= 0.65 && edge.atEnd && props.hasNextChapter) emit('next-chapter')
  else if (ratio <= 0.35 && edge.atStart && props.hasPrevChapter) emit('prev-chapter')
}

function onKeydown(event: KeyboardEvent) {
  const tag = (event.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault()
    goPrev()
  } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault()
    goNext()
  }
}

watch(
  () => [props.text, props.startAt, props.loading, props.failed] as const,
  async () => {
    await nextTick()
    charOffset = 0
    await rebuild(false)
  },
)

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  await nextTick()
  await rebuild(false)
})

onBeforeUnmount(() => {
  buildSeq += 1
  window.removeEventListener('keydown', onKeydown)
  teardownFlip()
})
</script>

<template>
  <div ref="rootEl" class="immersive">
    <div ref="stageEl" class="immersive__stage">
      <p v-if="statusText" class="immersive__status">{{ statusText }}</p>

      <div
        class="immersive__book-wrap"
        :class="{ 'is-hidden': !!statusText }"
        @click="onPagesClick"
      >
        <!-- v-once: PageFlip owns this subtree; Vue must not re-patch/clear it -->
        <div v-once ref="bookWrapEl" class="immersive__book-root" />
      </div>
    </div>

    <div class="immersive__meta">
      <button
        v-if="atStart && hasPrevChapter"
        type="button"
        class="immersive__chapter-btn"
        @click="emit('prev-chapter')"
      >
        ← 上一章
      </button>
      <span>{{ pageLabel }}</span>
      <button
        v-if="atEnd && hasNextChapter"
        type="button"
        class="immersive__chapter-btn"
        @click="emit('next-chapter')"
      >
        下一章 →
      </button>
      <span class="immersive__hint">点击书页左右侧或拖拽页角翻页 · 方向键也可翻页</span>
    </div>
  </div>
</template>

<style scoped>
.immersive {
  --paper: #f7f1e3;
  --paper-deep: #efe6d4;
  --ink: var(--clay-body-strong, #1a1a1a);
  --muted: var(--clay-muted, #6a6a6a);
  --stage: #e4d8c6;

  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 8px 8px;
  overflow: hidden;
  border-radius: var(--clay-rounded-lg, 16px);
  border: 1px solid color-mix(in srgb, var(--clay-hairline, #e5e5e5) 70%, #cbb89a);
  background:
    radial-gradient(ellipse 70% 55% at 50% 42%, #f3ebe0 0%, transparent 72%),
    linear-gradient(165deg, #efe6d8 0%, var(--stage) 48%, #d6c7b2 100%);
}

.immersive__stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.immersive__status {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.immersive__book-wrap {
  position: relative;
  z-index: 1;
  width: min(100%, 1040px);
  max-height: 100%;
  min-height: 0;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.immersive__book-wrap.is-hidden {
  display: none;
}

.immersive__book-root,
.flip-book {
  margin: 0 auto;
  width: 100%;
  max-height: 100%;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

/* Flip sheets and shadows stick out of the page box and briefly grow the scroll area. */
:deep(.stf__parent),
:deep(.stf__wrapper),
:deep(.stf__block) {
  overflow: hidden;
}

/*
  Page markup is created via innerHTML (outside Vue's template compiler),
  so scoped attributes are NOT applied to .book-page*. Use :deep().
*/
:deep(.book-page) {
  background: var(--paper);
  color: var(--ink);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

:deep(.book-page__inner) {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 28px 30px 22px;
  display: flex;
  flex-direction: column;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(120, 90, 50, 0.03) 3px,
      rgba(120, 90, 50, 0.03) 4px
    ),
    linear-gradient(180deg, #faf6ec 0%, var(--paper) 42%, var(--paper-deep) 100%);
}

:deep(.book-page__header) {
  margin: 0 0 12px;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: color-mix(in srgb, var(--muted) 85%, #8a6a40);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.book-page__text) {
  margin: 0;
  flex: 1 1 auto;
  min-height: 120px;
  overflow: hidden;
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
  color: var(--ink);
}

:deep(.book-page__footer) {
  margin-top: 12px;
  flex: 0 0 auto;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-align: center;
  color: color-mix(in srgb, var(--muted) 80%, #8a6a40);
}

.immersive__meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 16px;
  font-size: 12px;
  color: color-mix(in srgb, var(--muted) 80%, #7a5a3a);
}

.immersive__chapter-btn {
  appearance: none;
  border: 1px solid color-mix(in srgb, var(--clay-hairline, #e5e5e5) 70%, #cbb89a);
  background: color-mix(in srgb, var(--paper) 80%, white);
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.immersive__chapter-btn:hover {
  border-color: color-mix(in srgb, var(--clay-brand-peach, #ffb084) 50%, #cbb89a);
}

.immersive__hint {
  opacity: 0.9;
  width: 100%;
  text-align: center;
}

@media (max-width: 800px) {
  :deep(.book-page__inner) {
    padding: 22px 18px 16px;
  }

  :deep(.book-page__text) {
    font-size: 15px;
  }
}
</style>
