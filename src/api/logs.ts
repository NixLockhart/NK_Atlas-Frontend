import request from '@/utils/request'
import type { OperationLogListResponse, LoginLogListResponse } from '@/types'

// ========== 操作日志 ==========

/**
 * 获取操作日志列表
 * @param params - 查询参数（页码、每页数量、用户 ID、操作类型、目标）
 * @returns 分页的操作日志列表
 */
export function getOperationLogs(params: {
  page?: number
  page_size?: number
  user_id?: number
  action?: string
  target?: string
  status?: number
}) {
  return request.get<OperationLogListResponse>('/admin/logs/operation', { params })
}

// ========== 登录日志 ==========

/**
 * 获取登录日志列表
 * @param params - 查询参数（页码、每页数量、用户 ID、状态）
 * @returns 分页的登录日志列表
 */
export function getLoginLogs(params: {
  page?: number
  page_size?: number
  user_id?: number
  status?: number
}) {
  return request.get<LoginLogListResponse>('/admin/logs/login', { params })
}

/**
 * 清理 30 天前的登录日志
 * @returns 被清理的日志条数
 */
export function cleanLoginLogs() {
  return request.delete<{ deleted: number }>('/admin/logs/login/clean')
}

/**
 * 清理 30 天前的操作日志
 * @returns 被清理的日志条数
 */
export function cleanOperationLogs() {
  return request.delete<{ deleted: number }>('/admin/logs/operation/clean')
}
