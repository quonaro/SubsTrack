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
  const pill = () => document.body.querySelector('.h-1.w-10.rounded-full.bg-app-border')
  const backButton = () =>
    Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Назад'),
    )

  // Committing a sheet gesture finishes its exit animation first (commitDelay).
  const settle = () => new Promise((r) => setTimeout(r, 250))

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

    it('expands to fullscreen on an upward swipe: handle hides, back button appears', async () => {
      stubMobile()
      mockNow()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      expect(pill()).not.toBeNull()
      expect(backButton()).toBeUndefined()

      swipe(handle(), 300, 100)
      await settle()

      expect(pill()).toBeNull()
      expect(backButton()).toBeDefined()
      w.unmount()
    })

    it('follows the finger while swiping up instead of animating height', async () => {
      stubMobile()
      mockNow()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      const wrap = document.body.querySelector('.touch-none')?.parentElement
        ?.parentElement as HTMLElement
      swipe(handle(), 300, 200)
      await nextTick()
      // the sheet is stretched to the viewport and moved by a transform
      expect(wrap.className).toContain('h-full')
      expect(wrap.style.transform).toContain('translateY')
      expect(backButton()).toBeUndefined()
      w.unmount()
    })

    it('returns to the bottom-sheet layout when the swipe up is too short', async () => {
      stubMobile()
      mockNow()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      swipe(handle(), 300, 270)
      await settle()
      expect(backButton()).toBeUndefined()
      expect(pill()).not.toBeNull()
      w.unmount()
    })

    it('collapses back on a downward swipe while expanded', async () => {
      stubMobile()
      mockNow()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      swipe(handle(), 300, 100)
      await settle()
      expect(backButton()).toBeDefined()

      swipe(handle(), 100, 300)
      await settle()

      expect(backButton()).toBeUndefined()
      expect(pill()).not.toBeNull()
      // collapsing must not close the modal
      expect(w.emitted('update:open')).toBeUndefined()
      w.unmount()
    })

    it('collapses when the back button is tapped', async () => {
      stubMobile()
      mockNow()
      const w = mount(Modal, {
        props: { open: true, title: 'Шит' },
        attachTo: document.body,
      })
      await nextTick()
      swipe(handle(), 300, 100)
      await settle()

      backButton()?.dispatchEvent(new Event('click', { bubbles: true }))
      await nextTick()

      expect(backButton()).toBeUndefined()
      expect(pill()).not.toBeNull()
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

    it('leaves a fullscreen parent in place', async () => {
      stubMobile()
      mockNow()
      const parent = mount(Modal, {
        props: { open: true, title: 'Родитель' },
        attachTo: document.body,
      })
      await nextTick()
      swipe(handle(), 300, 100)
      await settle()
      expect(backButton()).toBeDefined()

      const child = mount(Modal, {
        props: { open: true, title: 'Ребёнок' },
        attachTo: document.body,
      })
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
