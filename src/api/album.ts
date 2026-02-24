import request from '@/utils/request'
import type { Album, AlbumListResponse, CreateAlbumData, UpdateAlbumData, SortItem } from '@/types'

/**
 * 创建相册
 * @param data - 相册信息（名称、描述）
 * @returns 创建成功后的相册信息
 */
export function createAlbum(data: CreateAlbumData) {
  return request.post<Album>('/albums', data)
}

/**
 * 获取相册列表（分页）
 * @param page - 页码，默认为 1
 * @param pageSize - 每页数量，默认为 20
 * @returns 分页的相册列表
 */
export function getAlbumList(page = 1, pageSize = 20) {
  return request.get<AlbumListResponse>('/albums', { params: { page, page_size: pageSize } })
}

/**
 * 获取所有相册（不分页，用于下拉选择）
 * @returns 全部相册列表
 */
export function getAllAlbums() {
  return request.get<Album[]>('/albums/all')
}

/**
 * 获取相册详情
 * @param id - 相册 ID
 * @returns 相册详细信息
 */
export function getAlbumById(id: number) {
  return request.get<Album>(`/albums/${id}`)
}

/**
 * 更新相册信息
 * @param id - 相册 ID
 * @param data - 要更新的相册信息（名称、描述）
 * @returns 更新结果
 */
export function updateAlbum(id: number, data: UpdateAlbumData) {
  return request.put(`/albums/${id}`, data)
}

/**
 * 删除相册
 * @param id - 相册 ID
 * @returns 删除结果
 */
export function deleteAlbum(id: number) {
  return request.delete(`/albums/${id}`)
}

/**
 * 设置相册封面
 * @param id - 相册 ID
 * @param imageId - 封面图片 ID
 * @returns 设置结果
 */
export function setAlbumCover(id: number, imageId: number) {
  return request.put(`/albums/${id}/cover`, { image_id: imageId })
}

/**
 * 批量更新相册排序
 * @param items - 排序项数组，每项包含相册 ID 和排序值
 * @returns 更新结果
 */
export function updateAlbumSort(items: SortItem[]) {
  return request.put('/albums/sort', { items })
}

/**
 * 重新计算所有相册的图片数量
 * @returns 计算结果
 */
export function recalculateAlbumCounts() {
  return request.post('/albums/recalculate-counts')
}
