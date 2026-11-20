import { describe, expect, it } from 'vitest'
import { blobToDataUrl, IMAGE_ICON_PREFIX, isImageIcon } from './imageIcon'

describe('isImageIcon', () => {
  it('detects stored photo icons', () => {
    expect(isImageIcon(`${IMAGE_ICON_PREFIX}avif;base64,AAAA`)).toBe(true)
    expect(isImageIcon('data:image/webp;base64,AAAA')).toBe(true)
  })

  it('ignores pack names, unknown names and legacy emoji', () => {
    expect(isImageIcon('film')).toBe(false)
    expect(isImageIcon('no-such-icon')).toBe(false)
    expect(isImageIcon('🎬')).toBe(false)
    expect(isImageIcon('')).toBe(false)
  })
})

describe('blobToDataUrl', () => {
  it('inlines the blob as a data URL', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/avif' })
    const url = await blobToDataUrl(blob)
    expect(url.startsWith('data:image/avif;base64,')).toBe(true)
    expect(isImageIcon(url)).toBe(true)
  })
})
