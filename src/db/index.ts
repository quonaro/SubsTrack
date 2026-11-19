import { Capacitor } from '@capacitor/core'
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from '@capacitor-community/sqlite'
import { logger } from '../log'

const log = logger('db')

export const DATABASE_NAME = 'substrack'

// Minimal surface every storage backend implements. Native and web both go
// through @capacitor-community/sqlite (web via jeep-sqlite/sql.js +
// IndexedDB), so the same SQL runs everywhere.
export interface Db {
  execute(statement: string): Promise<unknown>
  query(statement: string, values?: unknown[]): Promise<{ values?: Record<string, unknown>[] }>
  run(
    statement: string,
    values?: unknown[],
    transaction?: boolean,
  ): Promise<{ changes?: { changes?: number; lastId?: number } }>
}

let dbPromise: Promise<Db> | null = null

async function openNative(): Promise<Db> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  const ret = await sqlite.checkConnectionsConsistency()
  const hasConn = (await sqlite.isConnection(DATABASE_NAME, false)).result
  let conn: SQLiteDBConnection
  if (ret.result && hasConn) {
    conn = await sqlite.retrieveConnection(DATABASE_NAME, false)
  } else {
    conn = await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false)
  }
  await conn.open()
  // OFF by default in SQLite — ON DELETE CASCADE/SET NULL silently no-ops otherwise.
  await conn.execute('PRAGMA foreign_keys = ON')
  return conn
}

async function openWeb(): Promise<Db> {
  // jeep-sqlite is a no-op on native — on web it registers the sql.js worker
  // and persists the database file into IndexedDB.
  const { defineCustomElements: defineJeepSqlite } = await import('jeep-sqlite/loader')
  defineJeepSqlite(window)
  await customElements.whenDefined('jeep-sqlite')
  const el = document.createElement('jeep-sqlite')
  document.body.appendChild(el)
  await customElements.whenDefined('jeep-sqlite')
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  await sqlite.initWebStore()
  const conn = await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false)
  await conn.open()
  await conn.execute('PRAGMA foreign_keys = ON')

  // Web persistence is NOT automatic: the in-memory sql.js database only
  // reaches IndexedDB via saveToStore(). Saves are coalesced per microtask
  // and serialized on a promise chain — jeep's saveDBToStore
  // (removeItem+setItem) is not atomic, so overlapping saves could overwrite
  // fresh data with a stale export. A timer-based debounce is avoided on
  // purpose: it can be throttled to death in backgrounded tabs.
  let saveChain: Promise<void> = Promise.resolve()
  let pending = 0
  const flushSave = () => {
    saveChain = saveChain.then(() =>
      sqlite.saveToStore(DATABASE_NAME).catch((e) => log.warn('saveToStore failed', e)),
    )
  }
  const scheduleSave = () => {
    pending++
    queueMicrotask(() => {
      if (pending === 0) return
      pending = 0
      flushSave()
    })
  }
  window.addEventListener('pagehide', flushSave)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave()
  })
  return {
    execute: async (s) => {
      const r = await conn.execute(s)
      scheduleSave()
      return r
    },
    query: (s, v) => conn.query(s, v),
    run: async (s, v, t) => {
      const r = await conn.run(s, v, t)
      scheduleSave()
      return r
    },
  }
}

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    const platform = Capacitor.getPlatform()
    dbPromise = (platform === 'web' ? openWeb() : openNative()).catch((e) => {
      dbPromise = null
      log.error('failed to open database', e)
      throw e
    })
  }
  return dbPromise
}

/** Test hook: swap the storage backend. */
export function setDbForTesting(db: Db | null): void {
  dbPromise = db ? Promise.resolve(db) : null
}

// --- row mapping helpers -----------------------------------------------------

export function rows<T>(res: { values?: Record<string, unknown>[] }): T[] {
  return (res.values ?? []) as T[]
}

export function lastId(res: { changes?: { lastId?: number } }): number {
  return res.changes?.lastId ?? 0
}
