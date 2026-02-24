import request from '@/utils/request'
import type { User, UserListResponse, UpdateUserRequest, SystemConfig, SetConfigRequest, DashboardStats, GrowthData, StorageStats } from '@/types'

// ========== 用户管理 ==========

/**
 * 获取用户列表（管理员）
 * @param params - 查询参数（页码、每页数量、关键词、排序字段、排序方向）
 * @returns 分页的用户列表
 */
export function getUsers(params: {
  page?: number
  page_size?: number
  keyword?: string
  sort_by?: string
  sort_order?: string
}) {
  return request.get<UserListResponse>('/admin/users', { params })
}

/**
 * 获取用户详情（管理员）
 * @param id - 用户 ID
 * @returns 用户详细信息
 */
export function getUser(id: number) {
  return request.get<User>(`/admin/users/${id}`)
}

/**
 * 更新用户信息（管理员）
 * @param id - 用户 ID
 * @param data - 要更新的用户信息（状态、角色、额外配额）
 * @returns 更新结果
 */
export function updateUser(id: number, data: UpdateUserRequest) {
  return request.put(`/admin/users/${id}`, data)
}

/**
 * 删除用户（管理员）
 * @param id - 用户 ID
 * @returns 删除结果
 */
export function deleteUser(id: number) {
  return request.delete(`/admin/users/${id}`)
}

// ========== 系统配置 ==========

/**
 * 获取系统配置列表
 * @param group - 配置分组名称，不传则获取所有分组
 * @returns 配置列表或按分组归类的配置对象
 */
export function getConfigs(group?: string) {
  return request.get<SystemConfig[] | Record<string, SystemConfig[]>>('/admin/configs', {
    params: group ? { group } : undefined
  })
}

/**
 * 获取单个系统配置
 * @param key - 配置键名
 * @returns 配置详细信息
 */
export function getConfig(key: string) {
  return request.get<SystemConfig>(`/admin/configs/${key}`)
}

/**
 * 设置系统配置
 * @param data - 配置数据（分组、键名、值、类型、描述）
 * @returns 设置结果
 */
export function setConfig(data: SetConfigRequest) {
  return request.post('/admin/configs', data)
}

/**
 * 同步默认配额到所有用户
 * @returns 同步结果
 */
export function syncQuotaToAllUsers() {
  return request.post('/admin/configs/sync-quota')
}

/**
 * 删除系统配置
 * @param key - 配置键名
 * @returns 删除结果
 */
export function deleteConfig(key: string) {
  return request.delete(`/admin/configs/${key}`)
}

// ========== 数据统计 ==========

/**
 * 获取仪表盘统计数据
 * @returns 仪表盘统计信息（用户数、图片数、存储量、今日上传等）
 */
export function getDashboardStats() {
  return request.get<DashboardStats>('/admin/stats/dashboard')
}

/**
 * 获取用户增长趋势数据
 * @param days - 查询天数，默认为 30
 * @returns 按日期统计的用户增长数据
 */
export function getUserGrowth(days = 30) {
  return request.get<GrowthData[]>('/admin/stats/users', { params: { days } })
}

/**
 * 获取上传统计趋势数据
 * @param days - 查询天数，默认为 30
 * @returns 按日期统计的上传数据
 */
export function getUploadStats(days = 30) {
  return request.get<GrowthData[]>('/admin/stats/uploads', { params: { days } })
}

/**
 * 获取存储统计数据
 * @returns 存储统计信息（总空间、已用空间、用户数、图片数、Top 用户、按类型统计）
 */
export function getStorageStats() {
  return request.get<StorageStats>('/admin/stats/storage')
}
