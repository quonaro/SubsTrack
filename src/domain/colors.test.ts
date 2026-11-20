import { describe, expect, it } from 'vitest'
import { ICON_COLORS, iconTileBackground } from './colors'

describe('iconTileBackground', () => {
  it('prefers the subscription color over the category color', () => {
    expect(iconTileBackground('#ef4444', '#22c55e')).toBe('#ef444426')
  })

  it('falls back to the category color, then to gray', () => {
    expect(iconTileBackground(null, '#22c55e')).toBe('#22c55e26')
    expect(iconTileBackground(undefined, null)).toBe('#6b728026')
  })
})

describe('ICON_COLORS', () => {
  it('lists unique hex colors with labels', () => {
    expect(ICON_COLORS.length).toBeGreaterThan(5)
    for (const color of ICON_COLORS) {
      expect(color.value).toMatch(/^#[0-9a-f]{6}$/)
      expect(color.label.length).toBeGreaterThan(0)
    }
    expect(new Set(ICON_COLORS.map((c) => c.value)).size).toBe(ICON_COLORS.length)
  })
})
