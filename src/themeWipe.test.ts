import { describe, expect, it, vi } from 'vitest'
import { runThemeWipe } from './themeWipe'
import { store } from './store'

describe('runThemeWipe', () => {
  it('runs apply() and cleans up the overlay and transition freeze', async () => {
    store.settings = { ...store.settings, preset: 'warm', themeMode: 'dark' }
    const apply = vi.fn()
    await runThemeWipe({ clientX: 10, clientY: 20 }, apply)
    expect(apply).toHaveBeenCalledTimes(1)
    expect(document.documentElement.classList.contains('theme-wipe')).toBe(false)
  })

  it('applies immediately under prefers-reduced-motion', async () => {
    const orig = window.matchMedia
    window.matchMedia = ((q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
    try {
      const apply = vi.fn()
      await runThemeWipe({ clientX: 0, clientY: 0 }, apply)
      expect(apply).toHaveBeenCalledTimes(1)
      expect(document.documentElement.classList.contains('theme-wipe')).toBe(false)
    } finally {
      window.matchMedia = orig
    }
  })
})
