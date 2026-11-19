import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ToggleSwitch from './ToggleSwitch.vue'

describe('ToggleSwitch', () => {
  it('emits update:checked with the flipped value on click', async () => {
    const w = mount(ToggleSwitch, { props: { checked: false } })
    await w.find('[role="switch"],button').trigger('click')
    expect(w.emitted('update:checked')).toEqual([[true]])
  })

  it('does not emit when disabled', async () => {
    const w = mount(ToggleSwitch, { props: { checked: false, disabled: true } })
    await w.find('[role="switch"],button').trigger('click')
    expect(w.emitted('update:checked')).toBeUndefined()
  })
})
