import { useUserStore } from '@/stores/user'

/**
 * 获取图片显示URL
 * - 公开图片：使用原始URL（快速，静态文件服务）
 * - 私有图片：使用代理URL（需要认证）
 */
export function getImageDisplayUrl(image: { id: number; url: string; thumbnail?: string; is_public: number }, useThumbnail = false): string {
  // 公开图片直接使用原始URL
  if (image.is_public === 1) {
    return useThumbnail && image.thumbnail ? image.thumbnail : image.url
  }

  // 私有图片使用代理URL
  const userStore = useUserStore()
  const token = userStore.getToken()
  const baseUrl = window.location.origin

  if (token) {
    return `${baseUrl}/i/${image.id}?auth=${encodeURIComponent(token)}${useThumbnail ? '&thumb=1' : ''}`
  }

  return `${baseUrl}/i/${image.id}${useThumbnail ? '?thumb=1' : ''}`
}

/**
 * 获取分享图片的显示URL
 * 使用分享token访问私有图片
 */
export function getShareImageUrl(imageId: number, shareCode: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/i/${imageId}?token=${encodeURIComponent(shareCode)}`
}
