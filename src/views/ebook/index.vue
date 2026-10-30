<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEbookLibrary, type EbookBook } from '@/composables/useEbookLibrary'
import HomeView from './HomeView.vue'
import ReaderView from './ReaderView.vue'

const router = useRouter()
const { books, getBook, touchVisited } = useEbookLibrary()

const view = ref<'home' | 'reader'>('home')
const activeBookId = ref<string | null>(null)
const activeChapterId = ref('')
/** Snapshot for reader — avoids TOC disappearing if library list updates (e.g. touchVisited). */
const readerBook = ref<EbookBook | null>(null)

const activeBook = computed(() => {
  if (view.value !== 'reader') return null
  if (readerBook.value) return readerBook.value
  return activeBookId.value ? getBook(activeBookId.value) : null
})

const tocChapters = computed(() => activeBook.value?.chapters ?? [])
const TOC_ITEM = 36
const tocEl = ref<HTMLElement | null>(null)
const tocScroll = ref(0)
const tocVirtual = computed(() => tocChapters.value.length > 60)

const visibleToc = computed(() => {
  const chapters = tocChapters.value
  if (!tocVirtual.value) return chapters.map((chapter, index) => ({ chapter, index }))
  const start = Math.max(0, Math.floor(tocScroll.value / TOC_ITEM) - 6)
  const end = Math.min(chapters.length, start + 28)
  return chapters.slice(start, end).map((chapter, offset) => ({
    chapter,
    index: start + offset,
  }))
})

function onTocScroll(event: Event) {
  tocScroll.value = (event.target as HTMLElement).scrollTop
}

const navItems = [
  { key: 'home', label: '主页' },
  { key: 'drive', label: '云盘' },
  { key: 'wiki', label: '知识库' },
  { key: 'record', label: '智能纪录' },
]

function openBook(bookId: string) {
  const book = getBook(bookId)
  if (!book || book.status === 'parsing') return

  const chapters = Array.isArray(book.chapters) ? book.chapters : []
  readerBook.value = {
    ...book,
    chapters,
  }
  activeBookId.value = bookId
  activeChapterId.value = chapters[0]?.id ?? ''
  view.value = 'reader'
  void touchVisited(bookId)
}

function backHome() {
  view.value = 'home'
  activeBookId.value = null
  activeChapterId.value = ''
  readerBook.value = null
}

function selectChapter(id: string) {
  activeChapterId.value = id
}

function goDashboard() {
  router.push('/dashboard')
}

watch(activeChapterId, (id) => {
  if (!tocVirtual.value) return
  const index = tocChapters.value.findIndex((chapter) => chapter.id === id)
  const el = tocEl.value
  if (!el || index < 0) return
  const top = index * TOC_ITEM
  const bottom = top + TOC_ITEM
  if (top < el.scrollTop || bottom > el.scrollTop + el.clientHeight) {
    el.scrollTop = Math.max(0, top - TOC_ITEM * 2)
  }
})

watch(activeBookId, () => {
  tocScroll.value = 0
  if (tocEl.value) tocEl.value.scrollTop = 0
})
</script>

