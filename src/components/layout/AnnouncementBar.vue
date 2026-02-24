<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSiteStore } from '@/stores/site'

const { t } = useI18n()
const siteStore = useSiteStore()

const currentIndex = ref(0)
const collapsed = ref(false)
const showModal = ref(false)
const modalIndex = ref(0)
let autoPlayTimer: ReturnType<typeof setInterval> | null = null

const announcements = computed(() => siteStore.announcements)
const showAnnouncement = computed(() =>
  !siteStore.announcementsClosed && announcements.value.length > 0
)

const currentAnnouncement = computed(() =>
  announcements.value[currentIndex.value]
)

const modalAnnouncement = computed(() =>
  announcements.value[modalIndex.value]
)

function nextSlide() {
  if (announcements.value.length > 1) {
    currentIndex.value = (currentIndex.value + 1) % announcements.value.length
  }
}

function goToSlide(index: number) {
  currentIndex.value = index
  resetAutoPlay()
}

function startAutoPlay() {
  if (announcements.value.length > 1) {
    autoPlayTimer = setInterval(nextSlide, 5000)
  }
}

function resetAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
  }
  startAutoPlay()
}

function closeAnnouncement() {
  siteStore.closeAnnouncements()
}

function handleScroll() {
  collapsed.value = window.scrollY > 50
}

// 移动端弹窗相关
function openModal() {
  modalIndex.value = currentIndex.value
  showModal.value = true
  // 暂停自动播放
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

function closeModal() {
  showModal.value = false
  // 恢复自动播放
  startAutoPlay()
}

function modalPrev() {
  if (modalIndex.value > 0) {
    modalIndex.value--
  }
}

function modalNext() {
  if (modalIndex.value < announcements.value.length - 1) {
    modalIndex.value++
  }
}

onMounted(() => {
  siteStore.loadAnnouncements()
  startAutoPlay()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
  }
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Transition name="announcement">
    <div
      v-if="showAnnouncement"
      class="announcement-bar"
      :class="{ collapsed }"
    >
      <div class="announcement-container">
        <div class="announcement-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        <div class="announcement-content" @click="openModal">
          <Transition name="slide" mode="out-in">
            <div v-if="currentAnnouncement" :key="currentAnnouncement.id" class="announcement-text">
              <span class="announcement-title">{{ currentAnnouncement.title }}</span>
              <span class="announcement-separator">|</span>
              <span class="announcement-body">{{ currentAnnouncement.content }}</span>
            </div>
          </Transition>
        </div>

        <!-- 多公告指示器 -->
        <div v-if="announcements.length > 1" class="announcement-indicators">
          <button
            v-for="(_, index) in announcements"
            :key="index"
            class="indicator"
            :class="{ active: index === currentIndex }"
            @click="goToSlide(index)"
          />
        </div>

        <button class="close-btn" @click="closeAnnouncement" :title="t('common.close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </Transition>

  <!-- 移动端公告详情弹窗 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModal" class="announcement-modal-overlay" @click.self="closeModal">
        <div class="announcement-modal">
          <div class="modal-header">
            <div class="modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <span class="modal-header-title">{{ t('admin.announcements') }}</span>
            <button class="modal-close-btn" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body" v-if="modalAnnouncement">
            <h3 class="modal-title">{{ modalAnnouncement.title }}</h3>
            <p class="modal-content">{{ modalAnnouncement.content }}</p>
          </div>

          <div class="modal-footer">
            <div class="modal-pagination">
              <button
                class="pagination-btn"
                :disabled="modalIndex === 0"
                @click="modalPrev"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span class="pagination-info">{{ modalIndex + 1 }} / {{ announcements.length }}</span>
              <button
                class="pagination-btn"
                :disabled="modalIndex === announcements.length - 1"
                @click="modalNext"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.announcement-bar {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-bottom: 1px solid #fcd34d;
  padding: 8px 0;
  position: sticky;
  top: 64px;
  z-index: 90;
  transition: all 0.3s ease;
}

:root.dark .announcement-bar {
  background: linear-gradient(135deg, #78350f, #92400e);
  border-bottom-color: #b45309;
}

.announcement-bar.collapsed {
  padding: 4px 0;
  opacity: 0.9;
}

.announcement-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.announcement-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: #b45309;
}

:root.dark .announcement-icon {
  color: #fbbf24;
}

.announcement-icon svg {
  width: 100%;
  height: 100%;
}

.announcement-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
}

.announcement-text {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--text-sm);
  color: #78350f;
}

:root.dark .announcement-text {
  color: #fef3c7;
}

.announcement-title {
  font-weight: 600;
  flex-shrink: 0;
}

.announcement-separator {
  color: #d97706;
  flex-shrink: 0;
}

