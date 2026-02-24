<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { login } from '@/api/auth'

import { getErrorMessage } from '@/utils/error'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const errorMsg = ref('')
const form = reactive({
  username: '',
  password: ''
})

async function handleLogin() {
  if (!form.username || !form.password) {
    errorMsg.value = t('auth.pleaseCompleteLogin')
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    const res = await login(form)
    userStore.setToken(res.token)
    userStore.setUserInfo(res.user)
    router.push('/gallery')
  } catch (error) {
    errorMsg.value = getErrorMessage(error, t('auth.loginFailed'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-logo">
        <img src="/favicon.svg" alt="NK" class="logo-icon" />
        <span class="logo-text">Atlas</span>
      </div>

      <h1 class="auth-title">{{ t('auth.welcomeBack') }}</h1>
      <p class="auth-subtitle">{{ t('auth.loginToContinue') }}</p>

      <!-- 错误提示 -->
      <div v-if="errorMsg" class="error-alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 8v5"/>
          <path d="M12 16v.01"/>
        </svg>
        <span>{{ errorMsg }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="input-group">
          <label class="input-label">{{ t('auth.usernameOrEmail') }}</label>
          <input
            v-model="form.username"
            type="text"
            class="input"
            :placeholder="t('auth.enterUsernameOrEmail')"
            required
          />
        </div>

        <div class="input-group">
          <div class="label-row">
            <label class="input-label">{{ t('auth.password') }}</label>
            <RouterLink to="/forgot-password" class="forgot-link">{{ t('auth.forgotPassword') }}</RouterLink>
          </div>
          <input
            v-model="form.password"
            type="password"
            class="input"
            :placeholder="t('auth.enterPassword')"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? t('auth.loggingIn') : t('auth.login') }}
        </button>
      </form>

      <div class="auth-footer">
        <span class="text-secondary">{{ t('auth.noAccount') }}</span>
        <RouterLink to="/register" class="link-primary">{{ t('auth.registerNow') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 64px - 73px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-xl);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  object-fit: contain;
}

.logo-text {
  font-size: var(--text-2xl);
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-title {
  text-align: center;
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.auth-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.error-alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-base);
  color: var(--color-error);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-base);
}

.error-alert svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  font-size: var(--text-sm);
  color: var(--color-primary);
}

.forgot-link:hover {
  text-decoration: underline;
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

.auth-footer {
  margin-top: var(--spacing-lg);
  text-align: center;
  font-size: var(--text-sm);
}

.text-secondary {
  color: var(--color-text-secondary);
}

.link-primary {
  color: var(--color-primary);
  font-weight: 500;
  margin-left: var(--spacing-xs);
}

.link-primary:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-page {
    padding: var(--spacing-base);
    align-items: flex-start;
    padding-top: var(--spacing-xl);
  }

  .auth-card {
    max-width: none;
    padding: var(--spacing-lg);
  }

  .auth-title {
    font-size: var(--text-xl);
  }

  .logo-icon {
    width: 40px;
    height: 40px;
  }

  .logo-text {
    font-size: var(--text-xl);
  }
}
</style>
