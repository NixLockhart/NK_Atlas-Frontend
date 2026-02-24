<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getTokens, createToken, updateToken, deleteToken } from '@/api/apiToken'
import type { APIToken, CreateTokenRequest } from '@/types'
import { useSiteStore } from '@/stores/site'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import DateTimePicker from '@/components/common/DateTimePicker.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()
const siteStore = useSiteStore()
const loading = ref(false)
const tokens = ref<APIToken[]>([])

// 获取站点URL，如果未配置则使用当前域名
const siteUrl = computed(() => {
  if (siteStore.siteUrl) {
    // 移除末尾的斜杠
    return siteStore.siteUrl.replace(/\/$/, '')
  }
  // 回退到当前页面的域名
  return window.location.origin
})

// 创建弹窗
const createDialogVisible = ref(false)
const createForm = ref<CreateTokenRequest>({
  name: '',
  permissions: 'upload',
  expires_at: ''
})
const newTokenValue = ref('')
const showNewToken = ref(false)

// 编辑弹窗
const editDialogVisible = ref(false)
const editingToken = ref<APIToken | null>(null)
const editForm = ref({
  name: '',
  permissions: '',
  status: 1
})

// 权限选项
const permissionOptions = computed(() => [
  { value: 'upload', label: t('apiToken.permUploadOnly') },
  { value: 'upload,read', label: t('apiToken.permUploadRead') },
  { value: 'upload,delete', label: t('apiToken.permUploadDelete') },
  { value: '*', label: t('apiToken.permAll') }
])

// 状态选项
const statusOptions = computed(() => [
  { value: 1, label: t('common.enabled') },
  { value: 0, label: t('common.disabled') }
])

// 将 datetime-local 格式转换为 ISO 8601 格式
function toISOString(dateTimeLocal: string): string | undefined {
  if (!dateTimeLocal) return undefined
  // datetime-local 格式: "YYYY-MM-DDTHH:MM"
  // 转换为 ISO 8601 格式
  const date = new Date(dateTimeLocal)
  if (isNaN(date.getTime())) return undefined
  return date.toISOString()
}

