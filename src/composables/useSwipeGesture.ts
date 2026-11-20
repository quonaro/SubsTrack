import { computed, onScopeDispose, ref, watch, type CSSProperties, type Ref } from 'vue'

type SwipeDirection = 'left' | 'right' | 'up' | 'down'

interface SwipeGestureOptions {
  /** Direction of the swipe that commits the gesture. */
  direction: SwipeDirection
  /** Called when the swipe passes the distance or velocity threshold. */
  onCommit: () => void
  /** Translate the target with the finger (the offset is exposed via `style`). */
  follow?: boolean
  /** Only engage while this is `true`; resets the gesture when it turns `true`. */
  active?: Ref<boolean>
  /** Checked on touch start — `false` ignores the gesture without resetting it. */
  canStart?: () => boolean
  /**
   * Added to the follow offset, letting the target rest away from its natural
   * position and be dragged back towards it (e.g. a sheet parked below the
   * viewport bottom).
   */
  base?: Ref<number>
  /** Overrides the element-size clamp applied to the follow offset. */
  limit?: () => number
  /** Called when the gesture locks onto its axis. */
  onStart?: () => void
  /** Called once an uncommitted gesture finished snapping back. */
  onCancel?: () => void
  /** Distance in px the finger must travel before committing. */
  threshold?: number
  /** Velocity in px/ms that also commits the gesture. */
  velocity?: number
  /** Minimum travel before the gesture locks to the drag axis. */
  axisLock?: number
  /** Duration of the snap-back transition, in ms (follow mode only). */
  settleMs?: number
  /**
   * Delay in ms between sliding the target off its edge and calling
   * `onCommit` (follow mode only). Lets the swipe-out transition play while
   * the target is still mounted.
   */
  commitDelay?: number
}

/**
 * Axis-aligned swipe gesture (horizontal or vertical). In `follow` mode the
 * bound element tracks the finger and either settles back or commits (direct
 * manipulation); otherwise it is a plain swipe detector.
 *
 * Touch events drive the gesture (with a non-passive `touchmove` so the browser
 * does not hijack it for scrolling); pointer events handle mouse/pen.
 */
