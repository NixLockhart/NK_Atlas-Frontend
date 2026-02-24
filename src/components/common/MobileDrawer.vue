<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

const { t } = useI18n()

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'logout'): void
}>()

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const isLoggedIn = computed(() => userStore.isLoggedIn())
const userInfo = computed(() => userStore.userInfo)
const isAdmin = computed(() => userStore.isAdmin)

// 路由变化时关闭抽屉
watch(() => route.path, () => {
  emit('close')
})

function handleLogout() {
  emit('close')
  emit('logout')
}

function navigateTo(path: string) {
  router.push(path)
  emit('close')
}

const navItems = computed(() => [
  { path: '/gallery', icon: 'gallery', label: t('nav.gallery') },
  { path: '/albums', icon: 'folder', label: t('nav.albums') },
  { path: '/trash', icon: 'trash', label: t('nav.trash') },
  { path: '/shares', icon: 'share', label: t('nav.shares') },
  { path: '/user/profile', icon: 'user', label: t('nav.profile') },
])

const adminItems = computed(() => [
  { path: '/admin', icon: 'dashboard', label: t('nav.admin') },
])
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="drawer-overlay" @click="emit('close')">
        <div class="drawer" @click.stop>
          <!-- 用户信息 -->
          <div class="drawer-header">
            <template v-if="isLoggedIn">
              <div class="user-avatar">
                <img v-if="userInfo?.avatar" :src="userInfo.avatar" :alt="userInfo.nickname" />
                <span v-else class="avatar-placeholder">
                  {{ (userInfo?.nickname || userInfo?.username || 'U').charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="user-info">
                <p class="user-name">{{ userInfo?.nickname || userInfo?.username }}</p>
                <p class="user-email">{{ userInfo?.email }}</p>
              </div>
            </template>
            <template v-else>
              <p class="guest-text">{{ t('common.pleaseLogin') }}</p>
            </template>
          </div>

          <!-- 导航列表 -->
          <nav class="drawer-nav">
            <template v-if="isLoggedIn">
              <button
                v-for="item in navItems"
                :key="item.path"
                class="nav-item"
                :class="{ active: route.path === item.path }"
                @click="navigateTo(item.path)"
              >
                <!-- 图片库图标 -->
                <svg v-if="item.icon === 'gallery'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <!-- 文件夹图标 -->
                <svg v-else-if="item.icon === 'folder'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <!-- 回收站图标 -->
                <svg v-else-if="item.icon === 'trash'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <!-- 分享图标 -->
                <svg v-else-if="item.icon === 'share'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                <!-- 用户图标 -->
                <svg v-else-if="item.icon === 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{{ item.label }}</span>
              </button>

              <!-- 管理后台 -->
              <template v-if="isAdmin">
                <div class="nav-divider"></div>
                <button
                  v-for="item in adminItems"
                  :key="item.path"
                  class="nav-item"
                  :class="{ active: route.path.startsWith('/admin') }"
                  @click="navigateTo(item.path)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  <span>{{ item.label }}</span>
                </button>
              </template>
            </template>
            <template v-else>
              <button class="nav-item" @click="navigateTo('/login')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span>{{ t('nav.login') }}</span>
              </button>
              <button class="nav-item" @click="navigateTo('/register')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                <span>{{ t('nav.register') }}</span>
              </button>
            </template>
          </nav>

          <!-- 底部操作 -->
          <div class="drawer-footer">
            <button class="footer-btn" @click="themeStore.toggle">
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
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <span>{{ themeStore.actualTheme === 'dark' ? t('settings.themeLight') : t('settings.themeDark') }}</span>
            </button>
            <button v-if="isLoggedIn" class="footer-btn logout" @click="handleLogout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>{{ t('nav.logout') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.drawer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  max-width: 85vw;
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-lg) var(--spacing-base);
  padding-top: max(var(--spacing-lg), env(safe-area-inset-top));
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  font-size: var(--text-lg);
  font-weight: 600;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guest-text {
  color: var(--color-text-secondary);
  margin: 0;
}

.drawer-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm) 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  width: 100%;
  padding: var(--spacing-base) var(--spacing-lg);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-fast);
}

.nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.nav-item.active {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.nav-item svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-sm) var(--spacing-lg);
}

.drawer-footer {
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-sm) 0;
  padding-bottom: max(var(--spacing-sm), env(safe-area-inset-bottom));
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  width: 100%;
  padding: var(--spacing-base) var(--spacing-lg);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-fast);
}

.footer-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.footer-btn.logout {
  color: var(--color-error);
}

.footer-btn.logout:hover {
  background: rgba(239, 68, 68, 0.1);
}

.footer-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* 过渡动画 */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(-100%);
}
</style>
