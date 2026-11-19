import type { Db } from './index'
import { getDb } from './index'
import { logger } from '../log'

const log = logger('db:migrate')

// Versioned migrations: SCHEMA[i] upgrades the database from version i to
// i+1. PRAGMA user_version stores the current version. Statements are all
// idempotent (IF NOT EXISTS): explicit BEGIN/COMMIT is not used — the
// jeep-sqlite web backend rejects nested transactions — so a failed
// migration can simply be retried; the version bump is the last statement.
const SCHEMA: string[][] = [
  // v0 -> v1: initial schema
  [
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#f15a24',
      icon TEXT NOT NULL DEFAULT '📁',
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price_minor INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RUB',
      period_days INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      next_payment_date TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📦',
      is_active INTEGER NOT NULL DEFAULT 1,
      reminder_enabled INTEGER NOT NULL DEFAULT 1,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_subs_active ON subscriptions(is_active, next_payment_date)`,
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      amount_minor INTEGER NOT NULL,
      currency TEXT NOT NULL,
      paid_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_payments_sub ON payments(subscription_id)`,
    `CREATE TABLE IF NOT EXISTS notify_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      days_before INTEGER,
      at_time TEXT,
      interval_hours INTEGER,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
  ],
  // v1 -> v2: recolor categories created with the old violet default to the
  // accent color.
  [`UPDATE categories SET color='#f15a24' WHERE color='#8b5cf6'`],
]

export async function migrate(db?: Db): Promise<void> {
  const conn = db ?? (await getDb())
  const res = await conn.query('PRAGMA user_version')
  const first = res.values?.[0] as Record<string, unknown> | undefined
  let version = Number(first?.user_version ?? Object.values(first ?? {})[0] ?? 0)
  log.info('database version', version)
  while (version < SCHEMA.length) {
    const statements = SCHEMA[version]
    log.info('applying migration', version, '->', version + 1)
    try {
      for (const stmt of statements) await conn.execute(stmt)
    } catch (e) {
      log.error('migration failed', version, e)
      throw e
    }
    await conn.execute(`PRAGMA user_version = ${version + 1}`)
    version += 1
  }
}
