<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminNav from '@/components/admin/AdminNav.vue'
import DateTimePicker from '@/components/common/DateTimePicker.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '@/api/announcement'
import type { Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest } from '@/types'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()

const loading = ref(true)
const announcements = ref<Announcement[]>([])
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  title: '',
  content: '',
  start_time: '',
  end_time: ''
})

const formTitle = computed(() =>
  isEditing.value ? t('admin.editAnnouncement') : t('admin.createAnnouncement')
)

async function loadAnnouncements() {
  loading.value = true
  try {
    announcements.value = await getAllAnnouncements()
  } catch (error) {
    console.error('Failed to load announcements:', error)
    toast.error(t('common.loadFailed'))
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  form.value = {
    title: '',
    content: '',
    start_time: '',
    end_time: ''
  }
  showModal.value = true
}

function openEditModal(announcement: Announcement) {
  isEditing.value = true
  editingId.value = announcement.id
  form.value = {
    title: announcement.title,
    content: announcement.content,
    start_time: announcement.start_time ? formatDateTimeLocal(announcement.start_time) : '',
    end_time: announcement.end_time ? formatDateTimeLocal(announcement.end_time) : ''
  }
  showModal.value = true
}

function formatDateTimeLocal(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// 将 datetime-local 格式转换为 ISO 8601 格式
function toISOString(dateTimeLocal: string): string | null {
  if (!dateTimeLocal) return null
  // datetime-local 格式: "YYYY-MM-DDTHH:MM"
  // 转换为 ISO 8601 格式: "YYYY-MM-DDTHH:MM:SS+08:00"
  const date = new Date(dateTimeLocal)
  return date.toISOString()
}

function closeModal() {
  showModal.value = false
}

async function handleSubmit() {
  if (!form.value.title.trim()) {
    toast.error(t('admin.announcementTitleRequired'))
    return
  }
  if (!form.value.content.trim()) {
    toast.error(t('admin.announcementContentRequired'))
    return
  }

  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      // 编辑时不修改 enabled 状态
      const data: UpdateAnnouncementRequest = {
        title: form.value.title.trim(),
        content: form.value.content.trim(),
        start_time: toISOString(form.value.start_time),
        end_time: toISOString(form.value.end_time)
      }
      await updateAnnouncement(editingId.value, data)
      toast.success(t('admin.announcementUpdated'))
    } else {
      // 创建时默认启用
      const data: CreateAnnouncementRequest = {
        title: form.value.title.trim(),
        content: form.value.content.trim(),
        start_time: toISOString(form.value.start_time),
        end_time: toISOString(form.value.end_time),
        enabled: 1
      }
      await createAnnouncement(data)
      toast.success(t('admin.announcementCreated'))
    }
    closeModal()
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to save announcement:', error)
    toast.error(t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(announcement: Announcement) {
  const confirmed = await confirm({
    message: t('admin.deleteAnnouncementConfirm', { title: announcement.title }),
    title: t('common.confirmTitle')
  })
  if (!confirmed) return

  try {
    await deleteAnnouncement(announcement.id)
    toast.success(t('admin.announcementDeleted'))
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to delete announcement:', error)
    toast.error(t('common.deleteFailed'))
  }
}

async function toggleEnabled(announcement: Announcement) {
  try {
    await updateAnnouncement(announcement.id, {
      title: announcement.title,
      content: announcement.content,
      start_time: announcement.start_time,
      end_time: announcement.end_time,
      enabled: announcement.enabled === 1 ? 0 : 1
    })
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to toggle announcement:', error)
    toast.error(t('common.operationFailed'))
  }
}

function formatDateTime(isoString: string | null): string {
  if (!isoString) return t('admin.noTimeLimit')
  const date = new Date(isoString)
  return date.toLocaleString()
}

function isActive(announcement: Announcement): boolean {
  if (announcement.enabled !== 1) return false
  const now = new Date()
  if (announcement.start_time && new Date(announcement.start_time) > now) return false
  if (announcement.end_time && new Date(announcement.end_time) < now) return false
  return true
}

onMounted(() => {
  loadAnnouncements()
})
</script>

<template>
  <div class="announcement-page">
    <AdminNav />

    <div class="page-header">
      <h1 class="page-title">{{ t('admin.announcements') }}</h1>
      <button class="btn btn-primary" @click="openCreateModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ t('admin.createAnnouncement') }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="announcements.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
      </svg>
      <h3>{{ t('admin.noAnnouncements') }}</h3>
      <p>{{ t('admin.noAnnouncementsHint') }}</p>
    </div>

    <div v-else class="announcements-list">
      <div
        v-for="announcement in announcements"
        :key="announcement.id"
        class="announcement-card"
        :class="{ active: isActive(announcement), disabled: announcement.enabled !== 1 }"
      >
        <div class="announcement-header">
          <div class="announcement-title">
            <span class="status-dot" :class="{ active: isActive(announcement) }"></span>
            {{ announcement.title }}
          </div>
          <div class="announcement-actions">
            <button
              class="btn-icon"
              :title="announcement.enabled === 1 ? t('common.disable') : t('common.enable')"
              @click="toggleEnabled(announcement)"
            >
              <svg v-if="announcement.enabled === 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
            <button class="btn-icon" :title="t('common.edit')" @click="openEditModal(announcement)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon danger" :title="t('common.delete')" @click="handleDelete(announcement)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="announcement-content">{{ announcement.content }}</div>
        <div class="announcement-meta">
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ t('admin.startTime') }}: {{ formatDateTime(announcement.start_time) }}
          </span>
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ t('admin.endTime') }}: {{ formatDateTime(announcement.end_time) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 创建/编辑模态框 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay">
        <div class="modal announcement-modal">
          <div class="modal-header">
            <h3>{{ formTitle }}</h3>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>{{ t('admin.announcementTitle') }} *</label>
              <input
                type="text"
                v-model="form.title"
                class="input"
                :placeholder="t('admin.announcementTitlePlaceholder')"
                maxlength="100"
              />
            </div>
            <div class="form-group">
              <label>{{ t('admin.announcementContent') }} *</label>
              <textarea
                v-model="form.content"
                class="input textarea"
                :placeholder="t('admin.announcementContentPlaceholder')"
                rows="4"
                maxlength="500"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.startTime') }}</label>
                <DateTimePicker v-model="form.start_time" :placeholder="t('admin.selectTime')" />
                <span class="form-hint">{{ t('admin.startTimeHint') }}</span>
              </div>
              <div class="form-group">
                <label>{{ t('admin.endTime') }}</label>
                <DateTimePicker v-model="form.end_time" :placeholder="t('admin.selectTime')" />
                <span class="form-hint">{{ t('admin.endTimeHint') }}</span>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.announcement-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.page-header .btn svg {
  width: 18px;
  height: 18px;
  margin-right: var(--spacing-xs);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-base);
}

.empty-state h3 {
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* 公告列表 */
.announcements-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.announcement-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-base);
  transition: var(--transition-fast);
}

.announcement-card.active {
  border-left: 3px solid var(--color-success);
}

.announcement-card.disabled {
  opacity: 0.6;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.announcement-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
}

.status-dot.active {
  background: var(--color-success);
}

.announcement-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-icon:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.btn-icon.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

.announcement-content {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  line-height: 1.5;
}

.announcement-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-base);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
}

.announcement-modal {
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-text);
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 24px;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.modal-body {
  padding: var(--spacing-base);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-base);
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-base);
}

/* 表单 */
.form-group {
  margin-bottom: var(--spacing-base);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.form-hint {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-xs);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-base);
}

.textarea {
  resize: vertical;
  min-height: 100px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  flex-shrink: 0;
  position: relative;
  margin: 0;
}

.checkbox-label input[type="checkbox"]:hover {
  border-color: var(--color-primary);
}

.checkbox-label input[type="checkbox"]:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-label input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-base);
  }
}
</style>
