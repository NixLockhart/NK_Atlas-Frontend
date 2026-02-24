// 图片相关类型定义

export interface Image {
  id: number
  user_id: number
  album_id?: number
  category_id?: number
  name: string
  original_name: string
  path: string
  url: string
  thumbnail: string
  size: number
  width: number
  height: number
  mime_type: string
  hash: string
  storage_id: number
  is_public: number
  short_code: string
  source: string
  source_domain: string
  original_size: number
  views: number
  downloads: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface UploadOptions {
  category?: string
  album_id?: number
  source?: string
  source_domain?: string
}

export interface ImageListResponse {
  list: Image[]
  total: number
  page: number
}

export interface ImageFilters {
  album_id?: number
  category_id?: number
  mime_type?: string
  start_date?: string
  end_date?: string
  min_size?: number
  max_size?: number
  order_by?: string
  order_dir?: 'ASC' | 'DESC'
}

export interface ImageCategory {
  id: number
  code: string
  name: string
  icon: string
  sort_order: number
  is_system: number
}
