import request from '@/utils/request'
import type { WatermarkSettings, UploadSettings, WatermarkStatus, UserSettings } from '@/types'

/**
 * 获取水印设置
 * @returns 当前用户的水印配置
 */
export function getWatermarkSettings() {
  return request.get<WatermarkSettings>('/user/settings/watermark')
}

/**
 * 更新水印设置
 * @param settings - 水印配置（启用状态、类型、文本、位置、透明度等）
 * @returns 更新结果
 */
export function updateWatermarkSettings(settings: WatermarkSettings) {
  return request.put('/user/settings/watermark', settings)
}

/**
 * 获取水印服务状态
 * @returns 水印服务的可用状态和消息
 */
export function getWatermarkStatus() {
  return request.get<WatermarkStatus>('/user/settings/watermark/status')
}

/**
 * 获取所有用户设置
 * @returns 完整的用户设置信息（包含水印和上传设置）
 */
export function getUserSettings() {
  return request.get<UserSettings>('/user/settings')
}

/**
 * 获取上传设置
 * @returns 当前用户的上传配置（压缩质量、是否保留原格式）
 */
export function getUploadSettings() {
  return request.get<UploadSettings>('/user/settings/upload')
}

/**
 * 更新上传设置
 * @param settings - 上传配置（压缩质量、是否保留原格式）
 * @returns 更新结果
 */
export function updateUploadSettings(settings: UploadSettings) {
  return request.put('/user/settings/upload', settings)
}
