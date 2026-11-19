import { describe, expect, it } from 'vitest'
import { ACCENTS, THEME_PRESETS, applyThemeToDom } from './theme'

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

  it('clears preset overrides when switching back to default', () => {
    applyThemeToDom('dark', 'orange', 'nord')
    applyThemeToDom('dark', 'orange', 'default')
    const style = document.documentElement.style
    expect(style.getPropertyValue('--color-app-bg')).toBe('')
    expect(style.getPropertyValue('--color-app-card')).toBe('')
  })
})
