<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  used: number
  total: number
}>()

const percent = computed(() => {
  if (!props.total) return 0
  return Math.round(props.used / props.total * 100)
})

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}
</script>

<template>
  <div class="quota-progress">
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: percent + '%' }"
        :class="{ warning: percent > 80, danger: percent > 95 }"
      ></div>
    </div>
    <div class="progress-text">
      {{ formatSize(used) }} / {{ formatSize(total) }} ({{ percent }}%)
    </div>
  </div>
</template>

<style scoped>
.quota-progress {
  width: 100%;
}

.progress-bar {
  height: 8px;
  background: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1890ff;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.warning {
  background: #faad14;
}

.progress-fill.danger {
  background: #ff4d4f;
}

.progress-text {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
</style>
