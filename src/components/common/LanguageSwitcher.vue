<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'

const { currentLocale, localeOptions, switchLocale } = useLocale()
</script>

<template>
  <div class="language-toggle-group">
    <button
      v-for="option in localeOptions"
      :key="option.value"
      class="lang-btn"
      :class="{ active: currentLocale === option.value }"
      @click="switchLocale(option.value as 'zh-CN' | 'en-US')"
    >
      <span class="flag">{{ option.flag }}</span>
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.language-toggle-group {
  display: flex;
  gap: var(--spacing-sm);
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.lang-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.lang-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.flag {
  font-size: 16px;
  line-height: 1;
}
</style>
