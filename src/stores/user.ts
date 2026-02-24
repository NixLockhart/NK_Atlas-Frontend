import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { getProfile } from '@/api/user'
import { STORAGE_KEYS } from '@/config'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<User | null>(null)

  // 计算属性：总配额
  const totalQuota = computed(() => {
    if (!userInfo.value) return 0
    return userInfo.value.base_quota + userInfo.value.extra_quota
  })

  // 计算属性：可用空间
  const availableSpace = computed(() => {
    if (!userInfo.value) return 0
    return totalQuota.value - userInfo.value.used_space
  })

  // 计算属性：使用百分比
  const usagePercent = computed(() => {
    if (!totalQuota.value) return 0
    return Math.round((userInfo.value?.used_space || 0) / totalQuota.value * 100)
  })

  // 计算属性：是否为管理员
  const isAdmin = computed(() => {
    return userInfo.value?.role === 2
  })

  function setToken(t: string) {
    token.value = t
    localStorage.setItem(STORAGE_KEYS.TOKEN, t)
  }

  function getToken() {
    if (!token.value) {
      token.value = localStorage.getItem(STORAGE_KEYS.TOKEN) || ''
    }
    return token.value
  }

  function setUserInfo(user: User) {
    userInfo.value = user
  }

  async function fetchUserInfo() {
    try {
      const user = await getProfile()
      userInfo.value = user
      return user
    } catch (error) {
      return null
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
  }

  function isLoggedIn() {
    return !!getToken()
  }

  return {
    token,
    userInfo,
    totalQuota,
    availableSpace,
    usagePercent,
    isAdmin,
    setToken,
    getToken,
    setUserInfo,
    fetchUserInfo,
    logout,
    isLoggedIn
  }
})
