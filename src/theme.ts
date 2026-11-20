import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { ref } from 'vue'
import type { AccentKey, PresetKey, Settings, ThemeMode } from './types'

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
  warm: {
    label: 'Стандартная',
    accent: 'orange',
    light: {
      '--color-app-bg': '#fdfaf4',
      '--color-app-bg2': '#fffefa',
      '--color-app-card': '#f7f3ea',
      '--color-app-border': '#e9e1d2',
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
  default: { label: 'Графит', accent: 'violet', light: {}, dark: {} },
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
}

/** Theme mode actually applied to the DOM — lags store.settings during a theme wipe. */
export const appliedThemeMode = ref<'dark' | 'light'>('dark')

/**
 * Last applied theme, mirrored into localStorage so the inline boot script in
 * index.html can paint it before the bundle (and the async DB read) runs —
 * otherwise the dark CSS defaults flash for a frame on a light theme.
 */
export const THEME_CACHE_KEY = 'substrack:theme'

export interface ThemeCache {
  themeMode: ThemeMode
  /** Ready-made inline declarations per mode, applied verbatim by the boot script. */
  css: Record<'dark' | 'light', string>
  /** `theme-color` / page background per mode. */
  bg: Record<'dark' | 'light', string>
}

const DARK_BG = '#0f1115'
const LIGHT_BG = '#f5f6f8'

export function systemThemeMode(): 'dark' | 'light' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function effectiveTheme(settings: Settings): 'dark' | 'light' {
  if (settings.themeMode === 'system') return systemThemeMode()
  return settings.themeMode === 'light' ? 'light' : 'dark'
}

export function resolveThemeMode(themeMode: ThemeMode | undefined): 'dark' | 'light' {
  if (themeMode === 'system' || !themeMode) return systemThemeMode()
  return themeMode === 'light' ? 'light' : 'dark'
}

function presetOverrides(preset: PresetKey, theme: 'dark' | 'light') {
  return (THEME_PRESETS[preset] ?? THEME_PRESETS.default)[theme] ?? {}
}

function presetBg(preset: PresetKey, theme: 'dark' | 'light'): string {
  return (
    presetOverrides(preset, theme)['--color-app-bg'] ?? (theme === 'light' ? LIGHT_BG : DARK_BG)
  )
}

function themeDeclarations(theme: 'dark' | 'light', accent: AccentKey, preset: PresetKey): string {
  const meta = ACCENTS[accent] ?? ACCENTS.orange
  const entries: [string, string][] = [
    ['--color-accent', meta.value],
    ['--color-accent-fg', meta.fg ?? '#ffffff'],
  ]
  const overrides = presetOverrides(preset, theme)
  for (const name of PRESET_VARS) {
    const value = overrides[name]
    if (value) entries.push([name, value])
  }
  return entries.map(([name, value]) => `${name}:${value}`).join(';')
}

function setThemeColorMeta(value: string): void {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', value)
}

/**
 * The status bar is transparent (content draws under it), so the system icons
 * must invert with the app theme — otherwise white icons disappear on the
 * light palette. Web build has no status bar, hence the early exit.
 */
function syncStatusBarIcons(theme: 'dark' | 'light'): void {
  if (!Capacitor.isNativePlatform()) return
  void StatusBar.setOverlaysWebView({ overlay: true })
    .then(() => StatusBar.setStyle({ style: theme === 'light' ? Style.Light : Style.Dark }))
    .catch(() => undefined)
}

function writeThemeCache(themeMode: ThemeMode, accent: AccentKey, preset: PresetKey): void {
  const cache: ThemeCache = {
    themeMode,
    css: {
      dark: themeDeclarations('dark', accent, preset),
      light: themeDeclarations('light', accent, preset),
    },
    bg: { dark: presetBg(preset, 'dark'), light: presetBg(preset, 'light') },
  }
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Private mode / quota — the boot script just falls back to the CSS defaults.
  }
}

/**
 * Synchronously paints the cached theme (also done inline in index.html before
 * the first paint). Returns false when nothing was cached yet.
 */
export function applyCachedTheme(): boolean {
  let cache: ThemeCache | null = null
  try {
    cache = JSON.parse(localStorage.getItem(THEME_CACHE_KEY) ?? 'null') as ThemeCache | null
  } catch {
    cache = null
  }
  if (!cache?.css) return false
  const mode = resolveThemeMode(cache.themeMode)
  const root = document.documentElement
  root.classList.toggle('light', mode === 'light')
  root.style.cssText = cache.css[mode] ?? ''
  const bg = cache.bg?.[mode] ?? (mode === 'light' ? LIGHT_BG : DARK_BG)
  // Literal background covers the gap before style.css loads; the runtime
  // applyThemeToDom() drops it so the CSS variables own the color again.
  root.style.backgroundColor = bg
  setThemeColorMeta(bg)
  appliedThemeMode.value = mode
  return true
}

export function applyThemeToDom(
  theme: 'dark' | 'light',
  accent: AccentKey,
  preset: PresetKey,
  themeMode: ThemeMode = theme,
): void {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  appliedThemeMode.value = theme
  const meta = ACCENTS[accent] ?? ACCENTS.orange
  root.style.setProperty('--color-accent', meta.value)
  root.style.setProperty('--color-accent-fg', meta.fg ?? '#ffffff')
  const overrides = presetOverrides(preset, theme)
  for (const name of PRESET_VARS) {
    const value = overrides[name]
    if (value) root.style.setProperty(name, value)
    else root.style.removeProperty(name)
  }
  root.style.removeProperty('background-color')
  setThemeColorMeta(presetBg(preset, theme))
  syncStatusBarIcons(theme)
  writeThemeCache(themeMode, accent, preset)
}
