<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getConfigs, setConfig, syncQuotaToAllUsers, getDashboardStats } from '@/api/admin'
import type { SystemConfig } from '@/types'
import { useSiteStore } from '@/stores/site'
import AdminNav from '@/components/admin/AdminNav.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()
const siteStore = useSiteStore()
const loading = ref(true)
const saving = ref(false)
const configGroups = ref<Record<string, SystemConfig[]>>({})

// 表单数据
const siteForm = ref({
  site_name: '',
  site_description: '',
  site_url: ''
})

const uploadForm = ref({
  max_file_size: 10,
  allowed_types: 'image/jpeg,image/png,image/gif,image/webp',
  max_uploads_per_day: 0
})

const quotaForm = ref({
  default_quota: 200,
  sync_quota: false
})

const trashForm = ref({
  recycle_days: 10
})

const emailForm = ref({
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_from: ''
})

const registrationForm = ref({
  allow_register: true,
  max_users: 0
})

const currentUserCount = ref(0)

const storageForm = ref({
  storage_type: 'local',
  // 本地存储
  local_base_path: './uploads',
  local_base_url: 'http://localhost:8080/uploads',
  // 阿里云 OSS
  aliyun_endpoint: '',
  aliyun_access_key: '',
  aliyun_secret_key: '',
  aliyun_bucket: '',
  aliyun_domain: '',
  aliyun_path_prefix: 'images',
  // 腾讯云 COS
  tencent_secret_id: '',
  tencent_secret_key: '',
  tencent_region: '',
  tencent_bucket: '',
  tencent_domain: '',
  tencent_path_prefix: 'images',
  // 七牛云
  qiniu_access_key: '',
  qiniu_secret_key: '',
  qiniu_bucket: '',
  qiniu_domain: '',
  qiniu_region: '',
  qiniu_path_prefix: 'images'
})

// 存储类型选项
const storageTypes = computed(() => [
  { value: 'local', label: t('admin.storageLocal') },
  { value: 'aliyun', label: t('admin.storageAliyun') },
  { value: 'tencent', label: t('admin.storageTencent') },
  { value: 'qiniu', label: t('admin.storageQiniu') }
])

async function loadConfigs() {
  loading.value = true
  try {
    // 同时获取配置和用户统计
    const [data, stats] = await Promise.all([
      getConfigs(),
      getDashboardStats()
    ])

    if (typeof data === 'object' && !Array.isArray(data)) {
      configGroups.value = data as Record<string, SystemConfig[]>

      // 填充表单
      populateForms()
    }

    // 获取当前用户数
    currentUserCount.value = stats.total_users || 0
  } catch (error) {
    console.error('Failed to load configs:', error)
  } finally {
    loading.value = false
  }
}

