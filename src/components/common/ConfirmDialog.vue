<script setup lang="ts">
import { watch, nextTick, ref as vueRef } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { state, handleConfirm, handleCancel } = useConfirm()
const overlay = vueRef<HTMLElement | null>(null)

// 当对话框显示时自动聚焦 overlay 以接收键盘事件
watch(() => state.value.visible, (visible) => {
  if (visible) {
    nextTick(() => overlay.value?.focus())
  }
})

function getIcon(type: string) {
  switch (type) {
    case 'warning':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    case 'danger':
      return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    default: // info
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleCancel()
  } else if (e.key === 'Enter') {
    handleConfirm()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div
        v-if="state.visible"
        class="confirm-overlay"
        @click="onOverlayClick"
        @keydown="onKeydown"
        tabindex="-1"
        ref="overlay"
      >
        <Transition name="confirm-scale" appear>
          <div class="confirm-dialog" :class="[`confirm-${state.type}`]">
            <div class="confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="getIcon(state.type)" />
              </svg>
            </div>
            <div class="confirm-content">
              <h3 v-if="state.title" class="confirm-title">{{ state.title }}</h3>
              <p class="confirm-message">{{ state.message }}</p>
            </div>
            <div class="confirm-actions">
              <button class="btn btn-secondary" @click="handleCancel">
                {{ state.cancelText || t('common.cancel') }}
              </button>
              <button
                class="btn"
                :class="state.type === 'danger' ? 'btn-danger' : 'btn-primary'"
                @click="handleConfirm"
              >
                {{ state.confirmText || t('common.confirm') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-confirm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  padding: var(--spacing-base);
}

.confirm-dialog {
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.confirm-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-base);
}

.confirm-icon svg {
  width: 28px;
  height: 28px;
}

/* Info 样式 - 蓝色 */
.confirm-info .confirm-icon {
  background: color-mix(in srgb, var(--color-info, #0078d4) 10%, transparent);
  color: var(--color-info, #0078d4);
}

/* Warning 样式 - 橙色 */
.confirm-warning .confirm-icon {
  background: color-mix(in srgb, var(--color-warning, #ffaa00) 10%, transparent);
  color: var(--color-warning, #ffaa00);
}

/* Danger 样式 - 红色 */
.confirm-danger .confirm-icon {
  background: color-mix(in srgb, var(--color-error, #d13438) 10%, transparent);
  color: var(--color-error, #d13438);
}

.confirm-content {
  margin-bottom: var(--spacing-lg);
}

.confirm-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm);
}

.confirm-message {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: var(--spacing-sm);
  width: 100%;
}

.confirm-actions .btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-base);
  font-size: var(--text-sm);
  font-weight: 500;
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: var(--transition-base);
}

.confirm-actions .btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.confirm-actions .btn-secondary:hover {
  background: var(--color-bg-hover);
}

.confirm-actions .btn-primary {
  background: var(--color-primary);
  color: white;
  border: 1px solid var(--color-primary);
}

.confirm-actions .btn-primary:hover {
  background: var(--color-primary-hover);
}

.confirm-actions .btn-danger {
  background: var(--color-error);
  color: white;
  border: 1px solid var(--color-error);
}

.confirm-actions .btn-danger:hover {
  filter: brightness(0.9);
}

/* 过渡动画 */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-scale-enter-active {
  animation: confirm-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-scale-leave-active {
  animation: confirm-scale-out 0.2s ease;
}

@keyframes confirm-scale-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes confirm-scale-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

/* 移动端适配 */
@media (max-width: 480px) {
  .confirm-dialog {
    max-width: none;
    margin: var(--spacing-base);
    padding: var(--spacing-lg);
  }

  .confirm-icon {
    width: 48px;
    height: 48px;
  }

  .confirm-icon svg {
    width: 24px;
    height: 24px;
  }

  .confirm-actions {
    flex-direction: column-reverse;
  }
}
</style>