<template>
  <div class="ebook-app">
    <aside class="ebook-sidebar">
      <div class="ebook-sidebar__brand">
        <button type="button" class="ebook-sidebar__logo" @click="backHome">
          <span class="ebook-sidebar__mark" aria-hidden="true">册</span>
          <span>电子书</span>
        </button>
        <button type="button" class="ebook-sidebar__exit" title="返回工作台" @click="goDashboard">
          工作台
        </button>
      </div>

      <!-- 主页：导航占位 -->
      <template v-if="view === 'home'">
        <div class="ebook-sidebar__search" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.6" />
            <path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <span>搜索</span>
        </div>

        <nav class="ebook-sidebar__nav" aria-label="主导航">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            class="ebook-sidebar__link"
            :class="{ 'ebook-sidebar__link--active': item.key === 'home' }"
            :disabled="item.key !== 'home'"
            @click="item.key === 'home' && backHome()"
          >
            {{ item.label }}
          </button>
        </nav>

        <div class="ebook-sidebar__section ebook-sidebar__section--grow">
          <div class="ebook-sidebar__section-head">
            <span>我的书库</span>
            <span class="ebook-sidebar__section-count">{{ books.length }}</span>
          </div>
          <p v-if="books.length === 0" class="ebook-sidebar__placeholder">
            上传 txt 后将显示在这里
          </p>
          <nav v-else class="ebook-sidebar__books" aria-label="已上传电子书">
            <button
              v-for="book in books"
              :key="book.id"
              type="button"
              class="ebook-sidebar__book"
              :title="book.status === 'parsing' ? `${book.title}（解析中）` : book.title"
              :disabled="book.status === 'parsing'"
              :aria-busy="book.status === 'parsing'"
              @click="openBook(book.id)"
            >
              <span class="ebook-sidebar__book-icon" aria-hidden="true">
                <i v-if="book.status === 'parsing'" class="ebook-sidebar__spinner" />
                <template v-else>书</template>
              </span>
              <span class="ebook-sidebar__book-title">{{ book.title }}</span>
              <span class="ebook-sidebar__book-meta">
                {{
                  book.status === 'parsing'
                    ? `解析中 ${book.parseProgress ?? 0}%`
                    : `${book.chapters.length} 章`
                }}
              </span>
            </button>
          </nav>
        </div>

        <div class="ebook-sidebar__foot" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </template>

      <!-- 阅读：章节目录 -->
      <template v-else-if="activeBook">
        <div class="ebook-sidebar__toc-meta">
          <p class="ebook-sidebar__toc-book">{{ activeBook.title }}</p>
          <p class="ebook-sidebar__toc-hint">
            目录
            <span v-if="tocChapters.length" class="ebook-sidebar__toc-count">
              （{{ tocChapters.length }}）
            </span>
          </p>
        </div>
        <nav
          ref="tocEl"
          class="ebook-sidebar__toc"
          aria-label="章节目录"
          @scroll.passive="onTocScroll"
        >
          <p v-if="tocChapters.length === 0" class="ebook-sidebar__toc-empty">暂无章节目录</p>
          <div
            v-else
            class="ebook-sidebar__toc-list"
            :style="tocVirtual ? { height: `${tocChapters.length * TOC_ITEM}px` } : undefined"
          >
            <button
              v-for="item in visibleToc"
              :key="item.chapter.id"
              type="button"
              class="ebook-sidebar__toc-item"
              :class="[
                `ebook-sidebar__toc-item--l${item.chapter.level}`,
                {
                  'ebook-sidebar__toc-item--active': item.chapter.id === activeChapterId,
                  'ebook-sidebar__toc-item--virtual': tocVirtual,
                },
              ]"
              :style="
                tocVirtual
                  ? { top: `${item.index * TOC_ITEM}px`, height: `${TOC_ITEM}px` }
                  : undefined
              "
              :title="item.chapter.title"
              @click="selectChapter(item.chapter.id)"
            >
              {{ item.chapter.title }}
            </button>
          </div>
        </nav>
      </template>
    </aside>

    <div class="ebook-main">
      <header class="ebook-topbar">
        <div class="ebook-topbar__spacer" />
        <div class="ebook-topbar__actions" aria-hidden="true">
          <button type="button" class="ebook-topbar__btn" disabled title="搜索">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.6" />
              <path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="ebook-topbar__btn" disabled title="帮助">?</button>
          <button type="button" class="ebook-topbar__btn" disabled title="通知">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9a6 6 0 1 1 12 0c0 4 2 5 2 5H4s2-1 2-5Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="ebook-topbar__btn" disabled title="应用">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="7" cy="7" r="1.5" fill="currentColor" />
              <circle cx="12" cy="7" r="1.5" fill="currentColor" />
              <circle cx="17" cy="7" r="1.5" fill="currentColor" />
              <circle cx="7" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="17" cy="12" r="1.5" fill="currentColor" />
              <circle cx="7" cy="17" r="1.5" fill="currentColor" />
              <circle cx="12" cy="17" r="1.5" fill="currentColor" />
              <circle cx="17" cy="17" r="1.5" fill="currentColor" />
            </svg>
          </button>
          <span class="ebook-topbar__avatar">我</span>
        </div>
      </header>

      <div class="ebook-content">
        <HomeView v-if="view === 'home'" @open="openBook" />
        <ReaderView
          v-else-if="activeBook"
          :book="activeBook"
          :chapter-id="activeChapterId"
          @back="backHome"
          @update:chapter-id="selectChapter"
        />
        <div v-else class="ebook-missing">
          <p>未找到该书，可能已被清除。</p>
          <button type="button" @click="backHome">返回主页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ebook-app {
  display: flex;
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  background: var(--clay-canvas, #fffaf0);
  color: var(--clay-ink, #0a0a0a);
}

.ebook-sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 12px 12px;
  border-right: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-soft, #faf5e8);
  min-height: 0;
}

.ebook-sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
  flex-shrink: 0;
}

.ebook-sidebar__logo {
  appearance: none;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--clay-ink, #0a0a0a);
  cursor: pointer;
  padding: 0;
}

