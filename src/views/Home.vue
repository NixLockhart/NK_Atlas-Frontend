<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn())
</script>

<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-logo">
          <img src="/favicon.svg" alt="NK" class="logo-icon" />
          <span class="logo-text">Atlas</span>
        </div>
        <h1 class="hero-title">{{ t('home.heroTitle') }}</h1>
        <p class="hero-subtitle">
          {{ t('home.heroSubtitle1') }}<br/>
          {{ t('home.heroSubtitle2') }}
        </p>
        <div class="hero-actions">
          <RouterLink v-if="isLoggedIn" to="/gallery" class="btn btn-primary btn-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {{ t('home.startUpload') }}
          </RouterLink>
          <template v-else>
            <RouterLink to="/register" class="btn btn-primary btn-lg">
              {{ t('home.freeRegister') }}
            </RouterLink>
            <RouterLink to="/login" class="btn btn-secondary btn-lg">
              {{ t('home.loginAccount') }}
            </RouterLink>
          </template>
        </div>
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">{{ t('home.features') }}</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h3 class="feature-title">{{ t('home.feature1Title') }}</h3>
          <p class="feature-desc">{{ t('home.feature1Desc') }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 class="feature-title">{{ t('home.feature2Title') }}</h3>
          <p class="feature-desc">{{ t('home.feature2Desc') }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h3 class="feature-title">{{ t('home.feature3Title') }}</h3>
          <p class="feature-desc">{{ t('home.feature3Desc') }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h3 class="feature-title">{{ t('home.feature4Title') }}</h3>
          <p class="feature-desc">{{ t('home.feature4Desc') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1000px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  padding: var(--spacing-3xl) 0;
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
}

.hero-logo {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
}

.logo-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-xl);
  object-fit: contain;
}

.logo-text {
  font-size: var(--text-4xl);
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--spacing-base);
  line-height: 1.3;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xl);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-base);
  flex-wrap: wrap;
}

.hero-actions .btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 140px;
}

.hero-actions .btn svg {
  width: 20px;
  height: 20px;
}

.features-section {
  padding: var(--spacing-2xl) 0;
}

.section-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 var(--spacing-xl);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-lg);
}

.feature-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  text-align: center;
  transition: var(--transition-base);
}

.feature-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--spacing-base);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-lg);
  color: white;
}

.feature-icon svg {
  width: 28px;
  height: 28px;
}

.feature-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm);
}

.feature-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .hero-title {
    font-size: var(--text-2xl);
  }

  .hero-subtitle {
    font-size: var(--text-base);
  }

  .logo-icon {
    width: 48px;
    height: 48px;
  }

  .logo-text {
    font-size: var(--text-3xl);
  }
}
</style>
