import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ColorSwatches from './ColorSwatches.vue'

describe('ColorSwatches', () => {
  it('emits a preset color and marks it selected', async () => {
    const w = mount(ColorSwatches, { props: { modelValue: null } })
    const red = w.find('button[aria-label="Красный"]')
    expect(red.attributes('aria-pressed')).toBe('false')
    await red.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['#ef4444']])
    w.unmount()
  })

  it('emits null for the inherit-category option', async () => {
    const w = mount(ColorSwatches, { props: { modelValue: '#3b82f6' } })
    const auto = w.find('button[aria-label="Как у категории"]')
    expect(auto.attributes('aria-pressed')).toBe('false')
    await auto.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[null]])
    w.unmount()
  })

  it('highlights the current value', () => {
    const w = mount(ColorSwatches, { props: { modelValue: '#a855f7' } })
    expect(w.find('button[aria-label="Фиолетовый"]').attributes('aria-pressed')).toBe('true')
    expect(w.find('button[aria-label="Синий"]').attributes('aria-pressed')).toBe('false')
    expect(w.find('button[aria-label="Как у категории"]').attributes('aria-pressed')).toBe('false')
    w.unmount()
  })
})
