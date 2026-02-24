<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface WatermarkConfig {
  enabled: boolean
  type: 'text' | 'image'
  text: string
  position: string
  opacity: number
  sizeRatio: number
  minWidth: number
  minHeight: number
}

const props = defineProps<{
  modelValue: WatermarkConfig
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: WatermarkConfig): void
}>()

const localConfig = ref<WatermarkConfig>({ ...props.modelValue })

watch(() => props.modelValue, (newVal) => {
  localConfig.value = { ...newVal }
}, { deep: true })

function updateConfig() {
  if (props.disabled) return
  emit('update:modelValue', { ...localConfig.value })
}

const positions = computed(() => [
  { value: 'top-left', label: t('watermark.topLeft') },
  { value: 'top-right', label: t('watermark.topRight') },
  { value: 'bottom-left', label: t('watermark.bottomLeft') },
  { value: 'bottom-right', label: t('watermark.bottomRight') },
  { value: 'center', label: t('watermark.center') },
])

const opacityPercent = computed({
  get: () => Math.round(localConfig.value.opacity * 100),
  set: (val: number) => {
    if (props.disabled) return
    localConfig.value.opacity = val / 100
    updateConfig()
  }
})

const sizeRatioPercent = computed({
  get: () => Math.round((localConfig.value.sizeRatio || 0.04) * 100),
  set: (val: number) => {
    if (props.disabled) return
    localConfig.value.sizeRatio = val / 100
    updateConfig()
  }
})
</script>

<template>
  <div class="watermark-config" :class="{ disabled: disabled }">
    <!-- 启用开关 -->
    <div class="config-row">
      <label class="switch-label">
        <input
          type="checkbox"
          v-model="localConfig.enabled"
          :disabled="disabled"
          @change="updateConfig"
        />
        <span class="switch-slider"></span>
        <span class="switch-text">{{ t('watermark.enable') }}</span>
      </label>
    </div>

    <template v-if="localConfig.enabled">
      <!-- 水印类型 -->
      <div class="config-row">
        <label class="config-label">{{ t('watermark.type') }}</label>
        <div class="radio-group">
          <label class="radio-label">
            <input
              type="radio"
              v-model="localConfig.type"
              value="text"
              @change="updateConfig"
            />
            <span>{{ t('watermark.textWatermark') }}</span>
          </label>
          <label class="radio-label">
            <input
              type="radio"
              v-model="localConfig.type"
              value="image"
              @change="updateConfig"
              disabled
            />
            <span>{{ t('watermark.imageWatermark') }}</span>
          </label>
        </div>
      </div>

      <!-- 文字内容 -->
      <div v-if="localConfig.type === 'text'" class="config-row">
        <label class="config-label">{{ t('watermark.text') }}</label>
        <input
          type="text"
          v-model="localConfig.text"
          class="config-input"
          :placeholder="t('watermark.textPlaceholder')"
          maxlength="50"
          @change="updateConfig"
        />
      </div>

      <!-- 水印位置 -->
      <div class="config-row">
        <label class="config-label">{{ t('watermark.position') }}</label>
        <div class="position-grid">
          <button
            v-for="pos in positions"
            :key="pos.value"
            class="position-btn"
            :class="{ active: localConfig.position === pos.value }"
            @click="localConfig.position = pos.value; updateConfig()"
          >
            {{ pos.label }}
          </button>
        </div>
      </div>

      <!-- 水印大小 -->
      <div class="config-row">
        <label class="config-label">{{ t('watermark.sizeRatio') }}: {{ sizeRatioPercent }}%</label>
        <p class="config-hint">{{ t('watermark.sizeRatioHint') }}</p>
        <input
          type="range"
          v-model.number="sizeRatioPercent"
          min="1"
          max="15"
          step="1"
          class="range-input"
        />
      </div>

      <!-- 不透明度 -->
      <div class="config-row">
        <label class="config-label">{{ t('watermark.opacity') }}: {{ opacityPercent }}%</label>
        <input
          type="range"
          v-model.number="opacityPercent"
          min="10"
          max="100"
          step="5"
          class="range-input"
        />
      </div>

      <!-- 最小尺寸 -->
      <div class="config-row">
        <label class="config-label">{{ t('watermark.minSize') }}</label>
        <p class="config-hint">{{ t('watermark.minSizeHint') }}</p>
        <div class="size-inputs">
          <div class="size-input-group">
            <label>{{ t('watermark.width') }}</label>
            <input
              type="number"
              v-model.number="localConfig.minWidth"
              min="0"
              step="50"
              class="config-input size-input"
              @change="updateConfig"
            />
            <span>px</span>
          </div>
          <div class="size-input-group">
            <label>{{ t('watermark.height') }}</label>
            <input
              type="number"
              v-model.number="localConfig.minHeight"
              min="0"
              step="50"
              class="config-input size-input"
              @change="updateConfig"
            />
            <span>px</span>
          </div>
        </div>
      </div>

      <!-- 预览 -->
      <div class="config-row">
        <label class="config-label">{{ t('watermark.preview') }}</label>
        <div class="preview-box">
          <div class="preview-image">
            <div
              class="preview-watermark"
              :class="localConfig.position"
              :style="{
                opacity: localConfig.opacity,
                fontSize: `${Math.max(10, sizeRatioPercent * 1.5)}px`
              }"
            >
              {{ localConfig.text }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.watermark-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.config-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.config-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.config-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0;
}

.config-input {
  padding: var(--spacing-sm) var(--spacing-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: var(--color-bg);
}

.config-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* 开关样式 */
.switch-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.switch-label input {
  display: none;
}

.switch-slider {
  width: 40px;
  height: 22px;
  background: var(--color-bg-tertiary);
  border-radius: 11px;
  position: relative;
  transition: var(--transition-fast);
}

.switch-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: var(--transition-fast);
}

.switch-label input:checked + .switch-slider {
  background: var(--color-primary);
}

.switch-label input:checked + .switch-slider::after {
  left: 20px;
}

.switch-text {
  font-size: var(--text-sm);
  color: var(--color-text);
}

/* 单选按钮 */
.radio-group {
  display: flex;
  gap: var(--spacing-base);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.radio-label input[disabled] + span {
  color: var(--color-text-tertiary);
}

/* 位置选择 */
.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
}

.position-btn {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: var(--transition-fast);
}

.position-btn:hover {
  border-color: var(--color-primary);
}

.position-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* 范围输入 */
.range-input {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-bg-tertiary);
  outline: none;
  -webkit-appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
}

/* 尺寸输入 */
.size-inputs {
  display: flex;
  gap: var(--spacing-base);
}

.size-input-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.size-input-group label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.size-input {
  width: 80px;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.size-input-group span {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

/* 预览 */
.preview-box {
  padding: var(--spacing-sm);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.preview-image {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview-watermark {
  position: absolute;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.preview-watermark.top-left {
  top: var(--spacing-sm);
  left: var(--spacing-sm);
}

.preview-watermark.top-right {
  top: var(--spacing-sm);
  right: var(--spacing-sm);
}

.preview-watermark.bottom-left {
  bottom: var(--spacing-sm);
  left: var(--spacing-sm);
}

.preview-watermark.bottom-right {
  bottom: var(--spacing-sm);
  right: var(--spacing-sm);
}

.preview-watermark.center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 禁用状态 */
.watermark-config.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.watermark-config.disabled .switch-slider {
  background: var(--color-bg-tertiary);
}

.watermark-config.disabled .config-input,
.watermark-config.disabled .range-input,
.watermark-config.disabled .position-btn {
  cursor: not-allowed;
}
</style>
