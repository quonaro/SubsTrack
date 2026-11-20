import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Modal from './Modal.vue'

// Reka Dialog teleports its content to document.body — assertions query the
// document rather than the wrapper tree.
describe('Modal', () => {
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

  function swipe(el: Element, fromY: number, toY: number) {
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

  const handle = () => document.body.querySelector('.touch-none') as Element

  // jsdom reports no animations, so Reka's Presence unmounts a closing dialog
  // on the same tick. Report a running animation to observe what the DOM looks
  // like mid-exit — the frames the user actually sees.
  function holdExitAnimations() {
    const original = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation(((el: Element) => {
      const style = original(el)
      return new Proxy(style, {
        get: (target, key) =>
          key === 'animationName' ? 'test-out' : Reflect.get(target, key, target),
      })
    }) as typeof window.getComputedStyle)
  }

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

  it('keeps the dim backdrop fading out while the sheet leaves', async () => {
    stubMobile()
    holdExitAnimations()
    const w = mount(Modal, {
      props: { open: true, title: 'Шит' },
      attachTo: document.body,
    })
    await nextTick()
    await w.setProps({ open: false })
    await nextTick()
    // The stack entry is gone by now, but the overlay must not snap to a
    // transparent class: that would drop the fade-out animation with it.
    const overlay = document.body.querySelector('.z-40')
    expect(overlay).not.toBeNull()
    expect(overlay?.className).toContain('bg-black/60')
    expect(overlay?.getAttribute('data-state')).toBe('closed')
    w.unmount()
  })

  describe('mobile sheet', () => {
    it('keeps the drag handle outside the scrollable area', async () => {
      stubMobile()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      const scroller = document.body.querySelector('.overflow-y-auto')
      expect(scroller).not.toBeNull()
      expect(scroller?.contains(handle())).toBe(false)
      // the title scrolls with the content
      expect(scroller?.textContent).toContain('Шит')
      w.unmount()
    })

    it('emits update:open false when the header is dragged down', async () => {
      stubMobile()
      mockNow()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      swipe(handle(), 100, 260)
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
      swipe(handle(), 100, 130)
      expect(w.emitted('update:open')).toBeUndefined()
      w.unmount()
    })

    it('does not expand on an upward swipe', async () => {
      stubMobile()
      mockNow()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      swipe(handle(), 300, 100)
      await nextTick()
      const sheet = document.body.querySelector('[role="dialog"]') as HTMLElement
      expect(sheet.style.transform).toBe('')
      // the sheet stays content-sized instead of taking the viewport
      const body = sheet.querySelector('.max-h-\\[85dvh\\]') as HTMLElement
      expect(body).not.toBeNull()
      expect(body.className).not.toContain('h-full')
      expect(w.emitted('update:open')).toBeUndefined()
      w.unmount()
    })
  })

  describe('nested modals', () => {
    const overlays = () => Array.from(document.body.querySelectorAll('.z-40'))
    const dialogs = () => Array.from(document.body.querySelectorAll('[role="dialog"]'))
    const pushedSheets = () =>
      Array.from(document.body.querySelectorAll('[role="dialog"] .translate-y-full'))

    it('dims the backdrop once and leaves a lone dialog at rest', async () => {
      const w = mount(Modal, { props: { open: true, title: 'Один' }, attachTo: document.body })
      await nextTick()
      expect(overlays()).toHaveLength(1)
      expect(overlays()[0].className).toContain('bg-black/60')
      expect(pushedSheets()).toHaveLength(0)
      w.unmount()
    })

    it('pushes a covered sheet down and stops it from dimming the backdrop', async () => {
      stubMobile()
      const parent = mount(Modal, {
        props: { open: true, title: 'Родитель' },
        attachTo: document.body,
      })
      await nextTick()
      const child = mount(Modal, {
        props: { open: true, title: 'Ребёнок' },
        attachTo: document.body,
      })
      await nextTick()

      expect(overlays()).toHaveLength(2)
      expect(overlays()[0].className).toContain('bg-black/60')
      expect(overlays()[1].className).toContain('bg-transparent')
      expect(pushedSheets()).toHaveLength(1)
      expect(dialogs()[0].contains(pushedSheets()[0])).toBe(true)

      child.unmount()
      parent.unmount()
    })

    it('brings the parent back when the child closes', async () => {
      stubMobile()
      const parent = mount(Modal, {
        props: { open: true, title: 'Родитель' },
        attachTo: document.body,
      })
      await nextTick()
      const child = mount(Modal, {
        props: { open: true, title: 'Ребёнок' },
        attachTo: document.body,
      })
      await nextTick()
      expect(pushedSheets()).toHaveLength(1)

      await child.setProps({ open: false })
      await nextTick()
      expect(pushedSheets()).toHaveLength(0)

      child.unmount()
      parent.unmount()
    })

    it('fades the desktop dialog instead of dropping the backdrop', async () => {
      // jsdom's matchMedia never matches, so the desktop layout is in use.
      const parent = mount(Modal, {
        props: { open: true, title: 'Родитель' },
        attachTo: document.body,
      })
      await nextTick()
      const child = mount(Modal, {
        props: { open: true, title: 'Ребёнок' },
        attachTo: document.body,
      })
      await nextTick()

      expect(overlays()[1].className).toContain('bg-transparent')
      const box = dialogs()[0].querySelector('.max-w-md') as HTMLElement
      expect(box.className).toContain('opacity-0')

      child.unmount()
      parent.unmount()
    })
  })
})
