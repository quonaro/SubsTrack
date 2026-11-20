/** Preset colors for the subscription icon tile. */
export const ICON_COLORS: { value: string; label: string }[] = [
  { value: '#ef4444', label: 'Красный' },
  { value: '#f15a24', label: 'Оранжевый' },
  { value: '#eab308', label: 'Жёлтый' },
  { value: '#84cc16', label: 'Лаймовый' },
  { value: '#22c55e', label: 'Зелёный' },
  { value: '#14b8a6', label: 'Бирюзовый' },
  { value: '#3b82f6', label: 'Синий' },
  { value: '#6366f1', label: 'Индиго' },
  { value: '#a855f7', label: 'Фиолетовый' },
  { value: '#ec4899', label: 'Розовый' },
  { value: '#6b7280', label: 'Серый' },
]

/**
 * Alpha suffix for icon tile tints (~30%). Higher values read as the real
 * color instead of a gray wash, while the line icon stays readable in both
 * themes.
 */
export const ICON_TILE_ALPHA = '4d'

/**
 * Tinted background for an icon tile: the subscription's own color wins,
 * then its category color.
 */
export function iconTileBackground(
  iconColor: string | null | undefined,
  categoryColor: string | null | undefined,
): string {
  return `${iconColor ?? categoryColor ?? '#6b7280'}${ICON_TILE_ALPHA}`
}

/** Normalizes user/hex input to a lowercase `#rrggbb`, or null if invalid. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw
      .split('')
      .map((c) => c + c)
      .join('')}`.toLowerCase()
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toLowerCase()}`
  return null
}

export interface Hsv {
  /** Hue in degrees, 0–360. */
  h: number
  /** Saturation, 0–1. */
  s: number
  /** Value (brightness), 0–1. */
  v: number
}

/** Falls back to the neutral tile gray for anything unparseable. */
export function hexToHsv(hex: string | null | undefined): Hsv {
  const rgb = normalizeHex(hex ?? '') ?? '#6b7280'
  const r = Number.parseInt(rgb.slice(1, 3), 16) / 255
  const g = Number.parseInt(rgb.slice(3, 5), 16) / 255
  const b = Number.parseInt(rgb.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const hue = ((h % 360) + 360) % 360
  const c = v * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = v - c
  let rgb: [number, number, number]
  if (hue < 60) rgb = [c, x, 0]
  else if (hue < 120) rgb = [x, c, 0]
  else if (hue < 180) rgb = [0, c, x]
  else if (hue < 240) rgb = [0, x, c]
  else if (hue < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const hex = rgb
    .map((n) =>
      Math.round((n + m) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
  return `#${hex}`
}
