import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import Sheet from './Sheet.vue'

// Reka Dialog teleports its content to document.body — assertions query the
// document rather than the wrapper tree.
describe('Sheet', () => {
  it('renders title and slot content into the body when open', async () => {
    const w = mount(Sheet, {
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
    const w = mount(Sheet, {
      props: { open: true, title: 'Без описания' },
      attachTo: document.body,
    })
    await nextTick()
    const content = document.body.querySelector('[role="dialog"]')
    expect(content?.hasAttribute('aria-describedby')).toBe(false)
    w.unmount()
  })

  it('renders nothing when closed', async () => {
    const w = mount(Sheet, {
      props: { open: false, title: 'Скрыто' },
      slots: { default: '<p>невидимое</p>' },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.body.textContent).not.toContain('Скрыто')
    expect(document.body.textContent).not.toContain('невидимое')
    w.unmount()
  })
})
