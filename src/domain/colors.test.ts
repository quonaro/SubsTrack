import { describe, expect, it } from 'vitest'
import {
  ICON_COLORS,
  ICON_TILE_ALPHA,
  hexToHsv,
  hsvToHex,
  iconTileBackground,
  normalizeHex,
} from './colors'

describe('iconTileBackground', () => {
  it('prefers the subscription color over the category color', () => {
    expect(iconTileBackground('#ef4444', '#22c55e')).toBe(`#ef4444${ICON_TILE_ALPHA}`)
  })

  it('falls back to the category color, then to gray', () => {
    expect(iconTileBackground(null, '#22c55e')).toBe(`#22c55e${ICON_TILE_ALPHA}`)
    expect(iconTileBackground(undefined, null)).toBe(`#6b7280${ICON_TILE_ALPHA}`)
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

describe('normalizeHex', () => {
  it('accepts short and long hex with or without a hash', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(normalizeHex(' 00AA55 ')).toBe('#00aa55')
    expect(normalizeHex('#3b82f6')).toBe('#3b82f6')
  })

  it('rejects incomplete or non-hex input', () => {
    expect(normalizeHex('00aa')).toBeNull()
    expect(normalizeHex('#xyzxyz')).toBeNull()
    expect(normalizeHex('')).toBeNull()
  })
})

describe('hexToHsv / hsvToHex', () => {
  it('round-trips presets and custom colors', () => {
    for (const hex of ['#ef4444', '#3b82f6', '#123456', '#ffffff', '#000000', '#6b7280']) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex)
    }
  })

  it('maps primaries to their hues', () => {
    expect(Math.round(hexToHsv('#ff0000').h)).toBe(0)
    expect(Math.round(hexToHsv('#00ff00').h)).toBe(120)
    expect(Math.round(hexToHsv('#0000ff').h)).toBe(240)
    expect(hexToHsv('#808080').s).toBe(0)
  })

  it('wraps hue past 360 and tolerates negatives', () => {
    expect(hsvToHex({ h: 360, s: 1, v: 1 })).toBe('#ff0000')
    expect(hsvToHex({ h: -60, s: 1, v: 1 })).toBe('#ff00ff')
  })

  it('falls back to the neutral gray for unknown input', () => {
    expect(hexToHsv(null)).toEqual(hexToHsv('#6b7280'))
    expect(hexToHsv('nope')).toEqual(hexToHsv('#6b7280'))
  })
})
