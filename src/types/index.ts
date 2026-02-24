// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 用户类型
export interface User {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string
  role: number
  status: number
  base_quota: number
  extra_quota: number
  used_space: number
  email_verified: boolean
  last_login_at: string
  created_at: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: User
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 注册请求
export interface RegisterRequest {
  username: string
  email: string
  password: string
  code: string
}

export * from './image'
export * from './share'
export * from './settings'
export * from './apiToken'
export * from './album'
export * from './link'
export * from './logs'
export * from './announcement'
export * from './admin'
export * from './whitelist'
