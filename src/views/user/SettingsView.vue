<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { deleteAccount } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useToast } from '@/composables/useToast'
import ColorPicker from '@/components/common/ColorPicker.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const toast = useToast()
const showDeleteModal = ref(false)
const deletePassword = ref('')
const loading = ref(false)

function openDeleteModal() {
  showDeleteModal.value = true
  deletePassword.value = ''
}

function closeDeleteModal() {
  showDeleteModal.value = false
}

async function handleDeleteAccount() {
  if (!deletePassword.value) {
    toast.error(t('auth.passwordRequired'))
    return
  }

  loading.value = true
  try {
    await deleteAccount(deletePassword.value)
    toast.success(t('settings.deleteAccountSuccess'))
    userStore.logout()
    router.push('/login')
  } catch (err: any) {
    const errMsg = err.message || ''
    // 检查是否是密码错误
    if (errMsg.includes('密码错误') || errMsg.includes('password')) {
      toast.error(t('auth.wrongPassword'))
    } else {
      toast.error(errMsg || t('settings.deleteAccountFailed'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <RouterLink to="/user/profile" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        {{ t('settings.backToProfile') }}
      </RouterLink>
      <h1 class="page-title">{{ t('settings.title') }}</h1>
      <p class="page-subtitle">{{ t('settings.subtitle') }}</p>
    </div>

    <div class="settings-sections">
      <!-- 外观设置 -->
      <div class="settings-card">
        <div class="card-header">
          <h2 class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            {{ t('settings.appearance') }}
          </h2>
        </div>
        <div class="card-body">
          <div class="appearance-section">
            <!-- 主题模式 -->
            <div class="setting-row">
              <div class="setting-label">
                <span class="label-title">{{ t('settings.theme') }}</span>
                <span class="label-desc">{{ t('settings.themeDesc') }}</span>
              </div>
              <div class="theme-toggle-group">
                <button
                  class="theme-btn"
                  :class="{ active: themeStore.mode === 'light' }"
                  @click="themeStore.setMode('light')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                  {{ t('settings.themeLight') }}
                </button>
                <button
                  class="theme-btn"
                  :class="{ active: themeStore.mode === 'dark' }"
                  @click="themeStore.setMode('dark')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  {{ t('settings.themeDark') }}
                </button>
                <button
                  class="theme-btn"
                  :class="{ active: themeStore.mode === 'system' }"
                  @click="themeStore.setMode('system')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  {{ t('settings.themeSystem') }}
                </button>
              </div>
            </div>

            <!-- 主题色 -->
            <div class="setting-row">
              <ColorPicker />
            </div>

            <!-- 语言 -->
            <div class="setting-row">
              <div class="setting-label">
                <span class="label-title">{{ t('settings.language') }}</span>
                <span class="label-desc">{{ t('settings.languageDesc') }}</span>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2 class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {{ t('settings.security') }}
          </h2>
        </div>
        <div class="card-body">
          <RouterLink to="/user/change-password" class="setting-item">
            <div class="setting-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div class="setting-info">
              <span class="setting-title">{{ t('settings.loginPassword') }}</span>
              <span class="setting-desc">{{ t('settings.loginPasswordDesc') }}</span>
            </div>
            <svg class="setting-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </RouterLink>
        </div>
      </div>

      <!-- 危险操作 -->
      <div class="settings-card danger-card">
        <div class="card-header danger-header">
          <h2 class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <path d="M12 9v4"/>
              <path d="M12 17v.01"/>
            </svg>
            {{ t('settings.dangerZone') }}
          </h2>
        </div>
        <div class="card-body">
          <div class="setting-item danger-item">
            <div class="setting-icon danger-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </div>
            <div class="setting-info">
              <span class="setting-title">{{ t('user.deleteAccount') }}</span>
              <span class="setting-desc">{{ t('settings.deleteAccountDesc') }}</span>
            </div>
            <button @click="openDeleteModal" class="btn btn-danger-outline btn-sm">
              {{ t('user.deleteAccount') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 注销确认弹窗 -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-icon danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <path d="M12 9v4"/>
                <path d="M12 17v.01"/>
              </svg>
            </div>
            <h3 class="modal-title">{{ t('settings.confirmDeleteAccount') }}</h3>
            <p class="modal-desc">{{ t('user.deleteConfirm') }}</p>
          </div>

          <div class="input-group">
            <label class="input-label">{{ t('settings.enterPasswordToConfirm') }}</label>
            <input
              v-model="deletePassword"
              type="password"
              class="input"
              :placeholder="t('auth.enterPassword')"
            />
          </div>

          <div class="modal-actions">
            <button @click="closeDeleteModal" class="btn btn-secondary">{{ t('common.cancel') }}</button>
            <button @click="handleDeleteAccount" :disabled="loading" class="btn btn-danger">
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? t('common.loading') : t('settings.confirmDelete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.settings-page {
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

.danger-header .card-title svg {
  color: var(--color-error);
}

.card-body {
  padding: var(--spacing-base);
}

.appearance-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
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

.theme-toggle-group {
  display: flex;
  gap: var(--spacing-sm);
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.theme-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.theme-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.theme-btn svg {
  width: 16px;
  height: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: var(--transition-base);
}

a.setting-item:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
}

.setting-icon {
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

.setting-icon svg {
  width: 22px;
  height: 22px;
}

.danger-icon {
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-title {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.setting-desc {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.setting-arrow {
  width: 20px;
  height: 20px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.btn-danger-outline {
  background: transparent;
  border: 1px solid var(--color-error);
  color: var(--color-error);
}

.btn-danger-outline:hover {
  background: var(--color-error);
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-base);
}

.modal-content {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.modal-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--spacing-base);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-icon.danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.modal-icon svg {
  width: 28px;
  height: 28px;
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
}

.modal-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.modal-actions .btn {
  flex: 1;
}

.btn-danger {
  background: var(--color-error);
  border-color: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error);
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
</style>
