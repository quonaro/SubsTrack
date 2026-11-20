import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import ImageCropModal from './ImageCropModal.vue'

// Modal teleports into document.body, so the sheet lives outside the wrapper.
describe('ImageCropModal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function crop(file: File | null = null) {
    return mount(ImageCropModal, {
      props: { open: true, file },
      attachTo: document.body,
    })
  }

  const button = (label: string) =>
    [...document.body.querySelectorAll('button')].find((b) => b.textContent?.includes(label))

  it('shows a placeholder and blocks saving until a photo is picked', async () => {
    const w = crop()
    await nextTick()
    expect(document.body.textContent).toContain('Фото не выбрано')
    expect(button('Сохранить')?.disabled).toBe(true)
    w.unmount()
  })

  it('offers zoom, rotate and reset controls', async () => {
    const w = crop()
    await nextTick()
    for (const label of ['Уменьшить', 'Увеличить', 'Повернуть', 'Сбросить']) {
      const b = [...document.body.querySelectorAll(`button[aria-label="${label}"]`)]
      expect(b, label).toHaveLength(1)
    }
    // No cropper instance is mounted without an image, so the buttons must not
    // throw when clicked.
    await (document.body.querySelector('button[aria-label="Увеличить"]') as HTMLElement).click()
    w.unmount()
  })
})
