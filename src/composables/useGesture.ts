import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * 手势识别的配置选项
 * @description 定义滑动阈值和各方向滑动及下拉刷新的回调函数
 */
export interface GestureOptions {
  /** 滑动触发的距离阈值（像素），默认 50 */
  threshold?: number
  /** 向左滑动回调 */
  onSwipeLeft?: () => void
  /** 向右滑动回调 */
  onSwipeRight?: () => void
  /** 向上滑动回调 */
  onSwipeUp?: () => void
  /** 向下滑动回调 */
  onSwipeDown?: () => void
  /** 下拉刷新回调 */
  onPullToRefresh?: () => Promise<void>
}

/**
 * 触摸手势识别组合式函数
 * @description 为指定 DOM 元素绑定触摸事件监听，支持四方向滑动检测和下拉刷新，组件卸载时自动清理监听器
 * @param elementRef - 目标元素的模板引用
 * @param options - 手势配置选项，包含滑动阈值和各方向回调
 * @returns {{ isPulling: Ref<boolean>, pullDistance: Ref<number>, isRefreshing: Ref<boolean> }} 下拉刷新的状态信息
 */
export function useGesture(elementRef: Ref<HTMLElement | null>, options: GestureOptions = {}) {
  const threshold = options.threshold || 50
  const isPulling = ref(false)
  const pullDistance = ref(0)
  const isRefreshing = ref(false)

  let startX = 0
  let startY = 0
  let startTime = 0
  let isSwiping = false

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    startTime = Date.now()
    isSwiping = true

    // 检查是否在页面顶部，用于下拉刷新
    if (options.onPullToRefresh && window.scrollY === 0) {
      isPulling.value = true
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isSwiping || e.touches.length !== 1) return

    const touch = e.touches[0]
    const deltaY = touch.clientY - startY

    // 下拉刷新
    if (isPulling.value && deltaY > 0 && !isRefreshing.value) {
      e.preventDefault()
      // 使用阻尼效果
      pullDistance.value = Math.min(deltaY * 0.5, 100)
    }
  }

  async function handleTouchEnd(e: TouchEvent) {
    if (!isSwiping) return
    isSwiping = false

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const deltaTime = Date.now() - startTime

    // 下拉刷新
    if (isPulling.value) {
      if (pullDistance.value >= 60 && options.onPullToRefresh && !isRefreshing.value) {
        isRefreshing.value = true
        try {
          await options.onPullToRefresh()
        } finally {
          isRefreshing.value = false
        }
      }
      isPulling.value = false
      pullDistance.value = 0
      return
    }

    // 快速滑动检测（300ms 内）
    if (deltaTime > 300) return

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // 水平滑动
    if (absX > absY && absX > threshold) {
      if (deltaX > 0 && options.onSwipeRight) {
        options.onSwipeRight()
      } else if (deltaX < 0 && options.onSwipeLeft) {
        options.onSwipeLeft()
      }
    }
    // 垂直滑动
    else if (absY > absX && absY > threshold) {
      if (deltaY > 0 && options.onSwipeDown) {
        options.onSwipeDown()
      } else if (deltaY < 0 && options.onSwipeUp) {
        options.onSwipeUp()
      }
    }
  }

  function handleTouchCancel() {
    isSwiping = false
    isPulling.value = false
    pullDistance.value = 0
  }

  onMounted(() => {
    const element = elementRef.value
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true })
  })

  onUnmounted(() => {
    const element = elementRef.value
    if (!element) return

    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
    element.removeEventListener('touchcancel', handleTouchCancel)
  })

  return {
    isPulling,
    pullDistance,
    isRefreshing,
  }
}

/**
 * 滑动删除组合式函数
 * @description 提供向左滑动删除手势的状态管理和事件处理器，达到阈值后触发删除回调
 * @param options - 配置选项
 * @param options.threshold - 触发删除的滑动距离阈值（像素），默认 80
 * @param options.onDelete - 滑动距离达到阈值后触发的删除回调
 * @returns {{ swipeOffset: Ref<number>, isSwiping: Ref<boolean>, handlers: Record<string, Function> }} 滑动状态和触摸事件处理器
 */
export function useSwipeToDelete(options: {
  threshold?: number
  onDelete: () => void
}) {
  const swipeOffset = ref(0)
  const isSwiping = ref(false)
  const threshold = options.threshold || 80

  let startX = 0
  let currentX = 0

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return
    startX = e.touches[0].clientX
    isSwiping.value = true
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isSwiping.value || e.touches.length !== 1) return

    currentX = e.touches[0].clientX
    const delta = startX - currentX

    // 只允许向左滑动
    if (delta > 0) {
      swipeOffset.value = Math.min(delta, threshold + 20)
    } else {
      swipeOffset.value = 0
    }
  }

  function handleTouchEnd() {
    if (!isSwiping.value) return
    isSwiping.value = false

    if (swipeOffset.value >= threshold) {
      options.onDelete()
    }
    swipeOffset.value = 0
  }

  return {
    swipeOffset,
    isSwiping,
    handlers: {
      onTouchstart: handleTouchStart,
      onTouchmove: handleTouchMove,
      onTouchend: handleTouchEnd,
      onTouchcancel: () => {
        isSwiping.value = false
        swipeOffset.value = 0
      },
    },
  }
}
