<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { uploadImage } from '@/api/image'
import type { Image, UploadOptions } from '@/types'
import { useSiteStore } from '@/stores/site'

const { t } = useI18n()

let previewId = 0

interface PreviewFile {
  id: number
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  result?: Image
}

const props = defineProps<{
  category?: string
  multiple?: boolean
  accept?: string
  maxSize?: number
}>()

const emit = defineEmits<{
  (e: 'success', image: Image): void
  (e: 'error', error: string): void
}>()

const siteStore = useSiteStore()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
const previewFiles = ref<PreviewFile[]>([])

// 使用 props.accept 或站点配置的允许类型
const acceptTypes = computed(() => props.accept || siteStore.getAllowedTypesAccept())
// 使用 props.maxSize 或站点配置的 maxUploadSize
const maxFileSize = computed(() => props.maxSize || siteStore.maxUploadSize)
const maxFileSizeMB = computed(() => Math.round(maxFileSize.value / 1024 / 1024))
// isUploading computed for potential future use
// const isUploading = computed(() => previewFiles.value.some(f => f.status === 'uploading'))

onMounted(() => {
  siteStore.fetchSiteConfig()
})

onUnmounted(() => {
  previewFiles.value.forEach(f => {
    if (f.preview) URL.revokeObjectURL(f.preview)
  })
})

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

function getCompressionInfo(item: PreviewFile): string | null {
  if (!item.result || !item.result.original_size || item.result.original_size <= item.result.size) return null
  const saved = Math.round((1 - item.result.size / item.result.original_size) * 100)
  return `${formatFileSize(item.result.original_size)} → ${formatFileSize(item.result.size)}, -${saved}%`
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    handleFiles(Array.from(files))
  }
}

function handleClick() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    handleFiles(Array.from(target.files))
    target.value = ''
  }
}

function runConcurrent(tasks: (() => Promise<void>)[], limit: number): Promise<void> {
  let idx = 0
  const next = async (): Promise<void> => {
    if (idx < tasks.length) {
      const t = tasks[idx++]
      await t()
      await next()
    }
  }
  return Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => next())).then(() => {})
}

async function handleFiles(files: File[]) {
  const allowedTypesList = siteStore.allowedTypes
  const validIndices: number[] = []

  for (const file of files) {
    if (file.size > maxFileSize.value) {
      emit('error', t('upload.fileTooLarge', { name: file.name }))
      continue
    }

    // 检查文件类型是否在允许列表中
    if (!allowedTypesList.includes(file.type)) {
      emit('error', t('upload.invalidFormat', { name: file.name }))
      continue
    }

    // 创建预览
    const previewFile: PreviewFile = {
      id: ++previewId,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }
    previewFiles.value.push(previewFile)
    validIndices.push(previewFiles.value.length - 1)
  }

  // 并发上传，限制并发数 3
  const tasks = validIndices.map(index => () => uploadFile(index))
  await runConcurrent(tasks, 3)
}

async function uploadFile(index: number) {
  previewFiles.value[index].status = 'uploading'
  previewFiles.value[index].progress = 0

  try {
    const options: UploadOptions = {}
    if (props.category) options.category = props.category

    const res = await uploadImage(previewFiles.value[index].file, options, (percent) => {
      previewFiles.value[index].progress = percent
    })
    previewFiles.value[index].status = 'success'
    previewFiles.value[index].result = res
    emit('success', res)
  } catch (err) {
    previewFiles.value[index].status = 'error'
    const message = err instanceof Error ? err.message : t('upload.failed')
    previewFiles.value[index].error = message
    emit('error', message)
  }
}

function removePreview(index: number) {
  const file = previewFiles.value[index]
  if (file.preview) {
    URL.revokeObjectURL(file.preview)
  }
  previewFiles.value.splice(index, 1)
}

function clearCompleted() {
  const kept: PreviewFile[] = []
  for (const f of previewFiles.value) {
    if (f.status === 'uploading' || f.status === 'pending') {
      kept.push(f)
    } else if (f.preview) {
      URL.revokeObjectURL(f.preview)
    }
  }
  previewFiles.value = kept
}

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) handleFiles([file])
    }
  }
}
</script>

<template>
  <div class="uploader-wrapper">
    <div
      class="uploader"
      :class="{ dragging: isDragging }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="handleClick"
      @paste="handlePaste"
      tabindex="0"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="acceptTypes"
        :multiple="multiple"
        @change="handleFileChange"
        hidden
      />

      <div class="upload-hint">
        <div class="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p class="upload-text">{{ t('upload.dragHint') }}</p>
        <p class="upload-sub">{{ t('upload.pasteHint') }}，{{ t('upload.maxSize', { size: maxFileSizeMB }) }}</p>
      </div>
    </div>

    <!-- 预览列表 -->
    <div v-if="previewFiles.length" class="preview-list">
      <div class="preview-header">
        <span class="preview-title">{{ t('upload.queue') }} ({{ previewFiles.length }})</span>
        <button v-if="previewFiles.some(f => f.status !== 'uploading')" @click="clearCompleted" class="btn-clear">
          {{ t('upload.clearCompleted') }}
        </button>
      </div>
      <div v-for="(item, index) in previewFiles" :key="item.id" class="preview-item">
        <img :src="item.preview" :alt="item.file.name" class="preview-thumb" />
        <div class="preview-info">
          <div class="preview-name">{{ item.file.name }}</div>
          <div v-if="item.status === 'uploading'" class="progress-bar">
            <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
          </div>
          <div v-else-if="item.status === 'success'" class="status-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {{ t('upload.success') }}
            <span v-if="getCompressionInfo(item)" class="compression-info">({{ getCompressionInfo(item) }})</span>
          </div>
          <div v-else-if="item.status === 'error'" class="status-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 8v5"/>
              <path d="M12 16v.01"/>
            </svg>
            {{ item.error }}
          </div>
        </div>
        <button @click="removePreview(index)" class="btn-remove" :disabled="item.status === 'uploading'" :title="t('common.delete')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.uploader-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.uploader {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl) var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: var(--transition-base);
  background: var(--color-bg-secondary);
}

.uploader:hover,
.uploader.dragging {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
}

.uploader:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-base);
  color: var(--color-text-tertiary);
  transition: var(--transition-base);
}

.uploader:hover .upload-icon,
.uploader.dragging .upload-icon {
  color: var(--color-primary);
  transform: translateY(-4px);
}

.upload-icon svg {
  width: 100%;
  height: 100%;
}

.upload-text {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.upload-sub {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.preview-list {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.preview-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.btn-clear {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-clear:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.preview-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  border-bottom: 1px solid var(--color-border-light);
  transition: var(--transition-fast);
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-item:hover {
  background: var(--color-bg-hover);
}

.preview-thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: var(--radius-base);
  flex-shrink: 0;
  border: 1px solid var(--color-border-light);
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--spacing-xs);
}

.progress-bar {
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width 0.2s ease;
  border-radius: 3px;
}

.status-success,
.status-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--text-xs);
}

.status-success {
  color: var(--color-success);
}

.compression-info {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.status-error {
  color: var(--color-error);
}

.status-success svg,
.status-error svg {
  width: 14px;
  height: 14px;
}

.btn-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-base);
  color: var(--color-text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
  transition: var(--transition-fast);
}

.btn-remove svg {
  width: 16px;
  height: 16px;
}

.btn-remove:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.btn-remove:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
