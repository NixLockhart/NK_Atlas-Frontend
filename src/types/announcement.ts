// 公告相关类型定义

export interface Announcement {
  id: number
  title: string
  content: string
  start_time: string | null
  end_time: string | null
  enabled: number
  created_at: string
  updated_at: string
}

export interface CreateAnnouncementRequest {
  title: string
  content: string
  start_time?: string | null
  end_time?: string | null
  enabled: number
}

export interface UpdateAnnouncementRequest {
  title?: string
  content?: string
  start_time?: string | null
  end_time?: string | null
  enabled?: number
}
