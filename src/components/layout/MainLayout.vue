<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AnnouncementBar from './AnnouncementBar.vue'
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <AnnouncementBar />
    <main class="main-content">
      <slot />
    </main>
    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; 2026 NKAtlas. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-secondary);
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg) var(--spacing-base);
}

.app-footer {
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-base);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
</style>
