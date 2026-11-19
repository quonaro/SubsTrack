import { DOMWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import EmojiPicker from './EmojiPicker.vue'

describe('EmojiPicker', () => {
  it('shows the current emoji on the trigger', () => {
    const w = mount(EmojiPicker, { props: { modelValue: '🎬' } })
    expect(w.find('button').text()).toBe('🎬')
  })

  it('emits the picked emoji', async () => {
    const w = mount(EmojiPicker, { props: { modelValue: '📦' }, attachTo: document.body })
    await w.find('button').trigger('click')
    await nextTick()
    const btn = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === '🍕',
    )
    expect(btn).toBeTruthy()
    await new DOMWrapper(btn!).trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['🍕']])
    w.unmount()
  })
})
