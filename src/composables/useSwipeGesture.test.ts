import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSwipeGesture } from './useSwipeGesture'

function Harness(props: { active?: boolean; onCommit: () => void }) {
  const active = ref(props.active ?? true)
  const { target, style, handlers } = useSwipeGesture({
    direction: 'down',
    follow: true,
    active,
    onCommit: props.onCommit,
  })
  return { active, target, style, handlers }
}

const TestComp = defineComponent({
  props: { active: { type: Boolean, default: true }, onCommit: { type: Function, required: true } },
  setup(props) {
    const hnd = Harness({ active: props.active, onCommit: props.onCommit as () => void })
    // h() needs onXxx props for listeners, not bare event names.
    const listeners = Object.fromEntries(
      Object.entries(hnd.handlers).map(([k, v]) => [`on${k[0].toUpperCase()}${k.slice(1)}`, v]),
    )
    return () => h('div', { ref: hnd.target, style: hnd.style.value, ...listeners }, 'swipe me')
  },
})

interface FakeTouch {
  identifier: number
  clientX: number
  clientY: number
}

function touchEvent(type: string, touches: FakeTouch[], changed: FakeTouch[]) {
  const e = new Event(type, { bubbles: true, cancelable: true }) as Event & {
    touches: FakeTouch[]
    changedTouches: FakeTouch[]
  }
  e.touches = touches
  e.changedTouches = changed
  return e
}

function swipe(el: Element, fromY: number, toY: number) {
  const t0 = { identifier: 1, clientX: 10, clientY: fromY }
  const t1 = { identifier: 1, clientX: 10, clientY: toY }
  el.dispatchEvent(touchEvent('touchstart', [t0], [t0]))
  el.dispatchEvent(touchEvent('touchmove', [t1], [t1]))
  el.dispatchEvent(touchEvent('touchend', [], [t1]))
}

// Each call advances the clock by 100ms so the velocity check sees a sane
// px/ms value instead of jsdom's ~0ms deltas.
function mockNow() {
  let t = 0
  return vi.spyOn(performance, 'now').mockImplementation(() => (t += 100))
}

describe('useSwipeGesture', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('commits on a downward swipe past the threshold', async () => {
    mockNow()
    const onCommit = vi.fn()
    const w = mount(TestComp, { props: { onCommit } })
    swipe(w.element, 100, 220)
    await nextTick()
    expect(onCommit).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('settles back without committing below the threshold', async () => {
    vi.useFakeTimers()
    mockNow()
    const onCommit = vi.fn()
    const w = mount(TestComp, { props: { onCommit } })
    swipe(w.element, 100, 140)
    await nextTick()
    expect(onCommit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    await nextTick()
    // offset reset → no transform once settled
    expect((w.element as HTMLElement).style.transform).toBe('')
    w.unmount()
  })

  it('ignores upward swipes', () => {
    mockNow()
    const onCommit = vi.fn()
    const w = mount(TestComp, { props: { onCommit } })
    swipe(w.element, 200, 50)
    expect(onCommit).not.toHaveBeenCalled()
    w.unmount()
  })

  it('ignores horizontal swipes', () => {
    mockNow()
    const onCommit = vi.fn()
    const w = mount(TestComp, { props: { onCommit } })
    const t0 = { identifier: 1, clientX: 10, clientY: 100 }
    const t1 = { identifier: 1, clientX: 200, clientY: 105 }
    w.element.dispatchEvent(touchEvent('touchstart', [t0], [t0]))
    w.element.dispatchEvent(touchEvent('touchmove', [t1], [t1]))
    w.element.dispatchEvent(touchEvent('touchend', [], [t1]))
    expect(onCommit).not.toHaveBeenCalled()
    w.unmount()
  })

  it('does nothing while inactive', () => {
    mockNow()
    const onCommit = vi.fn()
    const w = mount(TestComp, { props: { onCommit, active: false } })
    swipe(w.element, 100, 300)
    expect(onCommit).not.toHaveBeenCalled()
    w.unmount()
  })
})
