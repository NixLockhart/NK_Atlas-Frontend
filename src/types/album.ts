// 相册相关类型定义

export interface Album {
  id: number
  user_id: number
  name: string
  description: string
  cover_id?: number
  cover_url: string
  image_count: number
  sort: number
  is_public: number
  created_at: string
  updated_at: string
}

export interface AlbumListResponse {
  list: Album[]
  total: number
  page: number
}

export interface CreateAlbumData {
  name: string
  description?: string
}

export interface UpdateAlbumData {
  name: string
  description?: string
}

export interface SortItem {
  id: number
  sort: number
}
