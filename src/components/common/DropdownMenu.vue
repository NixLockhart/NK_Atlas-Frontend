<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue'

export interface DropdownItem {
  key: string
  label: string
  icon?: string  // SVG path
  danger?: boolean
  disabled?: boolean
  divided?: boolean  // 分割线
}

const props = withDefaults(defineProps<{
  visible: boolean
  items: DropdownItem[]
  position?: 'left' | 'right'
}>(), {
  position: 'right'
})

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'select', key: string): void
}>()

const dropdownRef = ref<HTMLElement | null>(null)

function handleSelect(item: DropdownItem) {
  if (item.disabled) return
  emit('select', item.key)
  emit('update:visible', false)
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    emit('update:visible', false)
  }
}

watch(() => props.visible, (visible) => {
  if (visible) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <Transition name="dropdown">
    <div
      v-if="visible"
      ref="dropdownRef"
      class="dropdown-menu"
      :class="[`dropdown-${position}`]"
      @click.stop
    >
      <template v-for="(item, index) in items" :key="item.key">
        <div v-if="item.divided && index > 0" class="dropdown-divider"></div>
        <button
          class="dropdown-item"
          :class="{ 'dropdown-item--danger': item.danger, 'dropdown-item--disabled': item.disabled }"
          :disabled="item.disabled"
          @click="handleSelect(item)"
        >
          <svg
            v-if="item.icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            width="16"
            height="16"
            v-html="item.icon"
          />
          <span>{{ item.label }}</span>
        </button>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
.dropdown-menu {
  position: absolute;
  top: 100%;
  margin-top: 4px;
  min-width: 140px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 100;
}

.dropdown-right {
  right: 0;
}

.dropdown-left {
  left: 0;
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-xs) 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-base);
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.dropdown-item:hover {
  background: var(--color-bg-hover);
}

.dropdown-item svg {
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.dropdown-item--danger {
  color: var(--color-danger);
}

.dropdown-item--danger svg {
  color: var(--color-danger);
}

.dropdown-item--danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.dropdown-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-item--disabled:hover {
  background: transparent;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
