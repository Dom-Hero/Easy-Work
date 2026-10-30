<script setup lang="ts">
import { ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { useEbookLibrary, type EbookBook } from '@/composables/useEbookLibrary'

const emit = defineEmits<{
  open: [bookId: string]
}>()

const { books, ready, loadError, importTxtFile, removeBook } = useEbookLibrary()
const fileInputRef = ref<HTMLInputElement | null>(null)
const activeTab = ref('recent')
const uploading = ref(false)
const deletingId = ref<string | null>(null)

const tabs = [
  { key: 'recent', label: '最近访问' },
  { key: 'owned', label: '归我所有' },
  { key: 'shared', label: '与我共享' },
  { key: 'starred', label: '收藏' },
]

function triggerUpload() {
  fileInputRef.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploading.value = true
  try {
    const result = await importTxtFile(file)
    if (!result.ok) {
      if (!result.cancelled) message.warning(result.message)
      return
    }
    if (result.sourceSaved) {
      message.success(`已导入「${result.book.title}」（${result.encoding}）`)
    } else {
      message.warning(
        `已导入「${result.book.title}」（${result.encoding}），原文未能保存，无法在阅读页切换编码`,
      )
    }
  } finally {
    uploading.value = false
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatRelative(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 2 * day) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return formatDateTime(iso)
}

function openBook(book: EbookBook) {
  if (book.status === 'parsing') return
  emit('open', book.id)
}

function confirmRemove(book: EbookBook) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除「${book.title}」吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      deletingId.value = book.id
      try {
        await removeBook(book.id)
        message.success('已删除')
      } catch {
        message.error('删除失败')
      } finally {
        deletingId.value = null
      }
    },
  })
}
</script>

