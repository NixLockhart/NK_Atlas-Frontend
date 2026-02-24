import request from '@/utils/request'
import type { Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest } from '@/types'

// ========== 公开接口 ==========

/**
 * 获取当前有效的公告列表
 * @returns 当前生效中的公告列表
 */
export function getActiveAnnouncements() {
  return request.get<Announcement[]>('/announcements/active')
}

// ========== 管理接口 ==========

/**
 * 获取所有公告（管理员）
 * @returns 全部公告列表
 */
export function getAllAnnouncements() {
  return request.get<Announcement[]>('/admin/announcements')
}

/**
 * 创建公告（管理员）
 * @param data - 公告信息（标题、内容、开始时间、结束时间、启用状态）
 * @returns 创建成功后的公告信息
 */
export function createAnnouncement(data: CreateAnnouncementRequest) {
  return request.post<Announcement>('/admin/announcements', data)
}

/**
 * 更新公告（管理员）
 * @param id - 公告 ID
 * @param data - 要更新的公告信息（标题、内容、开始时间、结束时间、启用状态）
 * @returns 更新结果
 */
export function updateAnnouncement(id: number, data: UpdateAnnouncementRequest) {
  return request.put(`/admin/announcements/${id}`, data)
}

/**
 * 删除公告（管理员）
 * @param id - 公告 ID
 * @returns 删除结果
 */
export function deleteAnnouncement(id: number) {
  return request.delete(`/admin/announcements/${id}`)
}
