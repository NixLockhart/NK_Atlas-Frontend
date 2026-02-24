import { ref, readonly } from 'vue'

/**
 * 确认对话框的配置选项
 * @description 用于自定义确认对话框的标题、内容、按钮文本和类型
 */
export interface ConfirmOptions {
  /** 对话框标题 */
  title?: string
  /** 对话框消息内容 */
  message: string
  /** 确认按钮文本 */
  confirmText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 对话框类型，影响样式展示 */
  type?: 'info' | 'warning' | 'danger'
}

/**
 * 确认对话框的内部状态
 * @description 包含对话框的可见性、内容和 Promise 回调
 */
export interface ConfirmState {
  /** 对话框是否可见 */
  visible: boolean
  /** 对话框标题 */
  title: string
  /** 对话框消息内容 */
  message: string
  /** 确认按钮文本 */
  confirmText: string
  /** 取消按钮文本 */
  cancelText: string
  /** 对话框类型 */
  type: 'info' | 'warning' | 'danger'
  /** Promise 的 resolve 回调，用于返回用户选择结果 */
  resolve: ((value: boolean) => void) | null
}

const state = ref<ConfirmState>({
  visible: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  type: 'info',
  resolve: null
})

/**
 * 显示确认对话框
 * @description 打开一个确认对话框，返回 Promise，用户点击确认时 resolve(true)，取消时 resolve(false)
 * @param options - 确认对话框配置选项或纯消息字符串
 * @returns {Promise<boolean>} 用户确认返回 true，取消返回 false
 */
function confirm(options: ConfirmOptions | string): Promise<boolean> {
  return new Promise((resolve) => {
    const opts = typeof options === 'string' ? { message: options } : options

    state.value = {
      visible: true,
      title: opts.title || '',
      message: opts.message,
      confirmText: opts.confirmText || '',
      cancelText: opts.cancelText || '',
      type: opts.type || 'info',
      resolve
    }
  })
}

/**
 * 处理用户点击确认按钮
 * @description 调用 resolve(true) 并关闭对话框
 */
function handleConfirm() {
  if (state.value.resolve) {
    state.value.resolve(true)
  }
  close()
}

/**
 * 处理用户点击取消按钮
 * @description 调用 resolve(false) 并关闭对话框
 */
function handleCancel() {
  if (state.value.resolve) {
    state.value.resolve(false)
  }
  close()
}

/**
 * 关闭确认对话框
 * @description 隐藏对话框并清除 resolve 回调
 */
function close() {
  state.value.visible = false
  state.value.resolve = null
}

/**
 * 确认对话框组合式函数
 * @description 提供基于 Promise 的确认对话框功能，支持自定义标题、内容、按钮文本和类型
 * @returns {{ state: Readonly<Ref<ConfirmState>>, confirm: (options: ConfirmOptions | string) => Promise<boolean>, handleConfirm: () => void, handleCancel: () => void, close: () => void }} 对话框状态和操作方法
 */
export function useConfirm() {
  return {
    state: readonly(state),
    confirm,
    handleConfirm,
    handleCancel,
    close
  }
}
