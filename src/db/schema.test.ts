// Migration tests against real SQLite (sql.js in memory): table/index DDL,
// user_version bookkeeping and foreign-key behavior (testdb enables
// PRAGMA foreign_keys like the production backends).
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from './testdb'
import { setDbForTesting, type Db } from './index'
import { migrate } from './schema'

let db: Db

const tables = async (): Promise<string[]> =>
  (
    await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  ).values!.map((r) => String(r.name))

const userVersion = async (): Promise<number> =>
  Number((await db.query('PRAGMA user_version')).values?.[0]?.user_version)

beforeEach(async () => {
  db = await makeTestDb()
  setDbForTesting(db)
})

describe('schema migrations', () => {
  it('creates all tables and indexes on a fresh database', async () => {
    await migrate(db)
    expect(await tables()).toEqual(
      expect.arrayContaining([
        'categories',
        'subscriptions',
        'payments',
        'notify_rules',
        'events',
        'settings',
      ]),
    )
    const idx = (
      await db.query("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
    ).values!.map((r) => String(r.name))
    expect(idx).toEqual(
      expect.arrayContaining(['idx_subs_active', 'idx_payments_sub', 'idx_events_created']),
    )
  })

  it('bumps user_version and is idempotent', async () => {
    expect(await userVersion()).toBe(0)
    await migrate(db)
    const v = await userVersion()
    expect(v).toBeGreaterThanOrEqual(1)
    await migrate(db)
    await migrate(db)
    expect(await userVersion()).toBe(v)
    expect(await tables()).toContain('subscriptions')
  })

  it('cascades payments and notify_rules on subscription delete', async () => {
    await migrate(db)
    await db.run(
      `INSERT INTO subscriptions (name, price_minor, currency, period_days, start_date,
        next_payment_date, created_at, updated_at) VALUES ('S',100,'RUB',30,'2026-01-01','2026-01-01','t','t')`,
    )
    await db.run(
      "INSERT INTO payments (subscription_id, amount_minor, currency, paid_date, created_at) VALUES (1,100,'RUB','2026-01-01','t')",
    )
    await db.run(
      "INSERT INTO notify_rules (subscription_id, kind, created_at) VALUES (1,'advance','t')",
    )
    await db.run("INSERT INTO events (subscription_id, type, created_at) VALUES (1,'created','t')")
    await db.run('DELETE FROM subscriptions WHERE id=1')
    expect((await db.query('SELECT * FROM payments')).values).toHaveLength(0)
    expect((await db.query('SELECT * FROM notify_rules')).values).toHaveLength(0)
    // events keep history but lose the reference (ON DELETE SET NULL)
    const ev = (await db.query('SELECT * FROM events')).values![0]
    expect(ev.subscription_id).toBeNull()
  })

  it('sets subscriptions.category_id to NULL on category delete', async () => {
    await migrate(db)
    await db.run("INSERT INTO categories (name, created_at) VALUES ('C','t')")
    await db.run(
      `INSERT INTO subscriptions (name, price_minor, currency, period_days, start_date,
        next_payment_date, category_id, created_at, updated_at)
       VALUES ('S',100,'RUB',30,'2026-01-01','2026-01-01',1,'t','t')`,
    )
    await db.run('DELETE FROM categories WHERE id=1')
    const row = (await db.query('SELECT category_id FROM subscriptions')).values![0]
    expect(row.category_id).toBeNull()
  })

  it('rejects payments for a missing subscription (FK enforced)', async () => {
    await migrate(db)
    await expect(
      db.run(
        "INSERT INTO payments (subscription_id, amount_minor, currency, paid_date, created_at) VALUES (42,100,'RUB','2026-01-01','t')",
      ),
    ).rejects.toThrow()
  })
})