async function loadTokens() {
  loading.value = true
  try {
    const response = await getTokens()
    tokens.value = response || []
  } catch (error) {
    console.error('Failed to load tokens:', error)
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  createForm.value = {
    name: '',
    permissions: 'upload',
    expires_at: ''
  }
  newTokenValue.value = ''
  showNewToken.value = false
  createDialogVisible.value = true
}

async function handleCreate() {
  if (!createForm.value.name.trim()) {
    toast.info(t('apiToken.enterName'))
    return
  }
  try {
    const req: CreateTokenRequest = {
      name: createForm.value.name,
      permissions: createForm.value.permissions
    }
    if (createForm.value.expires_at) {
      req.expires_at = toISOString(createForm.value.expires_at)
    }
    const response = await createToken(req)
    newTokenValue.value = response.token
    showNewToken.value = true
    toast.success(t('apiToken.tokenCreated'))
    loadTokens()
  } catch (error) {
    console.error('Failed to create token:', error)
    toast.error(t('apiToken.createFailed'))
  }
}

function copyToken() {
  navigator.clipboard.writeText(newTokenValue.value)
    .then(() => toast.success(t('apiToken.tokenCopied')))
    .catch(() => toast.error(t('apiToken.copyFailed')))
}

function closeCreateDialog() {
  createDialogVisible.value = false
  showNewToken.value = false
  newTokenValue.value = ''
}

function openEditDialog(token: APIToken) {
  editingToken.value = token
  editForm.value = {
    name: token.name,
    permissions: token.permissions,
    status: token.status
  }
  editDialogVisible.value = true
}

async function handleSave() {
  if (!editingToken.value) return
  try {
    await updateToken(editingToken.value.id, {
      name: editForm.value.name,
      permissions: editForm.value.permissions,
      status: editForm.value.status
    })
    toast.success(t('apiToken.updateSuccess'))
    editDialogVisible.value = false
    loadTokens()
  } catch (error) {
    console.error('Failed to update token:', error)
    toast.error(t('apiToken.updateFailed'))
  }
}

async function handleDelete(token: APIToken) {
  const confirmed = await confirm({
    title: t('common.confirmTitle'),
    message: t('apiToken.deleteConfirm', { name: token.name }),
    type: 'danger'
  })
  if (!confirmed) return
  try {
    await deleteToken(token.id)
    toast.success(t('apiToken.deleteSuccess'))
    loadTokens()
  } catch (error) {
    console.error('Failed to delete token:', error)
    toast.error(t('apiToken.deleteFailed'))
  }
}

function formatDate(dateStr: string | null) {
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
  return status === 1 ? t('common.enabled') : t('common.disabled')
}

function getPermissionName(permissions: string) {
  if (permissions === '*') return t('apiToken.permAll')
  const permMap: Record<string, string> = {
    'upload': t('upload.title'),
    'read': t('gallery.title'),
    'delete': t('common.delete')
  }
  return permissions.split(',').map(p => permMap[p] || p).join(', ')
}

onMounted(() => {
  siteStore.fetchSiteConfig()
  loadTokens()
})
</script>

<template>
  <div class="token-page">
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
        <h1 class="page-title">{{ t('apiToken.title') }}</h1>
        <p class="page-desc">{{ t('apiToken.description') }}</p>
      </div>
      <button class="btn btn-primary" @click="openCreateDialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ t('apiToken.createToken') }}
      </button>
    </div>

    <!-- Token 表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('common.loading') }}</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>{{ t('apiToken.name') }}</th>
            <th>{{ t('apiToken.tokenPrefix') }}</th>
            <th>{{ t('apiToken.permissions') }}</th>
            <th>{{ t('common.status') }}</th>
            <th>{{ t('apiToken.lastUsed') }}</th>
            <th>{{ t('apiToken.expiresAt') }}</th>
            <th>{{ t('apiToken.createdAt') }}</th>
            <th>{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="token in tokens" :key="token.id" :class="{ disabled: token.status === 0 }">
            <td>{{ token.name }}</td>
            <td><code class="token-prefix">{{ token.token_prefix }}...</code></td>
            <td>{{ getPermissionName(token.permissions) }}</td>
            <td>
              <span class="badge" :class="token.status === 1 ? 'badge-success' : 'badge-danger'">
                {{ getStatusName(token.status) }}
              </span>
            </td>
            <td>{{ formatDate(token.last_used_at) }}</td>
            <td>{{ formatDate(token.expires_at) }}</td>
            <td>{{ formatDate(token.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button class="action-btn" @click="openEditDialog(token)" :title="t('common.edit')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="action-btn danger" @click="handleDelete(token)" :title="t('common.delete')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="tokens.length === 0">
            <td colspan="8" class="empty-cell">{{ t('apiToken.noTokens') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 使用说明 -->
    <div class="usage-guide">
      <h3>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 8v5"/>
          <path d="M12 16v.01"/>
        </svg>
        {{ t('apiToken.usage') }}
      </h3>

      <!-- 快速开始 -->
      <div class="guide-section highlight-section">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          {{ t('apiToken.quickStart') }}
        </h4>
        <div class="guide-content">
          <p>{{ t('apiToken.quickStartDesc') }}</p>
          <div class="code-block copyable">
            <code>curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -F "file=@image.jpg" {{ siteUrl }}/api/v1/open/upload</code>
          </div>
        </div>
      </div>

      <!-- 认证方式 -->
      <div class="guide-section">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          {{ t('apiToken.guideAuth') }}
        </h4>
        <div class="guide-content">
          <div class="auth-methods">
            <div class="auth-method recommended">
              <span class="auth-badge">{{ t('apiToken.recommended') }}</span>
              <p>{{ t('apiToken.guideAuthDesc') }}</p>
              <div class="code-block">
                <code>Authorization: Bearer YOUR_TOKEN</code>
              </div>
            </div>
            <div class="auth-method">
              <p>{{ t('apiToken.guideAuthAlt') }}</p>
              <div class="code-block">
                <code>?token=YOUR_TOKEN</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API 接口 -->
      <div class="guide-section">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          {{ t('apiToken.guideEndpoints') }}
        </h4>
        <div class="endpoint-list">
          <!-- 上传图片 -->
          <div class="endpoint-item">
            <div class="endpoint-header">
              <span class="method post">POST</span>
              <code>/api/v1/open/upload</code>
              <span class="endpoint-tag">{{ t('apiToken.tagCore') }}</span>
            </div>
            <p class="endpoint-desc">{{ t('apiToken.endpointUpload') }}</p>
            <div class="endpoint-params-box">
              <span class="param required">file</span>
              <span class="param">category</span>
              <span class="param">album_id</span>
            </div>
            <div class="code-block">
              <code>curl -X POST -H "Authorization: Bearer TOKEN" -F "file=@image.jpg" -F "category=general" {{ siteUrl }}/api/v1/open/upload</code>
            </div>
          </div>

          <!-- URL上传 -->
          <div class="endpoint-item">
            <div class="endpoint-header">
              <span class="method post">POST</span>
              <code>/api/v1/open/upload-url</code>
            </div>
            <p class="endpoint-desc">{{ t('apiToken.endpointUploadUrl') }}</p>
            <div class="endpoint-params-box">
              <span class="param required">url</span>
              <span class="param">category</span>
            </div>
            <div class="code-block">
              <code>curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"url\":\"https://example.com/image.jpg\"}" {{ siteUrl }}/api/v1/open/upload-url</code>
            </div>
          </div>

          <!-- 上传头像 -->
          <div class="endpoint-item">
            <div class="endpoint-header">
              <span class="method post">POST</span>
              <code>/api/v1/open/avatar</code>
            </div>
            <p class="endpoint-desc">{{ t('apiToken.endpointAvatar') }}</p>
            <div class="code-block">
              <code>curl -X POST -H "Authorization: Bearer TOKEN" -F "file=@avatar.jpg" {{ siteUrl }}/api/v1/open/avatar</code>
            </div>
          </div>

          <!-- 获取列表 -->
          <div class="endpoint-item">
            <div class="endpoint-header">
              <span class="method get">GET</span>
              <code>/api/v1/open/images</code>
              <span class="endpoint-perm">read</span>
            </div>
            <p class="endpoint-desc">{{ t('apiToken.endpointList') }}</p>
            <div class="code-block">
              <code>curl -H "Authorization: Bearer TOKEN" "{{ siteUrl }}/api/v1/open/images?page=1&amp;page_size=20"</code>
            </div>
          </div>

          <!-- 按ID删除 -->
          <div class="endpoint-item">
            <div class="endpoint-header">
              <span class="method delete">DELETE</span>
              <code>/api/v1/open/images/:id</code>
              <span class="endpoint-perm">delete</span>
            </div>
            <p class="endpoint-desc">{{ t('apiToken.endpointDelete') }}</p>
            <div class="code-block">
              <code>curl -X DELETE -H "Authorization: Bearer TOKEN" {{ siteUrl }}/api/v1/open/images/123</code>
            </div>
          </div>

          <!-- 按URL删除 -->
          <div class="endpoint-item featured">
            <div class="endpoint-header">
              <span class="method delete">DELETE</span>
              <code>/api/v1/open/delete-by-url</code>
              <span class="endpoint-perm">delete</span>
              <span class="endpoint-tag new">NEW</span>
            </div>
            <p class="endpoint-desc">{{ t('apiToken.endpointDeleteByUrl') }}</p>
            <div class="endpoint-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {{ t('apiToken.deleteByUrlNote') }}
            </div>
            <p class="endpoint-example-label">{{ t('apiToken.exampleDirect') }}</p>
            <div class="code-block">
              <code>curl -X DELETE -H "Authorization: Bearer TOKEN" "{{ siteUrl }}/api/v1/open/delete-by-url?url={{ siteUrl }}/uploads/images/xxx.jpg"</code>
            </div>
            <p class="endpoint-example-label">{{ t('apiToken.exampleShort') }}</p>
            <div class="code-block">
              <code>curl -X DELETE -H "Authorization: Bearer TOKEN" "{{ siteUrl }}/api/v1/open/delete-by-url?url={{ siteUrl }}/s/abc123"</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 响应格式 -->
      <div class="guide-section">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          {{ t('apiToken.guideFormat') }}
        </h4>
        <div class="guide-content">
          <p>{{ t('apiToken.guideFormatDesc') }}</p>
          <div class="format-grid">
            <div class="format-item">
              <code>?format=typora</code>
              <span>{{ t('apiToken.formatTypora') }}</span>
            </div>
            <div class="format-item">
              <code>?format=markdown</code>
              <span>{{ t('apiToken.formatMarkdown') }}</span>
            </div>
            <div class="format-item">
              <code>?format=vditor</code>
              <span>{{ t('apiToken.formatVditor') }}</span>
            </div>
            <div class="format-item">
              <code>?format=url</code>
              <span>{{ t('apiToken.formatUrl') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 常用工具配置 -->
      <div class="guide-section">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          {{ t('apiToken.guideTools') }}
        </h4>
        <div class="tools-grid">
          <div class="tool-card">
            <div class="tool-header">
              <span class="tool-name">Typora</span>
              <span class="tool-type">Markdown Editor</span>
            </div>
            <p>{{ t('apiToken.toolTypora') }}</p>
            <div class="code-block">
              <code>curl -X POST -F "file=@$1" -H "Authorization: Bearer TOKEN" {{ siteUrl }}/api/v1/open/upload?format=typora</code>
            </div>
          </div>
          <div class="tool-card">
            <div class="tool-header">
              <span class="tool-name">PicGo</span>
              <span class="tool-type">{{ t('apiToken.toolPicgoType') }}</span>
            </div>
            <p>{{ t('apiToken.toolPicgo') }}</p>
          </div>
        </div>
      </div>

      <!-- 权限说明 -->
      <div class="guide-section">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          {{ t('apiToken.guidePerms') }}
        </h4>
        <div class="perm-grid">
          <div class="perm-card">
            <div class="perm-header">
              <span class="perm-name">{{ t('apiToken.permUploadOnly') }}</span>
              <span class="perm-level safe">{{ t('apiToken.permLevelSafe') }}</span>
            </div>
            <p>{{ t('apiToken.permUploadOnlyDesc') }}</p>
          </div>
          <div class="perm-card">
            <div class="perm-header">
              <span class="perm-name">{{ t('apiToken.permUploadRead') }}</span>
              <span class="perm-level safe">{{ t('apiToken.permLevelSafe') }}</span>
            </div>
            <p>{{ t('apiToken.permUploadReadDesc') }}</p>
          </div>
          <div class="perm-card">
            <div class="perm-header">
              <span class="perm-name">{{ t('apiToken.permUploadDelete') }}</span>
              <span class="perm-level warning">{{ t('apiToken.permLevelMedium') }}</span>
            </div>
            <p>{{ t('apiToken.permUploadDeleteDesc') }}</p>
          </div>
          <div class="perm-card">
            <div class="perm-header">
              <span class="perm-name">{{ t('apiToken.permAll') }}</span>
              <span class="perm-level danger">{{ t('apiToken.permLevelHigh') }}</span>
            </div>
            <p>{{ t('apiToken.permAllDesc') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建弹窗 -->
    <Teleport to="body">
      <div v-if="createDialogVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ showNewToken ? t('apiToken.tokenCreated') : t('apiToken.createToken') }}</h3>
            <button class="modal-close" @click="closeCreateDialog">&times;</button>
          </div>
          <div class="modal-body">
            <div v-if="showNewToken" class="token-result">
              <p class="warning-text">{{ t('apiToken.copyWarning') }}</p>
              <div class="token-display">
                <code>{{ newTokenValue }}</code>
                <button class="btn btn-primary btn-sm" @click="copyToken">{{ t('common.copy') }}</button>
              </div>
            </div>
            <div v-else class="create-form">
              <div class="form-group">
                <label>{{ t('apiToken.name') }} *</label>
                <input v-model="createForm.name" type="text" class="input" :placeholder="t('apiToken.namePlaceholder')" />
              </div>
              <div class="form-group">
                <label>{{ t('apiToken.permissions') }}</label>
                <SelectDropdown v-model="createForm.permissions" :options="permissionOptions" width="100%" />
              </div>
              <div class="form-group">
                <label>{{ t('apiToken.expiresAt') }}</label>
                <DateTimePicker v-model="createForm.expires_at" :placeholder="t('admin.selectTime')" />
                <span class="form-hint">{{ t('apiToken.expiresAtHint') }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeCreateDialog">{{ showNewToken ? t('common.close') : t('common.cancel') }}</button>
            <button v-if="!showNewToken" class="btn btn-primary" @click="handleCreate">{{ t('common.create') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="editDialogVisible" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ t('apiToken.editToken') }}</h3>
            <button class="modal-close" @click="editDialogVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="edit-form">
              <div class="form-group">
                <label>{{ t('apiToken.name') }}</label>
                <input v-model="editForm.name" type="text" class="input" />
              </div>
              <div class="form-group">
                <label>{{ t('apiToken.permissions') }}</label>
                <SelectDropdown v-model="editForm.permissions" :options="permissionOptions" width="100%" />
              </div>
              <div class="form-group">
                <label>{{ t('common.status') }}</label>
                <SelectDropdown v-model="editForm.status" :options="statusOptions" width="100%" />
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
.token-page {
  max-width: 1200px;
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

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--text-xs);
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

.token-prefix {
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
  padding: var(--spacing-xl);
}

.usage-guide > h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-xl);
  margin: 0 0 var(--spacing-xl);
  color: var(--color-text);
  padding-bottom: var(--spacing-base);
  border-bottom: 2px solid var(--color-primary);
}

.usage-guide > h3 svg {
  color: var(--color-primary);
}

.guide-section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.guide-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.guide-section h4 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-base);
}

.guide-section h4 svg {
  color: var(--color-text-tertiary);
}

.highlight-section {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-xl);
}

.highlight-section h4 svg {
  color: var(--color-primary);
}

.guide-content {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.guide-content p {
  margin: 0 0 var(--spacing-sm);
}

.guide-content code {
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: var(--text-xs);
}

/* 认证方式 */
.auth-methods {
  display: grid;
  gap: var(--spacing-base);
}

.auth-method {
  background: var(--color-bg-secondary);
  padding: var(--spacing-base);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.auth-method.recommended {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.05);
}

.auth-badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--color-primary);
  color: white;
  font-size: var(--text-xs);
  font-weight: 500;
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-xs);
}

.auth-method p {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* 代码块 */
.code-block {
  background: var(--color-bg-tertiary);
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-md);
  margin: var(--spacing-sm) 0;
  overflow-x: auto;
  border: 1px solid var(--color-border-light);
}

.code-block code {
  background: none;
  padding: 0;
  color: var(--color-text);
  white-space: nowrap;
  font-size: var(--text-xs);
}

/* API 接口列表 */
.endpoint-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.endpoint-item {
  background: var(--color-bg-secondary);
  padding: var(--spacing-base);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  transition: var(--transition-fast);
}

.endpoint-item:hover {
  border-color: var(--color-border);
  box-shadow: var(--shadow-sm);
}

.endpoint-item.featured {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(139, 92, 246, 0.03));
}

.endpoint-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.endpoint-header code {
  font-size: var(--text-sm);
  font-weight: 500;
  background: none;
  padding: 0;
  color: var(--color-text);
}

.method {
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.method.get {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
}

.method.post {
  background: rgba(59, 130, 246, 0.15);
  color: var(--color-primary);
}

.method.delete {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-error);
}

.endpoint-tag {
  padding: 2px 8px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  border-radius: var(--radius-full);
}

.endpoint-tag.new {
  background: linear-gradient(135deg, var(--color-success), #059669);
  color: white;
  font-weight: 600;
}

.endpoint-perm {
  padding: 2px 8px;
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning);
  font-size: var(--text-xs);
  border-radius: var(--radius-full);
}

.endpoint-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-sm);
}

.endpoint-params-box {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-sm);
}

