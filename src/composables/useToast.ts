import { ref, readonly } from 'vue'
import { CONFIG } from '@/config'

/** Toast 通知的类型 */
export type ToastType = 'info' | 'success' | 'error'

/**
 * Toast 通知对象
 * @description 表示一个 toast 通知的数据结构
 */
export interface Toast {
  /** 通知的唯一标识 */
  id: number
  /** 通知类型 */
  type: ToastType
  /** 通知消息内容 */
  message: string
  /** 是否正在离开（用于退出动画） */
  leaving?: boolean
}

const toasts = ref<Toast[]>([])
let toastId = Date.now()

const MAX_TOASTS = CONFIG.maxToasts
const TOAST_DURATION = CONFIG.toastDuration

/**
 * 添加一个新的 toast 通知
 * @description 创建 toast 并添加到队列中，超出最大数量时自动移除最旧的通知，5秒后自动消失
 * @param type - 通知类型：info、success 或 error
 * @param message - 通知消息内容
 */
function addToast(type: ToastType, message: string) {
  const id = ++toastId
  const toast: Toast = { id, type, message }

  // 如果已经有3个，标记最上面的（最旧的）为离开状态
  if (toasts.value.length >= MAX_TOASTS) {
    const oldest = toasts.value[toasts.value.length - 1]
    oldest.leaving = true
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== oldest.id)
    }, 300)
  }

  // 新 toast 添加到数组开头，配合 column-reverse 显示在底部
  toasts.value.unshift(toast)

  // 5秒后自动移除
  setTimeout(() => {
    removeToast(id)
  }, TOAST_DURATION)
}

/**
 * 移除指定的 toast 通知
 * @description 标记 toast 为离开状态并在动画结束后从队列中移除
 * @param id - 要移除的 toast 通知 ID
 */
function removeToast(id: number) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value[index].leaving = true
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 300)
  }
}

/**
 * Toast 通知组合式函数
 * @description 提供 toast 通知的显示、自动消失和管理功能，支持 info、success、error 三种类型，最多同时显示 3 个通知
 * @returns {{ toasts: Readonly<Ref<Toast[]>>, info: (message: string) => void, success: (message: string) => void, error: (message: string) => void, remove: (id: number) => void }} toast 状态和操作方法
 */
export function useToast() {
  return {
    toasts: readonly(toasts),
    info: (message: string) => addToast('info', message),
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    remove: removeToast
  }
}
