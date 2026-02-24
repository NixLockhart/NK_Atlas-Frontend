<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from './components/layout/MainLayout.vue'
import ToastContainer from './components/common/ToastContainer.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import HotkeysPanel from './components/common/HotkeysPanel.vue'
import ImageUploader from './components/upload/ImageUploader.vue'
import SelectDropdown, { type SelectOption } from './components/common/SelectDropdown.vue'
import { getCategories, getUploadLimit } from '@/api/image'
import type { ImageCategory } from '@/types'
import { useUserStore } from '@/stores/user'
import { useSiteStore } from '@/stores/site'
import { useHotkeys } from '@/composables/useHotkeys'
import { useUpload } from '@/composables/useUpload'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const siteStore = useSiteStore()
const toast = useToast()
const { register, toggleHotkeysPanel, hideHotkeysPanel, hotkeysPanelVisible } = useHotkeys()
const { uploadDialogVisible, openUploadDialog, closeUploadDialog } = useUpload()

// 分类选择
const categories = ref<ImageCategory[]>([])
const selectedCategory = ref<string>('general')

// 上传限额
const uploadLimit = ref<{ daily_limit: number; used_today: number; remaining: number } | null>(null)

const categoryOptions = computed<SelectOption[]>(() => [
  ...categories.value.map(cat => ({ value: cat.code, label: cat.name }))
])

// 加载分类列表
async function loadCategories() {
  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

// 加载上传限额
async function loadUploadLimit() {
  try {
    uploadLimit.value = await getUploadLimit()
  } catch (error) {
    console.error('Failed to load upload limit:', error)
    uploadLimit.value = null
  }
}

// 当上传对话框打开时加载分类和限额
watch(uploadDialogVisible, (visible) => {
  if (visible) {
    if (categories.value.length === 0) {
      loadCategories()
    }
    loadUploadLimit()
  }
})

onMounted(() => {
  // 获取站点配置（设置页面标题等）
  siteStore.fetchSiteConfig()

  if (userStore.isLoggedIn()) {
    userStore.fetchUserInfo()
  }

  // 注册全局快捷键
  // Ctrl+U: 打开上传对话框
  register({
    key: 'u',
    ctrl: true,
    description: t('hotkeys.openUpload'),
    category: t('hotkeys.globalShortcuts'),
    handler: () => {
      if (userStore.isLoggedIn()) {
        openUploadDialog()
      } else {
        router.push('/login')
      }
    }
  })

  // ?: 显示/隐藏快捷键面板
  register({
    key: '?',
    description: t('hotkeys.showHotkeys'),
    category: t('hotkeys.globalShortcuts'),
    handler: () => {
      toggleHotkeysPanel()
    }
  })

  // Escape: 关闭弹窗
  register({
    key: 'Escape',
    description: t('hotkeys.closeDialog'),
    category: t('hotkeys.globalShortcuts'),
    handler: () => {
      if (hotkeysPanelVisible.value) {
        hideHotkeysPanel()
      } else if (uploadDialogVisible.value) {
        closeUploadDialog()
      }
    }
  })
})

// 上传成功后刷新页面（如果在图片库页面）
function handleUploadSuccess() {
  // 触发自定义事件，让图片库页面监听
  window.dispatchEvent(new CustomEvent('image-uploaded'))
  // 刷新剩余次数
  loadUploadLimit()
}

// 上传错误处理
function handleUploadError(error: string) {
  toast.error(error)
}
</script>

<template>
  <MainLayout>
    <RouterView />
  </MainLayout>
  <ToastContainer />
  <ConfirmDialog />
  <HotkeysPanel />

  <!-- 全局上传对话框 -->
  <Teleport to="body">
    <div v-if="uploadDialogVisible" class="modal-overlay" @click.self="closeUploadDialog">
      <div class="modal upload-modal">
        <div class="modal-header">
          <h3>{{ t('upload.title') }}</h3>
          <button class="modal-close" @click="closeUploadDialog">&times;</button>
        </div>
        <div class="modal-body">
          <div class="upload-options">
            <div class="upload-option">
              <label>{{ t('gallery.category') }}</label>
              <SelectDropdown
                v-model="selectedCategory"
                :options="categoryOptions"
                width="200px"
              />
            </div>
          </div>
          <div v-if="uploadLimit && uploadLimit.daily_limit > 0" class="upload-limit-info" :class="{ 'limit-reached': uploadLimit.remaining === 0 }">
            <template v-if="uploadLimit.remaining > 0">
              {{ t('upload.dailyRemaining', { remaining: uploadLimit.remaining, limit: uploadLimit.daily_limit }) }}
            </template>
            <template v-else>
              {{ t('upload.dailyLimitReached') }}
            </template>
          </div>
          <ImageUploader :category="selectedCategory" multiple @success="handleUploadSuccess" @error="handleUploadError" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* 全局上传弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9000;
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

.upload-modal {
  max-width: 600px;
}

.upload-options {
  margin-bottom: var(--spacing-base);
}

.upload-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.upload-option label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.upload-limit-info {
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.upload-limit-info.limit-reached {
  color: var(--color-danger);
  background: var(--color-danger-bg, rgba(239, 68, 68, 0.1));
}
</style>