<template>
  <div class="home">
    <h1 class="home__title">主页</h1>

    <div class="home__actions">
      <button type="button" class="action-card action-card--muted" disabled>
        <span class="action-card__icon action-card__icon--new" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
              stroke="currentColor"
              stroke-width="1.6"
            />
            <path
              d="M14 2v6h6M12 18v-6M9 15h6"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span class="action-card__body">
          <span class="action-card__label">新建</span>
          <span class="action-card__desc">新建文档开始协作</span>
        </span>
      </button>

      <button
        type="button"
        class="action-card action-card--upload"
        :disabled="uploading"
        @click="triggerUpload"
      >
        <span class="action-card__icon action-card__icon--upload" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V7M12 7l-3.5 3.5M12 7l3.5 3.5"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span class="action-card__body">
          <span class="action-card__label">{{ uploading ? '上传中…' : '上传' }}</span>
          <span class="action-card__desc">上传本地 .txt 文件</span>
        </span>
      </button>

      <button type="button" class="action-card action-card--muted" disabled>
        <span class="action-card__icon action-card__icon--tpl" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="3"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              stroke-width="1.6"
            />
            <rect
              x="13"
              y="3"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              stroke-width="1.6"
            />
            <rect
              x="3"
              y="13"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              stroke-width="1.6"
            />
            <rect
              x="13"
              y="13"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              stroke-width="1.6"
            />
          </svg>
        </span>
        <span class="action-card__body">
          <span class="action-card__label">模板库</span>
          <span class="action-card__desc">选择模板快速搭建</span>
        </span>
      </button>

      <input
        ref="fileInputRef"
        type="file"
        accept=".txt,text/plain"
        class="home__file"
        @change="onFileChange"
      />
    </div>

    <div class="home__toolbar">
      <div class="home__tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="home__tab"
          :class="{ 'home__tab--active': activeTab === tab.key }"
          :aria-selected="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
        <button type="button" class="home__tab home__tab--plus" disabled aria-label="添加">
          +
        </button>
      </div>
      <div class="home__tools" aria-hidden="true">
        <button type="button" class="home__tool" disabled>筛选</button>
        <button type="button" class="home__tool" disabled>显示设置</button>
      </div>
    </div>

    <div class="home__table-wrap">
      <table class="home__table">
        <thead>
          <tr>
            <th class="col-title">标题</th>
            <th class="col-loc">位置</th>
            <th class="col-owner">所有者</th>
            <th class="col-created">创建时间</th>
            <th class="col-visited">最近访问</th>
            <th class="col-more">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!ready">
            <td colspan="6" class="home__empty">正在加载书库…</td>
          </tr>
          <tr v-else-if="loadError">
            <td colspan="6" class="home__empty">{{ loadError }}</td>
          </tr>
          <tr v-else-if="books.length === 0">
            <td colspan="6" class="home__empty">暂无电子书，点击上方「上传」导入 .txt 文件</td>
          </tr>
          <tr
            v-for="book in books"
            :key="book.id"
            class="home__row"
            :class="{ 'home__row--busy': book.status === 'parsing' }"
            :tabindex="book.status === 'parsing' ? -1 : 0"
            :aria-busy="book.status === 'parsing'"
            @click="openBook(book)"
            @keydown.enter="openBook(book)"
          >
            <td class="col-title">
              <div class="book-cell">
                <span class="book-icon" aria-hidden="true">
                  <svg v-if="book.status !== 'parsing'" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                    />
                    <path
                      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                      stroke="currentColor"
                      stroke-width="1.6"
                    />
                  </svg>
                  <i v-else class="book-spinner" />
                </span>
                <span class="book-title-wrap">
                  <span class="book-title">{{ book.title }}</span>
                  <span v-if="book.status === 'parsing'" class="book-parsing">
                    解析中 {{ book.parseProgress ?? 0 }}%，完成前无法打开
                  </span>
                </span>
              </div>
            </td>
            <td class="col-loc">
              <span class="loc-pill">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                </svg>
                {{ book.location }}
              </span>
            </td>
            <td class="col-owner">
              <span class="owner">
                <span class="owner__avatar">{{ book.owner.slice(0, 1) }}</span>
                {{ book.owner }}
              </span>
            </td>
            <td class="col-created">{{ formatDateTime(book.createdAt) }}</td>
            <td class="col-visited">{{ formatRelative(book.lastVisitedAt) }}</td>
            <td class="col-more">
              <button
                type="button"
                class="row-action row-action--danger"
                :disabled="deletingId === book.id"
                @click.stop="confirmRemove(book)"
              >
                {{ deletingId === book.id ? '删除中…' : '删除' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.home__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--clay-ink, #0a0a0a);
}

.home__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  border-radius: var(--clay-rounded-lg, 16px);
  background: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-ink, #0a0a0a);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.action-card:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(10, 10, 10, 0.08);
  border-color: color-mix(in srgb, var(--clay-ink, #0a0a0a) 18%, transparent);
}

.action-card:disabled,
.action-card--muted {
  cursor: default;
  opacity: 0.72;
}

.action-card--upload:not(:disabled) {
  opacity: 1;
  background: color-mix(
    in srgb,
    var(--clay-brand-peach, #ffb084) 28%,
    var(--clay-surface-card, #f5f0e0)
  );
  border-color: color-mix(
    in srgb,
    var(--clay-brand-peach, #ffb084) 55%,
    var(--clay-hairline, #e5e5e5)
  );
}

.action-card__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--clay-ink, #0a0a0a);
}

.action-card__icon svg {
  width: 22px;
  height: 22px;
}

.action-card__icon--new {
  background: color-mix(in srgb, var(--clay-brand-lavender, #b8a4ed) 35%, white);
}

.action-card__icon--upload {
  background: color-mix(in srgb, var(--clay-brand-peach, #ffb084) 55%, white);
  color: #8a3d18;
}

.action-card__icon--tpl {
  background: color-mix(in srgb, var(--clay-brand-ochre, #e8b94a) 40%, white);
}

.action-card__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.action-card__label {
  font-size: 15px;
  font-weight: 700;
}

.action-card__desc {
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home__file {
  display: none;
}

.home__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--clay-hairline, #e5e5e5);
}

.home__tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
}

.home__tab {
  appearance: none;
  border: none;
  background: transparent;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--clay-muted, #6a6a6a);
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.home__tab--active {
  color: var(--clay-ink, #0a0a0a);
  font-weight: 650;
}

.home__tab--active::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--clay-brand-coral, #ff6b5a);
}

.home__tab--plus {
  font-size: 18px;
  line-height: 1;
  opacity: 0.5;
  cursor: default;
}

.home__tools {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.home__tool {
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: var(--clay-muted-soft, #9a9a9a);
  font-size: 13px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: default;
}

.home__table-wrap {
  overflow: auto;
  border-radius: var(--clay-rounded-lg, 16px);
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 88%, white);
}

.home__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.home__table th {
  text-align: left;
  font-weight: 600;
  color: var(--clay-muted, #6a6a6a);
  padding: 12px 14px;
  border-bottom: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-soft, #faf5e8);
  white-space: nowrap;
}

.home__table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--clay-hairline-soft, #f0f0f0);
  color: var(--clay-body, #3a3a3a);
  vertical-align: middle;
}

.home__row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.home__row:hover {
  background: color-mix(in srgb, var(--clay-brand-peach, #ffb084) 12%, transparent);
}

.home__row--busy,
.home__row--busy:hover {
  cursor: progress;
  background: transparent;
}

.home__empty {
  text-align: center;
  color: var(--clay-muted, #6a6a6a);
  padding: 48px 16px !important;
}

.col-title {
  min-width: 200px;
}

.book-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.book-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--clay-brand-mint, #a4d4c5) 40%, white);
  color: var(--clay-brand-teal, #1a3a3a);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.book-icon svg {
  width: 16px;
  height: 16px;
}

.book-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.book-title {
  font-weight: 600;
  color: var(--clay-ink, #0a0a0a);
}

.book-parsing {
  font-size: 12px;
  font-weight: 600;
  color: var(--clay-muted, #6a6a6a);
}

.book-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--clay-brand-teal, #1a3a3a) 25%, transparent);
  border-top-color: var(--clay-brand-teal, #1a3a3a);
  animation: home-spin 0.8s linear infinite;
}

@keyframes home-spin {
  to {
    transform: rotate(360deg);
  }
}

.loc-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--clay-body, #3a3a3a);
}

.loc-pill svg {
  width: 14px;
  height: 14px;
  color: var(--clay-muted, #6a6a6a);
}

.owner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.owner__avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--clay-brand-lavender, #b8a4ed);
  color: var(--clay-ink, #0a0a0a);
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.row-action {
  appearance: none;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-body, #3a3a3a);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.row-action:disabled {
  opacity: 0.6;
  cursor: default;
}

.row-action--danger:not(:disabled):hover {
  color: var(--clay-brand-coral, #ff6b5a);
  border-color: color-mix(
    in srgb,
    var(--clay-brand-coral, #ff6b5a) 45%,
    var(--clay-hairline, #e5e5e5)
  );
  background: color-mix(in srgb, var(--clay-brand-coral, #ff6b5a) 12%, white);
}

.col-more {
  width: 72px;
  text-align: right;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .home__actions {
    grid-template-columns: 1fr;
  }

  .col-loc,
  .col-owner,
  .col-created,
  th.col-loc,
  th.col-owner,
  th.col-created {
    display: none;
  }
}
</style>
