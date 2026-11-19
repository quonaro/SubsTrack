import { getDb, rows } from '../db'
import type { Settings } from '../types'

const DEFAULTS: Settings = {
  baseCurrency: 'RUB',
  theme: 'dark',
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
  return {
    baseCurrency: await getSetting('baseCurrency'),
    theme: await getSetting('theme'),
  }
}
