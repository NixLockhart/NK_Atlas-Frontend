<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import {
  getImageList,
  searchImages,
  getImagesWithFilters,
  deleteImage,
  batchDeleteImages,
  renameImage,
  moveToAlbum,
  setImageVisibility,
  batchSetImageVisibility,
  getCategories
} from '@/api/image'
import { getAllAlbums } from '@/api/album'
import type { Image, ImageFilters, ImageCategory, Album } from '@/types'
import LinkFormatPanel from '@/components/share/LinkFormatPanel.vue'
import ShareDialog from '@/components/share/ShareDialog.vue'
import ImageSkeleton from '@/components/common/ImageSkeleton.vue'
import DropdownMenu, { type DropdownItem } from '@/components/common/DropdownMenu.vue'
import SelectDropdown, { type SelectOption } from '@/components/common/SelectDropdown.vue'
import { ICONS } from '@/constants/icons'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useHotkeys } from '@/composables/useHotkeys'
import { useUpload } from '@/composables/useUpload'
import { getImageDisplayUrl } from '@/utils/image'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()
const { register } = useHotkeys()
const { openUploadDialog } = useUpload()

// 状态
const images = ref<Image[]>([])
const albums = ref<Album[]>([])
const categories = ref<ImageCategory[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(24)

// 搜索和筛选
const searchKeyword = ref('')
const filters = ref<ImageFilters>({})
const showFilters = ref(false)

// 防抖搜索
const debouncedSearch = useDebounceFn(() => {
  page.value = 1
  loadImages()
}, 300)

// 监听搜索关键词和筛选条件变化
watch([searchKeyword, () => filters.value.album_id, () => filters.value.category_id, () => filters.value.mime_type, () => filters.value.order_by, () => filters.value.order_dir], () => {
  debouncedSearch()
})

// 批量选择
const selectedIds = ref<Set<number>>(new Set())
const selectMode = ref(false)

// 灯箱
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

// 重命名弹窗
const renameDialogVisible = ref(false)
const renameTarget = ref<Image | null>(null)
const newName = ref('')

// 移动到相册弹窗
const moveDialogVisible = ref(false)
const targetAlbumId = ref<number | undefined>(undefined)
const singleMoveImage = ref<Image | null>(null) // 单张图片移动

// 链接面板和分享弹窗
const linkPanelVisible = ref(false)
const sharePanelVisible = ref(false)
const selectedImageId = ref<number>(0)

// 布局模式
const layoutMode = ref<'grid' | 'waterfall'>('grid')

// 更多菜单
const activeMoreMenu = ref<number | null>(null)
const activeMoreImage = ref<Image | null>(null)

// 切换更多菜单
function toggleMoreMenu(img: Image, event: Event) {
  event.stopPropagation()
  if (activeMoreMenu.value === img.id) {
    activeMoreMenu.value = null
    activeMoreImage.value = null
  } else {
    activeMoreMenu.value = img.id
    activeMoreImage.value = img
  }
}

// 关闭更多菜单
function closeMoreMenu() {
  activeMoreMenu.value = null
  activeMoreImage.value = null
}

// 生成更多菜单项
function getMoreMenuItems(img: Image): DropdownItem[] {
  return [
    {
      key: 'share',
      label: t('gallery.share'),
      icon: ICONS.share
    },
    {
      key: 'visibility',
      label: img.is_public === 1 ? t('gallery.setPrivate') : t('gallery.setPublic'),
      icon: img.is_public === 1 ? ICONS.lock : ICONS.globe
    },
    {
      key: 'move',
      label: t('gallery.moveToAlbum'),
      icon: ICONS.folder
    }
  ]
}

// 处理更多菜单选择
function handleMoreMenuSelect(key: string) {
  if (!activeMoreImage.value) return
  const img = activeMoreImage.value

  switch (key) {
    case 'share':
      openShareDialog(img)
      break
    case 'visibility':
      handleSetVisibility(img)
      break
    case 'move':
      openSingleMoveDialog(img)
      break
  }
  closeMoreMenu()
}

// 计算属性
const selectedCount = computed(() => selectedIds.value.size)
const allSelected = computed(() => images.value.length > 0 && images.value.every(img => selectedIds.value.has(img.id)))
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const currentImage = computed(() => images.value[lightboxIndex.value])

// 筛选选项
const albumOptions = computed<SelectOption[]>(() => [
  { value: undefined, label: t('common.all') },
  ...albums.value.map(album => ({ value: album.id, label: album.name }))
])

const categoryOptions = computed<SelectOption[]>(() => [
  { value: undefined, label: t('common.all') },
  ...categories.value.map(cat => ({ value: cat.id, label: cat.name }))
])

// 移动到相册选项
const moveAlbumOptions = computed<SelectOption[]>(() => [
  { value: undefined, label: t('gallery.noAlbum') },
  ...albums.value.map(album => ({ value: album.id, label: album.name }))
])

const mimeTypeOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('common.all') },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/gif', label: 'GIF' },
  { value: 'image/webp', label: 'WebP' }
])

const orderByOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('gallery.sortDefault') },
  { value: 'created_at', label: t('gallery.sortDate') },
  { value: 'size', label: t('gallery.sortSize') },
  { value: 'name', label: t('gallery.sortName') }
])

const orderDirOptions = computed<SelectOption[]>(() => [
  { value: 'DESC', label: t('gallery.sortDesc') },
  { value: 'ASC', label: t('gallery.sortAsc') }
])

// 加载图片列表
async function loadImages() {
  loading.value = true
  try {
    let response
    if (searchKeyword.value) {
      response = await searchImages(searchKeyword.value, page.value, pageSize.value)
    } else if (Object.keys(filters.value).some(k => filters.value[k as keyof ImageFilters])) {
      response = await getImagesWithFilters(filters.value, page.value, pageSize.value)
    } else {
      response = await getImageList(page.value, pageSize.value)
    }
    images.value = response.list || []
    total.value = response.total
  } catch (error) {
    console.error('Failed to load images:', error)
  } finally {
    loading.value = false
  }
}

// 加载相册列表
async function loadAlbums() {
  try {
    albums.value = await getAllAlbums()
  } catch (error) {
    console.error('Failed to load albums:', error)
  }
}

// 加载分类列表
async function loadCategories() {
  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

// 搜索
function handleSearch() {
  page.value = 1
  loadImages()
}

// 清除筛选
function clearFilters() {
  filters.value = {}
  searchKeyword.value = ''
  page.value = 1
  // loadImages() is triggered by the watch on searchKeyword/filters via debouncedSearch
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
  } catch (error) {
    console.error('Failed to delete image:', error)
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
  } catch (error) {
    console.error('Failed to batch delete:', error)
    toast.error(t('gallery.deleteFailed'))
  }
}

// 重命名
function openRenameDialog(img: Image) {
  renameTarget.value = img
  newName.value = img.original_name
  renameDialogVisible.value = true
}

async function handleRename() {
  if (!renameTarget.value || !newName.value.trim()) return
  try {
    await renameImage(renameTarget.value.id, newName.value.trim())
    toast.success(t('gallery.renameSuccess'))
    renameDialogVisible.value = false
    loadImages()
  } catch (error) {
    console.error('Failed to rename:', error)
    toast.error(t('gallery.renameFailed'))
  }
}

// 移动到相册
function openMoveDialog() {
  if (selectedCount.value === 0) return
  singleMoveImage.value = null
  targetAlbumId.value = undefined
  moveDialogVisible.value = true
}

// 单张图片移动到相册
function openSingleMoveDialog(img: Image) {
  singleMoveImage.value = img
  targetAlbumId.value = img.album_id || undefined
  moveDialogVisible.value = true
}

async function handleMove() {
  try {
    if (singleMoveImage.value) {
      // 单张图片移动
      await moveToAlbum([singleMoveImage.value.id], targetAlbumId.value || undefined)
    } else {
      // 批量移动
      if (selectedCount.value === 0) return
      await moveToAlbum(Array.from(selectedIds.value), targetAlbumId.value || undefined)
      clearSelection()
    }
    toast.success(t('gallery.moveSuccess'))
    moveDialogVisible.value = false
    singleMoveImage.value = null
    loadImages()
  } catch (error) {
    console.error('Failed to move:', error)
    toast.error(t('gallery.moveFailed'))
  }
}

