import request from '@/utils/request'
import type { DomainWhitelist, CreateDomainRequest, UpdateDomainRequest } from '@/types'

// ========== 域名白名单管理 ==========

/**
 * 获取域名白名单列表
 * @returns 当前用户的域名白名单列表
 */
export function getDomains() {
  return request.get<DomainWhitelist[]>('/user/domains')
}

/**
 * 添加域名到白名单
 * @param data - 域名信息（域名、状态、备注）
 * @returns 创建成功后的域名白名单信息
 */
export function createDomain(data: CreateDomainRequest) {
  return request.post<DomainWhitelist>('/user/domains', data)
}

/**
 * 更新域名白名单信息
 * @param id - 域名白名单记录 ID
 * @param data - 要更新的域名信息（域名、状态、备注）
 * @returns 更新结果
 */
export function updateDomain(id: number, data: UpdateDomainRequest) {
  return request.put(`/user/domains/${id}`, data)
}

/**
 * 从白名单中删除域名
 * @param id - 域名白名单记录 ID
 * @returns 删除结果
 */
export function deleteDomain(id: number) {
  return request.delete(`/user/domains/${id}`)
}
