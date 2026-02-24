import { ref } from 'vue'
import { getWatermarkSettings, updateWatermarkSettings, getWatermarkStatus } from '@/api/settings'
import type { WatermarkSettings, WatermarkStatus } from '@/types'

// 默认水印设置
const defaultSettings: WatermarkSettings = {
  enabled: false,
  type: 'text',
  text: 'NKAtlas',
  position: 'bottom-right',
  opacity: 0.8,
  sizeRatio: 0.04,
  minWidth: 300,
  minHeight: 300,
}

// 全局水印配置状态
const watermarkConfig = ref<WatermarkSettings>({ ...defaultSettings })
const watermarkStatus = ref<WatermarkStatus>({ available: true, message: '' })
const loading = ref(false)
const loaded = ref(false)
const statusLoaded = ref(false)

/**
 * 水印配置组合式函数
 * @description 提供水印设置的加载、保存、重置和服务状态管理功能，支持从服务端获取配置并持久化
 * @returns {{ watermarkConfig: Ref<WatermarkSettings>, watermarkStatus: Ref<WatermarkStatus>, loading: Ref<boolean>, loaded: Ref<boolean>, loadSettings: () => Promise<void>, loadStatus: () => Promise<void>, saveSettings: (settings?: WatermarkSettings) => Promise<boolean>, resetSettings: () => void, refreshSettings: () => Promise<void>, defaultSettings: WatermarkSettings }} 水印配置状态和操作方法
 */
export function useWatermark() {
  /**
   * 加载水印设置
   * @description 从服务端获取水印配置，已加载过则跳过；加载失败时回退到默认设置
   * @returns {Promise<void>}
   */
  async function loadSettings() {
    if (loaded.value) return

    loading.value = true
    try {
      const settings = await getWatermarkSettings()
      watermarkConfig.value = settings
      loaded.value = true
    } catch (error) {
      console.error('Failed to load watermark settings:', error)
      // 使用默认设置
      watermarkConfig.value = { ...defaultSettings }
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载水印服务状态
   * @description 从服务端获取水印服务的可用状态，已加载过则跳过
   * @returns {Promise<void>}
   */
  async function loadStatus() {
    if (statusLoaded.value) return

    try {
      const status = await getWatermarkStatus()
      watermarkStatus.value = status
      statusLoaded.value = true
    } catch (error) {
      console.error('Failed to load watermark status:', error)
      watermarkStatus.value = { available: false, message: '' }
    }
  }

  /**
   * 保存水印设置
   * @description 将水印配置保存到服务端，可传入自定义设置或使用当前配置
   * @param settings - 可选的水印设置对象，不传则使用当前 watermarkConfig
   * @returns {Promise<boolean>} 保存成功返回 true，失败返回 false
   */
  async function saveSettings(settings?: WatermarkSettings) {
    const toSave = settings || watermarkConfig.value
    loading.value = true
    try {
      await updateWatermarkSettings(toSave)
      watermarkConfig.value = { ...toSave }
      return true
    } catch (error) {
      console.error('Failed to save watermark settings:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置为默认设置
   * @description 将水印配置重置为内置的默认值（仅更新本地状态，不保存到服务端）
   */
  function resetSettings() {
    watermarkConfig.value = { ...defaultSettings }
  }

  /**
   * 刷新设置
   * @description 强制从服务端重新加载水印设置和服务状态，忽略本地缓存
   * @returns {Promise<void>}
   */
  let refreshing = false
  async function refreshSettings() {
    if (refreshing) return
    refreshing = true
    loaded.value = false
    statusLoaded.value = false
    try {
      await Promise.all([loadSettings(), loadStatus()])
    } finally {
      refreshing = false
    }
  }

  return {
    watermarkConfig,
    watermarkStatus,
    loading,
    loaded,
    loadSettings,
    loadStatus,
    saveSettings,
    resetSettings,
    refreshSettings,
    defaultSettings,
  }
}
