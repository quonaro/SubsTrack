import { DOMWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { hexToHsv, hsvToHex } from '../domain/colors'
import ColorPickerModal from './ColorPickerModal.vue'

// The sheet teleports into document.body, so its contents live outside the
// wrapper.
describe('ColorPickerModal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  async function mountPicker(modelValue: string | null = '#3b82f6') {
    const w = mount(ColorPickerModal, {
      props: { open: true, modelValue },
      attachTo: document.body,
    })
    await nextTick()
    return w
  }

  const hexInput = () => new DOMWrapper(document.body.querySelector('input[aria-label="HEX"]')!)

  const slider = (label: string) =>
    new DOMWrapper(document.body.querySelector(`[role="slider"][aria-label="${label}"]`)!)

  function stubRect(el: Element, width: number, height: number) {
    el.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0 }) as DOMRect
  }

  it('starts from the current color', async () => {
    const w = await mountPicker('#3b82f6')
    expect((hexInput().element as HTMLInputElement).value).toBe('#3b82f6')
    expect(slider('Насыщенность и яркость').attributes('aria-valuetext')).toBe('#3b82f6')
    expect(slider('Оттенок').attributes('aria-valuenow')).toBe(
      String(Math.round(hexToHsv('#3b82f6').h)),
    )
    w.unmount()
  })

  it('emits the color typed as hex', async () => {
    const w = await mountPicker('#3b82f6')
    await hexInput().setValue('00AA55')
    expect(w.emitted('update:modelValue')).toEqual([['#00aa55']])
    w.unmount()
  })

  it('ignores incomplete hex input', async () => {
    const w = await mountPicker('#3b82f6')
    await hexInput().setValue('00aa')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('picks saturation and brightness by dragging the area', async () => {
    const w = await mountPicker(null)
    const area = slider('Насыщенность и яркость').element
    stubRect(area, 100, 100)
    // Full brightness, zero saturation: the pure white corner.
    const emitted = new DOMWrapper(area)
    await emitted.trigger('pointerdown', { clientX: 0, clientY: 0, pointerId: 1, buttons: 1 })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['#ffffff'])
    w.unmount()
  })

  it('picks the hue by dragging the strip', async () => {
    const w = await mountPicker('#3b82f6')
    const hue = slider('Оттенок').element
    stubRect(hue, 100, 16)
    await new DOMWrapper(hue).trigger('pointerdown', {
      clientX: 0,
      clientY: 8,
      pointerId: 2,
      buttons: 1,
    })
    const value = (w.emitted('update:modelValue')!.at(-1) as string[])[0]
    const { s, v } = hexToHsv('#3b82f6')
    expect(value).toBe(hsvToHex({ h: 0, s, v }))
    w.unmount()
  })

  it('closes from the done button', async () => {
    const w = await mountPicker('#3b82f6')
    const done = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Готово'),
    )
    await new DOMWrapper(done!).trigger('click')
    expect(w.emitted('update:open')).toEqual([[false]])
    w.unmount()
  })
})
