import request from '@/utils/request'
import type { User } from '@/types'

/**
 * 获取当前登录用户信息
 * @returns 用户信息
 */
export function getProfile() {
  return request.get<User>('/user/profile')
}

/**
 * 更新用户资料
 * @param data - 需要更新的资料字段（昵称、头像）
 * @returns 更新结果
 */
export function updateProfile(data: { nickname?: string; avatar?: string }) {
  return request.put('/user/profile', data)
}

/**
 * 修改密码
 * @param data - 包含旧密码和新密码
 * @returns 修改结果
 */
export function changePassword(data: { old_password: string; new_password: string }) {
  return request.put('/user/password', data)
}

/**
 * 注销账号
 * @param password - 用户密码（用于身份确认）
 * @returns 注销结果
 */
export function deleteAccount(password: string) {
  return request.delete('/user/account', { data: { password } })
}

/**
 * 上传头像
 * @param file - 头像图片文件
 * @returns 上传成功后的头像 URL
 */
export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<{ avatar: string }>('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
