import type { User } from './index'

export interface UserListResponse {
  list: User[]
  total: number
  page: number
  page_size: number
}

export interface UpdateUserRequest {
  status?: number
  role?: number
  extra_quota?: number
}

export interface SystemConfig {
  id: number
  group: string
  key: string
  value: string
  type: string
  desc: string
  updated_at: string
}

export interface SetConfigRequest {
  group: string
  key: string
  value: string
  type?: string
  desc?: string
}

export interface DashboardStats {
  total_users: number
  total_images: number
  total_storage: number
  today_uploads: number
  today_logins: number
  new_users_today: number
  new_users_week: number
  active_users_week: number
}

export interface GrowthData {
  date: string
  count: number
}

export interface UserStorage {
  user_id: number
  username: string
  used_space: number
}

export interface StorageStats {
  total_space: number
  used_space: number
  user_count: number
  image_count: number
  top_users: UserStorage[]
  storage_by_type: Record<string, number>
}
