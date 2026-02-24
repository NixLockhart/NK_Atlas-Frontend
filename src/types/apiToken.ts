// API Token 相关类型定义

export interface APIToken {
  id: number
  user_id: number
  name: string
  token_prefix: string
  permissions: string
  status: number
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateTokenRequest {
  name: string
  permissions: string
  expires_at?: string | undefined
}

export interface CreateTokenResponse {
  token: string
  token_info: APIToken
}

export interface UpdateTokenRequest {
  name?: string
  permissions?: string
  status?: number
  expires_at?: string
}
