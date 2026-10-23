<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible class="note-sider">
      <div class="sider-header">
        <a-tooltip title="新建文件">
          <a-button type="text" class="sider-action-btn" :disabled="deleteMode" @click="handleCreateFile">
            <file-add-outlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="新建文件夹">
          <a-button type="text" class="sider-action-btn" :disabled="deleteMode" @click="handleCreateFolder">
            <folder-add-outlined />
          </a-button>
        </a-tooltip>
        <a-tooltip :title="deleteMode ? '取消删除' : '删除'">
          <a-button
            type="text"
            class="sider-action-btn"
            :class="{ 'sider-action-btn-active': deleteMode }"
            @click="toggleDeleteMode"
          >
            <delete-outlined />
          </a-button>
        </a-tooltip>
      </div>

      <div
        class="note-list"
        :class="{ 'drop-target-active': dragOverTarget === 'root' }"
        @dragover.prevent="onDragOver('root')"
        @dragleave="onDragLeave('root')"
        @drop.prevent="onDrop(null)"
      >
        <div
          v-for="file in rootFiles"
          :key="file.id"
          class="note-item"
          :class="{
            active: !deleteMode && selectedFileId === file.id,
            'is-checked': deleteMode && isDeleteSelected('file', file.id),
          }"
          :draggable="!deleteMode"
          @click="onItemClick('file', file.id)"
          @dragstart="onDragStart($event, file.id)"
          @dragend="onDragEnd"
        >
          <a-checkbox
            v-if="deleteMode"
            class="note-check"
            :checked="isDeleteSelected('file', file.id)"
            @click.stop
            @change="() => toggleDeleteSelect('file', file.id)"
          />
          <file-outlined class="note-icon" />
          <span class="note-name">{{ file.name }}</span>
        </div>

        <div v-for="folder in folders" :key="folder.id" class="folder-group">
          <div
            class="folder-header"
            :class="{
              'is-checked': deleteMode && isDeleteSelected('folder', folder.id),
              'drop-target-active': dragOverTarget === folder.id,
            }"
            @click="onFolderHeaderClick(folder.id)"
            @dragover.prevent="onDragOver(folder.id)"
            @dragleave="onDragLeave(folder.id)"
            @drop.prevent.stop="onDrop(folder.id)"
          >
            <a-checkbox
              v-if="deleteMode"
              class="note-check"
              :checked="isDeleteSelected('folder', folder.id)"
              @click.stop
              @change="() => toggleDeleteSelect('folder', folder.id)"
            />
            <folder-outlined v-if="!expandedFolders.has(folder.id)" class="note-icon" />
            <folder-open-outlined v-else class="note-icon" />
            <span class="note-name">{{ folder.name }}</span>
            <a-tooltip v-if="!deleteMode" title="在此文件夹新建文件">
              <a-button
                type="text"
                size="small"
                class="folder-add-btn"
                @click.stop="handleCreateFileInFolder(folder.id)"
              >
                <file-add-outlined />
              </a-button>
            </a-tooltip>
          </div>
          <div
            v-show="expandedFolders.has(folder.id)"
            class="folder-children"
            :class="{ 'drop-target-active': dragOverTarget === `child-${folder.id}` }"
            @dragover.prevent="onDragOver(`child-${folder.id}`, folder.id)"
            @dragleave="onDragLeave(`child-${folder.id}`)"
            @drop.prevent.stop="onDrop(folder.id)"
          >
            <div
              v-for="file in getFilesInFolder(folder.id)"
              :key="file.id"
              class="note-item note-item-nested"
              :class="{
                active: !deleteMode && selectedFileId === file.id,
                'is-checked': deleteMode && isDeleteSelected('file', file.id),
              }"
              :draggable="!deleteMode"
              @click="onItemClick('file', file.id)"
              @dragstart="onDragStart($event, file.id)"
              @dragend="onDragEnd"
            >
              <a-checkbox
                v-if="deleteMode"
                class="note-check"
                :checked="isDeleteSelected('file', file.id)"
                @click.stop
                @change="() => toggleDeleteSelect('file', file.id)"
              />
              <file-outlined class="note-icon" />
              <span class="note-name">{{ file.name }}</span>
            </div>
            <div
              v-if="getFilesInFolder(folder.id).length === 0"
              class="folder-empty"
            >
              暂无文件
            </div>
          </div>
        </div>

        <div v-if="rootFiles.length === 0 && folders.length === 0" class="list-empty">
          点击上方按钮创建记录
        </div>
      </div>

      <div v-if="deleteMode && deleteSelectionCount > 0" class="delete-bar">
        <span>已选 {{ deleteSelectionCount }} 项</span>
        <a-button type="primary" danger size="small" @click="confirmDelete">
          删除
        </a-button>
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="page-header">
        <BackBtn />
      </a-layout-header>
      <a-layout-content style="margin: 0 16px">
        <div class="editor-panel">
          <template v-if="selectedFileId">
            <div class="editor-header">
              <span class="editor-title">{{ currentFile?.name }}</span>
            </div>
            <MdEditor
              v-model="text"
              :height="400"
              @onSave="onSave"
            />
          </template>
          <a-empty v-else description="请选择或创建一个 Markdown 文件" />
        </div>
      </a-layout-content>
      <a-layout-footer class="page-footer">
        记录每一天，记录每一点，记录每一刻
      </a-layout-footer>
    </a-layout>

    <a-modal
      v-model:open="nameModalVisible"
      :title="nameModalTitle"
      ok-text="确定"
      cancel-text="取消"
      @ok="confirmCreate"
    >
      <a-input
        v-model:value="nameInput"
        :placeholder="nameModalPlaceholder"
        @pressEnter="confirmCreate"
      />
    </a-modal>
  </a-layout>
