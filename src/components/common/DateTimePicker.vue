<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string | undefined
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const showPicker = ref(false)
const pickerRef = ref<HTMLElement>()
const triggerRef = ref<HTMLElement>()

// 视图模式: 'day' | 'month' | 'year'
const viewMode = ref<'day' | 'month' | 'year'>('day')

// 当前选中的日期时间
const selectedDate = ref<Date | null>(null)
const viewDate = ref(new Date())
const hours = ref(0)
const minutes = ref(0)

// 下拉框位置
const dropdownStyle = ref({
  top: '0px',
  left: '0px'
})

// 初始化
watch(() => props.modelValue, (val) => {
  if (val) {
    const date = new Date(val)
    if (!isNaN(date.getTime())) {
      selectedDate.value = date
      viewDate.value = new Date(date)
      hours.value = date.getHours()
      minutes.value = date.getMinutes()
    }
  } else {
    selectedDate.value = null
  }
}, { immediate: true })

// 格式化显示值
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const date = new Date(props.modelValue)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// 当前月份的天数网格
const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }> = []

  // 上个月的天数（填充到周一开始）
  const startDayOfWeek = (firstDay.getDay() + 6) % 7
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: isSameDay(date, selectedDate.value)
    })
  }

  // 当月的天数
  const today = new Date()
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate.value)
    })
  }

  // 下个月的天数（填充到6行）
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isSelected: isSameDay(date, selectedDate.value)
    })
  }

  return days
})

// 月份列表
const months = computed(() => {
  const currentYear = viewDate.value.getFullYear()
  const selectedMonth = selectedDate.value?.getMonth()
  const selectedYear = selectedDate.value?.getFullYear()
  const now = new Date()

  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `${i + 1}月`,
    isSelected: selectedYear === currentYear && selectedMonth === i,
    isCurrent: now.getFullYear() === currentYear && now.getMonth() === i
  }))
})

// 年份列表（当前年份前后10年）
const years = computed(() => {
  const currentYear = viewDate.value.getFullYear()
  const startYear = Math.floor(currentYear / 10) * 10 - 1
  const selectedYear = selectedDate.value?.getFullYear()
  const nowYear = new Date().getFullYear()

  return Array.from({ length: 12 }, (_, i) => ({
    value: startYear + i,
    isSelected: selectedYear === startYear + i,
    isCurrent: nowYear === startYear + i,
    isOutOfRange: i === 0 || i === 11
  }))
})

// 标题显示
const headerLabel = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth() + 1

  if (viewMode.value === 'day') {
    return `${year}年${month}月`
  } else if (viewMode.value === 'month') {
    return `${year}年`
  } else {
    const startYear = Math.floor(year / 10) * 10
    return `${startYear} - ${startYear + 9}`
  }
})

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

function isSameDay(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return false
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}

// 点击标题切换视图
function toggleViewMode() {
  if (viewMode.value === 'day') {
    viewMode.value = 'month'
  } else if (viewMode.value === 'month') {
    viewMode.value = 'year'
  }
}

function prevPeriod() {
  if (viewMode.value === 'day') {
    viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
  } else if (viewMode.value === 'month') {
    viewDate.value = new Date(viewDate.value.getFullYear() - 1, viewDate.value.getMonth(), 1)
  } else {
    viewDate.value = new Date(viewDate.value.getFullYear() - 10, viewDate.value.getMonth(), 1)
  }
}

function nextPeriod() {
  if (viewMode.value === 'day') {
    viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
  } else if (viewMode.value === 'month') {
    viewDate.value = new Date(viewDate.value.getFullYear() + 1, viewDate.value.getMonth(), 1)
  } else {
    viewDate.value = new Date(viewDate.value.getFullYear() + 10, viewDate.value.getMonth(), 1)
  }
}

function selectDay(day: { date: Date }) {
  selectedDate.value = new Date(day.date)
  selectedDate.value.setHours(hours.value, minutes.value, 0, 0)
}

