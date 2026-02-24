import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_KEYS } from '@/config'

export type ThemeMode = 'light' | 'dark' | 'system'

// 预设主题色（name 为 i18n key，由使用方翻译）
export const PRESET_COLORS = [
  { name: 'settings.themeBlue', value: '#3b82f6' },
  { name: 'settings.themePurple', value: '#8b5cf6' },
  { name: 'settings.themeGreen', value: '#10b981' },
  { name: 'settings.themeOrange', value: '#f59e0b' },
  { name: 'settings.themeRed', value: '#ef4444' },
  { name: 'settings.themeCyan', value: '#06b6d4' },
  { name: 'settings.themePink', value: '#ec4899' },
  { name: 'settings.themeIndigo', value: '#6366f1' },
]

// 根据主色生成配套色（带缓存）
const paletteCache = new Map<string, ReturnType<typeof generateColorPaletteImpl>>()

function generateColorPalette(hex: string) {
  const cached = paletteCache.get(hex)
  if (cached) return cached
  const result = generateColorPaletteImpl(hex)
  paletteCache.set(hex, result)
  return result
}

function generateColorPaletteImpl(hex: string) {
  // 将 HEX 转换为 HSL
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  // 生成 hover 色（稍暗）
  const hoverL = Math.max(l - 0.1, 0.1)

  function hslToHex(h: number, s: number, l: number): string {
    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  return {
    primary: hex,
    primaryHover: hslToHex(h, s, hoverL),
    primaryLight: `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, 0.1)`,
  }
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('system')
  const actualTheme = ref<'light' | 'dark'>('light')
  const primaryColor = ref('#3b82f6') // 默认蓝色
  let mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null

  // 获取系统主题偏好
  function getSystemTheme(): 'light' | 'dark' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  // 应用主题色
  function applyPrimaryColor(color: string) {
    const palette = generateColorPalette(color)
    document.documentElement.style.setProperty('--color-primary', palette.primary)
    document.documentElement.style.setProperty('--color-primary-hover', palette.primaryHover)
    document.documentElement.style.setProperty('--color-bg-hover', palette.primaryLight)
  }

  // 应用主题
  function applyTheme(theme: 'light' | 'dark', animated = true) {
    actualTheme.value = theme

    if (animated) {
      document.documentElement.classList.add('theme-transition')
    }

    document.documentElement.setAttribute('data-theme', theme)

    // 应用主题色
    applyPrimaryColor(primaryColor.value)

    if (animated) {
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition')
      }, 300)
    }
  }

  // 设置主题模式
  function setMode(newMode: ThemeMode) {
    mode.value = newMode
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode)

    if (newMode === 'system') {
      applyTheme(getSystemTheme())
    } else {
      applyTheme(newMode)
    }
  }

  // 设置主题色
  function setPrimaryColor(color: string) {
    primaryColor.value = color
    localStorage.setItem(STORAGE_KEYS.PRIMARY_COLOR, color)
    applyPrimaryColor(color)
  }

  // 切换主题
  function toggle() {
    if (mode.value === 'light') {
      setMode('dark')
    } else if (mode.value === 'dark') {
      setMode('light')
    } else {
      // system mode: toggle to opposite of current actual theme
      setMode(actualTheme.value === 'light' ? 'dark' : 'light')
    }
  }

  // 初始化主题
  function init() {
    // 恢复主题模式
    const savedMode = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode | null
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      mode.value = savedMode
    } else {
      mode.value = 'system'
    }

    // 恢复主题色
    const savedColor = localStorage.getItem(STORAGE_KEYS.PRIMARY_COLOR)
    if (savedColor) {
      primaryColor.value = savedColor
    }

    if (mode.value === 'system') {
      applyTheme(getSystemTheme(), false)
    } else {
      applyTheme(mode.value, false)
    }

    // 监听系统主题变化（仅注册一次）
    if (window.matchMedia && !mediaQueryHandler) {
      mediaQueryHandler = (e: MediaQueryListEvent) => {
        if (mode.value === 'system') {
          applyTheme(e.matches ? 'dark' : 'light')
        }
      }
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', mediaQueryHandler)
    }
  }

  return {
    mode,
    actualTheme,
    primaryColor,
    setMode,
    setPrimaryColor,
    toggle,
    init
  }
})
