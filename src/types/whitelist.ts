export interface DomainWhitelist {
  id: number
  user_id: number
  domain: string
  status: number
  remark: string
  created_at: string
  updated_at: string
}

export interface CreateDomainRequest {
  domain: string
  status?: number
  remark?: string
}

export interface UpdateDomainRequest {
  domain?: string
  status?: number
  remark?: string
}
