import { ref } from 'vue'

// 全局上传对话框状态
const uploadDialogVisible = ref(false)

/**
 * 上传对话框组合式函数
 * @description 提供全局上传对话框的状态管理和控制方法
 * @returns {{ uploadDialogVisible: Ref<boolean>, openUploadDialog: () => void, closeUploadDialog: () => void, toggleUploadDialog: () => void }} 上传对话框状态和操作方法
 */
export function useUpload() {
  /**
   * 打开上传对话框
   * @description 将上传对话框的可见状态设为 true
   */
  function openUploadDialog() {
    uploadDialogVisible.value = true
  }

  /**
   * 关闭上传对话框
   * @description 将上传对话框的可见状态设为 false
   */
  function closeUploadDialog() {
    uploadDialogVisible.value = false
  }

  /**
   * 切换上传对话框的显示状态
   * @description 在可见与隐藏之间切换上传对话框
   */
  function toggleUploadDialog() {
    uploadDialogVisible.value = !uploadDialogVisible.value
  }

  return {
    uploadDialogVisible,
    openUploadDialog,
    closeUploadDialog,
    toggleUploadDialog,
  }
}
