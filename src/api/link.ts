import request from '@/utils/request'
import type { LinkFormats } from '@/types'

/**
 * 获取图片的所有链接格式
 * @param imageId - 图片 ID
 * @returns 各种格式的链接（直链、Markdown、HTML、BBCode、短链接）
 */
export function getImageLinks(imageId: number) {
  return request.get<LinkFormats>(`/images/${imageId}/links`)
}
