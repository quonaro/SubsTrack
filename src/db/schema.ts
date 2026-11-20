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
  // v2 -> v3: one-time purchases. Older builds don't know the flag and read
  // period_days literally (stored as ~100 years for one-time subs), so they
  // just treat them as a very long cycle instead of repeating them.
  [`ALTER TABLE subscriptions ADD COLUMN is_one_time INTEGER NOT NULL DEFAULT 0`],
  // v3 -> v4: optional tile background for the subscription icon. NULL means
  // «use the category color»; old builds ignore the extra column.
  [`ALTER TABLE subscriptions ADD COLUMN icon_color TEXT`],
  // v4 -> v5: calendar-month periods. «Ежемесячно» used to be a 30-day step,
  // so every short month dragged the payment date earlier (4 Jan → 3 Feb →
  // 5 Mar…). A month-based period now keeps the day of the month; `period_day`
  // stores that day so a date clamped into a short month (31 → 28/29) doesn't
  // shift the months after it. Older builds ignore both columns and keep
  // stepping by `period_days`, which this build still fills with the day
  // approximation (30 / 90 / 365).
  [
    `ALTER TABLE subscriptions ADD COLUMN period_months INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE subscriptions ADD COLUMN period_day INTEGER NOT NULL DEFAULT 0`,
    // Rows that came from the presets mean calendar periods; the anchor day is
    // the untouched start_date, so an already drifted schedule snaps back.
    `UPDATE subscriptions SET period_months = CASE period_days
       WHEN 30 THEN 1 WHEN 90 THEN 3 WHEN 365 THEN 12 ELSE 0 END
     WHERE is_one_time = 0`,
    `UPDATE subscriptions SET period_day = CAST(substr(start_date, 9, 2) AS INTEGER)
     WHERE period_months > 0`,
  ],
]

/** Schema version this build creates/expects (see backup.ts). */
export const SCHEMA_VERSION = SCHEMA.length

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
      for (const stmt of statements) {
        // ALTER TABLE has no IF NOT EXISTS: a retry after a crash between the
        // ALTER and the version bump would fail on the existing column.
        const added = addedColumn(stmt)
        if (added && (await hasColumn(conn, added.table, added.column))) continue
        await conn.execute(stmt)
      }
    } catch (e) {
      log.error('migration failed', version, e)
      throw e
    }
    await conn.execute(`PRAGMA user_version = ${version + 1}`)
    version += 1
  }
}

function addedColumn(stmt: string): { table: string; column: string } | null {
  const m = /^\s*ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i.exec(stmt)
  return m ? { table: m[1], column: m[2] } : null
}

async function hasColumn(conn: Db, table: string, column: string): Promise<boolean> {
  const res = await conn.query(`PRAGMA table_info(${table})`)
  return (res.values ?? []).some((r) => String(r.name) === column)
}
