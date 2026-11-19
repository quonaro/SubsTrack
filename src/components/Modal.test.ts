import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Modal from './Modal.vue'

// Reka Dialog teleports its content to document.body — assertions query the
// document rather than the wrapper tree.
describe('Modal', () => {
  it('renders title and slot content into the body when open', async () => {
    const w = mount(Modal, {
      props: { open: true, title: 'Мой шит' },
      slots: { default: '<p>содержимое</p>' },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.body.textContent).toContain('Мой шит')
    expect(document.body.textContent).toContain('содержимое')
    w.unmount()
  })

  it('opts out of aria-describedby so Reka does not warn about a missing Description', async () => {
    const w = mount(Modal, {
      props: { open: true, title: 'Без описания' },
      attachTo: document.body,
    })
    await nextTick()
    const content = document.body.querySelector('[role="dialog"]')
    expect(content?.hasAttribute('aria-describedby')).toBe(false)
    w.unmount()
  })

  it('renders nothing when closed', async () => {
    const w = mount(Modal, {
      props: { open: false, title: 'Скрыто' },
      slots: { default: '<p>невидимое</p>' },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.body.textContent).not.toContain('Скрыто')
    expect(document.body.textContent).not.toContain('невидимое')
    w.unmount()
  })

  it('keeps the drag handle outside the scrollable area', async () => {
    const w = mount(Modal, {
      props: { open: true, title: 'Шит' },
      attachTo: document.body,
    })
    await nextTick()
    const scroller = document.body.querySelector('.overflow-y-auto')
    const handle = document.body.querySelector('.touch-none')
    expect(scroller).not.toBeNull()
    expect(handle).not.toBeNull()
    expect(scroller?.contains(handle)).toBe(false)
    w.unmount()
  })

  describe('swipe-to-close on mobile', () => {
    const origMatchMedia = window.matchMedia

    function stubMobile() {
      window.matchMedia = ((q: string) => ({
        matches: q === '(max-width: 639.98px)',
        media: q,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })) as typeof window.matchMedia
    }

    afterEach(() => {
      window.matchMedia = origMatchMedia
      vi.restoreAllMocks()
    })

    // Fixed 100ms steps keep the gesture's velocity check deterministic.
    function mockNow() {
      let t = 0
      vi.spyOn(performance, 'now').mockImplementation(() => (t += 100))
    }

    function swipeDown(el: Element, fromY: number, toY: number) {
      const mk = (y: number) => ({ identifier: 1, clientX: 10, clientY: y }) as Touch
      const ev = (type: string, touches: Touch[], changed: Touch[]) => {
        const e = new Event(type, { bubbles: true, cancelable: true }) as Event & {
          touches: Touch[]
          changedTouches: Touch[]
        }
        e.touches = touches
        e.changedTouches = changed
        return e
      }
      el.dispatchEvent(ev('touchstart', [mk(fromY)], [mk(fromY)]))
      el.dispatchEvent(ev('touchmove', [mk(toY)], [mk(toY)]))
      el.dispatchEvent(ev('touchend', [], [mk(toY)]))
    }

    it('emits update:open false when the handle is dragged down', async () => {
      stubMobile()
      mockNow()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      const handle = document.body.querySelector('.touch-none')
      expect(handle).not.toBeNull()
      swipeDown(handle as Element, 100, 260)
      await nextTick()
      // the sheet keeps tracking the gesture: transform is applied while
      // it slides off-screen, before the delayed close fires
      const sheet = document.body.querySelector('[role="dialog"]') as HTMLElement
      expect(sheet.style.transform).toContain('translateY')
      // commitDelay lets the sheet finish sliding off-screen first
      await new Promise((r) => setTimeout(r, 250))
      expect(w.emitted('update:open')).toEqual([[false]])
      w.unmount()
    })

    it('does not close on a short drag', async () => {
      stubMobile()
      mockNow()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      const handle = document.body.querySelector('.touch-none')
      swipeDown(handle as Element, 100, 130)
      expect(w.emitted('update:open')).toBeUndefined()
      w.unmount()
    })
  })
})