function populateForms() {
  const groups = configGroups.value

  // 站点配置
  if (groups.site) {
    groups.site.forEach(config => {
      if (config.key === 'site_name') siteForm.value.site_name = config.value
      if (config.key === 'site_desc') siteForm.value.site_description = config.value
      if (config.key === 'site_url') siteForm.value.site_url = config.value
    })
  }

  // 上传配置
  if (groups.upload) {
    groups.upload.forEach(config => {
      if (config.key === 'max_upload_size') {
        // 数据库存储的是字节，转换为 MB 显示
        const bytes = parseInt(config.value) || 10485760
        uploadForm.value.max_file_size = Math.round(bytes / 1024 / 1024)
      }
      if (config.key === 'allowed_types') uploadForm.value.allowed_types = config.value
      if (config.key === 'max_uploads_per_day') uploadForm.value.max_uploads_per_day = parseInt(config.value) || 0
    })
  }

  // 配额配置
  if (groups.quota) {
    groups.quota.forEach(config => {
      if (config.key === 'default_quota') {
        // 数据库存储的是字节，转换为 MB 显示
        const bytes = parseInt(config.value) || 209715200
        quotaForm.value.default_quota = Math.round(bytes / 1024 / 1024)
      }
      if (config.key === 'recycle_days') {
        trashForm.value.recycle_days = parseInt(config.value) || 10
      }
    })
  }

  // 邮件配置
  if (groups.email) {
    groups.email.forEach(config => {
      if (config.key === 'smtp_host') emailForm.value.smtp_host = config.value
      if (config.key === 'smtp_port') emailForm.value.smtp_port = parseInt(config.value) || 587
      if (config.key === 'smtp_username') emailForm.value.smtp_username = config.value
      if (config.key === 'smtp_password') emailForm.value.smtp_password = config.value
      if (config.key === 'smtp_from') emailForm.value.smtp_from = config.value
    })
  }

  // 注册设置
  if (groups.security) {
    groups.security.forEach(config => {
      if (config.key === 'allow_register') registrationForm.value.allow_register = config.value === 'true'
      if (config.key === 'max_users') registrationForm.value.max_users = parseInt(config.value) || 0
    })
  }

  // 存储配置
  if (groups.storage) {
    groups.storage.forEach(config => {
      if (config.key === 'storage_type') storageForm.value.storage_type = config.value || 'local'
      // 本地存储
      if (config.key === 'local_base_path') storageForm.value.local_base_path = config.value
      if (config.key === 'local_base_url') storageForm.value.local_base_url = config.value
      // 阿里云 OSS
      if (config.key === 'aliyun_endpoint') storageForm.value.aliyun_endpoint = config.value
      if (config.key === 'aliyun_access_key') storageForm.value.aliyun_access_key = config.value
      if (config.key === 'aliyun_secret_key') storageForm.value.aliyun_secret_key = config.value
      if (config.key === 'aliyun_bucket') storageForm.value.aliyun_bucket = config.value
      if (config.key === 'aliyun_domain') storageForm.value.aliyun_domain = config.value
      if (config.key === 'aliyun_path_prefix') storageForm.value.aliyun_path_prefix = config.value || 'images'
      // 腾讯云 COS
      if (config.key === 'tencent_secret_id') storageForm.value.tencent_secret_id = config.value
      if (config.key === 'tencent_secret_key') storageForm.value.tencent_secret_key = config.value
      if (config.key === 'tencent_region') storageForm.value.tencent_region = config.value
      if (config.key === 'tencent_bucket') storageForm.value.tencent_bucket = config.value
      if (config.key === 'tencent_domain') storageForm.value.tencent_domain = config.value
      if (config.key === 'tencent_path_prefix') storageForm.value.tencent_path_prefix = config.value || 'images'
      // 七牛云
      if (config.key === 'qiniu_access_key') storageForm.value.qiniu_access_key = config.value
      if (config.key === 'qiniu_secret_key') storageForm.value.qiniu_secret_key = config.value
      if (config.key === 'qiniu_bucket') storageForm.value.qiniu_bucket = config.value
      if (config.key === 'qiniu_domain') storageForm.value.qiniu_domain = config.value
      if (config.key === 'qiniu_region') storageForm.value.qiniu_region = config.value
      if (config.key === 'qiniu_path_prefix') storageForm.value.qiniu_path_prefix = config.value || 'images'
    })
  }
}

