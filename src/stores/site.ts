import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'
import { getActiveAnnouncements } from '@/api/announcement'
import type { Announcement } from '@/types'

interface SiteConfig {
  site_name: string
  site_desc: string
  site_url: string
  allow_register: boolean
  register_closed_reason: string
  max_upload_size: number
  allowed_types: string[]
  recycle_days: number
}

export const useSiteStore = defineStore('site', () => {
  const siteName = ref('NKAtlas')
  const siteDesc = ref('')
  const siteUrl = ref('')
  const allowRegister = ref(true)
  const registerClosedReason = ref('')
  const maxUploadSize = ref(10 * 1024 * 1024) // 默认 10MB
  const allowedTypes = ref<string[]>(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  const recycleDays = ref(10) // 默认 10 天
  const loaded = ref(false)

  // 公告相关
  const announcements = ref<Announcement[]>([])
  const announcementsClosed = ref(false)

  async function fetchSiteConfig() {
    if (loaded.value) return

    try {
      // 获取公开的站点配置（不需要登录）
      const data = await request.get<SiteConfig>('/site/config')
      if (data) {
        siteName.value = data.site_name || 'NKAtlas'
        siteDesc.value = data.site_desc || ''
        siteUrl.value = data.site_url || ''
        allowRegister.value = data.allow_register !== false
        registerClosedReason.value = data.register_closed_reason || ''
        maxUploadSize.value = data.max_upload_size || 10 * 1024 * 1024
        allowedTypes.value = data.allowed_types || ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        recycleDays.value = data.recycle_days || 10
      }
      loaded.value = true

      // 更新页面标题
      document.title = siteName.value
    } catch {
      // 使用默认值
      loaded.value = true
    }
  }

  // 加载公告
  async function loadAnnouncements() {
    // 检查是否被用户关闭过（当前会话）
    const closed = sessionStorage.getItem('announcements_closed')
    if (closed === 'true') {
      announcementsClosed.value = true
      return
    }

    try {
      announcements.value = await getActiveAnnouncements()
    } catch {
      announcements.value = []
    }
  }

  // 关闭公告
  function closeAnnouncements() {
    announcementsClosed.value = true
    sessionStorage.setItem('announcements_closed', 'true')
  }

  // 强制刷新站点配置
  function refreshSiteConfig() {
    loaded.value = false
    return fetchSiteConfig()
  }

  // 获取允许的文件类型（用于 input accept 属性）
  function getAllowedTypesAccept() {
    return allowedTypes.value.join(',')
  }

  return {
    siteName,
    siteDesc,
    siteUrl,
    allowRegister,
    registerClosedReason,
    maxUploadSize,
    allowedTypes,
    recycleDays,
    loaded,
    announcements,
    announcementsClosed,
    fetchSiteConfig,
    refreshSiteConfig,
    getAllowedTypesAccept,
    loadAnnouncements,
    closeAnnouncements
  }
})
