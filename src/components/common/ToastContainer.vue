<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

function getIcon(type: string) {
  switch (type) {
    case 'success':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'error':
      return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    default: // info
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="[`toast-${toast.type}`, { 'toast-leaving': toast.leaving }]"
        >
          <div class="toast-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path :d="getIcon(toast.type)" />
            </svg>
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <div class="toast-progress">
            <div class="toast-progress-bar"></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
  max-width: 420px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--color-bg-elevated, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08);
  border-left: 4px solid;
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.toast-icon svg {
  width: 100%;
  height: 100%;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text, #1a1a1a);
  word-break: break-word;
}

/* Info 样式 - 蓝色 */
.toast-info {
  border-left-color: var(--color-info, #0078d4);
  background: linear-gradient(to right, rgba(0, 120, 212, 0.08), var(--color-bg-elevated, #fff) 40%);
}

.toast-info .toast-icon {
  color: var(--color-info, #0078d4);
}

.toast-info .toast-progress-bar {
  background: var(--color-info, #0078d4);
}

/* Success 样式 - 绿色 */
.toast-success {
  border-left-color: var(--color-success, #107c10);
  background: linear-gradient(to right, rgba(16, 124, 16, 0.08), var(--color-bg-elevated, #fff) 40%);
}

.toast-success .toast-icon {
  color: var(--color-success, #107c10);
}

.toast-success .toast-progress-bar {
  background: var(--color-success, #107c10);
}

/* Error 样式 - 红色 */
.toast-error {
  border-left-color: var(--color-error, #d13438);
  background: linear-gradient(to right, rgba(209, 52, 56, 0.08), var(--color-bg-elevated, #fff) 40%);
}

.toast-error .toast-icon {
  color: var(--color-error, #d13438);
}

.toast-error .toast-progress-bar {
  background: var(--color-error, #d13438);
}

/* 进度条 */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.06);
}

.toast-progress-bar {
  height: 100%;
  width: 100%;
  animation: progress 5s linear forwards;
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* 过渡动画 */
.toast-enter-active {
  animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  animation: toast-out 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leaving {
  animation: toast-leave-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@keyframes toast-leave-up {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* 移动端适配 */
@media (max-width: 480px) {
  .toast-container {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }

  .toast-item {
    min-width: auto;
    max-width: none;
  }
}
</style>

<!-- 暗色模式适配：因 Teleport 到 body，scoped 对 [data-theme] 选择器无效，需使用非 scoped 块 -->
<style>
[data-theme='dark'] .toast-item {
  background: var(--color-bg-elevated, #2d2d2d);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.32), 0 1px 4px rgba(0, 0, 0, 0.24);
}

[data-theme='dark'] .toast-info {
  background: linear-gradient(to right, rgba(0, 120, 212, 0.15), var(--color-bg-elevated, #2d2d2d) 40%);
}

[data-theme='dark'] .toast-success {
  background: linear-gradient(to right, rgba(16, 124, 16, 0.15), var(--color-bg-elevated, #2d2d2d) 40%);
}

[data-theme='dark'] .toast-error {
  background: linear-gradient(to right, rgba(209, 52, 56, 0.15), var(--color-bg-elevated, #2d2d2d) 40%);
}

[data-theme='dark'] .toast-progress {
  background: rgba(255, 255, 255, 0.1);
}
</style>
