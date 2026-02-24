import request from '@/utils/request'
import type { User, LoginRequest, LoginResponse, RegisterRequest } from '@/types'

/**
 * 发送注册验证码
 * @param email - 用户邮箱地址
 * @returns 发送结果
 */
export function sendRegisterCode(email: string) {
  return request.post('/auth/send-code', { email })
}

/**
 * 用户注册
 * @param data - 注册请求数据（用户名、密码、邮箱、验证码等）
 * @returns 注册成功后的用户信息
 */
export function register(data: RegisterRequest) {
  return request.post<User>('/auth/register', data)
}

/**
 * 用户登录
 * @param data - 登录请求数据（用户名、密码）
 * @returns 登录响应（token 和用户信息）
 */
export function login(data: LoginRequest) {
  return request.post<LoginResponse>('/auth/login', data)
}

/**
 * 刷新 Token
 * @returns 新的 token 字符串
 */
export function refreshToken() {
  return request.post<{ token: string }>('/auth/refresh')
}

/**
 * 发送密码重置验证码
 * @param email - 用户邮箱地址
 * @returns 发送结果
 */
export function sendResetCode(email: string) {
  return request.post('/auth/reset-code', { email })
}

/**
 * 重置密码
 * @param email - 用户邮箱地址
 * @param code - 验证码
 * @param newPassword - 新密码
 * @returns 重置结果
 */
export function resetPassword(email: string, code: string, newPassword: string) {
  return request.post('/auth/reset-password', {
    email,
    code,
    new_password: newPassword
  })
}