// 批量设置可见性
async function handleBatchSetVisibility(isPublic: number) {
  if (selectedCount.value === 0) return
  const count = selectedCount.value
  const action = isPublic === 1 ? t('gallery.setPublic') : t('gallery.setPrivate')
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('gallery.batchSetVisibilityConfirm', { count, action }),
    type: 'warning'
  })
  if (!confirmed) return
  try {
    await batchSetImageVisibility(Array.from(selectedIds.value), isPublic)
    toast.success(t('gallery.batchSetVisibilitySuccess', { count, action }))
    clearSelection()
    loadImages()
  } catch (error) {
    console.error('Failed to set visibility:', error)
    toast.error(t('common.error'))
  }
}

// 单张图片设置可见性
async function handleSetVisibility(img: Image) {
  const newVisibility = img.is_public === 1 ? 0 : 1
  const action = newVisibility === 1 ? t('gallery.setPublic') : t('gallery.setPrivate')
  closeMoreMenu()
  try {
    await setImageVisibility(img.id, newVisibility)
    // 更新本地状态
    img.is_public = newVisibility
    toast.success(t('gallery.visibilityChanged', { action }))
  } catch (error) {
    console.error('Failed to set visibility:', error)
    toast.error(t('common.error'))
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
  if (lightboxIndex.value > 0) {
    lightboxIndex.value--
  }
}

function lightboxNext() {
  if (lightboxIndex.value < images.value.length - 1) {
    lightboxIndex.value++
  }
}

function handleLightboxKeydown(e: KeyboardEvent) {
  if (!lightboxVisible.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') lightboxPrev()
  if (e.key === 'ArrowRight') lightboxNext()
}

// 复制链接
// copyUrl reserved for future use
// async function copyUrl(url: string) {
//   await navigator.clipboard.writeText(url)
//   toast.success(t('common.copied'))
// }

// 打开链接面板
function openLinkPanel(img: Image) {
  selectedImageId.value = img.id
  linkPanelVisible.value = true
}

// 打开分享弹窗
function openShareDialog(img: Image) {
  closeMoreMenu()
  selectedImageId.value = img.id
  sharePanelVisible.value = true
}

// 分享创建成功
function handleShareCreated(shareUrl: string) {
  console.log('Share created:', shareUrl)
}

// 上传成功回调（监听全局事件）
function handleGlobalUploadSuccess() {
  loadImages()
}

// 格式化
function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 监听键盘事件
onMounted(() => {
  loadImages()
  loadAlbums()
  loadCategories()
  document.addEventListener('keydown', handleLightboxKeydown)
  document.addEventListener('click', closeMoreMenu)

  // 监听全局上传成功事件
  window.addEventListener('image-uploaded', handleGlobalUploadSuccess)

  // 注册页面快捷键
  // Ctrl+A: 全选图片
  const unregisterSelectAll = register({
    key: 'a',
    ctrl: true,
    description: t('hotkeys.selectAll'),
    category: t('hotkeys.gallery'),
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
    category: t('hotkeys.gallery'),
    handler: () => {
      if (selectedCount.value > 0) {
        handleBatchDelete()
      }
    }
  })

  // 在组件卸载时注销快捷键
  onUnmounted(() => {
    unregisterSelectAll()
    unregisterDelete()
    window.removeEventListener('image-uploaded', handleGlobalUploadSuccess)
  })
})

watch(lightboxVisible, (visible) => {
  if (!visible) {
    document.removeEventListener('keydown', handleLightboxKeydown)
  }
})
</script>

<template>
  <div class="gallery-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ t('gallery.title') }}</h1>
        <span class="total-badge">{{ t('gallery.total', { count: total }) }}</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="openUploadDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {{ t('common.upload') }}
        </button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            :placeholder="t('gallery.searchPlaceholder')"
            @keyup.enter="handleSearch"
          />
        </div>
        <button class="btn btn-ghost" @click="showFilters = !showFilters">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          {{ t('gallery.filter') }}
        </button>
      </div>
      <div class="toolbar-right">
        <div class="layout-toggle">
          <button :class="{ active: layoutMode === 'grid' }" @click="layoutMode = 'grid'" :title="t('gallery.gridView')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button :class="{ active: layoutMode === 'waterfall' }" @click="layoutMode = 'waterfall'" :title="t('gallery.waterfallView')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <rect x="3" y="3" width="7" height="9"/>
              <rect x="14" y="3" width="7" height="5"/>
              <rect x="3" y="15" width="7" height="6"/>
              <rect x="14" y="11" width="7" height="10"/>
            </svg>
          </button>
        </div>
        <button class="btn" :class="selectMode ? 'btn-primary' : 'btn-ghost'" @click="selectMode = !selectMode">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          {{ selectMode ? t('gallery.exitSelect') : t('gallery.batchSelect') }}
        </button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilters" class="filter-panel">
      <div class="filter-row">
        <div class="filter-item">
          <label>{{ t('albums.title') }}</label>
          <SelectDropdown
            v-model="filters.album_id"
            :options="albumOptions"
            :placeholder="t('common.all')"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('gallery.category') }}</label>
          <SelectDropdown
            v-model="filters.category_id"
            :options="categoryOptions"
            :placeholder="t('common.all')"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('gallery.filterType') }}</label>
          <SelectDropdown
            v-model="filters.mime_type"
            :options="mimeTypeOptions"
            :placeholder="t('common.all')"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('gallery.sort') }}</label>
          <SelectDropdown
            v-model="filters.order_by"
            :options="orderByOptions"
            :placeholder="t('gallery.sortDefault')"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('gallery.sortOrder') }}</label>
          <SelectDropdown
            v-model="filters.order_dir"
            :options="orderDirOptions"
            width="120px"
          />
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn btn-ghost" @click="clearFilters">{{ t('gallery.clearFilter') }}</button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectMode && selectedCount > 0" class="batch-bar">
      <div class="batch-info">
        <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
        <span>{{ t('gallery.selectedCount', { count: selectedCount }) }}</span>
      </div>
      <div class="batch-actions">
        <button class="btn btn-ghost" @click="openMoveDialog">{{ t('gallery.moveToAlbum') }}</button>
        <button class="btn btn-ghost" @click="handleBatchSetVisibility(1)">{{ t('gallery.setPublic') }}</button>
        <button class="btn btn-ghost" @click="handleBatchSetVisibility(0)">{{ t('gallery.setPrivate') }}</button>
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
      <p>{{ t('gallery.noImages') }}</p>
      <button class="btn btn-primary" @click="openUploadDialog">{{ t('gallery.uploadFirst') }}</button>
    </div>

    <div v-else :class="['image-gallery', layoutMode]">
      <div
        v-for="(img, index) in images"
        :key="img.id"
        class="gallery-item"
        :class="{ selected: selectedIds.has(img.id) }"
      >
        <!-- 左上角：选择框或私有标记 -->
        <div class="item-checkbox" v-if="selectMode" @click.stop="toggleSelect(img.id)">
          <input type="checkbox" :checked="selectedIds.has(img.id)" />
        </div>
        <div class="item-visibility" v-else-if="img.is_public === 0" :title="t('gallery.privateImage')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <!-- 右上角：更多菜单 -->
        <div class="item-more">
          <button class="more-btn" @click="toggleMoreMenu(img, $event)" :title="t('gallery.moreActions')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
          <DropdownMenu
            :visible="activeMoreMenu === img.id"
            :items="getMoreMenuItems(img)"
            @update:visible="(v) => !v && closeMoreMenu()"
            @select="handleMoreMenuSelect"
          />
        </div>
        <div class="item-preview" @click="selectMode ? toggleSelect(img.id) : openLightbox(index)">
          <img :src="getImageDisplayUrl(img, true)" :alt="img.name" loading="lazy" />
        </div>
        <div class="item-overlay">
          <div class="item-info">
            <p class="item-name" :title="img.original_name">{{ img.original_name }}</p>
            <p class="item-meta">{{ formatSize(img.size) }} · {{ formatDate(img.created_at) }}</p>
          </div>
          <div class="item-actions">
            <button class="action-btn" @click.stop="openLinkPanel(img)" :title="t('gallery.copyLink')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="action-btn" @click.stop="openRenameDialog(img)" :title="t('gallery.rename')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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
      <button class="page-btn" :disabled="page === 1" @click="goToPage(page - 1)">{{ t('common.prev') }}</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="page === totalPages" @click="goToPage(page + 1)">{{ t('common.next') }}</button>
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
          <img v-if="currentImage" :src="getImageDisplayUrl(currentImage, false)" :alt="currentImage.name" />
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

    <!-- 重命名弹窗 -->
    <Teleport to="body">
      <div v-if="renameDialogVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('gallery.renameTitle') }}</h3>
            <button class="modal-close" @click="renameDialogVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <input v-model="newName" type="text" class="input" :placeholder="t('gallery.newName')" @keyup.enter="handleRename" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="renameDialogVisible = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="handleRename">{{ t('common.confirm') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 移动到相册弹窗 -->
    <Teleport to="body">
      <div v-if="moveDialogVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('gallery.moveToAlbum') }}</h3>
            <button class="modal-close" @click="moveDialogVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <SelectDropdown v-model="targetAlbumId" :options="moveAlbumOptions" width="100%" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="moveDialogVisible = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="handleMove">{{ t('common.confirm') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 链接格式面板 -->
    <LinkFormatPanel
      :image-id="selectedImageId"
      :visible="linkPanelVisible"
      @close="linkPanelVisible = false"
    />

    <!-- 分享创建弹窗 -->
    <ShareDialog
      :image-id="selectedImageId"
      :visible="sharePanelVisible"
      @close="sharePanelVisible = false"
      @created="handleShareCreated"
    />
  </div>
</template>

<style scoped>
.gallery-page {
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

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-base);
  flex-wrap: wrap;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  min-width: 250px;
}

.search-box svg {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-sm);
  outline: none;
}

.search-box input::placeholder {
  color: var(--color-text-tertiary);
}

.layout-toggle {
  display: flex;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 2px;
}

.layout-toggle button {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.layout-toggle button.active {
  background: var(--color-bg-elevated);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* 筛选面板 */
.filter-panel {
  padding: var(--spacing-base);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-base);
}

.filter-row {
  display: flex;
  gap: var(--spacing-base);
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 150px;
}

.filter-item label {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-base);
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

/* 图片画廊 */
.image-gallery {
  display: grid;
  gap: var(--spacing-base);
}

.image-gallery.grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.image-gallery.waterfall {
  display: block;
  column-count: 5;
  column-gap: var(--spacing-base);
}

.waterfall .gallery-item {
  break-inside: avoid;
  margin-bottom: var(--spacing-base);
}

.gallery-item {
  position: relative;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: var(--transition-base);
}

.gallery-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.gallery-item.selected {
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

.item-visibility {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  z-index: 10;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-more {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  z-index: 10;
}

.more-btn {
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition-fast);
}

.gallery-item:hover .more-btn {
  opacity: 1;
}

.more-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.item-preview {
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
}

.waterfall .item-preview {
  aspect-ratio: auto;
}

.item-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-base);
}

.gallery-item:hover .item-preview img {
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

.gallery-item:hover .item-overlay {
  opacity: 1;
}

.item-name {
  font-size: var(--text-sm);
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
  padding: var(--spacing-xs);
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

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-secondary);
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
  max-width: 400px;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left, .toolbar-right {
    justify-content: space-between;
  }

  .search-box {
    flex: 1;
    min-width: auto;
  }

  .filter-row {
    flex-direction: column;
  }

  .image-gallery.grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .image-gallery.waterfall {
    column-count: 2;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .image-gallery.waterfall {
    column-count: 3;
  }
}

@media (min-width: 1025px) and (max-width: 1400px) {
  .image-gallery.waterfall {
    column-count: 4;
  }
}
</style>
