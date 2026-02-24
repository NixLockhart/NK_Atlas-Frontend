// 设置相关类型定义

// 水印设置接口
export interface WatermarkSettings {
  enabled: boolean
  type: 'text' | 'image'
  text: string
  position: string
  opacity: number
  sizeRatio: number
  minWidth: number
  minHeight: number
}

// 上传设置接口
export interface UploadSettings {
  compressionQuality: number  // 压缩质量 0-100
  keepOriginalFormat: boolean // 保留原格式（不转换为webp）
}

// 水印服务状态
export interface WatermarkStatus {
  available: boolean
  message: string
}

// 用户设置接口
export interface UserSettings {
  id: number
  user_id: number
  watermark_settings: WatermarkSettings
  upload_settings: UploadSettings
  created_at: string
  updated_at: string
}