export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    direction,
    onCommit,
    follow = false,
    active,
    canStart,
    base,
    limit,
    onStart,
    onCancel,
    threshold = 80,
    velocity = 0.5,
    axisLock = 8,
    settleMs = 220,
    commitDelay = 0,
  } = options

  const horizontal = direction === 'left' || direction === 'right'
  const sign = direction === 'left' || direction === 'up' ? -1 : 1

  const target = ref<HTMLElement | null>(null)
  const offset = ref(0)
  const dragging = ref(false)
  const settling = ref(false)

  let gestureActive = false
  let gestureLocked = false
  let startPrimary = 0
  let startCross = 0
  let lastPrimary = 0
  let lastTime = 0
  let speed = 0
  let travel = 0
  let touchId: number | null = null
  let pointerId: number | null = null
  let settleTimer: ReturnType<typeof setTimeout> | null = null
  let commitTimer: ReturnType<typeof setTimeout> | null = null

  // `target` may hold a component instance proxy (e.g. reka-ui's
  // useForwardExpose) rather than the element itself — resolve $el.
  function el() {
    const t = target.value as unknown
    if (t instanceof HTMLElement) return t
    const inner = (t as { $el?: unknown } | null)?.$el
    return inner instanceof HTMLElement ? inner : null
  }

  const style = computed<CSSProperties | undefined>(() => {
    if (!follow || (!dragging.value && !settling.value)) return undefined
    const shift = (base?.value ?? 0) + offset.value
    return {
      transform: horizontal ? `translateX(${shift}px)` : `translateY(${shift}px)`,
      transition: dragging.value ? 'none' : 'transform 0.2s ease-out',
    }
  })

  function axisLimit() {
    if (limit) return limit()
    if (horizontal) return el()?.offsetWidth ?? window.innerWidth
    return el()?.offsetHeight ?? window.innerHeight
  }

  function clearSettleTimer() {
    if (settleTimer === null) return
    clearTimeout(settleTimer)
    settleTimer = null
  }

  function clearCommitTimer() {
    if (commitTimer === null) return
    clearTimeout(commitTimer)
    commitTimer = null
  }

  function reset() {
    clearSettleTimer()
    clearCommitTimer()
    touchId = null
    pointerId = null
    gestureActive = false
    gestureLocked = false
    offset.value = 0
    dragging.value = false
    settling.value = false
  }

  function begin(x: number, y: number) {
    if (active && !active.value) return
    // A decision already taken by the previous gesture must not be lost when
    // the next touch interrupts its exit animation.
    if (commitTimer !== null) {
      clearCommitTimer()
      onCommit()
    }
    if (settleTimer !== null) {
      clearSettleTimer()
      settling.value = false
      offset.value = 0
      onCancel?.()
    }
    if (canStart && !canStart()) return
    gestureActive = true
    gestureLocked = false
    startPrimary = horizontal ? x : y
    startCross = horizontal ? y : x
    // `move` measures the primary axis relative to the start point.
    lastPrimary = 0
    lastTime = performance.now()
    speed = 0
    travel = 0
  }

  function move(x: number, y: number) {
    if (!gestureActive) return false
    const primary = (horizontal ? x : y) - startPrimary
    const cross = (horizontal ? y : x) - startCross

    if (!gestureLocked) {
      if (Math.abs(primary) < axisLock) return false
      if (primary * sign <= 0 || Math.abs(primary) <= Math.abs(cross)) {
        gestureActive = false
        return false
      }
      gestureLocked = true
      if (follow) {
        settling.value = false
        dragging.value = true
      }
      onStart?.()
    }

    const now = performance.now()
    const dt = now - lastTime
    if (dt > 0) speed = (primary - lastPrimary) / dt
    lastPrimary = primary
    lastTime = now

    // Only measure travel in the commit direction and clamp the element to its
    // resting edge. Otherwise reversing mid-gesture drags it past the anchor
    // (e.g. a left-dismiss panel sliding off the right edge).
    const pulled = Math.max(0, primary * sign)
    travel = pulled
    if (follow) {
      offset.value = sign * Math.min(pulled, axisLimit())
    }
    return true
  }

  function end() {
    if (!gestureActive) return
    gestureActive = false
    if (!gestureLocked) return
    gestureLocked = false
    dragging.value = false

    if (travel > threshold || speed * sign > velocity) {
      if (follow) {
        offset.value = sign * axisLimit()
        settling.value = true
        if (commitDelay > 0) {
          // Let the swipe-out transition finish while the target is still
          // mounted, then report the commit.
          commitTimer = setTimeout(() => {
            commitTimer = null
            onCommit()
          }, commitDelay)
          return
        }
      }
      onCommit()
      return
    }

    if (!follow) return
    offset.value = 0
    settling.value = true
    settleTimer = setTimeout(() => {
      settleTimer = null
      settling.value = false
      onCancel?.()
    }, settleMs)
  }

  function findTouch(list: TouchList, id: number) {
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].identifier === id) return list[i]
    }
    return null
  }

  function onTouchStart(e: TouchEvent) {
    if (touchId !== null || e.touches.length !== 1) return
    const touch = e.touches[0]
    touchId = touch.identifier
    begin(touch.clientX, touch.clientY)
  }

  function onTouchMove(e: TouchEvent) {
    if (touchId === null) return
    const touch = findTouch(e.changedTouches, touchId)
    if (!touch) return
    if (move(touch.clientX, touch.clientY)) e.preventDefault()
  }

  function onTouchEnd(e: TouchEvent) {
    if (touchId === null) return
    if (!findTouch(e.changedTouches, touchId)) return
    touchId = null
    end()
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'touch' || e.button !== 0) return
    pointerId = e.pointerId
    begin(e.clientX, e.clientY)
  }

  function onPointerMove(e: PointerEvent) {
    if (pointerId !== e.pointerId) return
    if (move(e.clientX, e.clientY)) {
      el()?.setPointerCapture?.(e.pointerId)
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (pointerId !== e.pointerId) return
    pointerId = null
    const element = el()
    if (element?.hasPointerCapture?.(e.pointerId)) {
      element.releasePointerCapture(e.pointerId)
    }
    end()
  }

  const handlers = {
    touchstart: onTouchStart,
    touchmove: onTouchMove,
    touchend: onTouchEnd,
    touchcancel: onTouchEnd,
    pointerdown: onPointerDown,
    pointermove: onPointerMove,
    pointerup: onPointerUp,
    pointercancel: onPointerUp,
    dragstart: (e: DragEvent) => e.preventDefault(),
  }

  if (active) {
    watch(active, (isActive) => {
      if (isActive) reset()
    })
  }

  onScopeDispose(() => {
    clearSettleTimer()
    clearCommitTimer()
  })

  return { target, style, handlers, reset }
}
