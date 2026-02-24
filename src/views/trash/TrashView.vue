<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getTrashList,
  restoreImage,
  batchRestoreImages,
  permanentDeleteImage,
  batchPermanentDeleteImages
} from '@/api/image'
import type { Image } from '@/types'
import { useSiteStore } from '@/stores/site'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useHotkeys } from '@/composables/useHotkeys'
import TrashSkeleton from '@/components/common/TrashSkeleton.vue'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const { confirm } = useConfirm()
const { register } = useHotkeys()
const siteStore = useSiteStore()

// 状态
const images = ref<Image[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(24)

// 批量选择
const selectedIds = ref<Set<number>>(new Set())
const selectMode = ref(false)

// 计算属性
const selectedCount = computed(() => selectedIds.value.size)
const allSelected = computed(() => images.value.length > 0 && images.value.every(img => selectedIds.value.has(img.id)))
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const retentionDays = computed(() => siteStore.recycleDays)

// 计算剩余天数
function getRemainingDays(deletedAt: string | undefined): number {
  if (!deletedAt) return retentionDays.value
  const deleted = new Date(deletedAt)
  const expiry = new Date(deleted.getTime() + retentionDays.value * 24 * 60 * 60 * 1000)
  const now = new Date()
  const remaining = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  return Math.max(0, remaining)
}

// 获取过期状态类
function getExpiryClass(days: number): string {
  if (days <= 1) return 'danger'
  if (days <= 3) return 'warning'
  return 'normal'
}

// 加载回收站列表
async function loadTrash() {
  loading.value = true
  try {
    const response = await getTrashList(page.value, pageSize.value)
    images.value = response.list || []
    total.value = response.total
  } catch (error) {
    console.error('Failed to load trash:', error)
  } finally {
    loading.value = false
  }
}

// 分页
function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    loadTrash()
  }
}

// 选择相关
function toggleSelect(id: number) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    images.value.forEach(img => selectedIds.value.add(img.id))
  }
}

function clearSelection() {
  selectedIds.value.clear()
  selectMode.value = false
}

// 恢复单张图片
async function handleRestore(id: number) {
  try {
    await restoreImage(id)
    toast.success(t('trash.restoreSuccess'))
    loadTrash()
  } catch (error) {
    console.error('Failed to restore:', error)
    toast.error(t('trash.restoreFailed'))
  }
}

// 批量恢复
async function handleBatchRestore() {
  if (selectedCount.value === 0) return
  const count = selectedCount.value
  try {
    await batchRestoreImages(Array.from(selectedIds.value))
    toast.success(t('trash.batchRestoreSuccess', { count }))
    clearSelection()
    loadTrash()
  } catch (error) {
    console.error('Failed to batch restore:', error)
    toast.error(t('trash.restoreFailed'))
  }
}

// 彻底删除单张图片
async function handlePermanentDelete(id: number) {
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('trash.deleteConfirm'),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    await permanentDeleteImage(id)
    toast.success(t('trash.deleteSuccess'))
    loadTrash()
  } catch (error) {
    console.error('Failed to delete:', error)
    toast.error(t('trash.deleteFailed'))
  }
}

// 批量彻底删除
async function handleBatchPermanentDelete() {
  if (selectedCount.value === 0) return
  const count = selectedCount.value
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('trash.batchDeleteConfirm', { count }),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    await batchPermanentDeleteImages(Array.from(selectedIds.value))
    toast.success(t('trash.batchDeleteSuccess', { count }))
    clearSelection()
    loadTrash()
  } catch (error) {
    console.error('Failed to batch delete:', error)
    toast.error(t('trash.deleteFailed'))
  }
}

// 清空回收站
async function handleEmptyTrash() {
  if (images.value.length === 0) return
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('trash.emptyConfirm'),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    const allIds = images.value.map(img => img.id)
    await batchPermanentDeleteImages(allIds)
    toast.success(t('trash.emptySuccess'))
    loadTrash()
  } catch (error) {
    console.error('Failed to empty trash:', error)
    toast.error(t('trash.deleteFailed'))
  }
}

// 格式化
function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 快捷键注册
let unregisterHotkeys: (() => void)[] = []

onMounted(() => {
  loadTrash()

  // 注册快捷键
  // Ctrl+A: 全选/取消全选
  unregisterHotkeys.push(register({
    key: 'a',
    ctrl: true,
    description: t('hotkeys.selectAll'),
    category: t('hotkeys.trash') || t('trash.title'),
    handler: () => {
      if (images.value.length > 0) {
        selectMode.value = true
        toggleSelectAll()
      }
    }
  }))

  // Delete: 永久删除选中的图片
  unregisterHotkeys.push(register({
    key: 'Delete',
    description: t('hotkeys.delete'),
    category: t('hotkeys.trash') || t('trash.title'),
    handler: () => {
      if (selectedCount.value > 0) {
        handleBatchPermanentDelete()
      }
    }
  }))

  // Escape: 取消选择
  unregisterHotkeys.push(register({
    key: 'Escape',
    description: t('hotkeys.cancel'),
    category: t('hotkeys.trash') || t('trash.title'),
    handler: () => {
      if (selectMode.value) {
        clearSelection()
      }
    }
  }))
})

onUnmounted(() => {
  unregisterHotkeys.forEach(fn => fn())
})
</script>

