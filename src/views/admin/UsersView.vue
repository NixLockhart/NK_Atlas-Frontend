<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import { getUsers, updateUser, deleteUser } from '@/api/admin'
import type { User } from '@/types'
import AdminNav from '@/components/admin/AdminNav.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()
const loading = ref(false)
const users = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const sortBy = ref('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 编辑弹窗
const editDialogVisible = ref(false)
const editingUser = ref<User | null>(null)
const editForm = ref({
  status: 1,
  role: 1,
  extra_quota: 0
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 状态选项
const statusOptions = computed(() => [
  { value: 1, label: t('common.enabled') },
  { value: 0, label: t('common.disabled') }
])

// 角色选项
const roleOptions = computed(() => [
  { value: 1, label: t('user.normalUser') },
  { value: 2, label: t('user.admin') }
])

// 防抖搜索
const debouncedSearch = useDebounceFn(() => {
  page.value = 1
  loadUsers()
}, 300)

// 监听搜索关键词变化
watch(keyword, () => {
  debouncedSearch()
})

async function loadUsers() {
  loading.value = true
  try {
    const response = await getUsers({
      page: page.value,
      page_size: pageSize.value,
      keyword: keyword.value || undefined,
      sort_by: sortBy.value,
      sort_order: sortOrder.value
    })
    users.value = response.list || []
    total.value = response.total
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    loadUsers()
  }
}

function handleSort(field: string) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
  loadUsers()
}

function openEditDialog(user: User) {
  editingUser.value = user
  editForm.value = {
    status: user.status,
    role: user.role,
    extra_quota: Math.round(user.extra_quota / 1024 / 1024) // 转换为 MB
  }
  editDialogVisible.value = true
}

async function handleSave() {
  if (!editingUser.value) return
  try {
    await updateUser(editingUser.value.id, {
      status: editForm.value.status,
      role: editForm.value.role,
      extra_quota: editForm.value.extra_quota * 1024 * 1024 // 转换为字节
    })
    editDialogVisible.value = false
    loadUsers()
  } catch (error) {
    console.error('Failed to update user:', error)
    toast.error(t('common.updateFailed'))
  }
}

async function handleDelete(user: User) {
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('admin.deleteUserConfirm', { username: user.username }),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    await deleteUser(user.id)
    loadUsers()
  } catch (error) {
    console.error('Failed to delete user:', error)
    toast.error(t('common.deleteFailed'))
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// getRoleName reserved for future use
// function getRoleName(role: number) {
//   return role === 2 ? t('user.admin') : t('user.normalUser')
// }

function getStatusName(status: number) {
  switch (status) {
    case 0: return t('common.disabled')
    case 1: return t('common.enabled')
    default: return '-'
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="users-page">
    <AdminNav />

    <div class="page-header">
      <h1 class="page-title">{{ t('admin.users') }}</h1>
      <span class="total-badge">{{ total }} {{ t('admin.totalUsers').toLowerCase() }}</span>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="keyword"
          type="text"
          :placeholder="t('common.search') + '...'"
        />
      </div>
    </div>

    <!-- 用户表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('common.loading') }}</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('auth.username') }}</th>
            <th>{{ t('auth.email') }}</th>
            <th>{{ t('user.role') }}</th>
            <th>{{ t('common.status') }}</th>
            <th class="sortable" @click="handleSort('used_space')">
              {{ t('user.used') }}
              <span v-if="sortBy === 'used_space'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>{{ t('user.quota') }}</th>
            <th class="sortable" @click="handleSort('created_at')">
              {{ t('admin.registeredAt') }}
              <span v-if="sortBy === 'created_at'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>{{ t('admin.lastLogin') }}</th>
            <th>{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" :class="{ disabled: user.status === 0 }">
            <td>{{ user.id }}</td>
            <td>
              <div class="user-cell">
                <img v-if="user.avatar" :src="user.avatar" class="user-avatar" />
                <div v-else class="user-avatar-placeholder">{{ user.username.charAt(0).toUpperCase() }}</div>
                <span>{{ user.username }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span class="badge" :class="user.role === 2 ? 'badge-admin' : 'badge-user'">
                {{ user.role === 2 ? 'Admin' : 'User' }}
              </span>
            </td>
            <td>
              <span class="badge" :class="user.status === 1 ? 'badge-success' : 'badge-danger'">
                {{ getStatusName(user.status) }}
              </span>
            </td>
            <td>{{ formatSize(user.used_space) }}</td>
            <td>{{ formatSize(user.base_quota + user.extra_quota) }}</td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>{{ formatDate(user.last_login_at) }}</td>
            <td>
              <div class="action-buttons">
                <button class="action-btn" @click="openEditDialog(user)" :title="t('common.edit')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="action-btn danger" @click="handleDelete(user)" :title="t('common.delete')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="10" class="empty-cell">{{ t('common.noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="page === 1" @click="goToPage(page - 1)">{{ t('common.prev') }}</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="page === totalPages" @click="goToPage(page + 1)">{{ t('common.next') }}</button>
    </div>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="editDialogVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('common.edit') }}</h3>
            <button class="modal-close" @click="editDialogVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div v-if="editingUser" class="edit-form">
              <div class="form-group">
                <label>{{ t('auth.username') }}</label>
                <input type="text" class="input" :value="editingUser.username" disabled />
              </div>
              <div class="form-group">
                <label>{{ t('auth.email') }}</label>
                <input type="text" class="input" :value="editingUser.email" disabled />
              </div>
              <div class="form-group">
                <label>{{ t('common.status') }}</label>
                <SelectDropdown v-model="editForm.status" :options="statusOptions" width="100%" />
              </div>
              <div class="form-group">
                <label>{{ t('user.role') }}</label>
                <SelectDropdown v-model="editForm.role" :options="roleOptions" width="100%" />
              </div>
              <div class="form-group">
                <label>{{ t('user.extraQuota') }} (MB)</label>
                <input type="number" v-model.number="editForm.extra_quota" class="input" min="0" />
                <span class="form-hint">{{ t('user.baseQuota') }}: {{ formatSize(editingUser.base_quota) }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="editDialogVisible = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.users-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.total-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  border-radius: var(--radius-full);
}

/* 工具栏 */
.toolbar {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-base);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  flex: 1;
  max-width: 400px;
}

.search-box svg {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-sm);
  outline: none;
}

.search-box input::placeholder {
  color: var(--color-text-tertiary);
}

/* 表格 */
.table-container {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.data-table th,
.data-table td {
  padding: var(--spacing-sm) var(--spacing-base);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  background: var(--color-bg-secondary);
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  color: var(--color-primary);
}

.sort-icon {
  margin-left: var(--spacing-xs);
  color: var(--color-primary);
}

.data-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.data-table tbody tr.disabled {
  opacity: 0.6;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-sm);
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.badge-admin {
  background: rgba(139, 92, 246, 0.1);
  color: var(--color-secondary);
}

.badge-user {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.badge-danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
}

.action-btn {
  padding: var(--spacing-xs);
  border: none;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-primary);
  color: white;
}

.action-btn.danger:hover {
  background: var(--color-error);
}

.empty-cell {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: var(--spacing-xl) !important;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-base);
  margin-top: var(--spacing-xl);
}

.page-btn {
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
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

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-xl);
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
  padding: var(--spacing-base);
  border-top: 1px solid var(--color-border);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

@media (max-width: 1024px) {
  .table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 900px;
  }
}
</style>
