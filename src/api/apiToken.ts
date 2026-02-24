import request from '@/utils/request'
import type { APIToken, CreateTokenRequest, CreateTokenResponse, UpdateTokenRequest } from '@/types'

// ========== API Token 管理 ==========

/**
 * 创建 API Token
 * @param data - Token 创建信息（名称、权限、过期时间）
 * @returns 创建的 Token 字符串和 Token 详细信息
 */
export function createToken(data: CreateTokenRequest) {
  return request.post<CreateTokenResponse>('/user/tokens', data)
}

/**
 * 获取当前用户的 API Token 列表
 * @returns Token 列表
 */
export function getTokens() {
  return request.get<APIToken[]>('/user/tokens')
}

/**
 * 获取 API Token 详情
 * @param id - Token ID
 * @returns Token 详细信息
 */
export function getToken(id: number) {
  return request.get<APIToken>(`/user/tokens/${id}`)
}

/**
 * 更新 API Token
 * @param id - Token ID
 * @param data - 要更新的 Token 信息（名称、权限、状态、过期时间）
 * @returns 更新结果
 */
export function updateToken(id: number, data: UpdateTokenRequest) {
  return request.put(`/user/tokens/${id}`, data)
}

/**
 * 删除 API Token
 * @param id - Token ID
 * @returns 删除结果
 */
export function deleteToken(id: number) {
  return request.delete(`/user/tokens/${id}`)
}
