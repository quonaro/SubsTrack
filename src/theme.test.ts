import { beforeEach, describe, expect, it } from 'vitest'
import {
  ACCENTS,
  THEME_CACHE_KEY,
  THEME_PRESETS,
  applyCachedTheme,
  applyThemeToDom,
  effectiveTheme,
  systemThemeMode,
} from './theme'

describe('applyThemeToDom', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
  })

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

  it('caches both modes so the boot script can paint the light theme', () => {
    applyThemeToDom('light', 'blue', 'nord', 'light')
    const cache = JSON.parse(localStorage.getItem(THEME_CACHE_KEY) ?? 'null')
    expect(cache.themeMode).toBe('light')
    expect(cache.css.light).toContain(
      `--color-app-bg:${THEME_PRESETS.nord.light['--color-app-bg']}`,
    )
    expect(cache.css.dark).toContain(`--color-app-bg:${THEME_PRESETS.nord.dark['--color-app-bg']}`)
    expect(cache.bg.light).toBe(THEME_PRESETS.nord.light['--color-app-bg'])
  })
})

describe('applyCachedTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
  })

  it('returns false without a cache', () => {
    expect(applyCachedTheme()).toBe(false)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('restores a cached light theme without any DB read', () => {
    applyThemeToDom('light', 'emerald', 'solarized', 'light')
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
    expect(document.documentElement.classList.contains('light')).toBe(false)

    expect(applyCachedTheme()).toBe(true)
    const style = document.documentElement.style
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(style.getPropertyValue('--color-accent')).toBe(ACCENTS.emerald.value)
    expect(style.getPropertyValue('--color-app-bg')).toBe(
      THEME_PRESETS.solarized.light['--color-app-bg'],
    )
  })

  it('drops the literal boot background once the real theme lands', () => {
    applyThemeToDom('light', 'orange', 'default', 'light')
    document.documentElement.removeAttribute('style')
    applyCachedTheme()
    expect(document.documentElement.style.backgroundColor).not.toBe('')
    applyThemeToDom('light', 'orange', 'default', 'light')
    expect(document.documentElement.style.backgroundColor).toBe('')
  })

  it('follows prefers-color-scheme for a cached system mode', () => {
    applyThemeToDom('dark', 'orange', 'default', 'system')
    const orig = window.matchMedia
    window.matchMedia = ((q: string) => ({
      matches: true,
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
    try {
      document.documentElement.className = ''
      expect(applyCachedTheme()).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(true)
    } finally {
      window.matchMedia = orig
    }
  })

  it('ignores a corrupt cache', () => {
    localStorage.setItem(THEME_CACHE_KEY, '{not json')
    expect(applyCachedTheme()).toBe(false)
  })
})
