<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDomains, createDomain, updateDomain, deleteDomain } from '@/api/whitelist'
import type { DomainWhitelist, CreateDomainRequest } from '@/types'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import SelectDropdown from '@/components/common/SelectDropdown.vue'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()
const loading = ref(false)
const domains = ref<DomainWhitelist[]>([])

// 状态选项
const statusOptions = computed(() => [
  { value: 1, label: t('whitelist.enabled') },
  { value: 0, label: t('whitelist.disabled') }
])

// 创建弹窗
const createDialogVisible = ref(false)
const createForm = ref<CreateDomainRequest>({
  domain: '',
  status: 1,
  remark: ''
})

// 编辑弹窗
const editDialogVisible = ref(false)
const editingDomain = ref<DomainWhitelist | null>(null)
const editForm = ref({
  domain: '',
  status: 1,
  remark: ''
})

async function loadDomains() {
  loading.value = true
  try {
    const response = await getDomains()
    domains.value = response || []
  } catch (error) {
    console.error('Failed to load domains:', error)
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  createForm.value = {
    domain: '',
    status: 1,
    remark: ''
  }
  createDialogVisible.value = true
}

async function handleCreate() {
  if (!createForm.value.domain.trim()) {
    toast.info(t('whitelist.enterDomain'))
    return
  }
  try {
    await createDomain(createForm.value)
    toast.success(t('whitelist.addSuccess'))
    createDialogVisible.value = false
    loadDomains()
  } catch (error) {
    console.error('Failed to create domain:', error)
    toast.error(t('whitelist.addFailed'))
  }
}

function openEditDialog(domain: DomainWhitelist) {
  editingDomain.value = domain
  editForm.value = {
    domain: domain.domain,
    status: domain.status,
    remark: domain.remark
  }
  editDialogVisible.value = true
}

async function handleSave() {
  if (!editingDomain.value) return
  try {
    await updateDomain(editingDomain.value.id, {
      domain: editForm.value.domain,
      status: editForm.value.status,
      remark: editForm.value.remark
    })
    toast.success(t('whitelist.updateSuccess'))
    editDialogVisible.value = false
    loadDomains()
  } catch (error) {
    console.error('Failed to update domain:', error)
    toast.error(t('whitelist.updateFailed'))
  }
}

async function handleDelete(domain: DomainWhitelist) {
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('whitelist.confirmDelete', { domain: domain.domain }),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    await deleteDomain(domain.id)
    toast.success(t('whitelist.deleteSuccess'))
    loadDomains()
  } catch (error) {
    console.error('Failed to delete domain:', error)
    toast.error(t('whitelist.deleteFailed'))
  }
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

function getStatusName(status: number) {
  return status === 1 ? t('whitelist.enabled') : t('whitelist.disabled')
}

onMounted(() => {
  loadDomains()
})
</script>

<template>
  <div class="whitelist-page">
    <div class="back-header">
      <RouterLink to="/user/profile" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        {{ t('settings.backToProfile') }}
      </RouterLink>
    </div>

    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('whitelist.title') }}</h1>
        <p class="page-desc">{{ t('whitelist.description') }}</p>
      </div>
      <button class="btn btn-primary" @click="openCreateDialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ t('whitelist.addDomain') }}
      </button>
    </div>

    <!-- 域名表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('common.loading') }}</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>{{ t('whitelist.domain') }}</th>
            <th>{{ t('whitelist.status') }}</th>
            <th>{{ t('whitelist.remark') }}</th>
            <th>{{ t('whitelist.createdAt') }}</th>
            <th>{{ t('whitelist.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="domain in domains" :key="domain.id" :class="{ disabled: domain.status === 0 }">
            <td><code class="domain-text">{{ domain.domain }}</code></td>
            <td>
              <span class="badge" :class="domain.status === 1 ? 'badge-success' : 'badge-danger'">
                {{ getStatusName(domain.status) }}
              </span>
            </td>
            <td>{{ domain.remark || '-' }}</td>
            <td>{{ formatDate(domain.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button class="action-btn" @click="openEditDialog(domain)" :title="t('common.edit')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="action-btn danger" @click="handleDelete(domain)" :title="t('common.delete')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="domains.length === 0">
            <td colspan="5" class="empty-cell">{{ t('whitelist.noDomains') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 使用说明 -->
    <div class="usage-guide">
      <h3>{{ t('whitelist.usage') }}</h3>
      <div class="guide-content">
        <p>{{ t('whitelist.usageGuide1') }}</p>
        <p>{{ t('whitelist.usageGuide2') }}</p>
        <p>{{ t('whitelist.usageGuide3') }}</p>
        <p>{{ t('whitelist.usageGuide4') }}</p>
      </div>
    </div>

    <!-- 创建弹窗 -->
    <Teleport to="body">
      <div v-if="createDialogVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('whitelist.addDomain') }}</h3>
            <button class="modal-close" @click="createDialogVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="create-form">
              <div class="form-group">
                <label>{{ t('whitelist.domain') }} *</label>
                <input v-model="createForm.domain" type="text" class="input" :placeholder="t('whitelist.domainPlaceholder')" />
              </div>
              <div class="form-group">
                <label>{{ t('whitelist.status') }}</label>
                <SelectDropdown v-model="createForm.status" :options="statusOptions" width="100%" />
              </div>
              <div class="form-group">
                <label>{{ t('whitelist.remark') }}</label>
                <input v-model="createForm.remark" type="text" class="input" :placeholder="t('whitelist.remarkOptional')" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="createDialogVisible = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="handleCreate">{{ t('common.add') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="editDialogVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('whitelist.editDomain') }}</h3>
            <button class="modal-close" @click="editDialogVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="edit-form">
              <div class="form-group">
                <label>{{ t('whitelist.domain') }}</label>
                <input v-model="editForm.domain" type="text" class="input" />
              </div>
              <div class="form-group">
                <label>{{ t('whitelist.status') }}</label>
                <SelectDropdown v-model="editForm.status" :options="statusOptions" width="100%" />
              </div>
              <div class="form-group">
                <label>{{ t('whitelist.remark') }}</label>
                <input v-model="editForm.remark" type="text" class="input" />
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
.whitelist-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.back-header {
  margin-bottom: var(--spacing-lg);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-decoration: none;
  transition: var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.page-desc {
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0;
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

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-ghost:hover {
  background: var(--color-bg-secondary);
}

/* 表格 */
.table-container {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);
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

.data-table tbody tr.disabled {
  opacity: 0.6;
}

.domain-text {
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

/* 使用说明 */
.usage-guide {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-base);
}

.usage-guide h3 {
  font-size: var(--text-base);
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text);
}

.guide-content {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.guide-content code {
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: monospace;
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

.create-form,
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

@media (max-width: 768px) {
  .whitelist-page {
    padding: var(--spacing-base);
  }

  .page-header {
    flex-direction: column;
    gap: var(--spacing-base);
  }

  .table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 500px;
  }
}
</style>