.ebook-sidebar__mark {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
  background: var(--clay-brand-peach, #ffb084);
  border: 1px solid var(--clay-ink, #0a0a0a);
  box-shadow: 2px 2px 0 var(--clay-ink, #0a0a0a);
}

.ebook-sidebar__exit {
  appearance: none;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-muted, #6a6a6a);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  cursor: pointer;
}

.ebook-sidebar__exit:hover {
  color: var(--clay-ink, #0a0a0a);
}

.ebook-sidebar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 80%, white);
  border: 1px solid var(--clay-hairline, #e5e5e5);
  color: var(--clay-muted-soft, #9a9a9a);
  font-size: 13px;
}

.ebook-sidebar__search svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.ebook-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ebook-sidebar__link {
  appearance: none;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--clay-body, #3a3a3a);
  cursor: pointer;
  text-align: left;
}

.ebook-sidebar__link:disabled {
  cursor: default;
  opacity: 0.55;
}

.ebook-sidebar__link--active {
  background: color-mix(in srgb, var(--clay-brand-peach, #ffb084) 30%, white);
  color: var(--clay-ink, #0a0a0a);
  font-weight: 700;
  opacity: 1;
}

.ebook-sidebar__section {
  margin-top: 10px;
  padding: 0 4px;
}

.ebook-sidebar__section--grow {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ebook-sidebar__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
  font-weight: 600;
  flex-shrink: 0;
}

.ebook-sidebar__section-count {
  font-size: 11px;
  color: var(--clay-muted-soft, #9a9a9a);
  font-weight: 500;
}

.ebook-sidebar__placeholder {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--clay-muted-soft, #9a9a9a);
}

.ebook-sidebar__books {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: auto;
  min-height: 0;
  flex: 1;
}

.ebook-sidebar__book {
  appearance: none;
  border: none;
  background: transparent;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 8px;
  row-gap: 2px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  color: var(--clay-body, #3a3a3a);
}

.ebook-sidebar__book:hover:not(:disabled) {
  background: color-mix(in srgb, var(--clay-brand-peach, #ffb084) 18%, transparent);
}

.ebook-sidebar__book:disabled {
  cursor: progress;
  opacity: 0.72;
}

.ebook-sidebar__spinner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--clay-brand-teal, #1a3a3a) 25%, transparent);
  border-top-color: var(--clay-brand-teal, #1a3a3a);
  animation: ebook-spin 0.8s linear infinite;
}

@keyframes ebook-spin {
  to {
    transform: rotate(360deg);
  }
}

.ebook-sidebar__book-icon {
  grid-row: 1 / span 2;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  background: color-mix(in srgb, var(--clay-brand-mint, #a4d4c5) 45%, white);
  color: var(--clay-brand-teal, #1a3a3a);
}

.ebook-sidebar__book-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--clay-ink, #0a0a0a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ebook-sidebar__book-meta {
  font-size: 11px;
  color: var(--clay-muted-soft, #9a9a9a);
}

.ebook-sidebar__foot {
  margin-top: auto;
  display: flex;
  gap: 10px;
  padding: 8px 4px 4px;
}

.ebook-sidebar__foot span {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: var(--clay-hairline, #e5e5e5);
}

.ebook-sidebar__toc-meta {
  padding: 4px 8px 0;
}

.ebook-sidebar__toc-book {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--clay-ink, #0a0a0a);
  line-height: 1.35;
}

.ebook-sidebar__toc-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
  font-weight: 600;
}

.ebook-sidebar__toc-count {
  font-weight: 500;
  opacity: 0.85;
}

.ebook-sidebar__toc {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: auto;
  min-height: 0;
  flex: 1;
  padding-bottom: 8px;
}

.ebook-sidebar__toc-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ebook-sidebar__toc-empty {
  margin: 8px;
  font-size: 12px;
  color: var(--clay-muted-soft, #9a9a9a);
}

.ebook-sidebar__toc-item {
  appearance: none;
  border: none;
  background: transparent;
  text-align: left;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--clay-body, #3a3a3a);
  cursor: pointer;
  line-height: 1.4;
}

.ebook-sidebar__toc-item--l2 {
  padding-left: 20px;
  font-size: 12.5px;
}

.ebook-sidebar__toc-item--l3 {
  padding-left: 30px;
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
}

.ebook-sidebar__toc-item:hover {
  background: color-mix(in srgb, var(--clay-brand-peach, #ffb084) 18%, transparent);
}

.ebook-sidebar__toc-item--active {
  background: color-mix(in srgb, var(--clay-brand-peach, #ffb084) 32%, white);
  color: var(--clay-ink, #0a0a0a);
  font-weight: 700;
}

.ebook-sidebar__toc-item--virtual {
  position: absolute;
  left: 0;
  right: 0;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ebook-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--clay-canvas, #fffaf0) 70%, white) 0%,
    var(--clay-canvas, #fffaf0) 100%
  );
}

.ebook-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 24px;
}

.ebook-topbar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ebook-topbar__btn {
  appearance: none;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--clay-muted, #6a6a6a);
  display: grid;
  place-items: center;
  cursor: default;
  font-size: 14px;
  font-weight: 700;
}

.ebook-topbar__btn svg {
  width: 16px;
  height: 16px;
}

.ebook-topbar__avatar {
  width: 28px;
  height: 28px;
  margin-left: 4px;
  border-radius: 50%;
  background: var(--clay-brand-lavender, #b8a4ed);
  color: var(--clay-ink, #0a0a0a);
  font-size: 12px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.ebook-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 28px 28px;
  display: flex;
  flex-direction: column;
}

.ebook-missing {
  margin: auto;
  text-align: center;
  color: var(--clay-muted, #6a6a6a);
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.ebook-missing button {
  appearance: none;
  border: 1px solid var(--clay-ink, #0a0a0a);
  background: var(--clay-surface-card, #f5f0e0);
  border-radius: 12px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 768px) {
  .ebook-sidebar {
    display: none;
  }

  .ebook-content {
    padding: 8px 16px 24px;
  }
}
</style>
