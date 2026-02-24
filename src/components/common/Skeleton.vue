<script setup lang="ts">
defineProps<{
  width?: string
  height?: string
  radius?: string
  variant?: 'text' | 'circular' | 'rectangular'
}>()
</script>

<template>
  <div
    class="skeleton"
    :class="[`skeleton-${variant || 'rectangular'}`]"
    :style="{
      width: width || '100%',
      height: height || '1em',
      borderRadius: radius
    }"
  />
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary) 25%,
    var(--color-bg-hover) 50%,
    var(--color-bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-text {
  border-radius: var(--radius-sm);
}

.skeleton-circular {
  border-radius: 50%;
}

.skeleton-rectangular {
  border-radius: var(--radius-md);
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