<template>
  <div class="trash-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ t('trash.title') }}</h1>
        <span class="total-badge">{{ total }} {{ t('common.unit.image') }}</span>
      </div>
      <div class="header-actions">
        <button v-if="images.length > 0" class="btn btn-danger btn-outline" @click="handleEmptyTrash">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          {{ t('trash.empty') }}
        </button>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="notice-card">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v5"/>
        <path d="M12 16v.01"/>
      </svg>
      <p>{{ t('trash.expiresIn', { days: retentionDays }) }}</p>
    </div>

    <!-- 工具栏 -->
    <div v-if="images.length > 0" class="toolbar">
      <button class="btn" :class="selectMode ? 'btn-primary' : 'btn-ghost'" @click="selectMode = !selectMode">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        {{ selectMode ? t('gallery.exitSelect') : t('gallery.batchSelect') }}
      </button>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectMode && selectedCount > 0" class="batch-bar">
      <div class="batch-info">
        <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
        <span>{{ t('gallery.selectedCount', { count: selectedCount }) }}</span>
      </div>
      <div class="batch-actions">
        <button class="btn btn-ghost" @click="handleBatchRestore">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          {{ t('trash.restore') }}
        </button>
        <button class="btn btn-danger" @click="handleBatchPermanentDelete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          {{ t('trash.deletePermanently') }}
        </button>
        <button class="btn btn-ghost" @click="clearSelection">{{ t('common.cancel') }}</button>
      </div>
    </div>

    <!-- 图片列表 -->
    <TrashSkeleton v-if="loading" :count="pageSize" />

    <div v-else-if="images.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
      <p>{{ t('trash.noItems') }}</p>
      <button class="btn btn-primary" @click="router.push('/gallery')">{{ t('common.back') }}</button>
    </div>

    <div v-else class="trash-grid">
      <div
        v-for="img in images"
        :key="img.id"
        class="trash-item"
        :class="{ selected: selectedIds.has(img.id) }"
      >
        <div class="item-checkbox" v-if="selectMode" @click.stop="toggleSelect(img.id)">
          <input type="checkbox" :checked="selectedIds.has(img.id)" />
        </div>
        <div class="item-preview" @click="selectMode ? toggleSelect(img.id) : null">
          <img :src="img.thumbnail || img.url" :alt="img.name" loading="lazy" />
          <div class="expiry-badge" :class="getExpiryClass(getRemainingDays(img.deleted_at))">
            {{ t('trash.expiresIn', { days: getRemainingDays(img.deleted_at) }) }}
          </div>
        </div>
        <div class="item-info">
          <p class="item-name" :title="img.original_name">{{ img.original_name }}</p>
          <p class="item-meta">
            <span>{{ formatSize(img.size) }}</span>
            <span class="meta-separator">·</span>
            <span>{{ formatDate(img.deleted_at) }}</span>
          </p>
          <div class="item-actions">
            <button class="btn btn-sm btn-primary" @click="handleRestore(img.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              {{ t('trash.restore') }}
            </button>
            <button class="btn btn-sm btn-danger btn-outline" @click="handlePermanentDelete(img.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="page === 1" @click="goToPage(page - 1)">{{ t('common.prev') }}</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="page === totalPages" @click="goToPage(page + 1)">{{ t('common.next') }}</button>
    </div>
  </div>
</template>

<style scoped>
.trash-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.total-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  border-radius: var(--radius-full);
}

.header-actions .btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-danger.btn-outline {
  color: var(--color-error);
  border-color: var(--color-error);
  background: transparent;
}

.btn-danger.btn-outline:hover {
  background: var(--color-error);
  color: white;
}

/* 提示卡片 */
.notice-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text);
}

.notice-card svg {
  color: var(--color-warning);
  flex-shrink: 0;
}

.notice-card p {
  margin: 0;
  font-size: var(--text-sm);
}

.notice-card strong {
  color: var(--color-warning);
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-base);
}

.toolbar .btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 批量操作栏 */
.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-base);
}

.batch-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.batch-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.batch-actions .btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: white;
  border-color: rgba(255,255,255,0.3);
}

.batch-actions .btn:hover {
  background: rgba(255,255,255,0.1);
}

.batch-actions .btn-danger {
  background: var(--color-error);
  border-color: var(--color-error);
}

/* 回收站网格 */
.trash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-base);
}

.trash-item {
  position: relative;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition-base);
}

.trash-item:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-md);
}

.trash-item.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary);
}

.item-checkbox {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  z-index: 10;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.item-preview {
  position: relative;
  aspect-ratio: 16 / 10;
  background: var(--color-bg-secondary);
  overflow: hidden;
}

.item-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.7;
  transition: var(--transition-base);
}

.trash-item:hover .item-preview img {
  opacity: 1;
}

.expiry-badge {
  position: absolute;
  bottom: var(--spacing-sm);
  right: var(--spacing-sm);
  padding: 2px var(--spacing-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  border-radius: var(--radius-full);
}

.expiry-badge.normal {
  background: rgba(0,0,0,0.6);
  color: white;
}

.expiry-badge.warning {
  background: var(--color-warning);
  color: white;
}

.expiry-badge.danger {
  background: var(--color-error);
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.item-info {
  padding: var(--spacing-base);
}

.item-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0 0 var(--spacing-sm);
}

.meta-separator {
  margin: 0 var(--spacing-xs);
}

.item-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.item-actions .btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

/* 加载和空状态 */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state svg {
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-base);
}

.empty-state p {
  margin: 0 0 var(--spacing-base);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-base);
  margin-top: var(--spacing-xl);
}

.page-btn {
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

@media (max-width: 640px) {
  .trash-grid {
    grid-template-columns: 1fr;
  }

  .item-actions {
    flex-direction: column;
  }
}
</style>