.param {
  padding: 2px 8px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  font-family: monospace;
}

.param.required {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.param.required::after {
  content: '*';
  margin-left: 2px;
}

.endpoint-note {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-sm);
}

.endpoint-example-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: var(--spacing-sm) 0 var(--spacing-xs);
  font-weight: 500;
}

/* 响应格式网格 */
.format-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.format-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.format-item code {
  font-weight: 500;
  color: var(--color-primary);
}

.format-item span {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

/* 工具卡片 */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-base);
}

.tool-card {
  background: var(--color-bg-secondary);
  padding: var(--spacing-base);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.tool-name {
  font-weight: 600;
  color: var(--color-text);
}

.tool-type {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  padding: 2px 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
}

.tool-card p {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-sm);
}

/* 权限卡片 */
.perm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-base);
}

.perm-card {
  background: var(--color-bg-secondary);
  padding: var(--spacing-base);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.perm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.perm-name {
  font-weight: 600;
  color: var(--color-text);
}

.perm-level {
  padding: 2px 8px;
  font-size: var(--text-xs);
  font-weight: 500;
  border-radius: var(--radius-full);
}

.perm-level.safe {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
}

.perm-level.warning {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning);
}

.perm-level.danger {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-error);
}

.perm-card p {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
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

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
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

/* Token 结果 */
.token-result {
  text-align: center;
}

.warning-text {
  color: var(--color-warning);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-base);
}

.token-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--color-bg-secondary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.token-display code {
  flex: 1;
  font-family: monospace;
  font-size: var(--text-xs);
  word-break: break-all;
  text-align: left;
}

@media (max-width: 768px) {
  .token-page {
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
    min-width: 700px;
  }
}
</style>
