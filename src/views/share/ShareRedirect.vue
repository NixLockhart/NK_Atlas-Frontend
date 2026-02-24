<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

onMounted(() => {
  const code = route.params.code as string
  // 短链接直接重定向到后端处理
  window.location.href = `/s/${code}`
})
</script>

<template>
  <div class="redirect-page">
    <div class="loading">
      <div class="spinner"></div>
      <p>正在跳转...</p>
    </div>
  </div>
</template>

<style scoped>
.redirect-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}

.loading {
  text-align: center;
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto var(--spacing-base);
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
