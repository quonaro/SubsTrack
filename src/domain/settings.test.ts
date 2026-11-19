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
  })

  it('persists values and overwrites them', async () => {
    await setSetting('baseCurrency', 'USD')
    expect(await getSetting('baseCurrency')).toBe('USD')
    await setSetting('baseCurrency', 'EUR')
    expect(await getSetting('baseCurrency')).toBe('EUR')
    await setSetting('theme', 'light')
    expect(await getSetting('theme')).toBe('light')
  })

  it('loadSettings returns the full object', async () => {
    await setSetting('theme', 'light')
    expect(await loadSettings()).toEqual({ baseCurrency: 'RUB', theme: 'light' })
  })
})
