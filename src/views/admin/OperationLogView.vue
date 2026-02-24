<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import { getOperationLogs, cleanOperationLogs } from '@/api/logs'
import type { OperationLog } from '@/types'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import AdminNav from '@/components/admin/AdminNav.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'

const { t } = useI18n()
const { confirm } = useConfirm()
const toast = useToast()
const loading = ref(false)
const cleaning = ref(false)
const logs = ref<OperationLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

// 筛选条件
const filterUserId = ref<number | undefined>(undefined)
const filterAction = ref('')
const filterTarget = ref('')
const filterStatusStr = ref('')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 详情弹窗
const detailVisible = ref(false)
const detailLog = ref<OperationLog | null>(null)

function showDetail(log: OperationLog) {
  detailLog.value = log
  detailVisible.value = true
}

// 防抖搜索
const debouncedSearch = useDebounceFn(() => {
  page.value = 1
  loadLogs()
}, 300)

// 监听筛选条件变化
watch([filterUserId, filterAction, filterTarget, filterStatusStr], () => {
  debouncedSearch()
})

// 操作类型选项
const actionOptions = computed(() => [
  { value: '', label: t('admin.allActions') },
  { value: 'upload', label: t('admin.actionUpload') },
  { value: 'delete', label: t('admin.actionDelete') },
  { value: 'update', label: t('admin.actionUpdate') },
  { value: 'create', label: t('admin.actionCreate') },
  { value: 'restore', label: t('admin.actionRestore') }
])

// 目标类型选项
const targetOptions = computed(() => [
  { value: '', label: t('admin.allTargets') },
  { value: 'image', label: t('admin.targetImage') },
  { value: 'album', label: t('admin.targetAlbum') },
  { value: 'share', label: t('admin.targetShare') },
  { value: 'user', label: t('admin.targetUser') },
  { value: 'profile', label: t('admin.targetProfile') },
  { value: 'password', label: t('admin.targetPassword') },
  { value: 'avatar', label: t('admin.targetAvatar') },
  { value: 'account', label: t('admin.targetAccount') },
  { value: 'settings', label: t('admin.targetSettings') },
  { value: 'api_token', label: t('admin.targetAPIToken') },
  { value: 'domain', label: t('admin.targetDomain') },
  { value: 'config', label: t('admin.targetConfig') },
  { value: 'quota', label: t('admin.targetQuota') }
])

// 状态选项
const statusOptions = computed(() => [
  { value: '', label: t('admin.allStatus') },
  { value: '1', label: t('admin.success') },
  { value: '0', label: t('admin.failed') }
])

