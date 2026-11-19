import type { AccentKey, PresetKey, Settings } from './types'

export interface AccentMeta {
  label: string
  value: string
  /** Foreground for text/icons on the accent fill — amber needs a dark one. */
  fg?: string
}

export const ACCENTS: Record<AccentKey, AccentMeta> = {
  orange: { label: 'Оранжевый', value: '#f15a24' },
  violet: { label: 'Фиолетовый', value: '#8b5cf6' },
  blue: { label: 'Синий', value: '#3b82f6' },
  emerald: { label: 'Изумрудный', value: '#10b981' },
  pink: { label: 'Розовый', value: '#ec4899' },
  amber: { label: 'Янтарный', value: '#f59e0b', fg: '#1a1d24' },
  cyan: { label: 'Бирюзовый', value: '#06b6d4' },
}

const PRESET_VARS = [
  '--color-app-bg',
  '--color-app-bg2',
  '--color-app-card',
  '--color-app-border',
  '--color-app-text',
  '--color-app-text-muted',
] as const

export type PresetVar = (typeof PRESET_VARS)[number]

export interface ThemePreset {
  label: string
  /** Accent selected automatically when the preset is picked. Still overridable. */
  accent: AccentKey
  light: Partial<Record<PresetVar, string>>
  dark: Partial<Record<PresetVar, string>>
}

export const THEME_PRESETS: Record<PresetKey, ThemePreset> = {
  default: { label: 'Стандартная', accent: 'orange', light: {}, dark: {} },
  nord: {
    label: 'Nord',
    accent: 'cyan',
    light: {
      '--color-app-bg': '#f8fafb',
      '--color-app-bg2': '#f6f7f9',
      '--color-app-card': '#f4f4f6',
      '--color-app-border': '#e8ecf2',
      '--color-app-text': '#242932',
      '--color-app-text-muted': '#485265',
    },
    dark: {
      '--color-app-bg': '#1c1f26',
      '--color-app-bg2': '#22262f',
      '--color-app-card': '#292e38',
      '--color-app-border': '#373e4e',
      '--color-app-text': '#f5f7f9',
      '--color-app-text-muted': '#a6b2c9',
    },
  },
  solarized: {
    label: 'Solarized',
    accent: 'blue',
    light: {
      '--color-app-bg': '#fdf6e3',
      '--color-app-bg2': '#f6f1e4',
      '--color-app-card': '#efede6',
      '--color-app-border': '#eae1c8',
      '--color-app-text': '#46575d',
      '--color-app-text-muted': '#657a81',
    },
    dark: {
      '--color-app-bg': '#002b36',
      '--color-app-bg2': '#04303c',
      '--color-app-card': '#073541',
      '--color-app-border': '#123e49',
      '--color-app-text': '#abb9ba',
      '--color-app-text-muted': '#9dadaf',
    },
  },
  contrast: {
    label: 'Контрастная',
    accent: 'blue',
    light: {
      '--color-app-bg': '#ffffff',
      '--color-app-bg2': '#fbfbfb',
      '--color-app-card': '#f7f7f7',
      '--color-app-border': '#ebebeb',
      '--color-app-text': '#000000',
      '--color-app-text-muted': '#404040',
    },
    dark: {
      '--color-app-bg': '#000000',
      '--color-app-bg2': '#0a0a0a',
      '--color-app-card': '#141414',
      '--color-app-border': '#242424',
      '--color-app-text': '#ffffff',
      '--color-app-text-muted': '#cccccc',
    },
  },
  warm: {
    label: 'Тёплая',
    accent: 'orange',
    light: {
      '--color-app-bg': '#fbf8f4',
      '--color-app-bg2': '#f7f5f0',
      '--color-app-card': '#f4f3f1',
      '--color-app-border': '#f3efe7',
      '--color-app-text': '#332819',
      '--color-app-text-muted': '#786753',
    },
    dark: {
      '--color-app-bg': '#1d1a16',
      '--color-app-bg2': '#221f1b',
      '--color-app-card': '#28241f',
      '--color-app-border': '#332f28',
      '--color-app-text': '#f1ede5',
      '--color-app-text-muted': '#b2a599',
    },
  },
}

export function systemThemeMode(): 'dark' | 'light' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function effectiveTheme(settings: Settings): 'dark' | 'light' {
  if (settings.themeMode === 'system') return systemThemeMode()
  return settings.themeMode === 'light' ? 'light' : 'dark'
}

export function applyThemeToDom(
  theme: 'dark' | 'light',
  accent: AccentKey,
  preset: PresetKey,
): void {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  const meta = ACCENTS[accent] ?? ACCENTS.orange
  root.style.setProperty('--color-accent', meta.value)
  root.style.setProperty('--color-accent-fg', meta.fg ?? '#ffffff')
  const overrides = (THEME_PRESETS[preset] ?? THEME_PRESETS.default)[theme]
  for (const name of PRESET_VARS) {
    const value = overrides[name]
    if (value) root.style.setProperty(name, value)
    else root.style.removeProperty(name)
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      'content',
      overrides['--color-app-bg'] ?? (theme === 'light' ? '#f5f6f8' : '#0f1115'),
    )
}
