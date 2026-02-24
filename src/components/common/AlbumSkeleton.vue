<script setup lang="ts">
import Skeleton from './Skeleton.vue'

defineProps<{
  count?: number
}>()
</script>

<template>
  <div class="album-skeleton-grid">
    <div
      v-for="i in (count || 8)"
      :key="i"
      class="album-skeleton-item"
    >
      <div class="skeleton-cover">
        <Skeleton height="100%" />
      </div>
      <div class="skeleton-info">
        <Skeleton height="16px" width="60%" variant="text" />
        <Skeleton height="12px" width="80%" variant="text" />
        <Skeleton height="12px" width="40%" variant="text" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.album-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-lg);
}

.album-skeleton-item {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.skeleton-cover {
  aspect-ratio: 16 / 10;
  background: var(--color-bg-secondary);
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-base);
}

@media (max-width: 640px) {
  .album-skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
