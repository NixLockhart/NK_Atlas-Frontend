import request from '@/utils/request'
import type { Image, UploadOptions, ImageListResponse, ImageFilters, ImageCategory } from '@/types'

/**
 * 单文件上传
 * @param file - 要上传的图片文件
 * @param options - 上传选项（分类、相册 ID、来源等）
 * @param onProgress - 上传进度回调函数，参数为百分比数值
 * @returns 上传成功后的图片信息
 */
export function uploadImage(
  file: File,
  options?: UploadOptions,
  onProgress?: (percent: number) => void
) {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.category) formData.append('category', options.category)
  if (options?.album_id) formData.append('album_id', String(options.album_id))
  if (options?.source) formData.append('source', options.source)
  if (options?.source_domain) formData.append('source_domain', options.source_domain)

  return request.post<Image>('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    }
  })
}

/**
 * 批量上传图片
 * @param files - 要上传的图片文件数组
 * @param options - 上传选项（分类、来源等）
 * @returns 上传结果，包含成功的图片列表和失败数量
 */
export function batchUpload(files: File[], options?: UploadOptions) {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  if (options?.category) formData.append('category', options.category)
  if (options?.source) formData.append('source', options.source)

  return request.post<{ success: Image[]; failed: number }>('/images/batch-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 获取图片列表
 * @param page - 页码，默认为 1
 * @param pageSize - 每页数量，默认为 20
 * @returns 分页的图片列表
 */
export function getImageList(page = 1, pageSize = 20) {
  return request.get<ImageListResponse>('/images', { params: { page, page_size: pageSize } })
}

/**
 * 搜索图片
 * @param keyword - 搜索关键词
 * @param page - 页码，默认为 1
 * @param pageSize - 每页数量，默认为 20
 * @returns 分页的搜索结果列表
 */
export function searchImages(keyword: string, page = 1, pageSize = 20) {
  return request.get<ImageListResponse>('/images/search', { params: { keyword, page, page_size: pageSize } })
}

/**
 * 带筛选条件获取图片列表
 * @param filters - 筛选条件（相册、分类、类型、日期、大小、排序等）
 * @param page - 页码，默认为 1
 * @param pageSize - 每页数量，默认为 20
 * @returns 分页的筛选结果列表
 */
export function getImagesWithFilters(filters: ImageFilters, page = 1, pageSize = 20) {
  return request.get<ImageListResponse>('/images/filter', {
    params: {
      ...filters,
      page,
      page_size: pageSize
    }
  })
}

/**
 * 获取图片分类列表
 * @returns 所有图片分类
 */
export function getCategories() {
  return request.get<ImageCategory[]>('/images/categories')
}

/**
 * 获取图片详情
 * @param id - 图片 ID
 * @returns 图片详细信息
 */
export function getImageById(id: number) {
  return request.get<Image>(`/images/${id}`)
}

/**
 * 重命名图片
 * @param id - 图片 ID
 * @param name - 新的图片名称
 * @returns 重命名结果
 */
export function renameImage(id: number, name: string) {
  return request.put(`/images/${id}/rename`, { name })
}

/**
 * 移动图片到指定相册
 * @param ids - 要移动的图片 ID 数组
 * @param albumId - 目标相册 ID，不传则移出相册
 * @returns 移动结果
 */
export function moveToAlbum(ids: number[], albumId?: number) {
  return request.post('/images/move', { ids, album_id: albumId })
}

/**
 * 删除图片（移入回收站）
 * @param id - 图片 ID
 * @returns 删除结果
 */
export function deleteImage(id: number) {
  return request.delete(`/images/${id}`)
}

/**
 * 批量删除图片（移入回收站）
 * @param ids - 要删除的图片 ID 数组
 * @returns 删除结果
 */
export function batchDeleteImages(ids: number[]) {
  return request.post('/images/batch-delete', { ids })
}

/**
 * 获取回收站图片列表
 * @param page - 页码，默认为 1
 * @param pageSize - 每页数量，默认为 20
 * @returns 分页的回收站图片列表
 */
export function getTrashList(page = 1, pageSize = 20) {
  return request.get<ImageListResponse>('/trash', { params: { page, page_size: pageSize } })
}

/**
 * 从回收站恢复图片
 * @param id - 图片 ID
 * @returns 恢复结果
 */
export function restoreImage(id: number) {
  return request.post(`/trash/${id}/restore`)
}

/**
 * 批量从回收站恢复图片
 * @param ids - 要恢复的图片 ID 数组
 * @returns 恢复结果
 */
export function batchRestoreImages(ids: number[]) {
  return request.post('/trash/batch-restore', { ids })
}

/**
 * 彻底删除图片（不可恢复）
 * @param id - 图片 ID
 * @returns 删除结果
 */
export function permanentDeleteImage(id: number) {
  return request.delete(`/trash/${id}`)
}

/**
 * 批量彻底删除图片（不可恢复）
 * @param ids - 要彻底删除的图片 ID 数组
 * @returns 删除结果
 */
export function batchPermanentDeleteImages(ids: number[]) {
  return request.post('/trash/batch-delete', { ids })
}

/**
 * 设置单张图片的可见性
 * @param id - 图片 ID
 * @param isPublic - 可见性标志（1 为公开，0 为私有）
 * @returns 设置结果
 */
export function setImageVisibility(id: number, isPublic: number) {
  return request.put(`/images/${id}/visibility`, { is_public: isPublic })
}

/**
 * 批量设置图片的可见性
 * @param ids - 图片 ID 数组
 * @param isPublic - 可见性标志（1 为公开，0 为私有）
 * @returns 设置结果
 */
export function batchSetImageVisibility(ids: number[], isPublic: number) {
  return request.put('/images/batch-visibility', { ids, is_public: isPublic })
}

/**
 * 获取上传限额信息
 * @returns 每日限额、已用数、剩余数
 */
export function getUploadLimit() {
  return request.get<{ daily_limit: number; used_today: number; remaining: number }>('/images/upload-limit')
}
