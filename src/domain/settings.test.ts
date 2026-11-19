// Integration tests against real SQLite (sql.js in memory).
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'
import { getSetting, loadSettings, setSetting } from './settings'

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
})

describe('settings (sqlite)', () => {
  it('returns defaults for unset keys', async () => {
    expect(await getSetting('baseCurrency')).toBe('RUB')
    expect(await getSetting('theme')).toBe('dark')
    expect(await getSetting('themeMode')).toBe('dark')
    expect(await getSetting('accent')).toBe('orange')
    expect(await getSetting('preset')).toBe('default')
  })

  it('persists values and overwrites them', async () => {
    await setSetting('baseCurrency', 'USD')
    expect(await getSetting('baseCurrency')).toBe('USD')
    await setSetting('baseCurrency', 'EUR')
    expect(await getSetting('baseCurrency')).toBe('EUR')
    await setSetting('theme', 'light')
    expect(await getSetting('theme')).toBe('light')
    await setSetting('themeMode', 'system')
    expect(await getSetting('themeMode')).toBe('system')
    await setSetting('accent', 'blue')
    expect(await getSetting('accent')).toBe('blue')
    await setSetting('preset', 'nord')
    expect(await getSetting('preset')).toBe('nord')
  })

  it('loadSettings returns the full object', async () => {
    await setSetting('theme', 'light')
    expect(await loadSettings()).toEqual({
      baseCurrency: 'RUB',
      theme: 'light',
      themeMode: 'light',
      accent: 'orange',
      preset: 'default',
    })
  })

  it('loadSettings prefers a stored themeMode over the legacy theme key', async () => {
    await setSetting('theme', 'light')
    await setSetting('themeMode', 'system')
    const s = await loadSettings()
    expect(s.theme).toBe('light')
    expect(s.themeMode).toBe('system')
  })
})
