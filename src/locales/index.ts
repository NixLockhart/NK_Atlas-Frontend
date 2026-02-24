import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'
import { STORAGE_KEYS } from '@/config'

export type LocaleType = 'zh-CN' | 'en-US'

// 获取保存的语言设置，默认中文
function getDefaultLocale(): LocaleType {
  const saved = localStorage.getItem(STORAGE_KEYS.LOCALE)
  if (saved && ['zh-CN', 'en-US'].includes(saved)) {
    return saved as LocaleType
  }
  // 根据浏览器语言自动检测
  const browserLang = navigator.language
  if (browserLang.startsWith('en')) {
    return 'en-US'
  }
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  globalInjection: true, // 允许在模板中使用 $t
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export default i18n

// 切换语言
export function setLocale(locale: LocaleType) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEYS.LOCALE, locale)
  document.documentElement.setAttribute('lang', locale)
}

// 获取当前语言
export function getLocale(): LocaleType {
  return i18n.global.locale.value as LocaleType
}