async function saveSiteConfig() {
  saving.value = true
  try {
    await Promise.all([
      setConfig({ group: 'site', key: 'site_name', value: siteForm.value.site_name, type: 'string', desc: '站点名称' }),
      setConfig({ group: 'site', key: 'site_desc', value: siteForm.value.site_description, type: 'string', desc: '站点描述' }),
      setConfig({ group: 'site', key: 'site_url', value: siteForm.value.site_url, type: 'string', desc: '站点URL' })
    ])
    toast.success(t('admin.configSaved'))
    // 刷新站点配置缓存，更新页面标题等
    siteStore.refreshSiteConfig()
  } catch (error) {
    console.error('Failed to save site config:', error)
    toast.error(t('admin.configSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function saveUploadConfig() {
  saving.value = true
  try {
    // 将 MB 转换为字节存储
    const maxSizeBytes = uploadForm.value.max_file_size * 1024 * 1024
    await Promise.all([
      setConfig({ group: 'upload', key: 'max_upload_size', value: String(maxSizeBytes), type: 'int', desc: '单文件最大上传大小(字节)' }),
      setConfig({ group: 'upload', key: 'allowed_types', value: uploadForm.value.allowed_types, type: 'string', desc: '允许的文件类型' }),
      setConfig({ group: 'upload', key: 'max_uploads_per_day', value: String(uploadForm.value.max_uploads_per_day), type: 'int', desc: '每日上传次数限制(0=不限制)' })
    ])
    toast.success(t('admin.configSaved'))
    // 刷新站点配置缓存，更新前端的最大上传限制
    siteStore.refreshSiteConfig()
  } catch (error) {
    console.error('Failed to save upload config:', error)
    toast.error(t('admin.configSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function saveQuotaConfig() {
  saving.value = true
  try {
    // 将 MB 转换为字节存储
    const quotaBytes = quotaForm.value.default_quota * 1024 * 1024
    await setConfig({
      group: 'quota',
      key: 'default_quota',
      value: String(quotaBytes),
      type: 'int',
      desc: '默认用户配额(字节)'
    })

    // 如果勾选了同步，则调用同步接口
    if (quotaForm.value.sync_quota) {
      await syncQuotaToAllUsers()
      toast.success(t('admin.quotaSavedAndSynced'))
    } else {
      toast.success(t('admin.quotaSavedNewOnly'))
    }
    quotaForm.value.sync_quota = false
  } catch (error) {
    console.error('Failed to save quota config:', error)
    toast.error(t('admin.configSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function saveTrashConfig() {
  saving.value = true
  try {
    await setConfig({
      group: 'quota',
      key: 'recycle_days',
      value: String(trashForm.value.recycle_days),
      type: 'int',
      desc: '回收站保留天数'
    })
    toast.success(t('admin.configSaved'))
  } catch (error) {
    console.error('Failed to save trash config:', error)
    toast.error(t('admin.configSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function saveEmailConfig() {
  saving.value = true
  try {
    await Promise.all([
      setConfig({ group: 'email', key: 'smtp_host', value: emailForm.value.smtp_host, type: 'string', desc: 'SMTP服务器' }),
      setConfig({ group: 'email', key: 'smtp_port', value: String(emailForm.value.smtp_port), type: 'int', desc: 'SMTP端口' }),
      setConfig({ group: 'email', key: 'smtp_username', value: emailForm.value.smtp_username, type: 'string', desc: 'SMTP用户名' }),
      setConfig({ group: 'email', key: 'smtp_password', value: emailForm.value.smtp_password, type: 'string', desc: 'SMTP密码' }),
      setConfig({ group: 'email', key: 'smtp_from', value: emailForm.value.smtp_from, type: 'string', desc: '发件人地址' })
    ])
    toast.success(t('admin.configSaved'))
  } catch (error) {
    console.error('Failed to save email config:', error)
    toast.error(t('admin.configSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function saveRegistrationConfig() {
  saving.value = true
  try {
    // 先保存用户数上限
    await setConfig({
      group: 'security',
      key: 'max_users',
      value: String(registrationForm.value.max_users),
      type: 'int',
      desc: '最大用户数(0=不限制)'
    })

    // 再保存注册开关
    await setConfig({
      group: 'security',
      key: 'allow_register',
      value: String(registrationForm.value.allow_register),
      type: 'boolean',
      desc: '是否允许注册'
    })

    toast.success(t('admin.configSaved'))
    // 刷新站点配置缓存
    siteStore.refreshSiteConfig()
  } catch (error: any) {
    console.error('Failed to save registration config:', error)
    // 显示具体错误信息
    if (error.message) {
      toast.error(error.message)
    } else {
      toast.error(t('admin.configSaveFailed'))
    }
  } finally {
    saving.value = false
  }
}

async function saveStorageConfig() {
  saving.value = true
  try {
    const configs = [
      { group: 'storage', key: 'storage_type', value: storageForm.value.storage_type, type: 'string', desc: '存储类型' }
    ]

    // 根据存储类型添加对应配置
    switch (storageForm.value.storage_type) {
      case 'local':
        configs.push(
          { group: 'storage', key: 'local_base_path', value: storageForm.value.local_base_path, type: 'string', desc: '本地存储路径' },
          { group: 'storage', key: 'local_base_url', value: storageForm.value.local_base_url, type: 'string', desc: '本地访问URL' }
        )
        break
      case 'aliyun':
        configs.push(
          { group: 'storage', key: 'aliyun_endpoint', value: storageForm.value.aliyun_endpoint, type: 'string', desc: '阿里云端点' },
          { group: 'storage', key: 'aliyun_access_key', value: storageForm.value.aliyun_access_key, type: 'string', desc: '阿里云AccessKey' },
          { group: 'storage', key: 'aliyun_secret_key', value: storageForm.value.aliyun_secret_key, type: 'string', desc: '阿里云SecretKey' },
          { group: 'storage', key: 'aliyun_bucket', value: storageForm.value.aliyun_bucket, type: 'string', desc: '阿里云Bucket' },
          { group: 'storage', key: 'aliyun_domain', value: storageForm.value.aliyun_domain, type: 'string', desc: '阿里云域名' },
          { group: 'storage', key: 'aliyun_path_prefix', value: storageForm.value.aliyun_path_prefix, type: 'string', desc: '阿里云路径前缀' }
        )
        break
      case 'tencent':
        configs.push(
          { group: 'storage', key: 'tencent_secret_id', value: storageForm.value.tencent_secret_id, type: 'string', desc: '腾讯云SecretID' },
          { group: 'storage', key: 'tencent_secret_key', value: storageForm.value.tencent_secret_key, type: 'string', desc: '腾讯云SecretKey' },
          { group: 'storage', key: 'tencent_region', value: storageForm.value.tencent_region, type: 'string', desc: '腾讯云地域' },
          { group: 'storage', key: 'tencent_bucket', value: storageForm.value.tencent_bucket, type: 'string', desc: '腾讯云Bucket' },
          { group: 'storage', key: 'tencent_domain', value: storageForm.value.tencent_domain, type: 'string', desc: '腾讯云域名' },
          { group: 'storage', key: 'tencent_path_prefix', value: storageForm.value.tencent_path_prefix, type: 'string', desc: '腾讯云路径前缀' }
        )
        break
      case 'qiniu':
        configs.push(
          { group: 'storage', key: 'qiniu_access_key', value: storageForm.value.qiniu_access_key, type: 'string', desc: '七牛云AccessKey' },
          { group: 'storage', key: 'qiniu_secret_key', value: storageForm.value.qiniu_secret_key, type: 'string', desc: '七牛云SecretKey' },
          { group: 'storage', key: 'qiniu_bucket', value: storageForm.value.qiniu_bucket, type: 'string', desc: '七牛云Bucket' },
          { group: 'storage', key: 'qiniu_domain', value: storageForm.value.qiniu_domain, type: 'string', desc: '七牛云域名' },
          { group: 'storage', key: 'qiniu_region', value: storageForm.value.qiniu_region, type: 'string', desc: '七牛云区域' },
          { group: 'storage', key: 'qiniu_path_prefix', value: storageForm.value.qiniu_path_prefix, type: 'string', desc: '七牛云路径前缀' }
        )
        break
    }

    await Promise.all(configs.map(cfg => setConfig(cfg)))
    toast.success(t('admin.configSaved') + ' - ' + t('admin.storageRestartHint'))
  } catch (error) {
    console.error('Failed to save storage config:', error)
    toast.error(t('admin.configSaveFailed'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfigs()
})
</script>

<template>
  <div class="config-page">
    <AdminNav />

    <div class="page-header">
      <h1 class="page-title">{{ t('admin.config') }}</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else class="config-sections">
      <!-- 站点配置 -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>{{ t('admin.siteInfo') }}</h2>
            <p>{{ t('admin.siteInfoDesc') }}</p>
          </div>
        </div>
        <div class="section-body">
          <div class="form-group">
            <label>{{ t('admin.siteName') }}</label>
            <input type="text" v-model="siteForm.site_name" class="input" placeholder="NKAtlas" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.siteDescription') }}</label>
            <input type="text" v-model="siteForm.site_description" class="input" :placeholder="t('home.heroTitle')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.siteUrl') }}</label>
            <input type="url" v-model="siteForm.site_url" class="input" placeholder="https://example.com" />
          </div>
        </div>
        <div class="section-footer">
          <button class="btn btn-primary" @click="saveSiteConfig" :disabled="saving">{{ t('common.save') }}</button>
        </div>
      </div>

      <!-- 注册设置 -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon registration-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>{{ t('admin.registrationSettings') }}</h2>
            <p>{{ t('admin.registrationSettingsDesc') }}</p>
          </div>
        </div>
        <div class="section-body">
          <div class="form-group">
            <label>{{ t('admin.currentUsers') }}</label>
            <div class="current-users-display">
              <span class="users-count">{{ currentUserCount }}</span>
              <span v-if="registrationForm.max_users > 0" class="users-limit">/ {{ registrationForm.max_users }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('admin.maxUsers') }}</label>
            <input type="number" v-model.number="registrationForm.max_users" class="input" min="0" placeholder="0" />
            <span class="form-hint">{{ t('admin.maxUsersHint') }}</span>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="registrationForm.allow_register"
                :disabled="registrationForm.max_users > 0 && currentUserCount >= registrationForm.max_users"
              />
              <span>{{ t('admin.allowRegister') }}</span>
            </label>
            <span class="form-hint">{{ t('admin.allowRegisterHint') }}</span>
            <span
              v-if="registrationForm.max_users > 0 && currentUserCount >= registrationForm.max_users && !registrationForm.allow_register"
              class="form-hint warning"
            >
              {{ t('admin.cannotEnableRegister') }}
            </span>
          </div>
        </div>
        <div class="section-footer">
          <button class="btn btn-primary" @click="saveRegistrationConfig" :disabled="saving">{{ t('common.save') }}</button>
        </div>
      </div>

      <!-- 上传配置 -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>{{ t('admin.uploadSettings') }}</h2>
            <p>{{ t('admin.uploadSettingsDesc') }}</p>
          </div>
        </div>
        <div class="section-body">
          <div class="form-group">
            <label>{{ t('admin.maxFileSize') }}</label>
            <input type="number" v-model.number="uploadForm.max_file_size" class="input" min="1" max="100" />
            <span class="form-hint">{{ t('admin.maxFileSizeHint') }}</span>
          </div>
          <div class="form-group">
            <label>{{ t('admin.allowedTypes') }}</label>
            <input type="text" v-model="uploadForm.allowed_types" class="input" placeholder="image/jpeg,image/png,image/gif,image/webp" />
            <span class="form-hint">{{ t('admin.allowedTypesHint') }}</span>
          </div>
          <div class="form-group">
            <label>{{ t('admin.maxUploadsPerDay') }}</label>
            <input type="number" v-model.number="uploadForm.max_uploads_per_day" class="input" min="0" placeholder="0" />
            <span class="form-hint">{{ t('admin.maxUploadsPerDayHint') }}</span>
          </div>
        </div>
        <div class="section-footer">
          <button class="btn btn-primary" @click="saveUploadConfig" :disabled="saving">{{ t('common.save') }}</button>
        </div>
      </div>

      <!-- 配额配置 -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>{{ t('admin.quotaSettings') }}</h2>
            <p>{{ t('admin.quotaSettingsDesc') }}</p>
          </div>
        </div>
        <div class="section-body">
          <div class="form-group">
            <label>{{ t('admin.defaultQuota') }}</label>
            <input type="number" v-model.number="quotaForm.default_quota" class="input" min="1" />
            <span class="form-hint">{{ t('admin.defaultQuotaHint') }}</span>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="quotaForm.sync_quota" />
              <span>{{ t('admin.syncToAllUsers') }}</span>
            </label>
            <span class="form-hint warning">{{ t('admin.syncToAllUsersHint') }}</span>
          </div>
        </div>
        <div class="section-footer">
          <button class="btn btn-primary" @click="saveQuotaConfig" :disabled="saving">{{ t('common.save') }}</button>
        </div>
      </div>

      <!-- 回收站设置 -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon trash-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>{{ t('admin.trashSettings') }}</h2>
            <p>{{ t('admin.trashSettingsDesc') }}</p>
          </div>
        </div>
        <div class="section-body">
          <div class="form-group">
            <label>{{ t('admin.recycleDays') }}</label>
            <input type="number" v-model.number="trashForm.recycle_days" class="input" min="1" max="365" />
            <span class="form-hint">{{ t('admin.recycleDaysHint') }}</span>
          </div>
        </div>
        <div class="section-footer">
          <button class="btn btn-primary" @click="saveTrashConfig" :disabled="saving">{{ t('common.save') }}</button>
        </div>
      </div>

      <!-- 邮件配置 -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>{{ t('admin.emailSettings') }}</h2>
            <p>{{ t('admin.emailSettingsDesc') }}</p>
          </div>
        </div>
        <div class="section-body">
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.smtpHost') }}</label>
              <input type="text" v-model="emailForm.smtp_host" class="input" placeholder="smtp.example.com" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.smtpPort') }}</label>
              <input type="number" v-model.number="emailForm.smtp_port" class="input" placeholder="587" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.smtpUsername') }}</label>
              <input type="text" v-model="emailForm.smtp_username" class="input" placeholder="user@example.com" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.smtpPassword') }}</label>
              <input type="password" v-model="emailForm.smtp_password" class="input" placeholder="••••••••" />
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('admin.smtpFrom') }}</label>
            <input type="email" v-model="emailForm.smtp_from" class="input" placeholder="noreply@example.com" />
          </div>
        </div>
        <div class="section-footer">
          <button class="btn btn-primary" @click="saveEmailConfig" :disabled="saving">{{ t('common.save') }}</button>
        </div>
      </div>

      <!-- 存储配置 -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon storage-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>{{ t('admin.storageSettings') }}</h2>
            <p>{{ t('admin.storageSettingsDesc') }}</p>
          </div>
        </div>
        <div class="section-body">
          <div class="form-group">
            <label>{{ t('admin.storageType') }}</label>
            <SelectDropdown v-model="storageForm.storage_type" :options="storageTypes" width="100%" />
            <span class="form-hint">{{ t('admin.storageTypeHint') }}</span>
          </div>

          <!-- 本地存储配置 -->
          <template v-if="storageForm.storage_type === 'local'">
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.localBasePath') }}</label>
                <input type="text" v-model="storageForm.local_base_path" class="input" placeholder="./uploads" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.localBaseURL') }}</label>
                <input type="text" v-model="storageForm.local_base_url" class="input" placeholder="http://localhost:8080/uploads" />
              </div>
            </div>
          </template>

          <!-- 阿里云 OSS 配置 -->
          <template v-if="storageForm.storage_type === 'aliyun'">
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.aliyunEndpoint') }}</label>
                <input type="text" v-model="storageForm.aliyun_endpoint" class="input" placeholder="oss-cn-shanghai.aliyuncs.com" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.aliyunBucket') }}</label>
                <input type="text" v-model="storageForm.aliyun_bucket" class="input" placeholder="your-bucket-name" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.aliyunAccessKey') }}</label>
                <input type="text" v-model="storageForm.aliyun_access_key" class="input" placeholder="AccessKey ID" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.aliyunSecretKey') }}</label>
                <input type="password" v-model="storageForm.aliyun_secret_key" class="input" placeholder="AccessKey Secret" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.aliyunDomain') }}</label>
                <input type="text" v-model="storageForm.aliyun_domain" class="input" placeholder="https://cdn.example.com" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.aliyunPathPrefix') }}</label>
                <input type="text" v-model="storageForm.aliyun_path_prefix" class="input" placeholder="images" />
              </div>
            </div>
          </template>

          <!-- 腾讯云 COS 配置 -->
          <template v-if="storageForm.storage_type === 'tencent'">
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.tencentSecretID') }}</label>
                <input type="text" v-model="storageForm.tencent_secret_id" class="input" placeholder="SecretId" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.tencentSecretKey') }}</label>
                <input type="password" v-model="storageForm.tencent_secret_key" class="input" placeholder="SecretKey" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.tencentRegion') }}</label>
                <input type="text" v-model="storageForm.tencent_region" class="input" placeholder="ap-shanghai" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.tencentBucket') }}</label>
                <input type="text" v-model="storageForm.tencent_bucket" class="input" placeholder="bucket-1234567890" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.tencentDomain') }}</label>
                <input type="text" v-model="storageForm.tencent_domain" class="input" placeholder="https://cos.example.com" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.tencentPathPrefix') }}</label>
                <input type="text" v-model="storageForm.tencent_path_prefix" class="input" placeholder="images" />
              </div>
            </div>
          </template>

          <!-- 七牛云配置 -->
          <template v-if="storageForm.storage_type === 'qiniu'">
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.qiniuAccessKey') }}</label>
                <input type="text" v-model="storageForm.qiniu_access_key" class="input" placeholder="Access Key" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.qiniuSecretKey') }}</label>
                <input type="password" v-model="storageForm.qiniu_secret_key" class="input" placeholder="Secret Key" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.qiniuBucket') }}</label>
                <input type="text" v-model="storageForm.qiniu_bucket" class="input" placeholder="bucket-name" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.qiniuRegion') }}</label>
                <input type="text" v-model="storageForm.qiniu_region" class="input" placeholder="z0" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.qiniuDomain') }}</label>
                <input type="text" v-model="storageForm.qiniu_domain" class="input" placeholder="https://cdn.example.com" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.qiniuPathPrefix') }}</label>
                <input type="text" v-model="storageForm.qiniu_path_prefix" class="input" placeholder="images" />
              </div>
            </div>
          </template>

          <span class="form-hint warning">{{ t('admin.storageRestartHint') }}</span>
        </div>
        <div class="section-footer">
          <button class="btn btn-primary" @click="saveStorageConfig" :disabled="saving">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

/* 配置区块 */
.config-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.config-section {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-icon svg {
  width: 20px;
  height: 20px;
}

.section-info h2 {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.section-info p {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.section-body {
  padding: var(--spacing-base);
}

.section-footer {
  padding: var(--spacing-base);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
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

.form-hint.warning {
  color: var(--color-warning);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-base);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.checkbox-group > .checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
  margin-bottom: 0;
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
  vertical-align: middle;
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

.checkbox-label input[type="checkbox"]:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

.checkbox-label > span {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  line-height: 1;
}

/* 存储图标样式 */
.storage-icon {
  background: linear-gradient(135deg, var(--color-primary), #6366f1);
}

/* 注册图标样式 */
.registration-icon {
  background: linear-gradient(135deg, var(--color-success), #059669);
}

/* 回收站图标样式 */
.trash-icon {
  background: linear-gradient(135deg, var(--color-warning), #d97706);
}

/* 当前用户数显示 */
.current-users-display {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text);
}

.users-count {
  color: var(--color-primary);
}

.users-limit {
  font-size: var(--text-lg);
  color: var(--color-text-tertiary);
}

/* Select 样式 */
select.input {
  cursor: pointer;
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
