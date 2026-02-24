import { onMounted, onUnmounted, ref } from 'vue'

/**
 * 快捷键定义
 * @description 描述一个快捷键的按键组合、说明和处理函数
 */
export interface Hotkey {
  /** 按键名称（对应 KeyboardEvent.key） */
  key: string
  /** 是否需要 Ctrl/Cmd 键 */
  ctrl?: boolean
  /** 是否需要 Shift 键 */
  shift?: boolean
  /** 是否需要 Alt 键 */
  alt?: boolean
  /** 快捷键的功能说明 */
  description: string
  /** 快捷键所属分类 */
  category: string
  /** 快捷键触发时执行的处理函数 */
  handler: () => void
}

/**
 * 快捷键注册记录
 * @description 内部数据结构，关联快捷键 ID 与其定义
 */
interface HotkeyRegistration {
  /** 快捷键唯一标识 */
  id: string
  /** 快捷键定义 */
  hotkey: Hotkey
}

// 全局快捷键注册表
const registeredHotkeys = ref<HotkeyRegistration[]>([])
const hotkeysPanelVisible = ref(false)

/**
 * 生成快捷键的唯一标识
 * @description 根据修饰键和按键名称生成形如 "ctrl+shift+a" 的唯一 ID
 * @param hotkey - 快捷键按键组合信息
 * @returns {string} 快捷键的唯一标识字符串
 */
function getHotkeyId(hotkey: Omit<Hotkey, 'description' | 'category' | 'handler'>): string {
  const parts: string[] = []
  if (hotkey.ctrl) parts.push('ctrl')
  if (hotkey.shift) parts.push('shift')
  if (hotkey.alt) parts.push('alt')
  parts.push(hotkey.key.toLowerCase())
  return parts.join('+')
}

/**
 * 格式化快捷键为可读的显示文本
 * @description 将快捷键按键组合转换为用户友好的显示格式，如 "Ctrl + Shift + A"
 * @param hotkey - 快捷键按键组合信息
 * @returns {string} 格式化后的快捷键显示文本
 */
export function formatHotkey(hotkey: Omit<Hotkey, 'description' | 'category' | 'handler'>): string {
  const parts: string[] = []
  if (hotkey.ctrl) parts.push('Ctrl')
  if (hotkey.shift) parts.push('Shift')
  if (hotkey.alt) parts.push('Alt')

  // 特殊键名转换
  const keyNames: Record<string, string> = {
    'escape': 'Esc',
    'delete': 'Del',
    'backspace': 'Backspace',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    ' ': 'Space',
    '/': '/',
    '?': '?',
  }

  const displayKey = keyNames[hotkey.key.toLowerCase()] || hotkey.key.toUpperCase()
  parts.push(displayKey)

  return parts.join(' + ')
}

/**
 * 全局键盘事件处理函数
 * @description 监听 keydown 事件，匹配已注册的快捷键并执行对应处理器；输入框聚焦时忽略（Escape 除外）
 * @param event - 键盘事件对象
 */
function handleKeyDown(event: KeyboardEvent) {
  // 如果焦点在输入框/文本域，忽略快捷键（除了 Escape）
  const target = event.target as HTMLElement
  const isInputFocused = target.tagName === 'INPUT' ||
                         target.tagName === 'TEXTAREA' ||
                         target.isContentEditable

  if (isInputFocused && event.key !== 'Escape') {
    return
  }

  // 查找匹配的快捷键
  for (const registration of registeredHotkeys.value) {
    const h = registration.hotkey
    const keyMatch = event.key.toLowerCase() === h.key.toLowerCase()
    const ctrlMatch = !!h.ctrl === (event.ctrlKey || event.metaKey)
    const shiftMatch = !!h.shift === event.shiftKey
    const altMatch = !!h.alt === event.altKey

    if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
      event.preventDefault()
      event.stopPropagation()
      h.handler()
      return
    }
  }
}

/**
 * 初始化全局键盘事件监听器
 * @description 在 document 上注册 keydown 事件监听器（capture 阶段），仅执行一次
 */
