<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAlbumById, setAlbumCover, updateAlbum } from '@/api/album'
import { getImagesWithFilters, deleteImage, batchDeleteImages, moveToAlbum } from '@/api/image'
import type { Album, Image } from '@/types'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useHotkeys } from '@/composables/useHotkeys'
import ImageSkeleton from '@/components/common/ImageSkeleton.vue'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()
const { register } = useHotkeys()
const route = useRoute()
const router = useRouter()

// 状态
const album = ref<Album | null>(null)
const images = ref<Image[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(24)

// 批量选择
const selectedIds = ref<Set<number>>(new Set())
const selectMode = ref(false)

// 灯箱
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

// 编辑弹窗
const editDialogVisible = ref(false)
const editName = ref('')
const editDesc = ref('')

// 计算属性
const albumId = computed(() => Number(route.params.id))
const selectedCount = computed(() => selectedIds.value.size)
const allSelected = computed(() => images.value.length > 0 && images.value.every(img => selectedIds.value.has(img.id)))
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const currentImage = computed(() => images.value[lightboxIndex.value])

// 加载相册信息
async function loadAlbum() {
  try {
    album.value = await getAlbumById(albumId.value)
    editName.value = album.value.name
    editDesc.value = album.value.description
  } catch (error) {
    console.error('Failed to load album:', error)
    router.push('/albums')
  }
}

// 加载相册中的图片
async function loadImages() {
  loading.value = true
  try {
    const response = await getImagesWithFilters({ album_id: albumId.value }, page.value, pageSize.value)
    images.value = response.list || []
    total.value = response.total
  } catch (error) {
    console.error('Failed to load images:', error)
  } finally {
    loading.value = false
  }
}

// 分页
function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    loadImages()
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

// 设置封面
async function handleSetCover(imageId: number) {
  try {
    await setAlbumCover(albumId.value, imageId)
    toast.success(t('albums.setCoverSuccess'))
    loadAlbum()
  } catch (error) {
    console.error('Failed to set cover:', error)
    toast.error(t('albums.setCoverFailed'))
  }
}

// 从相册移除
async function handleRemove(ids: number[]) {
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('albums.deleteHint'),
    type: 'warning'
  })
  if (!confirmed) return
  try {
    await moveToAlbum(ids, undefined)
    toast.success(t('albums.removeSuccess'))
    clearSelection()
    loadImages()
    loadAlbum()
  } catch (error) {
    console.error('Failed to remove:', error)
    toast.error(t('albums.removeFailed'))
  }
}

// 删除图片
async function handleDelete(id: number) {
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('gallery.deleteConfirm'),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    await deleteImage(id)
    toast.success(t('gallery.deleteSuccess'))
    loadImages()
    loadAlbum()
  } catch (error) {
    console.error('Failed to delete:', error)
    toast.error(t('gallery.deleteFailed'))
  }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedCount.value === 0) return
  const count = selectedCount.value
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('gallery.batchDeleteConfirm', { count }),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    await batchDeleteImages(Array.from(selectedIds.value))
    toast.success(t('gallery.batchDeleteSuccess', { count }))
    clearSelection()
    loadImages()
    loadAlbum()
  } catch (error) {
    console.error('Failed to batch delete:', error)
    toast.error(t('gallery.deleteFailed'))
  }
}

// 编辑相册
async function handleEdit() {
  if (!editName.value.trim()) return
  try {
    await updateAlbum(albumId.value, { name: editName.value, description: editDesc.value })
    toast.success(t('albums.updateSuccess'))
    editDialogVisible.value = false
    loadAlbum()
  } catch (error) {
    console.error('Failed to update album:', error)
    toast.error(t('albums.updateFailed'))
  }
}

// 灯箱
function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxVisible.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxVisible.value = false
  document.body.style.overflow = ''
}

function lightboxPrev() {
  if (lightboxIndex.value > 0) lightboxIndex.value--
}

function lightboxNext() {
  if (lightboxIndex.value < images.value.length - 1) lightboxIndex.value++
}

// 复制链接
async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url)
  toast.success(t('share.copySuccess'))
}

// 格式化
function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