async function loadLogs() {
  loading.value = true
  try {
    const response = await getOperationLogs({
      page: page.value,
      page_size: pageSize.value,
      user_id: filterUserId.value,
      action: filterAction.value || undefined,
      target: filterTarget.value || undefined,
      status: filterStatusStr.value !== '' ? Number(filterStatusStr.value) : undefined
    })
    logs.value = response.list || []
    total.value = response.total
  } catch (error) {
    console.error('Failed to load operation logs:', error)
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
    const response = await cleanOperationLogs()
    toast.success(t('admin.cleanLogsSuccess', { count: response.deleted }))
    loadLogs()
  } catch (error) {
    console.error('Failed to clean operation logs:', error)
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

function getActionName(action: string) {
  const actionMap: Record<string, string> = {
    'upload': t('admin.actionUpload'),
    'delete': t('admin.actionDelete'),
    'update': t('admin.actionUpdate'),
    'create': t('admin.actionCreate'),
    'restore': t('admin.actionRestore')
  }
  return actionMap[action] || action
}

function getTargetName(target: string) {
  const targetMap: Record<string, string> = {
    'image': t('admin.targetImage'),
    'album': t('admin.targetAlbum'),
    'share': t('admin.targetShare'),
    'user': t('admin.targetUser'),
    'profile': t('admin.targetProfile'),
    'password': t('admin.targetPassword'),
    'avatar': t('admin.targetAvatar'),
    'account': t('admin.targetAccount'),
    'settings': t('admin.targetSettings'),
    'api_token': t('admin.targetAPIToken'),
    'domain': t('admin.targetDomain'),
    'config': t('admin.targetConfig'),
    'quota': t('admin.targetQuota')
  }
  return targetMap[target] || target
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
      <h1 class="page-title">{{ t('admin.operationLogs') }}</h1>
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
          v-model="filterAction"
          :options="actionOptions"
          :placeholder="t('admin.allActions')"
          width="130px"
        />
        <SelectDropdown
          v-model="filterTarget"
          :options="targetOptions"
          :placeholder="t('admin.allTargets')"
          width="130px"
        />
        <SelectDropdown
          v-model="filterStatusStr"
          :options="statusOptions"
          :placeholder="t('admin.allStatus')"
          width="110px"
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
            <th>{{ t('admin.action') }}</th>
            <th>{{ t('admin.target') }}</th>
            <th>{{ t('admin.targetId') }}</th>
            <th>{{ t('admin.detail') }}</th>
            <th>{{ t('admin.ip') }}</th>
            <th>{{ t('common.status') }}</th>
            <th>{{ t('admin.time') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.id }}</td>
            <td>
              <span class="user-info">
                <span class="user-id">#{{ log.user_id }}</span>
                <span>{{ log.username }}</span>
              </span>
            </td>
            <td>
              <span class="action-badge">{{ getActionName(log.action) }}</span>
            </td>
            <td>{{ getTargetName(log.target) }}</td>
            <td>{{ log.target_id }}</td>
            <td class="detail-cell">
              <span class="detail-text" :title="log.detail">{{ log.detail || '-' }}</span>
              <button v-if="log.detail" class="detail-btn" @click="showDetail(log)">
                {{ t('admin.viewDetail') }}
              </button>
            </td>
            <td><code class="ip-text">{{ log.ip }}</code></td>
            <td>
              <span class="badge" :class="log.status === 1 ? 'badge-success' : 'badge-danger'">
                {{ getStatusName(log.status) }}
              </span>
            </td>
            <td>{{ formatDate(log.created_at) }}</td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="9" class="empty-cell">{{ t('admin.noOperationLogs') }}</td>
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

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div v-if="detailVisible" class="modal-overlay" @click.self="detailVisible = false">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('admin.detail') }}</h3>
            <button class="modal-close" @click="detailVisible = false">&times;</button>
          </div>
          <div v-if="detailLog" class="modal-body">
            <div class="detail-row">
              <span class="detail-label">ID</span>
              <span class="detail-value">{{ detailLog.id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('admin.user') }}</span>
              <span class="detail-value">#{{ detailLog.user_id }} {{ detailLog.username }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('admin.action') }}</span>
              <span class="detail-value">{{ getActionName(detailLog.action) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('admin.target') }}</span>
              <span class="detail-value">{{ getTargetName(detailLog.target) }} #{{ detailLog.target_id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('admin.ip') }}</span>
              <span class="detail-value"><code class="ip-text">{{ detailLog.ip }}</code></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">User-Agent</span>
              <span class="detail-value detail-ua">{{ detailLog.user_agent || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('common.status') }}</span>
              <span class="detail-value">
                <span class="badge" :class="detailLog.status === 1 ? 'badge-success' : 'badge-danger'">
                  {{ getStatusName(detailLog.status) }}
                </span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('admin.time') }}</span>
              <span class="detail-value">{{ formatDate(detailLog.created_at) }}</span>
            </div>
            <div class="detail-row detail-row-full">
              <span class="detail-label">{{ t('admin.detail') }}</span>
              <pre class="detail-content">{{ detailLog.detail || '-' }}</pre>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
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
}

.input {
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.input:focus {
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

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-id {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.action-badge {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.detail-cell {
  max-width: 200px;
}

.detail-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-btn {
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: var(--text-xs);
  cursor: pointer;
  padding: 0;
  margin-top: 2px;
}

.detail-btn:hover {
  text-decoration: underline;
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

.empty-cell {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: var(--spacing-xl) !important;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  overflow-y: auto;
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

.detail-row {
  display: flex;
  gap: var(--spacing-base);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  flex-shrink: 0;
  width: 100px;
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.detail-value {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--color-text);
  word-break: break-all;
}

.detail-ua {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.detail-row-full {
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-content {
  margin: 0;
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
  max-height: 200px;
  overflow-y: auto;
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
    min-width: 900px;
  }
}
</style>
