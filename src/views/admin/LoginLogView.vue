<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import { getLoginLogs, cleanLoginLogs } from '@/api/logs'
import type { LoginLog } from '@/types'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import AdminNav from '@/components/admin/AdminNav.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'

const { t } = useI18n()
const { confirm } = useConfirm()
const toast = useToast()
const loading = ref(false)
const cleaning = ref(false)
const logs = ref<LoginLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

// 筛选条件
const filterUserId = ref<number | undefined>(undefined)
const filterStatus = ref<number>(-1)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 防抖搜索
const debouncedSearch = useDebounceFn(() => {
  page.value = 1
  loadLogs()
}, 300)

// 监听筛选条件变化
watch([filterUserId, filterStatus], () => {
  debouncedSearch()
})

// 状态选项
const statusOptions = computed(() => [
  { value: -1, label: t('admin.allStatus') },
  { value: 1, label: t('admin.success') },
  { value: 0, label: t('admin.failed') }
])

async function loadLogs() {
  loading.value = true
  try {
    const response = await getLoginLogs({
      page: page.value,
      page_size: pageSize.value,
      user_id: filterUserId.value,
      status: filterStatus.value >= 0 ? filterStatus.value : undefined
    })
    logs.value = response.list || []
    total.value = response.total
  } catch (error) {
    console.error('Failed to load login logs:', error)
  } finally {
    loading.value = false
  }
}

async function handleClean() {
  const confirmed = await confirm({
    title: t('admin.cleanLogsConfirmTitle'),
    message: t('admin.cleanLogsConfirmMessage'),
    confirmText: t('common.confirm'),
    cancelText: t('common.cancel'),
    type: 'warning'
  })
  if (!confirmed) return

  cleaning.value = true
  try {
    const response = await cleanLoginLogs()
    toast.success(t('admin.cleanLogsSuccess', { count: response.deleted }))
    loadLogs()
  } catch (error) {
    console.error('Failed to clean login logs:', error)
    toast.error(t('admin.cleanLogsFailed'))
  } finally {
    cleaning.value = false
  }
}

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    loadLogs()
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getStatusName(status: number) {
  return status === 1 ? t('admin.success') : t('admin.failed')
}

onMounted(() => {
  loadLogs()
})
</script>

<template>
  <div class="logs-page">
    <AdminNav />

    <div class="page-header">
      <h1 class="page-title">{{ t('admin.loginLogs') }}</h1>
      <span class="total-badge">{{ t('admin.totalRecords', { count: total }) }}</span>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="filter-group">
        <input
          v-model.number="filterUserId"
          type="number"
          class="input filter-input"
          :placeholder="t('admin.userId')"
        />
        <SelectDropdown
          v-model="filterStatus"
          :options="statusOptions"
          :placeholder="t('admin.allStatus')"
          width="120px"
        />
      </div>
      <button class="btn btn-danger" :disabled="cleaning" @click="handleClean">
        {{ cleaning ? t('common.loading') : t('admin.cleanLogs') }}
      </button>
    </div>

    <!-- 日志表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('common.loading') }}</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('admin.user') }}</th>
            <th>{{ t('admin.ip') }}</th>
            <th>{{ t('admin.location') }}</th>
            <th>{{ t('admin.device') }}</th>
            <th>{{ t('admin.browser') }}</th>
            <th>{{ t('admin.os') }}</th>
            <th>{{ t('common.status') }}</th>
            <th>{{ t('admin.failReason') }}</th>
            <th>{{ t('admin.time') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" :class="{ 'failed-row': log.status === 0 }">
            <td>{{ log.id }}</td>
            <td>
              <span class="user-info">
                <span class="user-id">#{{ log.user_id }}</span>
                <span>{{ log.username }}</span>
              </span>
            </td>
            <td><code class="ip-text">{{ log.ip }}</code></td>
            <td>{{ log.location || '-' }}</td>
            <td>{{ log.device || '-' }}</td>
            <td>{{ log.browser || '-' }}</td>
            <td>{{ log.os || '-' }}</td>
            <td>
              <span class="badge" :class="log.status === 1 ? 'badge-success' : 'badge-danger'">
                {{ getStatusName(log.status) }}
              </span>
            </td>
            <td class="fail-reason">{{ log.status === 0 ? (log.message || '-') : '-' }}</td>
            <td>{{ formatDate(log.created_at) }}</td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="10" class="empty-cell">{{ t('admin.noLoginLogs') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="page === 1" @click="goToPage(page - 1)">{{ t('common.prevPage') }}</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="page === totalPages" @click="goToPage(page + 1)">{{ t('common.nextPage') }}</button>
    </div>
  </div>
</template>

<style scoped>
.logs-page {
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
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-base);
}

.filter-group {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.filter-input {
  width: 100px;
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.data-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.data-table tbody tr.failed-row {
  background: rgba(239, 68, 68, 0.05);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-id {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.ip-text {
  font-family: monospace;
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.badge-danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.fail-reason {
  color: var(--color-error);
  font-size: var(--text-xs);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

@media (max-width: 1024px) {
  .table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 1000px;
  }
}
</style>