// 灯箱键盘事件
function handleLightboxKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    lightboxPrev()
  } else if (e.key === 'ArrowRight') {
    lightboxNext()
  } else if (e.key === 'Escape') {
    closeLightbox()
  }
}

onMounted(() => {
  loadAlbum()
  loadImages()

  // 注册页面快捷键
  // Ctrl+A: 全选图片
  const unregisterSelectAll = register({
    key: 'a',
    ctrl: true,
    description: t('hotkeys.selectAll'),
    category: t('hotkeys.albums'),
    handler: () => {
      if (!selectMode.value) {
        selectMode.value = true
      }
      toggleSelectAll()
    }
  })

  // Delete: 删除选中图片
  const unregisterDelete = register({
    key: 'Delete',
    description: t('hotkeys.delete'),
    category: t('hotkeys.albums'),
    handler: () => {
      if (selectedCount.value > 0) {
        handleBatchDelete()
      }
    }
  })

  // Escape: 清除选择或关闭弹窗
  const unregisterEscape = register({
    key: 'Escape',
    description: t('hotkeys.cancel'),
    category: t('hotkeys.albums'),
    handler: () => {
      if (lightboxVisible.value) {
        closeLightbox()
      } else if (editDialogVisible.value) {
        editDialogVisible.value = false
      } else if (selectMode.value) {
        clearSelection()
      }
    }
  })

  // 在组件卸载时注销快捷键
  onUnmounted(() => {
    unregisterSelectAll()
    unregisterDelete()
    unregisterEscape()
  })
})

watch(lightboxVisible, (visible) => {
  if (visible) {
    document.addEventListener('keydown', handleLightboxKeydown)
  } else {
    document.removeEventListener('keydown', handleLightboxKeydown)
  }
})
</script>

<template>
  <div class="album-detail-page">
    <!-- 返回和标题 -->
    <div class="page-header">
      <button class="back-btn" @click="router.push('/albums')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        {{ t('albums.backToAlbums') }}
      </button>
    </div>

    <!-- 相册信息卡片 -->
    <div v-if="album" class="album-header-card">
      <div class="album-cover">
        <img v-if="album.cover_url" :src="album.cover_url" :alt="album.name" />
        <div v-else class="cover-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      </div>
      <div class="album-meta">
        <h1 class="album-title">{{ album.name }}</h1>
        <p class="album-desc" v-if="album.description">{{ album.description }}</p>
        <p class="album-stats">{{ t('albums.imageCount', { count: album.image_count }) }}</p>
        <button class="btn btn-ghost btn-sm" @click="editDialogVisible = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          {{ t('common.edit') }}
        </button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <span class="toolbar-title">{{ t('albums.allImages') }}</span>
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
        <button class="btn btn-ghost" @click="handleRemove(Array.from(selectedIds))">{{ t('albums.removeFromAlbum') }}</button>
        <button class="btn btn-danger" @click="handleBatchDelete">{{ t('common.delete') }}</button>
        <button class="btn btn-ghost" @click="clearSelection">{{ t('common.cancel') }}</button>
      </div>
    </div>

    <!-- 图片网格 -->
    <ImageSkeleton v-if="loading" :count="pageSize" />

    <div v-else-if="images.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <p>{{ t('albums.noImagesInAlbum') }}</p>
      <button class="btn btn-primary" @click="router.push('/gallery')">{{ t('albums.addImages') }}</button>
    </div>

    <div v-else class="image-grid">
      <div
        v-for="(img, index) in images"
        :key="img.id"
        class="grid-item"
        :class="{ selected: selectedIds.has(img.id) }"
      >
        <div class="item-checkbox" v-if="selectMode" @click.stop="toggleSelect(img.id)">
          <input type="checkbox" :checked="selectedIds.has(img.id)" />
        </div>
        <div class="item-preview" @click="selectMode ? toggleSelect(img.id) : openLightbox(index)">
          <img :src="img.thumbnail || img.url" :alt="img.name" loading="lazy" />
        </div>
        <div class="item-overlay">
          <div class="item-info">
            <p class="item-name" :title="img.original_name">{{ img.original_name }}</p>
            <p class="item-meta">{{ formatSize(img.size) }}</p>
          </div>
          <div class="item-actions">
            <button class="action-btn" @click.stop="handleSetCover(img.id)" :title="t('albums.setAsCover')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
            <button class="action-btn" @click.stop="copyUrl(img.url)" :title="t('share.copyLink')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="action-btn danger" @click.stop="handleDelete(img.id)" :title="t('common.delete')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="page === 1" @click="goToPage(page - 1)">{{ t('common.prevPage') }}</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="page === totalPages" @click="goToPage(page + 1)">{{ t('common.nextPage') }}</button>
    </div>

    <!-- 灯箱 -->
    <Teleport to="body">
      <div v-if="lightboxVisible" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" @click="closeLightbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button class="lightbox-nav prev" :disabled="lightboxIndex === 0" @click="lightboxPrev">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div class="lightbox-content">
          <img v-if="currentImage" :src="currentImage.url" :alt="currentImage.name" />
        </div>
        <button class="lightbox-nav next" :disabled="lightboxIndex === images.length - 1" @click="lightboxNext">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <div v-if="currentImage" class="lightbox-info">
          <p class="lightbox-name">{{ currentImage.original_name }}</p>
          <p class="lightbox-meta">{{ currentImage.width }}×{{ currentImage.height }} · {{ formatSize(currentImage.size) }}</p>
        </div>
      </div>
    </Teleport>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="editDialogVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('albums.editAlbum') }}</h3>
            <button class="modal-close" @click="editDialogVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ t('albums.name') }}</label>
              <input v-model="editName" type="text" class="input" :placeholder="t('albums.albumName')" />
            </div>
            <div class="form-group">
              <label>{{ t('albums.description') }}</label>
              <textarea v-model="editDesc" class="input textarea" :placeholder="t('albums.descriptionOptional')" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="editDialogVisible = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="handleEdit">{{ t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.album-detail-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  border: none;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
}

