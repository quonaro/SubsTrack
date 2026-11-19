import { describe, expect, it } from 'vitest'
import { ACCENTS, THEME_PRESETS, applyThemeToDom, effectiveTheme, systemThemeMode } from './theme'

describe('applyThemeToDom', () => {
  it('toggles the light class on the document root', () => {
    applyThemeToDom('light', 'orange', 'default')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    applyThemeToDom('dark', 'orange', 'default')
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('writes the accent color vars onto the document root', () => {
    applyThemeToDom('dark', 'blue', 'default')
    const style = document.documentElement.style
    expect(style.getPropertyValue('--color-accent')).toBe(ACCENTS.blue.value)
    expect(style.getPropertyValue('--color-accent-fg')).toBe('#ffffff')
  })

  it('uses a dark foreground for light accents like amber', () => {
    applyThemeToDom('dark', 'amber', 'default')
    expect(document.documentElement.style.getPropertyValue('--color-accent-fg')).toBe('#1a1d24')
  })

  it('applies preset surface overrides for the active mode', () => {
    applyThemeToDom('dark', 'orange', 'nord')
    const style = document.documentElement.style
    expect(style.getPropertyValue('--color-app-bg')).toBe(THEME_PRESETS.nord.dark['--color-app-bg'])
    expect(style.getPropertyValue('--color-app-card')).toBe(
      THEME_PRESETS.nord.dark['--color-app-card'],
    )
  })

  it('systemThemeMode follows prefers-color-scheme', () => {
    const orig = window.matchMedia
    const stub = (matches: boolean) =>
      ((q: string) => ({
        matches,
        media: q,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })) as typeof window.matchMedia
    try {
      window.matchMedia = stub(true)
      expect(systemThemeMode()).toBe('light')
      window.matchMedia = stub(false)
      expect(systemThemeMode()).toBe('dark')
    } finally {
      window.matchMedia = orig
    }
  })

  it('effectiveTheme resolves system and explicit modes', () => {
    const base = {
      baseCurrency: 'RUB',
      theme: 'dark',
      accent: 'orange',
      preset: 'default',
    } as const
    expect(effectiveTheme({ ...base, themeMode: 'light' })).toBe('light')
    expect(effectiveTheme({ ...base, themeMode: 'dark' })).toBe('dark')
    // test.setup matchMedia stub reports matches: false → dark
    expect(effectiveTheme({ ...base, themeMode: 'system' })).toBe('dark')
  })

  it('clears preset overrides when switching back to default', () => {
    applyThemeToDom('dark', 'orange', 'nord')
    applyThemeToDom('dark', 'orange', 'default')
    const style = document.documentElement.style
    expect(style.getPropertyValue('--color-app-bg')).toBe('')
    expect(style.getPropertyValue('--color-app-card')).toBe('')
  })
})
