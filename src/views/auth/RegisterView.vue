<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { register, sendRegisterCode } from '@/api/auth'
import { useSiteStore } from '@/stores/site'
import { getErrorMessage } from '@/utils/error'

const { t } = useI18n()
const router = useRouter()
const siteStore = useSiteStore()

const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const errorMsg = ref('')
const successMsg = ref('')
let countdownTimer: ReturnType<typeof setInterval> | null = null

// 注册是否允许
const registrationClosed = computed(() => !siteStore.allowRegister)
const closedReason = computed(() => siteStore.registerClosedReason || t('auth.registrationClosed'))

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  code: ''
})

onMounted(async () => {
  // 刷新站点配置以获取最新的注册状态
  await siteStore.refreshSiteConfig()
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

async function handleSendCode() {
  if (!form.email) {
    errorMsg.value = t('auth.pleaseEnterEmail')
    return
  }

  sendingCode.value = true
  errorMsg.value = ''
  try {
    await sendRegisterCode(form.email)
    successMsg.value = t('auth.codeSent')
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer!)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    errorMsg.value = getErrorMessage(error, t('auth.sendCodeFailed'))
  } finally {
    sendingCode.value = false
  }
}

async function handleRegister() {
  errorMsg.value = ''
  successMsg.value = ''

  if (form.password !== form.confirmPassword) {
    errorMsg.value = t('auth.passwordMismatch')
    return
  }

  if (form.password.length < 6) {
    errorMsg.value = t('auth.passwordTooShort')
    return
  }

  loading.value = true
  try {
    await register({
      username: form.username,
      email: form.email,
      password: form.password,
      code: form.code
    })
    router.push('/login')
  } catch (error) {
    errorMsg.value = getErrorMessage(error, t('auth.registerFailed'))
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

      <h1 class="auth-title">{{ t('auth.createAccount') }}</h1>
      <p class="auth-subtitle">{{ t('auth.registerToStart') }}</p>

      <!-- 注册已关闭提示 -->
      <div v-if="registrationClosed" class="closed-alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <div class="closed-content">
          <h3>{{ t('auth.registrationClosedTitle') }}</h3>
          <p>{{ closedReason }}</p>
        </div>
        <RouterLink to="/login" class="btn btn-primary btn-lg btn-block">
          {{ t('auth.backToLogin') }}
        </RouterLink>
      </div>

      <template v-else>
        <!-- 错误提示 -->
        <div v-if="errorMsg" class="error-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 8v5"/>
            <path d="M12 16v.01"/>
          </svg>
          <span>{{ errorMsg }}</span>
        </div>

        <!-- 成功提示 -->
        <div v-if="successMsg" class="success-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>{{ successMsg }}</span>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
        <div class="input-group">
          <label class="input-label">{{ t('auth.username') }}</label>
          <input
            v-model="form.username"
            type="text"
            class="input"
            :placeholder="t('auth.usernamePlaceholder')"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label">{{ t('auth.email') }}</label>
          <div class="input-with-btn">
            <input
              v-model="form.email"
              type="email"
              class="input"
              :placeholder="t('auth.emailPlaceholder')"
              required
            />
            <button
              type="button"
              class="btn btn-secondary send-code-btn"
              @click="handleSendCode"
              :disabled="sendingCode || countdown > 0"
            >
              {{ countdown > 0 ? `${countdown}s` : sendingCode ? t('auth.sending') : t('auth.sendCode') }}
            </button>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">{{ t('auth.verificationCode') }}</label>
          <input
            v-model="form.code"
            type="text"
            class="input"
            :placeholder="t('auth.codePlaceholder')"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label">{{ t('auth.password') }}</label>
          <input
            v-model="form.password"
            type="password"
            class="input"
            :placeholder="t('auth.passwordPlaceholder')"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label">{{ t('auth.confirmPassword') }}</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="input"
            :placeholder="t('auth.confirmPasswordPlaceholder')"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? t('auth.registering') : t('auth.register') }}
        </button>
      </form>

      <div class="auth-footer">
        <span class="text-secondary">{{ t('auth.hasAccount') }}</span>
        <RouterLink to="/login" class="link-primary">{{ t('auth.loginNow') }}</RouterLink>
      </div>
      </template>
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
}

.error-alert,
.success-alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-base);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-base);
}

.error-alert {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--color-error);
}

.success-alert {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: var(--color-success);
}

.error-alert svg,
.success-alert svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.closed-alert {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-xl);
  background-color: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-lg);
  text-align: center;
}

.closed-alert > svg {
  width: 48px;
  height: 48px;
  color: var(--color-error);
}

.closed-content h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs) 0;
}

.closed-content p {
  color: var(--color-text-secondary);
  margin: 0;
}

.closed-alert .btn {
  margin-top: var(--spacing-base);
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

  .input-with-btn {
    flex-direction: column;
  }

  .send-code-btn {
    width: 100%;
    min-width: auto;
  }
}
</style>
