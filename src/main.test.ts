// Boot smoke test: importing main.ts runs boot() — migrate + seed + initStore
// + mount. Runs against a real in-memory db; fetch is stubbed so the
// fire-and-forget update check stays offline.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeTestDb } from './db/testdb'
import { setDbForTesting } from './db'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('boot', () => {
  it('migrates, seeds categories and mounts the app', async () => {
    const db = await makeTestDb()
    setDbForTesting(db)
    document.body.innerHTML = '<div id="app"></div>'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    )
    const { store } = await import('./store')
    await import('./main')
    await vi.waitFor(() => expect(store.ready).toBe(true))
    expect(store.categories.length).toBeGreaterThanOrEqual(6)
    expect(document.querySelector('#app nav a[aria-label="Главная"]')).toBeTruthy()
  })
})
