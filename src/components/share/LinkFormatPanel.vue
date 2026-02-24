<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getImageLinks } from '@/api/link'
import type { LinkFormats } from '@/types'
import { STORAGE_KEYS } from '@/config'

const { t } = useI18n()

const props = defineProps<{
  imageId: number
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const loading = ref(false)
const links = ref<LinkFormats | null>(null)
const copyStatus = ref<string>('')
const showSettings = ref(false)

// 链接格式配置
interface FormatConfig {
  key: keyof LinkFormats
  label: string
  enabled: boolean
}

const defaultFormats = computed<FormatConfig[]>(() => [
  { key: 'direct', label: t('linkFormat.directLink'), enabled: true },
  { key: 'markdown', label: t('linkFormat.markdown'), enabled: true },
  { key: 'html', label: t('linkFormat.html'), enabled: true },
  { key: 'bbcode', label: t('linkFormat.bbcode'), enabled: true },
  { key: 'short', label: t('linkFormat.shortLink'), enabled: true },
])

const formatConfigs = ref<FormatConfig[]>([])

// 加载用户自定义配置
function loadFormatSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LINK_FORMATS)
    if (saved) {
      const parsed = JSON.parse(saved) as { key: string; enabled: boolean }[]
      formatConfigs.value = defaultFormats.value.map(f => {
        const savedConfig = parsed.find(p => p.key === f.key)
        return { ...f, enabled: savedConfig?.enabled ?? f.enabled }
      })
    } else {
      formatConfigs.value = [...defaultFormats.value]
    }
  } catch {
    formatConfigs.value = [...defaultFormats.value]
  }
}

// 保存用户自定义配置
function saveFormatSettings() {
  const toSave = formatConfigs.value.map(f => ({ key: f.key, enabled: f.enabled }))
  localStorage.setItem(STORAGE_KEYS.LINK_FORMATS, JSON.stringify(toSave))
}

// 切换格式显示
function toggleFormat(key: keyof LinkFormats) {
  const config = formatConfigs.value.find(f => f.key === key)
  if (config) {
    // 至少保留一个格式
    const enabledCount = formatConfigs.value.filter(f => f.enabled).length
    if (config.enabled && enabledCount <= 1) return
    config.enabled = !config.enabled
    saveFormatSettings()
  }
}

// 重置为默认配置
function resetFormats() {
  formatConfigs.value = [...defaultFormats.value]
  saveFormatSettings()
}

// 获取启用的格式列表
const enabledFormats = computed(() => formatConfigs.value.filter(f => f.enabled))

const isVisible = computed(() => props.visible)

onMounted(loadFormatSettings)

watch(() => props.visible, async (visible) => {
  if (visible && props.imageId) {
    await loadLinks()
  }
})

async function loadLinks() {
  loading.value = true
  try {
    links.value = await getImageLinks(props.imageId)
  } catch (error) {
    console.error('Failed to load links:', error)
  } finally {
    loading.value = false
  }
}

async function copyToClipboard(text: string, type: string) {
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = type
    setTimeout(() => {
      copyStatus.value = ''
    }, 2000)
  } catch {
    // Fallback
    const input = document.createElement('input')
    input.value = text
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copyStatus.value = type
    setTimeout(() => {
      copyStatus.value = ''
    }, 2000)
  }
}

async function copyAll() {
  if (!links.value) return
  // 只复制启用的格式
  const allLinks = enabledFormats.value
    .map(f => `${f.label}：${links.value![f.key]}`)
    .join('\n')
  try {
    await navigator.clipboard.writeText(allLinks)
    copyStatus.value = 'all'
    setTimeout(() => {
      copyStatus.value = ''
    }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = allLinks
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copyStatus.value = 'all'
    setTimeout(() => {
      copyStatus.value = ''
    }, 2000)
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ t('gallery.copyLink') }}</h3>
          <div class="header-actions">
            <button
              class="settings-toggle"
              :class="{ active: showSettings }"
              @click="showSettings = !showSettings"
              :title="t('nav.settings')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <button class="modal-close" @click="close">&times;</button>
          </div>
        </div>
        <div class="modal-body">
          <!-- 设置面板 -->
          <div v-if="showSettings" class="settings-panel">
            <div class="settings-header">
              <span>{{ t('linkFormat.selectFormats') }}</span>
              <button class="reset-btn" @click="resetFormats">{{ t('linkFormat.reset') }}</button>
            </div>
            <div class="format-toggles">
              <label
                v-for="config in formatConfigs"
                :key="config.key"
                class="format-toggle"
                :class="{ disabled: config.enabled && enabledFormats.length <= 1 }"
              >
                <input
                  type="checkbox"
                  :checked="config.enabled"
                  @change="toggleFormat(config.key)"
                />
                <span>{{ config.label }}</span>
              </label>
            </div>
          </div>

          <div v-if="loading" class="loading">
            <div class="spinner"></div>
          </div>
          <div v-else-if="links" class="link-list">
            <!-- 动态渲染启用的格式 -->
            <div v-for="config in enabledFormats" :key="config.key" class="link-item">
              <div class="link-label">{{ config.label }}</div>
              <div class="link-input-wrap">
                <input type="text" :value="links[config.key]" readonly class="link-input" />
                <button
                  class="copy-btn"
                  :class="{ copied: copyStatus === config.key }"
                  @click="copyToClipboard(links[config.key], config.key)"
                >
                  {{ copyStatus === config.key ? t('common.copied') : t('common.copy') }}
                </button>
              </div>
            </div>

            <!-- 批量复制 -->
            <div class="link-item copy-all-item">
              <button
                class="copy-all-btn"
                :class="{ copied: copyStatus === 'all' }"
                @click="copyAll"
              >
                {{ copyStatus === 'all' ? t('linkFormat.copiedAll') : t('linkFormat.copyAll') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.settings-toggle {
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.settings-toggle:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.settings-toggle.active {
  background: var(--color-primary-light, rgba(59, 130, 246, 0.1));
  color: var(--color-primary);
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 24px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--color-text);
}

.modal-body {
  padding: var(--spacing-base);
  overflow-y: auto;
  max-height: calc(90vh - 60px);
}

/* 设置面板样式 */
.settings-panel {
  margin-bottom: var(--spacing-base);
  padding: var(--spacing-base);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.reset-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: var(--transition-fast);
}

.reset-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.format-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.format-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.format-toggle:hover {
  border-color: var(--color-primary);
}

.format-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.format-toggle input[type="checkbox"] {
  accent-color: var(--color-primary);
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.link-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.link-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.link-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.link-input-wrap {
  display: flex;
  gap: var(--spacing-xs);
}

.link-input {
  flex: 1;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-family: monospace;
  outline: none;
}

.link-input:focus {
  border-color: var(--color-primary);
}

.copy-btn {
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-primary);
  background: transparent;
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
  min-width: 60px;
}

.copy-btn:hover {
  background: var(--color-primary);
  color: white;
}

.copy-btn.copied {
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.copy-all-item {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-base);
  border-top: 1px solid var(--color-border);
}

.copy-all-btn {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.copy-all-btn:hover {
  opacity: 0.9;
}

.copy-all-btn.copied {
  background: var(--color-success);
  border-color: var(--color-success);
}
</style>
