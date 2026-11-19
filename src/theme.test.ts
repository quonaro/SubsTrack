import { describe, expect, it } from 'vitest'
import { applyThemeToDom } from './theme'

describe('applyThemeToDom', () => {
  it('toggles the light class on the document root', () => {
    applyThemeToDom('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    applyThemeToDom('dark')
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })
})
