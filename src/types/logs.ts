// 日志相关类型定义

export interface OperationLog {
  id: number
  user_id: number
  username: string
  action: string
  target: string
  target_id: number
  ip: string
  user_agent: string
  detail: string
  status: number
  created_at: string
}

export interface OperationLogListResponse {
  list: OperationLog[]
  total: number
  page: number
  page_size: number
}

export interface LoginLog {
  id: number
  user_id: number
  username: string
  ip: string
  location: string
  device: string
  browser: string
  os: string
  status: number
  message: string
  created_at: string
}

export interface LoginLogListResponse {
  list: LoginLog[]
  total: number
  page: number
  page_size: number
}
