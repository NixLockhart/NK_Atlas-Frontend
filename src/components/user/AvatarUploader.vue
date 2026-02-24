<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { uploadAvatar } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import { CONFIG } from '@/config'
import { getErrorMessage } from '@/utils/error'

const { t } = useI18n()
const userStore = useUserStore()
const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const loading = ref(false)

function handleClick() {
  fileInput.value?.click()
}

async function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > CONFIG.avatarMaxSize) {
    toast.error(t('user.avatarSizeLimit'))
    return
  }

  if (!file.type.startsWith('image/')) {
    toast.error(t('user.selectImageFile'))
    return
  }

  loading.value = true

  try {
    const res = await uploadAvatar(file)
    if (userStore.userInfo) {
      userStore.userInfo.avatar = res.avatar
    }
    toast.success(t('user.avatarChangeSuccess'))
  } catch (err) {
    toast.error(getErrorMessage(err, t('upload.failed')))
  } finally {
    loading.value = false
    target.value = ''
  }
}
</script>

<template>
  <div class="avatar-uploader">
    <div class="avatar-wrapper" @click="handleClick">
      <img
        :src="userStore.userInfo?.avatar || '/default-avatar.png'"
        :alt="t('user.avatar')"
        class="avatar-img"
      />
      <div class="avatar-overlay">
        <svg v-if="loading" class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <template v-else>
          <svg class="camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span>{{ t('user.changeAvatar') }}</span>
        </template>
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleFileChange"
      hidden
    />
    <p class="avatar-hint">{{ t('user.changeAvatarHint') }}</p>
  </div>
</template>

<style scoped>
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid var(--color-border);
  transition: var(--transition-base);
}

.avatar-wrapper:hover {
  border-color: var(--color-primary);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: var(--transition-base);
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay span {
  color: white;
  font-size: var(--text-xs);
  font-weight: 500;
}

.camera-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.loading-icon {
  width: 24px;
  height: 24px;
  color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.avatar-hint {
  margin: var(--spacing-sm) 0 0;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}
</style>
