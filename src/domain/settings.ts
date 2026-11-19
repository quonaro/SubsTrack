import { getDb, rows } from '../db'
import type { Settings, ThemeMode } from '../types'

const DEFAULTS: Settings = {
  baseCurrency: 'RUB',
  theme: 'dark',
  themeMode: 'dark',
  accent: 'orange',
  preset: 'warm',
}

export async function getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
  const db = await getDb()
  const res = await db.query('SELECT value FROM settings WHERE key=?', [key])
  const row = rows<{ value: string }>(res)[0]
  return (row?.value as Settings[K]) ?? DEFAULTS[key]
}

export async function setSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): Promise<void> {
  const db = await getDb()
  await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)', [key, value])
}

export async function loadSettings(): Promise<Settings> {
  const db = await getDb()
  const res = await db.query('SELECT value FROM settings WHERE key=?', ['themeMode'])
  const stored = rows<{ value: string }>(res)[0]?.value as ThemeMode | undefined
  const theme = await getSetting('theme')
  return {
    baseCurrency: await getSetting('baseCurrency'),
    theme,
    // themeMode was added later — fall back to the legacy theme key.
    themeMode: stored ?? theme,
    accent: await getSetting('accent'),
    preset: await getSetting('preset'),
  }
}
