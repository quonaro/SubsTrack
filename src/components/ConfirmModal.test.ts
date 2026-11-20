import { DOMWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import ConfirmModal from './ConfirmModal.vue'

// The sheet teleports into document.body, so assertions look there.
describe('ConfirmModal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const buttons = () => [...document.body.querySelectorAll('button')]

  it('shows the title, message and default labels', async () => {
    const w = mount(ConfirmModal, {
      props: { open: true, title: 'Удалить?', message: 'Безвозвратно.' },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.body.textContent).toContain('Удалить?')
    expect(document.body.textContent).toContain('Безвозвратно.')
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['Отмена', 'Удалить'])
    w.unmount()
  })

  it('emits confirm and update:open on the buttons', async () => {
    const w = mount(ConfirmModal, {
      props: { open: true, title: 'Удалить?', confirmLabel: 'Да, удалить' },
      attachTo: document.body,
    })
    await nextTick()
    const [cancel, confirm] = buttons()
    await new DOMWrapper(cancel).trigger('click')
    await new DOMWrapper(confirm).trigger('click')
    expect(w.emitted('update:open')).toEqual([[false]])
    expect(w.emitted('confirm')).toHaveLength(1)
    w.unmount()
  })
})
