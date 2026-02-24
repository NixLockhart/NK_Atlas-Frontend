<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { sendResetCode, resetPassword } from '@/api/auth'

const { t } = useI18n()
const router = useRouter()
const step = ref(1)
const loading = ref(false)
const errorMsg = ref('')
const countdown = ref(0)

const form = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

async function handleSendCode() {
  if (!form.email) {
    errorMsg.value = t('auth.emailRequired')
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await sendResetCode(form.email)
    step.value = 2
    startCountdown()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || t('auth.sendCodeFailed')
  } finally {
    loading.value = false
  }
}

function startCountdown() {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function handleResetPassword() {
  if (!form.code) {
    errorMsg.value = t('auth.codeRequired')
    return
  }
  if (!form.newPassword || form.newPassword.length < 6) {
    errorMsg.value = t('auth.passwordTooShort')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    errorMsg.value = t('auth.passwordMismatch')
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    await resetPassword(form.email, form.code, form.newPassword)
    step.value = 3
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || t('auth.resetFailed')
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
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

      <h1 class="auth-title">{{ t('auth.findPassword') }}</h1>
      <p class="auth-subtitle">
        <template v-if="step === 1">{{ t('auth.enterRegisteredEmail') }}</template>
        <template v-else-if="step === 2">{{ t('auth.setNewPassword') }}</template>
        <template v-else>{{ t('auth.passwordResetSuccess') }}</template>
      </p>

      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <div class="step" :class="{ active: step >= 1, done: step > 1 }">
          <span class="step-number">1</span>
          <span class="step-label">{{ t('auth.verifyEmail') }}</span>
        </div>
        <div class="step-line" :class="{ active: step > 1 }"></div>
        <div class="step" :class="{ active: step >= 2, done: step > 2 }">
          <span class="step-number">2</span>
          <span class="step-label">{{ t('auth.resetPassword') }}</span>
        </div>
        <div class="step-line" :class="{ active: step > 2 }"></div>
        <div class="step" :class="{ active: step >= 3 }">
          <span class="step-number">3</span>
          <span class="step-label">{{ t('auth.complete') }}</span>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMsg" class="error-alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 8v5"/>
          <path d="M12 16v.01"/>
        </svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- 步骤1: 输入邮箱 -->
      <form v-if="step === 1" @submit.prevent="handleSendCode" class="auth-form">
        <div class="input-group">
          <label class="input-label">{{ t('auth.email') }}</label>
          <input
            v-model="form.email"
            type="email"
            class="input"
            :placeholder="t('auth.enterRegisteredEmailPlaceholder')"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? t('auth.sending') : t('auth.sendCode') }}
        </button>
      </form>

      <!-- 步骤2: 输入验证码和新密码 -->
      <form v-else-if="step === 2" @submit.prevent="handleResetPassword" class="auth-form">
        <div class="input-group">
          <label class="input-label">{{ t('auth.verificationCode') }}</label>
          <div class="input-with-btn">
            <input
              v-model="form.code"
              type="text"
              class="input"
              :placeholder="t('auth.codePlaceholder')"
              required
            />
            <button
              type="button"
              class="btn btn-secondary send-code-btn"
              @click="handleSendCode"
              :disabled="countdown > 0 || loading"
            >
              {{ countdown > 0 ? `${countdown}s` : t('auth.resend') }}
            </button>
          </div>
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
          {{ loading ? t('common.submitting') : t('auth.resetPassword') }}
        </button>
      </form>

      <!-- 步骤3: 成功 -->
      <div v-else class="success-section">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <p class="success-text">{{ t('auth.passwordResetSuccess') }}</p>
        <p class="success-hint">{{ t('auth.passwordResetSuccessHint') }}</p>
        <button @click="goToLogin" class="btn btn-primary btn-lg btn-block">
          {{ t('auth.backToLogin') }}
        </button>
      </div>

      <div class="auth-footer">
        <RouterLink to="/login" class="link-primary">{{ t('auth.backToLogin') }}</RouterLink>
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
  max-width: 420px;
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
  font-size: var(--text-sm);
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.step-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: var(--text-xs);
  font-weight: 600;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  transition: var(--transition-base);
}

.step.active .step-number {
  background: var(--color-primary);
  color: white;
}

.step.done .step-number {
  background: var(--color-success);
  color: white;
}

.step-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.step.active .step-label {
  color: var(--color-text);
}

.step-line {
  width: 40px;
  height: 2px;
  background: var(--color-border);
  margin: 0 var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  transition: var(--transition-base);
}

.step-line.active {
  background: var(--color-primary);
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

.input-with-btn {
  display: flex;
  gap: var(--spacing-sm);
}

.input-with-btn .input {
  flex: 1;
}

.send-code-btn {
  flex-shrink: 0;
  min-width: 100px;
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

.success-section {
  text-align: center;
  padding: var(--spacing-lg) 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-base);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 50%;
  color: var(--color-success);
}

.success-icon svg {
  width: 32px;
  height: 32px;
}

.success-text {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
}

.success-hint {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-lg);
}

.auth-footer {
  margin-top: var(--spacing-lg);
  text-align: center;
  font-size: var(--text-sm);
}

.link-primary {
  color: var(--color-primary);
  font-weight: 500;
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

  .steps {
    transform: scale(0.9);
  }

  .step-line {
    width: 24px;
  }

  .input-with-btn {
    flex-direction: column;
  }

  .send-code-btn {
    width: 100%;
    min-width: auto;
  }
}
</style>
