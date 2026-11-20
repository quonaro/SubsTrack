import { DOMWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import IconPicker from './IconPicker.vue'

// Modal teleports into document.body, so the grid lives outside the wrapper.
describe('IconPicker', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function picker(modelValue = 'film') {
    return mount(IconPicker, { props: { modelValue }, attachTo: document.body })
  }

  const iconButtons = () =>
    [...document.body.querySelectorAll('button')].filter(
      (b) => b.getAttribute('aria-label') !== 'Выбрать иконку',
    )

  const search = () =>
    new DOMWrapper(document.body.querySelector('input[type="search"]') as Element)

  async function open(w: ReturnType<typeof picker>) {
    await w.find('button').trigger('click')
    await nextTick()
  }

  it('renders the current icon as a line icon', () => {
    const w = picker('film')
    expect(w.find('button svg').exists()).toBe(true)
    expect(w.find('button').text()).toBe('')
    w.unmount()
  })

  it('keeps rendering legacy emoji values', () => {
    const w = picker('🎬')
    expect(w.find('button').text()).toBe('🎬')
    w.unmount()
  })

  it('falls back to a default icon when the value is empty', () => {
    const w = picker('')
    expect(w.find('button svg').exists()).toBe(true)
    w.unmount()
  })

  it('applies a custom trigger size', () => {
    const w = mount(IconPicker, { props: { modelValue: 'film', size: 72 } })
    const btn = w.find('button')
    expect(btn.attributes('style')).toContain('width: 72px')
    expect(btn.attributes('style')).toContain('height: 72px')
    expect(btn.find('svg').attributes('width')).toBe('40')
    w.unmount()
  })

  it('tints the trigger with the chosen icon color', () => {
    const w = mount(IconPicker, { props: { modelValue: 'film', color: '#ef4444' } })
    const style = w.find('button').element.style
    expect(style.backgroundColor).toBe('rgba(239, 68, 68, 0.15)')
    w.unmount()
  })

  it('falls back to the category color, then to gray', () => {
    const cat = mount(IconPicker, { props: { modelValue: 'film', categoryColor: '#3b82f6' } })
    expect(cat.find('button').element.style.backgroundColor).toBe('rgba(59, 130, 246, 0.15)')
    cat.unmount()

    const bare = mount(IconPicker, { props: { modelValue: 'film' } })
    expect(bare.find('button').element.style.backgroundColor).toBe('rgba(107, 114, 128, 0.15)')
    bare.unmount()
  })

  it('searches the pack by keyword', async () => {
    const w = picker()
    await open(w)
    expect(iconButtons().length).toBeGreaterThan(200)

    await search().setValue('кофе')
    const shown = iconButtons().map((b) => b.getAttribute('aria-label'))
    expect(shown).toEqual(['кофе'])
    w.unmount()
  })

  it('shows an empty state when nothing matches', async () => {
    const w = picker()
    await open(w)
    await search().setValue('нет-такого-слова')
    expect(document.body.textContent).toContain('Ничего не найдено')
    expect(iconButtons()).toHaveLength(0)
    w.unmount()
  })

  it('emits the picked icon name', async () => {
    const w = picker('package')
    await open(w)
    const btn = iconButtons().find((b) => b.getAttribute('aria-label') === 'пицца')
    expect(btn).toBeTruthy()
    await new DOMWrapper(btn!).trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['pizza']])
    w.unmount()
  })
})
