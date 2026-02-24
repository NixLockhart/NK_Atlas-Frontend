<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSiteStore } from '@/stores/site'
import { useWatermark } from '@/composables/useWatermark'
import { useToast } from '@/composables/useToast'
import { getUploadSettings, updateUploadSettings } from '@/api/settings'
import type { UploadSettings } from '@/types'
import WatermarkConfig from '@/components/upload/WatermarkConfig.vue'

const { t } = useI18n()
const siteStore = useSiteStore()
const toast = useToast()

// Watermark
const { watermarkConfig, watermarkStatus, loading: watermarkLoading, loadSettings, loadStatus, saveSettings } = useWatermark()
const watermarkSaving = ref(false)

// Upload settings
const uploadSettings = ref<UploadSettings>({
  compressionQuality: 85,
  keepOriginalFormat: false
})
const uploadLoading = ref(false)
const uploadSaving = ref(false)

const allowedTypes = computed(() => siteStore.allowedTypes || [])
const allowedTypesDisplay = computed(() => {
  return allowedTypes.value.map(type => {
    const ext = type.replace('image/', '').toUpperCase()
    return ext
  }).join(', ')
})

onMounted(async () => {
  loadSettings()
  loadStatus()
  await siteStore.fetchSiteConfig()
  await loadUploadSettings()
})

async function loadUploadSettings() {
  uploadLoading.value = true
  try {
    const data = await getUploadSettings()
    if (data) {
      uploadSettings.value = data as UploadSettings
    }
  } catch (err) {
    console.error('Failed to load upload settings:', err)
  } finally {
    uploadLoading.value = false
  }
}

async function handleSaveWatermark() {
  watermarkSaving.value = true
  try {
    const success = await saveSettings()
    if (success) {
      toast.success(t('common.saved'))
    } else {
      toast.error(t('common.operationFailed'))
    }
  } catch (err) {
    toast.error(t('common.operationFailed'))
  } finally {
    watermarkSaving.value = false
  }
}

async function handleSaveUpload() {
  uploadSaving.value = true
  try {
    await updateUploadSettings(uploadSettings.value)
    toast.success(t('common.saved'))
  } catch (err) {
    console.error('Failed to save upload settings:', err)
    toast.error(t('common.operationFailed'))
  } finally {
    uploadSaving.value = false
  }
}
</script>

<template>
  <div class="upload-settings-page">
    <div class="page-header">
      <RouterLink to="/user/profile" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        {{ t('settings.backToProfile') }}
      </RouterLink>
      <h1 class="page-title">{{ t('user.uploadSettings') }}</h1>
      <p class="page-subtitle">{{ t('user.uploadSettingsSubtitle') }}</p>
    </div>

    <div class="settings-sections">
      <!-- Image Processing Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2 class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {{ t('upload.imageProcessing') }}
          </h2>
        </div>
        <div class="card-body">
          <!-- Supported formats info -->
          <div class="info-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 8v5"/>
              <path d="M12 16v.01"/>
            </svg>
            <div class="info-content">
              <span class="info-title">{{ t('upload.supportedFormats') }}</span>
              <span class="info-message">{{ allowedTypesDisplay || t('common.loading') }}</span>
            </div>
          </div>

          <div class="setting-group">
            <!-- Compression Quality -->
            <div class="setting-row">
              <div class="setting-label">
                <span class="label-title">{{ t('upload.compressionQuality') }}</span>
                <span class="label-desc">{{ t('upload.compressionQualityDesc') }}</span>
              </div>
              <div class="slider-control">
                <input
                  type="range"
                  v-model.number="uploadSettings.compressionQuality"
                  min="0"
                  max="100"
                  step="1"
                  class="slider"
                />
                <span class="slider-value">{{ uploadSettings.compressionQuality }}%</span>
              </div>
            </div>

            <!-- Keep Original Format -->
            <div class="setting-row">
              <div class="setting-label">
                <span class="label-title">{{ t('upload.keepOriginalFormat') }}</span>
                <span class="label-desc">{{ t('upload.keepOriginalFormatDesc') }}</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="uploadSettings.keepOriginalFormat" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-actions">
            <button
              class="btn btn-primary"
              :disabled="uploadSaving || uploadLoading"
              @click="handleSaveUpload"
            >
              <span v-if="uploadSaving" class="loading-spinner"></span>
              {{ uploadSaving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Watermark Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2 class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            {{ t('settings.watermark') }}
          </h2>
        </div>
        <div class="card-body">
          <!-- Watermark service unavailable warning -->
          <div v-if="!watermarkStatus.available" class="warning-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div class="warning-content">
              <span class="warning-title">{{ t('settings.watermarkUnavailable') }}</span>
              <span class="warning-message">{{ watermarkStatus.message }}</span>
            </div>
          </div>
          <p class="section-desc">{{ t('settings.watermarkDesc') }}</p>
          <WatermarkConfig v-model="watermarkConfig" :disabled="!watermarkStatus.available" />
          <div class="setting-actions">
            <button
              class="btn btn-primary"
              :disabled="watermarkSaving || watermarkLoading || !watermarkStatus.available"
              @click="handleSaveWatermark"
            >
              <span v-if="watermarkSaving" class="loading-spinner"></span>
              {{ watermarkSaving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-settings-page {
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-decoration: none;
  transition: var(--transition-fast);
  margin-bottom: var(--spacing-base);
}

.back-link:hover {
  color: var(--color-primary);
}

.back-link svg {
  width: 18px;
  height: 18px;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.settings-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.card-header {
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.card-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.card-title svg {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
}

.card-body {
  padding: var(--spacing-lg);
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background-color: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.info-alert > svg {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.info-message {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.warning-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-base);
}

.warning-alert > svg {
  width: 20px;
  height: 20px;
  color: var(--color-warning);
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.warning-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: #b45309;
}

.warning-message {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.section-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-base);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.label-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.label-desc {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.slider-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 180px;
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border);
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-value {
  min-width: 45px;
  text-align: right;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: var(--transition-fast);
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: var(--transition-fast);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.setting-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-base);
  border-top: 1px solid var(--color-border);
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin-right: var(--spacing-sm);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .setting-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .slider-control {
    width: 100%;
    min-width: unset;
  }
}
</style>
