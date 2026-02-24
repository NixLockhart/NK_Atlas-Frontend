import request from '@/utils/request'
import type { Share, CreateShareData, UpdateShareData, ShareListResponse, PublicShareResponse } from '@/types'

/**
 * 创建分享链接
 * @param data - 分享配置（图片 ID、密码、过期天数、最大访问次数）
 * @returns 分享信息和分享链接
 */
export function createShare(data: CreateShareData) {
  return request.post<{ share: Share; share_url: string }>('/shares', data)
}

/**
 * 获取分享列表
 * @param page - 页码，默认为 1
 * @param pageSize - 每页数量，默认为 20
 * @returns 分页的分享列表（包含关联图片信息）
 */
export function getShareList(page = 1, pageSize = 20) {
  return request.get<ShareListResponse>('/shares', { params: { page, page_size: pageSize } })
}

/**
 * 更新分享设置
 * @param id - 分享 ID
 * @param data - 要更新的分享配置（密码、过期天数、最大访问次数）
 * @returns 更新结果
 */
export function updateShare(id: number, data: UpdateShareData) {
  return request.put(`/shares/${id}`, data)
}

/**
 * 删除分享
 * @param id - 分享 ID
 * @returns 删除结果
 */
export function deleteShare(id: number) {
  return request.delete(`/shares/${id}`)
}

/**
 * 获取公开分享信息（无需登录）
 * @param code - 分享短码
 * @returns 分享详情（是否需要密码、图片信息等）
 */
export function getPublicShare(code: string) {
  return request.get<PublicShareResponse>(`/share/${code}`)
}

/**
 * 验证分享密码（无需登录），成功后返回图片信息
 * @param code - 分享短码
 * @param password - 分享密码
 * @returns 验证结果及图片信息
 */
export function verifySharePassword(code: string, password: string) {
  return request.post<{ valid: boolean; image: PublicShareResponse['image'] }>(`/share/${code}/verify`, { password })
}

/**
 * 下载分享图片并记录下载次数（无需登录）
 * @param code - 分享短码
 * @returns 下载信息（分享 ID、图片 URL、文件名）
 */
export function downloadShare(code: string) {
  return request.get<{ share_id: number; url: string; filename: string }>(`/share/${code}/download`)
}

/**
 * 生成前端分享页面链接
 * @param code - 分享短码
 * @returns 完整的分享页面 URL
 */
export function generateShareUrl(code: string): string {
  return `${window.location.origin}/share/${code}`
}
