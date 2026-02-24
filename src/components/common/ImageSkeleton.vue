<script setup lang="ts">
import Skeleton from './Skeleton.vue'

defineProps<{
  count?: number
}>()
</script>

<template>
  <div class="image-skeleton-grid">
    <div
      v-for="i in (count || 12)"
      :key="i"
      class="image-skeleton-item"
    >
      <div class="skeleton-preview">
        <Skeleton height="100%" />
      </div>
      <div class="skeleton-info">
        <Skeleton height="14px" width="70%" variant="text" />
        <Skeleton height="12px" width="50%" variant="text" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-base);
}

.image-skeleton-item {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.skeleton-preview {
  aspect-ratio: 1;
  background: var(--color-bg-secondary);
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
}

@media (max-width: 768px) {
  .image-skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
