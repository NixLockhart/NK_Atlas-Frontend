<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useRouter } from 'vue-router'
import MobileDrawer from '@/components/common/MobileDrawer.vue'

const { t } = useI18n()
const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()

const isLoggedIn = computed(() => userStore.isLoggedIn())
const userInfo = computed(() => userStore.userInfo)
const isAdmin = computed(() => userStore.isAdmin)

// 移动端抽屉状态
const drawerVisible = ref(false)

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <!-- 移动端菜单按钮 -->
      <button class="menu-toggle hide-desktop" @click="drawerVisible = true" :aria-label="t('nav.menu')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <!-- Logo -->
      <RouterLink to="/" class="logo">
        <img src="/favicon.svg" alt="NK" class="logo-icon" />
        <span class="logo-text">Atlas</span>
      </RouterLink>

      <!-- 导航 (桌面端) -->
      <nav class="nav-menu hide-mobile">
        <template v-if="isLoggedIn">
          <RouterLink to="/gallery" class="nav-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>{{ t('nav.gallery') }}</span>
          </RouterLink>
          <RouterLink to="/albums" class="nav-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{{ t('nav.albums') }}</span>
          </RouterLink>
          <RouterLink to="/trash" class="nav-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>{{ t('nav.trash') }}</span>
          </RouterLink>
          <RouterLink to="/shares" class="nav-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>{{ t('nav.shares') }}</span>
          </RouterLink>
          <RouterLink to="/user/profile" class="nav-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>{{ userInfo?.nickname || userInfo?.username || t('nav.profile') }}</span>
          </RouterLink>
          <RouterLink v-if="isAdmin" to="/admin" class="nav-link admin-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>{{ t('nav.admin') }}</span>
          </RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/login" class="nav-link">{{ t('nav.login') }}</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm">{{ t('nav.register') }}</RouterLink>
        </template>

        <!-- 主题切换 -->
        <button class="theme-toggle" @click="themeStore.toggle" :title="themeStore.actualTheme === 'light' ? t('settings.themeDark') : t('settings.themeLight')">
          <!-- 太阳图标 (暗色模式显示) -->
          <svg v-if="themeStore.actualTheme === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <!-- 月亮图标 (亮色模式显示) -->
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        <!-- 退出登录 -->
        <button v-if="isLoggedIn" class="logout-btn" @click="handleLogout" :title="t('nav.logout')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </nav>
    </div>
  </header>

  <!-- 移动端抽屉 -->
  <MobileDrawer
    :visible="drawerVisible"
    @close="drawerVisible = false"
    @logout="handleLogout"
  />
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background-color: var(--header-bg);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-base);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 700;
  font-size: var(--text-xl);
  color: var(--color-text);
  text-decoration: none;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  object-fit: contain;
}

.logo-text {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  border-radius: var(--radius-base);
  transition: var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-primary);
  background-color: var(--color-bg-secondary);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  background-color: var(--color-bg-secondary);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.theme-toggle,
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-base);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.theme-toggle:hover,
.logout-btn:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
}

.theme-toggle svg,
.logout-btn svg {
  width: 20px;
  height: 20px;
}

.logout-btn {
  color: var(--color-error);
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-base);
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition-fast);
}

.menu-toggle:hover {
  background-color: var(--color-bg-secondary);
}

.menu-toggle svg {
  width: 24px;
  height: 24px;
}

@media (max-width: 768px) {
  .nav-link {
    padding: var(--spacing-sm);
  }

  .header-content {
    gap: var(--spacing-sm);
  }

  .logo {
    flex: 1;
  }
}
</style>
