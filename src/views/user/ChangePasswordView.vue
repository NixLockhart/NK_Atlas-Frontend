<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { changePassword } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const toast = useToast()
const loading = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

async function handleSubmit() {
  if (!form.oldPassword) {
    toast.error(t('auth.currentPasswordRequired'))
    return
  }
  if (!form.newPassword || form.newPassword.length < 6) {
    toast.error(t('auth.newPasswordTooShort'))
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    toast.error(t('auth.passwordMismatch'))
    return
  }

  loading.value = true
  try {
    await changePassword({
      old_password: form.oldPassword,
      new_password: form.newPassword
    })
    toast.success(t('auth.passwordChangedSuccess'))
    setTimeout(() => {
      userStore.logout()
      router.push('/login')
    }, 1500)
  } catch (err: any) {
    const errMsg = err.message || ''
    // 检查是否是原密码错误
    if (errMsg.includes('密码错误') || errMsg.includes('password')) {
      toast.error(t('auth.wrongPassword'))
    } else {
      toast.error(errMsg || t('auth.changeFailed'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="change-password-page">
    <div class="page-header">
      <RouterLink to="/user/profile" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        {{ t('settings.backToProfile') }}
      </RouterLink>
    </div>

    <div class="form-card">
      <div class="card-header">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 class="card-title">{{ t('auth.changePassword') }}</h1>
        <p class="card-subtitle">{{ t('auth.changePasswordHint') }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="input-group">
          <label class="input-label">{{ t('auth.currentPassword') }}</label>
          <input
            v-model="form.oldPassword"
            type="password"
            class="input"
            :placeholder="t('auth.enterCurrentPassword')"
            required
          />
        </div>
        <div class="input-group">
          <label class="input-label">{{ t('auth.newPassword') }}</label>
          <input
            v-model="form.newPassword"
            type="password"
            class="input"
            :placeholder="t('auth.passwordCharLimit')"
            required
          />
        </div>
        <div class="input-group">
          <label class="input-label">{{ t('auth.confirmNewPassword') }}</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="input"
            :placeholder="t('auth.reenterNewPassword')"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? t('common.submitting') : t('auth.confirmChange') }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.change-password-page {
  max-width: 480px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-decoration: none;
  transition: var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.back-link svg {
  width: 18px;
  height: 18px;
}

.form-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.card-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.card-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-base);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-xl);
  color: white;
}

.card-icon svg {
  width: 32px;
  height: 32px;
}

.card-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.btn-block {
  width: 100%;
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