let initialized = false
function initGlobalListener() {
  if (initialized) return
  initialized = true
  // 使用 capture: true 确保在浏览器默认行为之前捕获事件
  document.addEventListener('keydown', handleKeyDown, true)
}

/**
 * 快捷键管理组合式函数
 * @description 提供全局快捷键的注册、注销、分类查看和快捷键面板显示控制功能
 * @returns {{ register: (hotkey: Hotkey) => () => void, registerMany: (hotkeys: Hotkey[]) => () => void, useHotkeyScope: (hotkeys: Hotkey[]) => void, getHotkeysByCategory: () => Record<string, Hotkey[]>, registeredHotkeys: Ref<HotkeyRegistration[]>, hotkeysPanelVisible: Ref<boolean>, showHotkeysPanel: () => void, hideHotkeysPanel: () => void, toggleHotkeysPanel: () => void, formatHotkey: Function }} 快捷键管理状态和操作方法
 */
export function useHotkeys() {
  /**
   * 注册单个快捷键
   * @description 将快捷键添加到全局注册表中，若已存在相同组合则替换
   * @param hotkey - 快捷键定义
   * @returns {() => void} 注销函数，调用后移除该快捷键注册
   */
  function register(hotkey: Hotkey): () => void {
    initGlobalListener()

    const id = getHotkeyId(hotkey)

    // 检查是否已存在相同快捷键
    const existingIndex = registeredHotkeys.value.findIndex(r => r.id === id)
    if (existingIndex !== -1) {
      // 替换现有注册
      registeredHotkeys.value[existingIndex] = { id, hotkey }
    } else {
      registeredHotkeys.value.push({ id, hotkey })
    }

    // 返回注销函数
    return () => {
      const index = registeredHotkeys.value.findIndex(r => r.id === id)
      if (index !== -1) {
        registeredHotkeys.value.splice(index, 1)
      }
    }
  }

  /**
   * 批量注册快捷键
   * @description 一次性注册多个快捷键，返回统一的注销函数
   * @param hotkeys - 快捷键定义数组
   * @returns {() => void} 注销函数，调用后移除所有已注册的快捷键
   */
  function registerMany(hotkeys: Hotkey[]): () => void {
    const unregisters = hotkeys.map(h => register(h))
    return () => unregisters.forEach(fn => fn())
  }

  /**
   * 组件作用域内的快捷键管理
   * @description 在组件 onMounted 时自动注册快捷键，onUnmounted 时自动注销，确保快捷键生命周期与组件一致
   * @param hotkeys - 快捷键定义数组
   */
  function useHotkeyScope(hotkeys: Hotkey[]) {
    let unregister: (() => void) | null = null

    onMounted(() => {
      unregister = registerMany(hotkeys)
    })

    onUnmounted(() => {
      if (unregister) {
        unregister()
      }
    })
  }

  /**
   * 按分类获取所有已注册的快捷键
   * @description 将所有已注册的快捷键按 category 字段分组返回
   * @returns {Record<string, Hotkey[]>} 以分类名为键、快捷键数组为值的对象
   */
  function getHotkeysByCategory(): Record<string, Hotkey[]> {
    const categories: Record<string, Hotkey[]> = {}

    for (const registration of registeredHotkeys.value) {
      const category = registration.hotkey.category
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(registration.hotkey)
    }

    return categories
  }

  /**
   * 显示快捷键面板
   * @description 将快捷键帮助面板设为可见
   */
  function showHotkeysPanel() {
    hotkeysPanelVisible.value = true
  }

  /**
   * 隐藏快捷键面板
   * @description 将快捷键帮助面板设为隐藏
   */
  function hideHotkeysPanel() {
    hotkeysPanelVisible.value = false
  }

  /**
   * 切换快捷键面板的显示状态
   * @description 在可见与隐藏之间切换快捷键帮助面板
   */
  function toggleHotkeysPanel() {
    hotkeysPanelVisible.value = !hotkeysPanelVisible.value
  }

  return {
    register,
    registerMany,
    useHotkeyScope,
    getHotkeysByCategory,
    registeredHotkeys,
    hotkeysPanelVisible,
    showHotkeysPanel,
    hideHotkeysPanel,
    toggleHotkeysPanel,
    formatHotkey,
  }
}
