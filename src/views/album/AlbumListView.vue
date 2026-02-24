<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getAlbumList,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  updateAlbumSort,
  recalculateAlbumCounts
} from '@/api/album'
import type { Album, CreateAlbumData, SortItem } from '@/types'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import AlbumSkeleton from '@/components/common/AlbumSkeleton.vue'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()
const router = useRouter()

// 状态
const albums = ref<Album[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

// 创建/编辑弹窗
const dialogVisible = ref(false)
const editMode = ref(false)
const editTarget = ref<Album | null>(null)
const formData = ref<CreateAlbumData>({ name: '', description: '' })
const formError = ref('')

// 拖拽排序
const dragIndex = ref<number | null>(null)

// 重新计算状态
const recalculating = ref(false)

// 加载相册列表
async function loadAlbums() {
  loading.value = true
  try {
    const response = await getAlbumList(page.value, pageSize.value)
    albums.value = response.list || []
    total.value = response.total
  } catch (error) {
    console.error('Failed to load albums:', error)
  } finally {
    loading.value = false
  }
}

// 打开创建弹窗
function openCreateDialog() {
  editMode.value = false
  editTarget.value = null
  formData.value = { name: '', description: '' }
  formError.value = ''
  dialogVisible.value = true
}

// 打开编辑弹窗
function openEditDialog(album: Album) {
  editMode.value = true
  editTarget.value = album
  formData.value = { name: album.name, description: album.description }
  formError.value = ''
  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  if (!formData.value.name.trim()) {
    formError.value = t('albums.enterName')
    return
  }

  try {
    if (editMode.value && editTarget.value) {
      await updateAlbum(editTarget.value.id, formData.value)
      toast.success(t('albums.updateSuccess'))
    } else {
      await createAlbum(formData.value)
      toast.success(t('albums.createSuccess'))
    }
    dialogVisible.value = false
    loadAlbums()
  } catch (error: any) {
    formError.value = error?.message || t('common.operationFailed')
  }
}

// 删除相册
async function handleDelete(album: Album) {
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('albums.deleteConfirm', { name: album.name }),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    await deleteAlbum(album.id)
    toast.success(t('albums.deleteSuccess'))
    loadAlbums()
  } catch (error: any) {
    toast.error(error?.message || t('albums.deleteFailed'))
  }
}

// 进入相册详情
function goToDetail(album: Album) {
  router.push(`/albums/${album.id}`)
}

// 重新计算相册图片数量
async function handleRecalculate() {
  recalculating.value = true
  try {
    await recalculateAlbumCounts()
    toast.success(t('albums.recalculateSuccess'))
    loadAlbums()
  } catch (error) {
    toast.error(t('albums.recalculateFailed'))
  } finally {
    recalculating.value = false
  }
}

// 拖拽排序
function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  if (dragIndex.value === null || dragIndex.value === index) return
  const items = [...albums.value]
  const dragged = items.splice(dragIndex.value, 1)[0]
  items.splice(index, 0, dragged)
  albums.value = items
  dragIndex.value = index
}

async function onDragEnd() {
  if (dragIndex.value === null) return
  dragIndex.value = null

  // 保存新的排序
  const sortItems: SortItem[] = albums.value.map((album, index) => ({
    id: album.id,
    sort: index
  }))

  try {
    await updateAlbumSort(sortItems)
  } catch (error) {
    console.error('Failed to update sort:', error)
    loadAlbums() // 排序失败则重新加载
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadAlbums()
})
</script>

<template>
  <div class="album-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ t('albums.myAlbums') }}</h1>
        <span class="total-badge">{{ total }} {{ t('common.unit.album') }}</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" @click="handleRecalculate" :disabled="recalculating" :title="t('albums.recalculateCounts')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" :class="{ spinning: recalculating }">
            <path d="M23 4v6h-6"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <button class="btn btn-primary" @click="openCreateDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ t('albums.create') }}
        </button>
      </div>
    </div>

    <AlbumSkeleton v-if="loading" :count="pageSize" />

    <div v-else-if="albums.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <p>{{ t('albums.noAlbums') }}</p>
      <button class="btn btn-primary" @click="openCreateDialog">{{ t('albums.create') }}</button>
    </div>

    <div v-else class="album-grid">
      <div
        v-for="(album, index) in albums"
        :key="album.id"
        class="album-card"
        draggable="true"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver($event, index)"
        @dragend="onDragEnd"
        @click="goToDetail(album)"
      >
        <div class="album-cover">
          <img v-if="album.cover_url" :src="album.cover_url" :alt="album.name" />
          <div v-else class="cover-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div class="album-count">{{ t('albums.imageCount', { count: album.image_count }) }}</div>
        </div>
        <div class="album-info">
          <h3 class="album-name">{{ album.name }}</h3>
          <p class="album-desc" v-if="album.description">{{ album.description }}</p>
          <p class="album-date">{{ formatDate(album.created_at) }}</p>
        </div>
        <div class="album-actions" @click.stop>
          <button class="action-btn" @click="openEditDialog(album)" :title="t('common.edit')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn danger" @click="handleDelete(album)" :title="t('common.delete')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <Teleport to="body">
      <div v-if="dialogVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editMode ? t('albums.edit') : t('albums.create') }}</h3>
            <button class="modal-close" @click="dialogVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ t('common.name') }}</label>
              <input v-model="formData.name" type="text" class="input" :placeholder="t('albums.enterName')" @keyup.enter="handleSubmit" />
            </div>
            <div class="form-group">
              <label>{{ t('common.description') }}</label>
              <textarea v-model="formData.description" class="input textarea" :placeholder="t('share.optional')" rows="3"></textarea>
            </div>
            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="dialogVisible = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="handleSubmit">{{ editMode ? t('common.save') : t('common.create') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.album-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
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

.page-header .btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.spinning {
  animation: spin 1s linear infinite;
}

/* 相册网格 */
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-lg);
}

.album-card {
  position: relative;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-base);
}

.album-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.album-cover {
  position: relative;
  aspect-ratio: 16 / 10;
  background: var(--color-bg-secondary);
  overflow: hidden;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-base);
}

.album-card:hover .album-cover img {
  transform: scale(1.05);
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-tertiary);
}

.album-count {
  position: absolute;
  bottom: var(--spacing-sm);
  right: var(--spacing-sm);
  padding: 2px var(--spacing-sm);
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: var(--text-xs);
  border-radius: var(--radius-full);
}

.album-info {
  padding: var(--spacing-base);
}

.album-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
}

.album-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.album-date {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0;
}

.album-actions {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: var(--transition-fast);
}

.album-card:hover .album-actions {
  opacity: 1;
}

.action-btn {
  padding: var(--spacing-xs);
  border: none;
  background: rgba(0,0,0,0.5);
  color: white;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.action-btn:hover {
  background: rgba(0,0,0,0.7);
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

.form-error {
  color: var(--color-error);
  font-size: var(--text-sm);
  margin: var(--spacing-sm) 0 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 640px) {
  .album-grid {
    grid-template-columns: 1fr;
  }
}
</style>