function selectMonth(month: number) {
  viewDate.value = new Date(viewDate.value.getFullYear(), month, 1)
  viewMode.value = 'day'
}

function selectYear(year: number) {
  viewDate.value = new Date(year, viewDate.value.getMonth(), 1)
  viewMode.value = 'month'
}

function updateHours(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value) || 0
  hours.value = Math.max(0, Math.min(23, val))
  if (selectedDate.value) {
    selectedDate.value.setHours(hours.value)
  }
}

function updateMinutes(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value) || 0
  minutes.value = Math.max(0, Math.min(59, val))
  if (selectedDate.value) {
    selectedDate.value.setMinutes(minutes.value)
  }
}

function confirm() {
  if (selectedDate.value) {
    selectedDate.value.setHours(hours.value, minutes.value, 0, 0)
    const year = selectedDate.value.getFullYear()
    const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.value.getDate()).padStart(2, '0')
    const h = String(hours.value).padStart(2, '0')
    const m = String(minutes.value).padStart(2, '0')
    emit('update:modelValue', `${year}-${month}-${day}T${h}:${m}`)
  }
  closePicker()
}

function clear() {
  selectedDate.value = null
  emit('update:modelValue', '')
  closePicker()
}

function updateDropdownPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const dropdownHeight = 420

  if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
    dropdownStyle.value = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`
    }
  } else {
    dropdownStyle.value = {
      top: `${rect.top - dropdownHeight - 8}px`,
      left: `${rect.left}px`
    }
  }
}

function openPicker(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (!showPicker.value) {
    showPicker.value = true
    viewMode.value = 'day'
    if (!selectedDate.value) {
      viewDate.value = new Date()
      hours.value = 0
      minutes.value = 0
    }
    nextTick(() => {
      updateDropdownPosition()
    })
  } else {
    closePicker()
  }
}

function closePicker() {
  showPicker.value = false
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (pickerRef.value && !pickerRef.value.contains(target) &&
      triggerRef.value && !triggerRef.value.contains(target)) {
    closePicker()
  }
}

function handleScroll() {
  if (showPicker.value) {
    updateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <div class="datetime-picker">
    <div
      ref="triggerRef"
      class="picker-input"
      @mousedown="openPicker"
    >
      <span v-if="displayValue" class="input-value">{{ displayValue }}</span>
      <span v-else class="input-placeholder">{{ placeholder || t('admin.selectTime') }}</span>
      <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>

    <Teleport to="body">
      <Transition name="picker-fade">
        <div
          v-if="showPicker"
          ref="pickerRef"
          class="picker-dropdown"
          :style="dropdownStyle"
          @mousedown.stop
        >
          <div class="picker-panel">
            <!-- 头部导航 -->
            <div class="picker-header">
              <button type="button" class="nav-btn" @click="prevPeriod">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button
                type="button"
                class="header-label"
                :class="{ clickable: viewMode !== 'year' }"
                @click="toggleViewMode"
              >
                {{ headerLabel }}
              </button>
              <button type="button" class="nav-btn" @click="nextPeriod">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            <!-- 日期视图 -->
            <Transition name="view-fade" mode="out-in">
              <div v-if="viewMode === 'day'" key="day" class="view-container">
                <div class="weekdays">
                  <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
                </div>
                <div class="days-grid">
                  <button
                    v-for="(day, index) in calendarDays"
                    :key="index"
                    type="button"
                    class="cell-btn day-btn"
                    :class="{
                      'other-month': !day.isCurrentMonth,
                      'today': day.isToday,
                      'selected': day.isSelected
                    }"
                    @click="selectDay(day)"
                  >
                    {{ day.date.getDate() }}
                  </button>
                </div>
              </div>

              <!-- 月份视图 -->
              <div v-else-if="viewMode === 'month'" key="month" class="view-container">
                <div class="months-grid">
                  <button
                    v-for="month in months"
                    :key="month.value"
                    type="button"
                    class="cell-btn month-btn"
                    :class="{
                      'selected': month.isSelected,
                      'current': month.isCurrent
                    }"
                    @click="selectMonth(month.value)"
                  >
                    {{ month.label }}
                  </button>
                </div>
              </div>

              <!-- 年份视图 -->
              <div v-else key="year" class="view-container">
                <div class="years-grid">
                  <button
                    v-for="year in years"
                    :key="year.value"
                    type="button"
                    class="cell-btn year-btn"
                    :class="{
                      'selected': year.isSelected,
                      'current': year.isCurrent,
                      'out-of-range': year.isOutOfRange
                    }"
                    @click="selectYear(year.value)"
                  >
                    {{ year.value }}
                  </button>
                </div>
              </div>
            </Transition>

            <!-- 时间选择 -->
            <div class="time-section">
              <span class="time-label">{{ t('common.time') || '时间' }}</span>
              <div class="time-inputs">
                <input
                  type="number"
                  class="time-input"
                  :value="hours"
                  @input="updateHours"
                  min="0"
                  max="23"
                  placeholder="00"
                />
                <span class="time-separator">:</span>
                <input
                  type="number"
                  class="time-input"
                  :value="minutes"
                  @input="updateMinutes"
                  min="0"
                  max="59"
                  placeholder="00"
                />
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="picker-footer">
              <button type="button" class="picker-btn clear" @click="clear">{{ t('common.clear') || '清除' }}</button>
              <button type="button" class="picker-btn confirm" @click="confirm">{{ t('common.confirm') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.datetime-picker {
  position: relative;
  width: 100%;
}

.picker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  min-height: 40px;
  user-select: none;
}

.picker-input:hover {
  border-color: var(--color-border-hover);
}

.picker-input:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-value {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.input-placeholder {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.input-icon {
  width: 18px;
  height: 18px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.picker-dropdown {
  position: fixed;
  z-index: 9999;
}

.picker-panel {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-base);
  width: 320px;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-base);
}

.nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  color: var(--color-text-secondary);
}

.nav-btn:hover {
  background: var(--color-primary);
  color: white;
}

.nav-btn svg {
  width: 16px;
  height: 16px;
}

.header-label {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  background: none;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: default;
  transition: var(--transition-fast);
}

.header-label.clickable {
  cursor: pointer;
}

.header-label.clickable:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.view-container {
  min-height: 240px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: var(--spacing-xs);
}

.weekday {
  text-align: center;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-tertiary);
  padding: var(--spacing-xs);
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
}

.years-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
}

.cell-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition-fast);
}

.cell-btn:hover {
  background: var(--color-bg-hover);
}

.day-btn {
  aspect-ratio: 1;
}

.month-btn,
.year-btn {
  padding: var(--spacing-base) var(--spacing-sm);
}

.cell-btn.other-month,
.cell-btn.out-of-range {
  color: var(--color-text-tertiary);
}

.cell-btn.today,
.cell-btn.current {
  background: var(--color-bg-tertiary);
  font-weight: 600;
}

.cell-btn.selected {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
}

.cell-btn.selected:hover {
  background: var(--color-primary-hover);
}

.time-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base) 0;
  margin-top: var(--spacing-base);
  border-top: 1px solid var(--color-border);
}

.time-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.time-input {
  width: 48px;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: var(--text-sm);
  text-align: center;
  -moz-appearance: textfield;
}

.time-input::-webkit-outer-spin-button,
.time-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.time-separator {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.picker-footer {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-base);
  padding-top: var(--spacing-base);
  border-top: 1px solid var(--color-border);
}

.picker-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-base);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.picker-btn.clear {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.picker-btn.clear:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.picker-btn.confirm {
  background: var(--color-primary);
  color: white;
}

.picker-btn.confirm:hover {
  background: var(--color-primary-hover);
}

/* 下拉框动画 */
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 视图切换动画 */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.view-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.view-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
