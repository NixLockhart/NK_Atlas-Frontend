import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, type LocaleType } from '@/locales'

/**
 * 国际化语言切换组合式函数
 * @description 提供当前语言的读取和切换功能，封装 vue-i18n 的 locale 管理
 * @returns {{ currentLocale: ComputedRef<LocaleType>, localeOptions: Array<{ value: string, label: string, flag: string }>, switchLocale: (newLocale: LocaleType) => void, getCurrentLocaleName: () => string, t: Function }} 语言配置状态和操作方法
 */
export function useLocale() {
  const { locale, t } = useI18n()

  const currentLocale = computed<LocaleType>({
    get: () => locale.value as LocaleType,
    set: (val: LocaleType) => {
      setLocale(val)
    }
  })

  const localeOptions = [
    { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
    { value: 'en-US', label: 'English', flag: '🇺🇸' },
  ]

  /**
   * 切换语言
   * @description 将应用语言切换为指定的 locale
   * @param newLocale - 目标语言标识，如 'zh-CN' 或 'en-US'
   */
  function switchLocale(newLocale: LocaleType) {
    setLocale(newLocale)
  }

  /**
   * 获取当前语言的显示名称
   * @description 根据当前 locale 值查找对应的可读名称（如"简体中文"或"English"）
   * @returns {string} 当前语言的显示名称，找不到时返回 locale 值本身
   */
  function getCurrentLocaleName(): string {
    const option = localeOptions.find(o => o.value === currentLocale.value)
    return option?.label || currentLocale.value
  }

  return {
    currentLocale,
    localeOptions,
    switchLocale,
    getCurrentLocaleName,
    t,
  }
}