/* 相册头部卡片 */
.album-header-card {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
}

.album-cover {
  width: 200px;
  height: 140px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-tertiary);
}

.album-meta {
  flex: 1;
}

.album-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
}

.album-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-sm);
}

.album-stats {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin: 0 0 var(--spacing-base);
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-base);
}

.toolbar-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
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

/* 图片网格 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-base);
}

.grid-item {
  position: relative;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: var(--transition-base);
}

.grid-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.grid-item.selected {
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
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
}

.item-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-base);
}

.grid-item:hover .item-preview img {
  transform: scale(1.05);
}

.item-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-sm);
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  opacity: 0;
  transition: var(--transition-fast);
}

.grid-item:hover .item-overlay {
  opacity: 1;
}

.item-name {
  font-size: var(--text-xs);
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: var(--text-xs);
  opacity: 0.8;
  margin: 0;
}

.item-actions {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
}

.action-btn {
  padding: 4px;
  border: none;
  background: rgba(255,255,255,0.2);
  color: white;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.action-btn:hover {
  background: rgba(255,255,255,0.3);
}

.action-btn.danger:hover {
  background: var(--color-error);
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

/* 灯箱 */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.95);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-close {
  position: absolute;
  top: var(--spacing-base);
  right: var(--spacing-base);
  padding: var(--spacing-sm);
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  transition: var(--transition-fast);
}

.lightbox-close:hover {
  opacity: 1;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: var(--spacing-base);
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  transition: var(--transition-fast);
}

.lightbox-nav:hover:not(:disabled) {
  opacity: 1;
}

.lightbox-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.lightbox-nav.prev {
  left: var(--spacing-base);
}

.lightbox-nav.next {
  right: var(--spacing-base);
}

.lightbox-content {
  max-width: 90%;
  max-height: 80%;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.lightbox-info {
  position: absolute;
  bottom: var(--spacing-xl);
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: white;
}

.lightbox-name {
  font-size: var(--text-base);
  margin: 0 0 var(--spacing-xs);
}

.lightbox-meta {
  font-size: var(--text-sm);
  opacity: 0.7;
  margin: 0;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-text);
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 24px;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.modal-body {
  padding: var(--spacing-base);
}

.form-group {
  margin-bottom: var(--spacing-base);
}

.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .album-header-card {
    flex-direction: column;
  }

  .album-cover {
    width: 100%;
    height: 180px;
  }

  .image-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
