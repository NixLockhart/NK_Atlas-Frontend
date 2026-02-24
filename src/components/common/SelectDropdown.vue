<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

export interface SelectOption {
  value: string | number | undefined
  label: string
}

const { t } = useI18n()

const props = withDefaults(defineProps<{
  modelValue: string | number | undefined
  options: SelectOption[]
  placeholder?: string
  width?: string
}>(), {
  placeholder: '',
  width: '140px'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | undefined): void
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option ? option.label : (props.placeholder || t('common.pleaseSelect'))
})

function toggle() {
  isOpen.value = !isOpen.value
}

function select(option: SelectOption) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (
    triggerRef.value && !triggerRef.value.contains(target) &&
    dropdownRef.value && !dropdownRef.value.contains(target)
  ) {
    isOpen.value = false
  }
}

watch(isOpen, (open) => {
  if (open) {
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
  <div class="select-dropdown" :style="{ width }">
    <button
      ref="triggerRef"
      type="button"
      class="select-trigger"
      :class="{ active: isOpen }"
      @click="toggle"
    >
      <span class="select-value">{{ selectedLabel }}</span>
      <svg
        class="select-arrow"
        :class="{ open: isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        width="14"
        height="14"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
    <Transition name="dropdown">
      <div v-if="isOpen" ref="dropdownRef" class="select-menu">
        <button
          v-for="option in options"
          :key="String(option.value)"
          type="button"
          class="select-option"
          :class="{ selected: option.value === modelValue }"
          @click="select(option)"
        >
          <span>{{ option.label }}</span>
          <svg
            v-if="option.value === modelValue"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="14"
            height="14"
          >
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.select-dropdown {
  position: relative;
  display: inline-block;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition-fast);
}

.select-trigger:hover {
  border-color: var(--color-border-hover);
}

.select-trigger.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-bg);
}

.select-value {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-arrow {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: transform 0.2s ease;
}

.select-arrow.open {
  transform: rotate(180deg);
}

.select-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.select-option:hover {
  background: var(--color-bg-hover);
}

.select-option.selected {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.select-option svg {
  flex-shrink: 0;
  color: var(--color-primary);
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
