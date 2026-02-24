<script setup lang="ts">
import Skeleton from './Skeleton.vue'

defineProps<{
  count?: number
}>()
</script>

<template>
  <div class="trash-skeleton-grid">
    <div
      v-for="i in (count || 8)"
      :key="i"
      class="trash-skeleton-item"
    >
      <div class="skeleton-preview">
        <Skeleton height="100%" />
      </div>
      <div class="skeleton-info">
        <Skeleton height="14px" width="70%" variant="text" />
        <Skeleton height="12px" width="50%" variant="text" />
        <div class="skeleton-actions">
          <Skeleton height="30px" width="48%" radius="var(--radius-md)" />
          <Skeleton height="30px" width="48%" radius="var(--radius-md)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trash-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-base);
}

.trash-skeleton-item {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.skeleton-preview {
  aspect-ratio: 16 / 10;
  background: var(--color-bg-secondary);
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-base);
}

.skeleton-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

@media (max-width: 640px) {
  .trash-skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
