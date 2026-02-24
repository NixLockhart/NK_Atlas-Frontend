<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { createShare, generateShareUrl } from '@/api/share'
import { useToast } from '@/composables/useToast'
import { copyToClipboard } from '@/utils/clipboard'
import SelectDropdown from '@/components/common/SelectDropdown.vue'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  imageId: number
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', shareUrl: string): void
}>()

const loading = ref(false)
const password = ref('')
const expireDays = ref(0)
const maxViews = ref(0)
const shareUrl = ref('')
const created = ref(false)
const copyStatus = ref(false)
const overlayRef = ref<HTMLElement | null>(null)

const isVisible = computed(() => props.visible)

const expireOptions = computed(() => [
  { label: t('share.neverExpire'), value: 0 },
  { label: t('share.oneDay'), value: 1 },
  { label: t('share.sevenDays'), value: 7 },
  { label: t('share.thirtyDays'), value: 30 },
  { label: t('share.ninetyDays'), value: 90 },
])

watch(() => props.visible, (visible) => {
  if (visible) {
    // Reset form
    password.value = ''
    expireDays.value = 0
    maxViews.value = 0
    shareUrl.value = ''
    created.value = false
    copyStatus.value = false
    nextTick(() => overlayRef.value?.focus())
  }
})

async function handleCreate() {
  loading.value = true
  try {
    const result = await createShare({
      image_id: props.imageId,
      password: password.value || undefined,
      expire_days: expireDays.value || undefined,
      max_views: maxViews.value || undefined,
    })
    const url = generateShareUrl(result.share.code)
    shareUrl.value = url
    created.value = true
    emit('created', url)
  } catch (error) {
    console.error('Failed to create share:', error)
    toast.error(t('share.createFailed'))
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  await copyToClipboard(shareUrl.value)
  copyStatus.value = true
  setTimeout(() => {
    copyStatus.value = false
  }, 2000)
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" class="modal-overlay" @click.self="close" @keydown.escape="close" tabindex="-1" ref="overlayRef">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ created ? t('share.shareCreated') : t('share.createShare') }}</h3>
          <button class="modal-close" @click="close">&times;</button>
        </div>

        <!-- 创建成功 -->
        <div v-if="created" class="modal-body">
          <div class="share-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p class="success-text">{{ t('share.shareCreated') }}</p>
            <div class="share-link-wrap">
              <input type="text" :value="shareUrl" readonly class="share-link-input" />
              <button
                class="copy-btn"
                :class="{ copied: copyStatus }"
                @click="copyLink"
              >
                {{ copyStatus ? t('common.copied') : t('common.copy') }}
              </button>
            </div>
            <div class="share-tips" v-if="password">
              <p><strong>{{ t('share.password') }}:</strong> {{ password }}</p>
            </div>
          </div>
        </div>

        <!-- 创建表单 -->
        <div v-else class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ t('share.password') }} ({{ t('share.optional') }})</label>
            <input
              v-model="password"
              type="password"
              autocomplete="new-password"
              class="form-input"
              :placeholder="t('share.optional')"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('share.expiry') }}</label>
            <SelectDropdown v-model="expireDays" :options="expireOptions" width="100%" />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('share.maxViews') }}</label>
            <input
              v-model.number="maxViews"
              type="number"
              class="form-input"
              :placeholder="t('share.unlimitedViews')"
              min="0"
            />
            <p class="form-hint">{{ t('share.unlimitedViews') }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" @click="close">
            {{ created ? t('common.close') : t('common.cancel') }}
          </button>
          <button
            v-if="!created"
            class="btn btn-primary"
            :disabled="loading"
            @click="handleCreate"
          >
            {{ loading ? t('common.loading') : t('share.createShare') }}
          </button>
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
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--color-text);
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

.form-group {
  margin-bottom: var(--spacing-base);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.form-input,
.form-select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-sm);
  outline: none;
  transition: var(--transition-fast);
}

.form-input:focus,
.form-select:focus {
  border-color: var(--color-primary);
}

.form-input::placeholder {
  color: var(--color-text-tertiary);
}

.form-hint {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.share-success {
  text-align: center;
  padding: var(--spacing-base) 0;
}

.share-success svg {
  color: var(--color-success);
  margin-bottom: var(--spacing-base);
}

.success-text {
  margin: 0 0 var(--spacing-base);
  color: var(--color-text);
  font-weight: 500;
}

.share-link-wrap {
  display: flex;
  gap: var(--spacing-xs);
}

.share-link-input {
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

.copy-btn {
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.copy-btn:hover {
  opacity: 0.9;
}

.copy-btn.copied {
  background: var(--color-success);
  border-color: var(--color-success);
}

.share-tips {
  margin-top: var(--spacing-base);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.share-tips p {
  margin: 0;
}
</style>