:root.dark .announcement-separator {
  color: #fbbf24;
}

.announcement-body {
  overflow: hidden;
  text-overflow: ellipsis;
}

.announcement-indicators {
  display: flex;
  gap: 6px;
  margin: 0 var(--spacing-sm);
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: none;
  background: rgba(180, 83, 9, 0.3);
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

:root.dark .indicator {
  background: rgba(251, 191, 36, 0.3);
}

.indicator:hover {
  background: rgba(180, 83, 9, 0.5);
}

:root.dark .indicator:hover {
  background: rgba(251, 191, 36, 0.5);
}

.indicator.active {
  background: #b45309;
  transform: scale(1.3);
}

:root.dark .indicator.active {
  background: #fbbf24;
}

.close-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #92400e;
  cursor: pointer;
  padding: 0;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

:root.dark .close-btn {
  color: #fcd34d;
}

.close-btn:hover {
  background: rgba(180, 83, 9, 0.1);
  color: #78350f;
}

:root.dark .close-btn:hover {
  background: rgba(251, 191, 36, 0.1);
  color: #fef3c7;
}

.close-btn svg {
  width: 14px;
  height: 14px;
}

/* 公告详情弹窗 */
.announcement-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-base);
}

.announcement-modal {
  background: linear-gradient(180deg, #fffbeb, #fef3c7);
  border: 1px solid #fcd34d;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(180, 83, 9, 0.2);
}

:root.dark .announcement-modal {
  background: linear-gradient(180deg, #78350f, #451a03);
  border-color: #b45309;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid rgba(180, 83, 9, 0.2);
}

:root.dark .modal-header {
  border-bottom-color: rgba(251, 191, 36, 0.2);
}

.modal-icon {
  width: 24px;
  height: 24px;
  color: #b45309;
}

:root.dark .modal-icon {
  color: #fbbf24;
}

.modal-icon svg {
  width: 100%;
  height: 100%;
}

.modal-header-title {
  flex: 1;
  font-weight: 600;
  font-size: var(--text-base);
  color: #78350f;
}

:root.dark .modal-header-title {
  color: #fef3c7;
}

.modal-close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(180, 83, 9, 0.1);
  color: #92400e;
  cursor: pointer;
  border-radius: var(--radius-base);
  transition: all 0.2s ease;
}

:root.dark .modal-close-btn {
  background: rgba(251, 191, 36, 0.1);
  color: #fcd34d;
}

.modal-close-btn:hover {
  background: rgba(180, 83, 9, 0.2);
  color: #78350f;
}

:root.dark .modal-close-btn:hover {
  background: rgba(251, 191, 36, 0.2);
  color: #fef3c7;
}

.modal-close-btn svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: #78350f;
  margin: 0 0 var(--spacing-base);
}

:root.dark .modal-title {
  color: #fef3c7;
}

.modal-content {
  font-size: var(--text-sm);
  line-height: 1.6;
  color: #92400e;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

:root.dark .modal-content {
  color: #fde68a;
}

.modal-footer {
  padding: var(--spacing-base) var(--spacing-lg);
  border-top: 1px solid rgba(180, 83, 9, 0.2);
}

:root.dark .modal-footer {
  border-top-color: rgba(251, 191, 36, 0.2);
}

.modal-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-base);
}

.pagination-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(180, 83, 9, 0.3);
  background: rgba(180, 83, 9, 0.1);
  color: #92400e;
  cursor: pointer;
  border-radius: var(--radius-base);
  transition: all 0.2s ease;
}

:root.dark .pagination-btn {
  border-color: rgba(251, 191, 36, 0.3);
  background: rgba(251, 191, 36, 0.1);
  color: #fcd34d;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(180, 83, 9, 0.2);
  border-color: #b45309;
}

:root.dark .pagination-btn:hover:not(:disabled) {
  background: rgba(251, 191, 36, 0.2);
  border-color: #fbbf24;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-btn svg {
  width: 18px;
  height: 18px;
}

.pagination-info {
  font-size: var(--text-sm);
  font-weight: 500;
  color: #92400e;
  min-width: 50px;
  text-align: center;
}

:root.dark .pagination-info {
  color: #fcd34d;
}

/* Transitions */
.announcement-enter-active,
.announcement-leave-active {
  transition: all 0.3s ease;
}

.announcement-enter-from,
.announcement-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .announcement-modal,
.modal-leave-to .announcement-modal {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .announcement-container {
    padding: 0 var(--spacing-base);
  }

  .announcement-indicators {
    display: none;
  }

  .announcement-title {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .announcement-content {
    cursor: pointer;
  }

  .announcement-content:active {
    opacity: 0.7;
  }
}
</style>
