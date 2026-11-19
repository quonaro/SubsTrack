import { DOMWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import OptionField from './OptionField.vue'

const options = [
  { value: 'a', label: 'Вариант А' },
  { value: 'b', label: 'Вариант Б', hint: 'подсказка', icon: '⭐' },
]

const bodyButton = async (text: string) => {
  await nextTick()
  const btn = [...document.body.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(text),
  )
  expect(btn).toBeTruthy()
  return new DOMWrapper(btn!)
}

describe('OptionField', () => {
  it('shows the selected option label', () => {
    const w = mount(OptionField, { props: { modelValue: 'a', options } })
    expect(w.text()).toContain('Вариант А')
  })

  it('shows the placeholder for an unknown/null value', () => {
    const w = mount(OptionField, {
      props: { modelValue: null, options, placeholder: 'Выбери' },
    })
    expect(w.text()).toContain('Выбери')
  })

  it('opens the sheet and emits the picked value', async () => {
    const w = mount(OptionField, {
      props: { modelValue: 'a', options, label: 'Поле' },
      attachTo: document.body,
    })
    await w.find('button').trigger('click')
    const target = await bodyButton('Вариант Б')
    await target.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['b']])
    w.unmount()
  })
})
