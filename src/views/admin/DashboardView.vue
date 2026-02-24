<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDashboardStats, getStorageStats } from '@/api/admin'
import type { DashboardStats, StorageStats } from '@/types'
import AdminNav from '@/components/admin/AdminNav.vue'
import { formatSize } from '@/utils/format'
import { getErrorMessage } from '@/utils/error'

const { t } = useI18n()
const loading = ref(true)
const error = ref('')
const stats = ref<DashboardStats | null>(null)
const storageStats = ref<StorageStats | null>(null)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [dashboardData, storageData] = await Promise.all([
      getDashboardStats(),
      getStorageStats()
    ])
    stats.value = dashboardData
    storageStats.value = storageData
  } catch (err) {
    console.error('Failed to load dashboard stats:', err)
    error.value = getErrorMessage(err, t('common.loadFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="dashboard-page">
    <AdminNav />

    <div class="page-header">
      <h1 class="page-title">{{ t('admin.dataStatistics') }}</h1>
      <button class="btn btn-outline" @click="loadData" :disabled="loading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        {{ t('common.refresh') }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadData">{{ t('common.retry') }}</button>
    </div>

    <template v-else-if="stats">
      <!-- 概览统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon users">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">{{ t('admin.totalUsers') }}</span>
            <span class="stat-value">{{ stats.total_users }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon images">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">{{ t('admin.totalImages') }}</span>
            <span class="stat-value">{{ stats.total_images }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon storage">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">{{ t('admin.totalStorage') }}</span>
            <span class="stat-value">{{ formatSize(stats.total_storage) }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon uploads">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">{{ t('admin.todayUploads') }}</span>
            <span class="stat-value">{{ stats.today_uploads }}</span>
          </div>
        </div>
      </div>

      <!-- 今日数据 -->
      <div class="section">
        <h2 class="section-title">{{ t('admin.todayData') }}</h2>
        <div class="today-grid">
          <div class="today-card">
            <span class="today-label">{{ t('admin.todayLogins') }}</span>
            <span class="today-value">{{ stats.today_logins }}</span>
          </div>
          <div class="today-card">
            <span class="today-label">{{ t('admin.todayNewUsers') }}</span>
            <span class="today-value">{{ stats.new_users_today }}</span>
          </div>
          <div class="today-card">
            <span class="today-label">{{ t('admin.weekNewUsers') }}</span>
            <span class="today-value">{{ stats.new_users_week }}</span>
          </div>
          <div class="today-card">
            <span class="today-label">{{ t('admin.weekActiveUsers') }}</span>
            <span class="today-value">{{ stats.active_users_week }}</span>
          </div>
        </div>
      </div>

      <!-- 存储排行 -->
      <div v-if="storageStats" class="section">
        <h2 class="section-title">{{ t('admin.storageRankingTop10') }}</h2>
        <div class="ranking-list">
          <div v-if="!storageStats.top_users || storageStats.top_users.length === 0" class="empty-ranking">
            {{ t('common.noData') }}
          </div>
          <div v-else class="ranking-item" v-for="(user, index) in storageStats.top_users" :key="user.user_id">
            <span class="ranking-number" :class="{ top: index < 3 }">{{ index + 1 }}</span>
            <span class="ranking-name">{{ user.username }}</span>
            <div class="ranking-bar-container">
              <div
                class="ranking-bar"
                :style="{ width: (user.used_space / storageStats.top_users[0].used_space * 100) + '%' }"
              ></div>
            </div>
            <span class="ranking-value">{{ formatSize(user.used_space) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.page-header .btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-lg);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.users {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.stat-icon.images {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.stat-icon.storage {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.stat-icon.uploads {
  background: rgba(139, 92, 246, 0.1);
  color: var(--color-secondary);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
}

/* 章节 */
.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-base);
}

/* 今日数据 */
.today-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-base);
}

.today-card {
  padding: var(--spacing-base);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
}

.today-label {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.today-value {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
}

/* 排行榜 */
.ranking-list {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  border-bottom: 1px solid var(--color-border);
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ranking-number.top {
  background: var(--color-primary);
  color: white;
}

.ranking-name {
  width: 120px;
  font-size: var(--text-sm);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-bar-container {
  flex: 1;
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.ranking-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.ranking-value {
  width: 80px;
  text-align: right;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.empty-ranking {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-tertiary);
}

/* 加载状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-secondary);
}

.error-state svg {
  color: var(--color-error);
  margin-bottom: var(--spacing-base);
}

.error-state p {
  margin: 0 0 var(--spacing-base);
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .today-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ranking-name {
    width: 80px;
  }

  .ranking-value {
    width: 60px;
  }
}
</style>
