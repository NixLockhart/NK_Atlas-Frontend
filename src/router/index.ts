import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guest: true }
  },
  {
    path: '/user/profile',
    name: 'Profile',
    component: () => import('@/views/user/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/change-password',
    name: 'ChangePassword',
    component: () => import('@/views/user/ChangePasswordView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/settings',
    name: 'Settings',
    component: () => import('@/views/user/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/upload-settings',
    name: 'UploadSettings',
    component: () => import('@/views/user/UploadSettingsView.vue'),
    meta: { requiresAuth: true }
  },
  // Phase 4: 图片管理相关路由
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('@/views/gallery/GalleryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/albums',
    name: 'Albums',
    component: () => import('@/views/album/AlbumListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/albums/:id',
    name: 'AlbumDetail',
    component: () => import('@/views/album/AlbumDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trash',
    name: 'Trash',
    component: () => import('@/views/trash/TrashView.vue'),
    meta: { requiresAuth: true }
  },
  // Phase 5: 分享相关路由
  {
    path: '/s/:code',
    name: 'ShortLink',
    component: () => import('@/views/share/ShareRedirect.vue'),
  },
  {
    path: '/share/:code',
    name: 'ShareView',
    component: () => import('@/views/share/ShareView.vue'),
  },
  {
    path: '/shares',
    name: 'ShareManage',
    component: () => import('@/views/share/ShareManageView.vue'),
    meta: { requiresAuth: true }
  },
  // Phase 6: 管理后台路由
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/DashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/UsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/config',
    name: 'AdminConfig',
    component: () => import('@/views/admin/ConfigView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/logs/operation',
    name: 'AdminOperationLogs',
    component: () => import('@/views/admin/OperationLogView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/logs/login',
    name: 'AdminLoginLogs',
    component: () => import('@/views/admin/LoginLogView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/announcements',
    name: 'AdminAnnouncements',
    component: () => import('@/views/admin/AnnouncementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  // Phase 7: 用户功能路由
  {
    path: '/user/tokens',
    name: 'ApiTokens',
    component: () => import('@/views/user/ApiTokenView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/domains',
    name: 'DomainWhitelist',
    component: () => import('@/views/user/DomainWhitelistView.vue'),
    meta: { requiresAuth: true }
  },
  // 兼容旧的 /upload 路由，重定向到图片库
  {
    path: '/upload',
    redirect: '/gallery'
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    // 如果有保存的位置（浏览器前进/后退），恢复到该位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则滚动到页面顶部
    return { top: 0 }
  },
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  let isLoggedIn = userStore.isLoggedIn()

  // 检查 token 是否过期
  if (isLoggedIn) {
    const token = localStorage.getItem('token')
    if (token && isTokenExpired(token)) {
      userStore.logout()
      isLoggedIn = false
    }
  }

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 需要登录但未登录，跳转到登录页
    next('/login')
  } else if (to.meta.guest && isLoggedIn) {
    // 游客页面但已登录，跳转到图片库
    next('/gallery')
  } else if (to.meta.requiresAdmin) {
    // 需要管理员权限，确保已获取用户信息
    if (!userStore.userInfo) {
      await userStore.fetchUserInfo()
    }
    if (!userStore.isAdmin) {
      next('/gallery')
    } else {
      next()
    }
  } else if (to.path === '/' && isLoggedIn) {
    // 已登录用户访问首页，跳转到图片库
    next('/gallery')
  } else {
    next()
  }
})

export default router
