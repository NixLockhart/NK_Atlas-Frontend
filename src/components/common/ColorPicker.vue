<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore, PRESET_COLORS } from '@/stores/theme'

const { t } = useI18n()
const themeStore = useThemeStore()

const showCustomInput = ref(false)
const customColor = ref(themeStore.primaryColor)

const currentColor = computed(() => themeStore.primaryColor)

function selectColor(color: string) {
  themeStore.setPrimaryColor(color)
  customColor.value = color
}

function handleCustomColorChange() {
  if (/^#[0-9A-Fa-f]{6}$/.test(customColor.value)) {
    themeStore.setPrimaryColor(customColor.value)
  }
}

function isSelected(color: string) {
  return currentColor.value.toLowerCase() === color.toLowerCase()
}
</script>

<template>
  <div class="color-picker">
    <div class="color-label">{{ t('settings.themeColor') }}</div>
    <div class="color-options">
      <button
        v-for="color in PRESET_COLORS"
        :key="color.value"
        class="color-option"
        :class="{ selected: isSelected(color.value) }"
        :style="{ backgroundColor: color.value }"
        :title="t(color.name)"
        @click="selectColor(color.value)"
      >
        <svg v-if="isSelected(color.value)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>

      <!-- 自定义颜色按钮 -->
      <button
        class="color-option custom-btn"
        :class="{ selected: !PRESET_COLORS.some(c => isSelected(c.value)) }"
        :style="{ backgroundColor: !PRESET_COLORS.some(c => isSelected(c.value)) ? currentColor : 'transparent' }"
        :title="t('settings.customColor')"
        @click="showCustomInput = !showCustomInput"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8"/>
          <path d="M8 12h8"/>
        </svg>
      </button>
    </div>

    <!-- 自定义颜色输入 -->
    <div v-if="showCustomInput" class="custom-color-input">
      <div class="input-group">
        <input
          v-model="customColor"
          type="color"
          class="color-input-native"
        />
        <input
          v-model="customColor"
          type="text"
          class="color-input-text"
          placeholder="#3b82f6"
          maxlength="7"
          @change="handleCustomColorChange"
          @keyup.enter="handleCustomColorChange"
        />
        <button class="apply-btn" @click="handleCustomColorChange">{{ t('common.apply') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.color-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: var(--color-text);
  box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-text);
}

.color-option svg {
  width: 16px;
  height: 16px;
  color: white;
}

.custom-btn {
  border: 2px dashed var(--color-border);
  background: var(--color-bg-secondary) !important;
}

.custom-btn svg {
  color: var(--color-text-secondary);
}

.custom-btn:not(.selected):hover {
  border-color: var(--color-primary);
}

.custom-btn.selected {
  border-style: solid;
}

.custom-color-input {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.input-group {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.color-input-native {
  width: 40px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.color-input-native::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input-native::-webkit-color-swatch {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.color-input-text {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: var(--color-bg);
  text-transform: uppercase;
}

.color-input-text:focus {
  outline: none;
  border-color: var(--color-primary);
}

.apply-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.apply-btn:hover {
  background: var(--color-primary-hover);
}
</style>
