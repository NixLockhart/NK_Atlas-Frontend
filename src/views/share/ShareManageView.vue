<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getShareList, deleteShare, generateShareUrl } from '@/api/share'
import type { ShareWithImage } from '@/types'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()
const shares = ref<ShareWithImage[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

async function loadShares() {
  loading.value = true
  try {
    const response = await getShareList(page.value, pageSize.value)
    shares.value = response.list || []
    total.value = response.total
  } catch (error) {
    console.error('Failed to load shares:', error)
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('share.deleteConfirm'),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    await deleteShare(id)
    toast.success(t('share.deleteSuccess'))
    loadShares()
  } catch (error) {
    console.error('Failed to delete share:', error)
    toast.error(t('share.deleteFailed'))
  }
}

async function copyLink(code: string) {
  const url = generateShareUrl(code)
  try {
    await navigator.clipboard.writeText(url)
    toast.success(t('share.copySuccess'))
  } catch {
    // Fallback
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    toast.success(t('share.copySuccess'))
  }
}

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    loadShares()
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// formatDateTime reserved for future use
// function formatDateTime(dateStr: string) {
//   return new Date(dateStr).toLocaleDateString('zh-CN', {
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit'
//   })
// }

function isExpired(share: ShareWithImage) {
  if (!share.expire_at) return false
  return new Date(share.expire_at) < new Date()
}

onMounted(loadShares)
</script>

<template>
  <div class="share-manage-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ t('share.manageTitle') }}</h1>
        <span class="total-badge">{{ t('share.totalCount', { count: total }) }}</span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="shares.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
      <p>{{ t('share.noShares') }}</p>
      <p class="hint">{{ t('share.createHint') }}</p>
    </div>

    <!-- 分享列表 -->
    <div v-else class="share-list">
      <div v-for="share in shares" :key="share.id" class="share-card">
        <div class="share-image" v-if="share.image">
          <img :src="share.image.thumbnail || share.image.url" :alt="share.image.original_name" />
        </div>
        <div class="share-image deleted" v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
        </div>
        <div class="share-info">
          <div class="share-name" :class="{ deleted: !share.image }">{{ share.image?.original_name || t('share.deletedImage') }}</div>
          <div class="share-details">
            <span class="detail-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {{ share.views }}{{ share.max_views > 0 ? ' / ' + share.max_views : '' }}
            </span>
            <span v-if="share.password" class="detail-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {{ t('share.passwordProtected') }}
            </span>
            <span class="detail-item" :class="{ expired: isExpired(share) }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <template v-if="share.expire_at">
                <template v-if="isExpired(share)">{{ t('share.expired') }}</template>
                <template v-else>{{ formatDate(share.created_at) }} ~ {{ formatDate(share.expire_at) }}</template>
              </template>
              <template v-else>
                {{ formatDate(share.created_at) }} ({{ t('share.forever') }})
              </template>
            </span>
          </div>
        </div>
        <div class="share-actions">
          <button class="action-btn" @click="copyLink(share.code)" :title="t('share.copyLink')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button class="action-btn danger" @click="handleDelete(share.id)" :title="t('share.deleteShare')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="page === 1" @click="goToPage(page - 1)">{{ t('common.prevPage') }}</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="page === totalPages" @click="goToPage(page + 1)">{{ t('common.nextPage') }}</button>
    </div>
  </div>
</template>

<style scoped>
.share-manage-page {
  max-width: 1200px;
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

.loading-state,
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
  margin: 0;
}

.empty-state .hint {
  margin-top: var(--spacing-xs);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
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

.share-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.share-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.share-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.share-image {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.share-image.deleted {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.share-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.share-info {
  flex: 1;
  min-width: 0;
}

.share-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-name.deleted {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.share-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.detail-item.expired {
  color: var(--color-error);
}

.share-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.action-btn {
  padding: var(--spacing-sm);
  border: none;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.action-btn.danger:hover {
  color: var(--color-error);
}

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

@media (max-width: 768px) {
  .share-card {
    flex-wrap: wrap;
  }

  .share-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