</template>

<script lang="ts" setup>
import { MdEditor } from 'md-editor-v3'
import {
  FileAddOutlined,
  FolderAddOutlined,
  FileOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { ref, computed, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useMarkdownNotes } from '@/composables/useMarkdownNotes'
import 'md-editor-v3/lib/style.css'
import BackBtn from './components/backBtn.vue'

const collapsed = ref(false)
const selectedFileId = ref<string | null>(null)
const text = ref('')
const expandedFolders = ref(new Set<string>())
const deleteMode = ref(false)
const selectedFileIds = ref(new Set<string>())
const selectedFolderIds = ref(new Set<string>())
const draggingFileId = ref<string | null>(null)
const dragOverTarget = ref<string | null>(null)

const {
  rootFiles,
  folders,
  getFilesInFolder,
  validateCreateName,
  createFile,
  createFolder,
  updateFileContent,
  getFileById,
  deleteItems,
  moveFile,
} = useMarkdownNotes()

const deleteSelectionCount = computed(
  () => selectedFileIds.value.size + selectedFolderIds.value.size,
)

const currentFile = computed(() =>
  selectedFileId.value ? getFileById(selectedFileId.value) : undefined,
)

watch(selectedFileId, (id) => {
  if (!id) {
    text.value = ''
    return
  }
  const file = getFileById(id)
  text.value = file?.content ?? ''
})

const nameModalVisible = ref(false)
const nameInput = ref('')
const nameModalTitle = ref('')
const nameModalPlaceholder = ref('')
const pendingCreateType = ref<'file' | 'folder'>('file')
const pendingFolderId = ref<string | null>(null)

function openNameModal(type: 'file' | 'folder', folderId: string | null = null) {
  pendingCreateType.value = type
  pendingFolderId.value = folderId
  nameModalTitle.value = type === 'file' ? '新建文件' : '新建文件夹'
  nameModalPlaceholder.value = type === 'file' ? '请输入文件名，如 日记' : '请输入文件夹名称'
  nameInput.value = type === 'file' ? '未命名' : '新建文件夹'
  nameModalVisible.value = true
}

function handleCreateFile() {
  openNameModal('file')
}

function handleCreateFolder() {
  openNameModal('folder')
}

function handleCreateFileInFolder(folderId: string) {
  expandedFolders.value.add(folderId)
  openNameModal('file', folderId)
}

function confirmCreate() {
  const name = nameInput.value.trim()
  const validation = validateCreateName(
    name,
    pendingCreateType.value,
    pendingFolderId.value,
  )
  if (!validation.valid) {
    message.warning(validation.message!)
    return Promise.reject()
  }

  if (pendingCreateType.value === 'folder') {
    createFolder(name)
    message.success('文件夹已创建')
  } else {
    const file = createFile(name, pendingFolderId.value)
    selectFile(file.id)
    if (pendingFolderId.value) {
      expandedFolders.value.add(pendingFolderId.value)
    }
    message.success('文件已创建')
  }

  nameModalVisible.value = false
}

function selectFile(id: string) {
  selectedFileId.value = id
}

function toggleFolder(folderId: string) {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId)
  } else {
    expandedFolders.value.add(folderId)
  }
}

