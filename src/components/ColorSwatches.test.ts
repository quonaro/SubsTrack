import { DOMWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import ColorSwatches from './ColorSwatches.vue'

// The custom-color sheet teleports into document.body.
describe('ColorSwatches', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const mountSwatches = (modelValue: string | null) =>
    mount(ColorSwatches, { props: { modelValue }, attachTo: document.body })

  const custom = (w: ReturnType<typeof mountSwatches>) => w.find('button[aria-label="Свой цвет"]')

  it('emits a preset color and marks it selected', async () => {
    const w = mountSwatches(null)
    const red = w.find('button[aria-label="Красный"]')
    expect(red.attributes('aria-pressed')).toBe('false')
    await red.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['#ef4444']])
    w.unmount()
  })

  it('emits null for the inherit-category option', async () => {
    const w = mountSwatches('#3b82f6')
    const auto = w.find('button[aria-label="Как у категории"]')
    expect(auto.attributes('aria-pressed')).toBe('false')
    await auto.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[null]])
    w.unmount()
  })

  it('highlights the current value', () => {
    const w = mountSwatches('#a855f7')
    expect(w.find('button[aria-label="Фиолетовый"]').attributes('aria-pressed')).toBe('true')
    expect(w.find('button[aria-label="Синий"]').attributes('aria-pressed')).toBe('false')
    expect(w.find('button[aria-label="Как у категории"]').attributes('aria-pressed')).toBe('false')
    expect(custom(w).attributes('aria-pressed')).toBe('false')
    w.unmount()
  })

  it('opens the custom picker sheet from its circle', async () => {
    const w = mountSwatches('#3b82f6')
    await custom(w).trigger('click')
    await nextTick()
    const input = document.body.querySelector('input[aria-label="HEX"]')
    expect(input).not.toBeNull()
    expect((input as HTMLInputElement).value).toBe('#3b82f6')
    w.unmount()
  })

  it('forwards the color picked in the sheet', async () => {
    const w = mountSwatches(null)
    await custom(w).trigger('click')
    await nextTick()
    const input = new DOMWrapper(document.body.querySelector('input[aria-label="HEX"]')!)
    await input.setValue('00aa55')
    expect(w.emitted('update:modelValue')).toEqual([['#00aa55']])
    w.unmount()
  })

  it('marks the circle as selected for a non-preset color', () => {
    const w = mountSwatches('#123456')
    expect(custom(w).attributes('aria-pressed')).toBe('true')
    const presets = w.findAll('button').filter((b) => b.attributes('aria-label') !== 'Свой цвет')
    for (const b of presets) expect(b.attributes('aria-pressed')).toBe('false')
    w.unmount()
  })

  it('falls back to neutral gray inside the sheet', async () => {
    const w = mountSwatches(null)
    await custom(w).trigger('click')
    await nextTick()
    const input = document.body.querySelector('input[aria-label="HEX"]') as HTMLInputElement
    expect(input.value).toBe('#6b7280')
    w.unmount()
  })
})
