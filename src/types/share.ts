// 分享相关类型定义

export interface Share {
  id: number
  user_id: number
  image_id: number
  code: string
  password?: string
  expire_at?: string
  views: number
  max_views: number
  status: number
  created_at: string
}

export interface CreateShareData {
  image_id: number
  password?: string
  expire_days?: number
  max_views?: number
}

export interface UpdateShareData {
  password?: string
  expire_days?: number
  max_views?: number
}

export interface ShareWithImage {
  id: number
  code: string
  password: boolean
  expire_at?: string
  views: number
  max_views: number
  status: number
  created_at: string
  share_url: string
  image?: {
    id: number
    name: string
    original_name: string
    url: string
    thumbnail: string
  }
}

export interface ShareListResponse {
  list: ShareWithImage[]
  total: number
  page: number
}

export interface PublicShareResponse {
  need_password: boolean
  share: {
    code: string
    views: number
    created_at: string
  }
  image?: {
    id: number
    name: string
    original_name: string
    url: string
    thumbnail: string
    width: number
    height: number
    size: number
    mime_type: string
  }
}