function toggleDeleteMode() {
  deleteMode.value = !deleteMode.value
  selectedFileIds.value.clear()
  selectedFolderIds.value.clear()
}

function isDeleteSelected(type: 'file' | 'folder', id: string) {
  return type === 'file'
    ? selectedFileIds.value.has(id)
    : selectedFolderIds.value.has(id)
}

function toggleDeleteSelect(type: 'file' | 'folder', id: string) {
  const set = type === 'file' ? selectedFileIds.value : selectedFolderIds.value
  if (set.has(id)) set.delete(id)
  else set.add(id)
}

function onItemClick(type: 'file' | 'folder', id: string) {
  if (deleteMode.value) {
    toggleDeleteSelect(type, id)
    return
  }
  if (type === 'file') selectFile(id)
}

function onFolderHeaderClick(folderId: string) {
  if (deleteMode.value) {
    toggleDeleteSelect('folder', folderId)
    return
  }
  toggleFolder(folderId)
}

function confirmDelete() {
  const fileCount = selectedFileIds.value.size
  const folderCount = selectedFolderIds.value.size
  if (fileCount + folderCount === 0) return

  Modal.confirm({
    title: '确认删除',
    content: `确定删除选中的 ${fileCount + folderCount} 项吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      const fileIds = [...selectedFileIds.value]
      const folderIds = [...selectedFolderIds.value]
      if (selectedFileId.value) {
        const current = getFileById(selectedFileId.value)
        const deleted =
          fileIds.includes(selectedFileId.value) ||
          (current?.folderId != null && folderIds.includes(current.folderId))
        if (deleted) selectedFileId.value = null
      }
      deleteItems(fileIds, folderIds)
      selectedFileIds.value.clear()
      selectedFolderIds.value.clear()
      deleteMode.value = false
      message.success('已删除')
    },
  })
}

function onDragStart(e: DragEvent, fileId: string) {
  draggingFileId.value = fileId
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', fileId)
}

function onDragEnd() {
  draggingFileId.value = null
  dragOverTarget.value = null
}

function onDragOver(target: string, folderId?: string) {
  dragOverTarget.value = target
  if (folderId) expandedFolders.value.add(folderId)
}

function onDragLeave(target: string) {
  if (dragOverTarget.value === target) dragOverTarget.value = null
}

function onDrop(folderId: string | null) {
  const fileId = draggingFileId.value
  dragOverTarget.value = null
  draggingFileId.value = null
  if (!fileId) return

  const file = getFileById(fileId)
  if (!file || file.folderId === folderId) return

  if (!moveFile(fileId, folderId)) {
    message.warning('目标位置已存在同名文件')
    return
  }
  if (folderId) expandedFolders.value.add(folderId)
}

function onSave(v: string) {
  if (!selectedFileId.value) return
  updateFileContent(selectedFileId.value, v)
  message.success('已保存到本地')
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 24px;
  line-height: normal;
  background: var(--clay-canvas, #fffaf0);
  border-bottom: 1px solid var(--clay-hairline, #e5e5e5);
}

.page-footer {
  text-align: center;
  background: var(--clay-surface-soft, #faf5e8);
  color: var(--clay-body, #3a3a3a);
  font-size: 14px;
}

.editor-panel {
  padding: 24px;
  min-height: 360px;
  background: var(--clay-canvas, #fffaf0);
  border: 1px solid var(--clay-hairline, #e5e5e5);
  border-radius: var(--clay-rounded-lg, 16px);
}

.note-sider {
  background: var(--clay-brand-teal, #1a3a3a) !important;
}

.note-sider :deep(.ant-layout-sider-trigger) {
  background: color-mix(in srgb, var(--clay-on-dark, #fff) 12%, transparent);
  color: var(--clay-on-dark, #fff);
}

.sider-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 8px 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--clay-on-dark, #fff) 12%, transparent);
}

.sider-action-btn {
  color: color-mix(in srgb, var(--clay-on-dark, #fff) 85%, transparent);
  font-size: 18px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--clay-rounded-md, 12px);
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.sider-action-btn:hover {
  color: var(--clay-on-dark, #fff);
  background: color-mix(in srgb, var(--clay-on-dark, #fff) 12%, transparent);
  transform: translateY(-1px);
}

.sider-action-btn-active {
  color: var(--clay-brand-coral, #ff6b5a) !important;
  background: color-mix(in srgb, var(--clay-brand-coral, #ff6b5a) 18%, transparent) !important;
}

.sider-action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.note-list {
  padding: 8px 0;
  overflow-y: auto;
  max-height: calc(100vh - 64px);
}

.note-list:has(+ .delete-bar) {
  max-height: calc(100vh - 112px);
}

.note-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  color: color-mix(in srgb, var(--clay-on-dark, #fff) 65%, transparent);
  border-radius: 0;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.note-item:hover {
  color: var(--clay-on-dark, #fff);
  background: color-mix(in srgb, var(--clay-on-dark, #fff) 8%, transparent);
}

.note-item.active {
  color: var(--clay-ink, #0a0a0a);
  background: var(--clay-brand-peach, #ffb084);
}

.note-item.is-checked,
.folder-header.is-checked {
  background: color-mix(in srgb, var(--clay-brand-coral, #ff6b5a) 16%, transparent);
}

.note-check {
  flex-shrink: 0;
}

.note-check :deep(.ant-checkbox-inner) {
  background: transparent;
  border-color: color-mix(in srgb, var(--clay-on-dark, #fff) 45%, transparent);
}

.note-item-nested {
  padding-left: 32px;
}

.note-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.note-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.folder-group {
  margin-top: 2px;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 16px;
  cursor: pointer;
  color: color-mix(in srgb, var(--clay-on-dark, #fff) 85%, transparent);
  transition: background-color 0.2s ease;
}

.folder-header:hover {
  background: color-mix(in srgb, var(--clay-on-dark, #fff) 8%, transparent);
}

.folder-add-btn {
  margin-left: auto;
  color: color-mix(in srgb, var(--clay-on-dark, #fff) 45%, transparent);
  flex-shrink: 0;
}

.folder-add-btn:hover {
  color: var(--clay-on-dark, #fff);
}

.folder-children {
  overflow: hidden;
}

.drop-target-active {
  outline: 1px dashed color-mix(in srgb, var(--clay-brand-ochre, #e8b94a) 70%, transparent);
  outline-offset: -1px;
  background: color-mix(in srgb, var(--clay-brand-ochre, #e8b94a) 12%, transparent);
}

.delete-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid color-mix(in srgb, var(--clay-on-dark, #fff) 12%, transparent);
  color: color-mix(in srgb, var(--clay-on-dark, #fff) 85%, transparent);
  font-size: 13px;
}

.folder-empty,
.list-empty {
  padding: 8px 16px 8px 32px;
  color: color-mix(in srgb, var(--clay-on-dark, #fff) 40%, transparent);
  font-size: 12px;
}

.list-empty {
  padding: 24px 16px;
  text-align: center;
}

.editor-header {
  margin-bottom: 12px;
}

.editor-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--clay-ink, #0a0a0a);
}
</style>
