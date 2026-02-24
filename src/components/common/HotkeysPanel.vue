<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHotkeys, formatHotkey } from '@/composables/useHotkeys'

const { t } = useI18n()
const { hotkeysPanelVisible, hideHotkeysPanel, getHotkeysByCategory } = useHotkeys()

const hotkeysByCategory = computed(() => getHotkeysByCategory())

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    hideHotkeysPanel()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="hotkeysPanelVisible" class="hotkeys-overlay" @click="handleOverlayClick">
        <div class="hotkeys-panel">
          <div class="panel-header">
            <h2 class="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                <path d="M6 8h.001"/>
                <path d="M10 8h.001"/>
                <path d="M14 8h.001"/>
                <path d="M18 8h.001"/>
                <path d="M8 12h.001"/>
                <path d="M12 12h.001"/>
                <path d="M16 12h.001"/>
                <path d="M7 16h10"/>
              </svg>
              {{ t('hotkeys.title') }}
            </h2>
            <button class="close-btn" @click="hideHotkeysPanel" :title="t('hotkeys.closeTooltip')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="panel-body">
            <div v-if="Object.keys(hotkeysByCategory).length === 0" class="empty-state">
              <p>{{ t('hotkeys.noHotkeys') }}</p>
            </div>

            <div v-else class="hotkeys-list">
              <div
                v-for="(hotkeys, category) in hotkeysByCategory"
                :key="category"
                class="hotkey-category"
              >
                <h3 class="category-title">{{ category }}</h3>
                <div class="hotkey-items">
                  <div
                    v-for="hotkey in hotkeys"
                    :key="formatHotkey(hotkey)"
                    class="hotkey-item"
                  >
                    <span class="hotkey-description">{{ hotkey.description }}</span>
                    <kbd class="hotkey-key">{{ formatHotkey(hotkey) }}</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-footer">
            <span class="hint">{{ t('hotkeys.pressToClose') }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.hotkeys-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.hotkeys-panel {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
}

.panel-title svg {
  color: var(--color-primary);
}

.close-btn {
  padding: var(--spacing-xs);
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.empty-state {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--spacing-xl);
}

.hotkeys-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.hotkey-category {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.category-title {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  margin: 0;
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--color-border);
}

.hotkey-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.hotkey-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
}

.hotkey-description {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.hotkey-key {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  box-shadow: 0 1px 0 var(--color-border);
}

.panel-footer {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.hint kbd {
  display: inline-block;
  padding: 2px 6px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: inherit;
  margin: 0 2px;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .hotkeys-panel,
.modal-leave-active .hotkeys-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .hotkeys-panel,
.modal-leave-to .hotkeys-panel {
  transform: scale(0.95);
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .hotkeys-overlay {
    padding: var(--spacing-base);
  }

  .hotkeys-panel {
    max-height: 90vh;
  }

  .panel-body {
    padding: var(--spacing-base);
  }
}
</style>
