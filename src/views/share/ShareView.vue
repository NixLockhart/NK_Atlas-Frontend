<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getPublicShare, verifySharePassword, downloadShare } from '@/api/share'
import type { PublicShareResponse } from '@/types'
import { getShareImageUrl } from '@/utils/image'
import { getErrorMessage } from '@/utils/error'

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const shareData = ref<PublicShareResponse | null>(null)
const imageData = ref<PublicShareResponse['image'] | null>(null)
const needPassword = ref(false)
const passwordVerified = ref(false)
const passwordInput = ref('')
const passwordError = ref('')

const code = computed(() => route.params.code as string)

// 计算图片显示URL，使用代理URL以支持私有图片
const imageDisplayUrl = computed(() => {
  if (!imageData.value) return ''
  // 使用代理URL，附带分享code作为token
  return getShareImageUrl(imageData.value.id, code.value)
})

async function loadShare() {
  loading.value = true
  error.value = ''
  try {
    const data = await getPublicShare(code.value)
    shareData.value = data
    needPassword.value = data.need_password
    if (!data.need_password && data.image) {
      // 无密码保护，直接显示图片
      imageData.value = data.image
      passwordVerified.value = true
    }
  } catch (e) {
    error.value = getErrorMessage(e, t('share.shareNotFound'))
  } finally {
    loading.value = false
  }
}

async function handleVerifyPassword() {
  if (!passwordInput.value.trim()) return
  passwordError.value = ''
  try {
    const result = await verifySharePassword(code.value, passwordInput.value)
    if (result.valid && result.image) {
      imageData.value = result.image
      passwordVerified.value = true
    } else {
      passwordError.value = t('share.wrongPassword')
    }
  } catch (e) {
    passwordError.value = getErrorMessage(e, t('share.verifyFailed'))
  }
}

async function handleDownload() {
  try {
    const data = await downloadShare(code.value)
    // 触发浏览器下载
    const a = document.createElement('a')
    a.href = data.url
    a.download = data.filename
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (e) {
    console.error('Download failed:', e)
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(loadShare)
</script>

<template>
  <div class="share-page">
    <!-- 加载中 -->
    <div v-if="loading" class="share-loading">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="share-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="64" height="64">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h2>{{ t('share.shareNotFound') }}</h2>
      <p>{{ error }}</p>
    </div>

    <!-- 密码验证 -->
    <div v-else-if="needPassword && !passwordVerified" class="share-password">
      <div class="password-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <h2>{{ t('share.passwordRequired') }}</h2>
        <p>{{ t('share.enterPassword') }}</p>
        <div class="password-form">
          <input
            v-model="passwordInput"
            type="password"
            class="input"
            :placeholder="t('share.password')"
            @keyup.enter="handleVerifyPassword"
          />
          <button class="btn btn-primary" @click="handleVerifyPassword">{{ t('share.verify') }}</button>
        </div>
        <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
      </div>
    </div>

    <!-- 分享内容 -->
    <div v-else-if="shareData && passwordVerified && imageData" class="share-content">
      <div class="share-header">
        <h1 class="share-title">{{ imageData.original_name || imageData.name }}</h1>
        <div class="share-meta">
          <span>{{ imageData.width }}x{{ imageData.height }}</span>
          <span>{{ formatSize(imageData.size) }}</span>
          <span>{{ formatDate(shareData.share.created_at) }}</span>
          <span>{{ shareData.share.views }}<span class="view-increment">(+1)</span> {{ t('share.viewCount') }}</span>
        </div>
      </div>
      <div class="share-image">
        <img :src="imageDisplayUrl" :alt="imageData.original_name" />
      </div>
      <div class="share-actions">
        <button class="btn btn-primary" @click="handleDownload">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {{ t('common.download') }}
        </button>
      </div>
      <div class="share-footer">
        <p>{{ t('share.poweredBy') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.share-page {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-loading,
.share-error {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--spacing-3xl);
}

.share-error svg {
  color: var(--color-error);
  margin-bottom: var(--spacing-base);
}

.share-error h2 {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text);
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto var(--spacing-base);
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.share-password {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-base);
}

.password-card {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.password-card svg {
  color: var(--color-primary);
  margin-bottom: var(--spacing-base);
}

.password-card h2 {
  margin: 0 0 var(--spacing-xs);
  color: var(--color-text);
  font-size: var(--text-lg);
}

.password-card p {
  margin: 0 0 var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.password-form {
  display: flex;
  gap: var(--spacing-sm);
}

.password-form .input {
  flex: 1;
}

.error-text {
  color: var(--color-error) !important;
  font-size: var(--text-sm) !important;
  margin-top: var(--spacing-sm) !important;
}

.share-content {
  width: 100%;
  max-width: 900px;
  padding: var(--spacing-xl) var(--spacing-base);
}

.share-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.share-title {
  font-size: var(--text-xl);
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm);
  word-break: break-all;
}

.share-meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--spacing-base);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.view-increment {
  color: var(--color-success, #22c55e);
  margin-left: 2px;
}

.share-image {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-base);
}

.share-image img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.share-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-xl);
}

.share-actions .btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.share-footer {
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}

.share-footer p {
  margin: 0;
}

.input {
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-sm);
  outline: none;
  transition: var(--transition-fast);
}

.input:focus {
  border-color: var(--color-primary);
}

@media (max-width: 768px) {
  .share-meta {
    gap: var(--spacing-sm);
  }
}
</style>
