<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import AvatarUploader from '@/components/user/AvatarUploader.vue'
import { formatSize } from '@/utils/format'

const { t } = useI18n()
const userStore = useUserStore()

const quotaInfo = computed(() => ({
  total: formatSize(userStore.totalQuota),
  used: formatSize(userStore.userInfo?.used_space || 0),
  available: formatSize(userStore.availableSpace),
  percent: userStore.usagePercent
}))

const quotaBarColor = computed(() => {
  if (userStore.usagePercent >= 90) return 'var(--color-error)'
  if (userStore.usagePercent >= 70) return 'var(--color-warning)'
  return 'var(--color-primary)'
})
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('user.profile') }}</h1>
      <p class="page-subtitle">{{ t('user.manageProfile') }}</p>
    </div>

    <div class="profile-grid">
      <!-- 个人信息卡片 -->
      <div class="card profile-card">
        <div class="card-header">
          <h2 class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {{ t('user.personalInfo') }}
          </h2>
        </div>
        <div class="card-body">
          <div class="user-info" v-if="userStore.userInfo">
            <div class="info-visual">
              <AvatarUploader />
            </div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">{{ t('auth.username') }}</span>
                <span class="info-value">{{ userStore.userInfo.username }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ t('auth.nickname') }}</span>
                <span class="info-value">{{ userStore.userInfo.nickname || t('common.notSet') }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ t('auth.email') }}</span>
                <span class="info-value">{{ userStore.userInfo.email }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 存储配额卡片 -->
      <div class="card quota-card">
        <div class="card-header">
          <h2 class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            {{ t('user.storageQuota') }}
          </h2>
        </div>
        <div class="card-body">
          <div class="quota-info">
            <div class="quota-visual">
              <div class="quota-circle">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" stroke-width="8"/>
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    :stroke="quotaBarColor"
                    stroke-width="8"
                    stroke-linecap="round"
                    :stroke-dasharray="`${quotaInfo.percent * 2.83} 283`"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div class="quota-percent">{{ quotaInfo.percent }}%</div>
              </div>
            </div>
            <div class="quota-details">
              <div class="quota-stat">
                <span class="quota-label">{{ t('user.used') }}</span>
                <span class="quota-value">{{ quotaInfo.used }}</span>
              </div>
              <div class="quota-stat">
                <span class="quota-label">{{ t('user.total') }}</span>
                <span class="quota-value">{{ quotaInfo.total }}</span>
              </div>
              <div class="quota-stat">
                <span class="quota-label">{{ t('user.remaining') }}</span>
                <span class="quota-value highlight">{{ quotaInfo.available }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作卡片 -->
      <div class="card actions-card">
        <div class="card-header">
          <h2 class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            {{ t('user.quickActions') }}
          </h2>
        </div>
        <div class="card-body">
          <div class="action-list">
            <RouterLink to="/user/tokens" class="action-item">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="action-info">
                <span class="action-title">{{ t('user.apiTokens') }}</span>
                <span class="action-desc">{{ t('user.apiTokensDesc') }}</span>
              </div>
              <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </RouterLink>
            <RouterLink to="/user/domains" class="action-item">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <div class="action-info">
                <span class="action-title">{{ t('user.domainWhitelist') }}</span>
                <span class="action-desc">{{ t('user.domainWhitelistDesc') }}</span>
              </div>
              <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </RouterLink>
            <RouterLink to="/user/change-password" class="action-item">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="action-info">
                <span class="action-title">{{ t('auth.changePassword') }}</span>
                <span class="action-desc">{{ t('user.changePasswordDesc') }}</span>
              </div>
              <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </RouterLink>
            <RouterLink to="/user/upload-settings" class="action-item">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div class="action-info">
                <span class="action-title">{{ t('user.uploadSettings') }}</span>
                <span class="action-desc">{{ t('user.uploadSettingsDesc') }}</span>
              </div>
              <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </RouterLink>
            <RouterLink to="/user/settings" class="action-item">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div class="action-info">
                <span class="action-title">{{ t('user.accountSettings') }}</span>
                <span class="action-desc">{{ t('user.accountSettingsDesc') }}</span>
              </div>
              <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
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

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.card {
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

/* 个人信息卡片 - 水平布局 */
.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.info-visual {
  flex-shrink: 0;
}

/* 隐藏头像组件内的提示文字，仅保留头像本体 */
.info-visual :deep(.avatar-hint) {
  display: none;
}

.info-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.info-value {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

/* 存储配额卡片 - 水平布局（与个人信息一致） */
.quota-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.quota-visual {
  flex-shrink: 0;
}

.quota-circle {
  position: relative;
  width: 96px;
  height: 96px;
}

.quota-circle svg {
  width: 100%;
  height: 100%;
}

.quota-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
}

.quota-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quota-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.quota-stat:last-child {
  border-bottom: none;
}

.quota-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.quota-value {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.quota-value.highlight {
  color: var(--color-success);
}

/* 快捷操作卡片 */
.actions-card {
  grid-column: 1 / -1;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: var(--transition-base);
}

.action-item:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
}

.action-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-base);
  color: var(--color-primary);
  flex-shrink: 0;
}

.action-icon svg {
  width: 22px;
  height: 22px;
}

.action-info {
  flex: 1;
  min-width: 0;
}

.action-title {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.action-desc {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.action-arrow {
  width: 20px;
  height: 20px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .user-info,
  .quota-info {
    flex-direction: column;
    text-align: center;
  }

  .info-visual,
  .quota-visual {
    margin-bottom: var(--spacing-base);
  }

  .info-list,
  .quota-details {
    width: 100%;
  }

  .info-item,
  .quota-stat {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    text-align: center;
  }

  .info-label,
  .quota-label {
    font-size: var(--text-xs);
  }

  .info-value,
  .quota-value {
    font-size: var(--text-base);
  }

  .quota-circle {
    width: 100px;
    height: 100px;
  }

  .card-body {
    padding: var(--spacing-base);
  }

  .action-item {
    padding: var(--spacing-sm);
  }

  .action-icon {
    width: 36px;
    height: 36px;
  }

  .action-icon svg {
    width: 18px;
    height: 18px;
  }
}
</style>
