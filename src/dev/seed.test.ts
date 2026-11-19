// The seeder runs against real SQLite (sql.js in memory) — verifies the demo
// batch inserts cleanly, covers the intended edge cases and is re-runnable.
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'
import { seedDemoData } from './seed'
import { SUBS, EXTRA_CATEGORIES } from './seed-data'
import { listSubscriptions } from '../domain/subscriptions'
import { listCategories, seedCategoriesIfEmpty } from '../domain/categories'
import { listPayments } from '../domain/payments'
import { listRules } from '../domain/rules'
import { listEvents } from '../domain/events'
import { todayIso } from '../domain/dates'

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
})

describe('seedDemoData (sqlite)', () => {
  it('creates the full demo batch: subs, categories, payments, rules, events', async () => {
    const { subs } = await seedDemoData()
    expect(subs).toBe(SUBS.length)

    const all = await listSubscriptions(true)
    expect(all).toHaveLength(SUBS.length)

    const cats = await listCategories()
    for (const c of EXTRA_CATEGORIES) {
      expect(cats.some((x) => x.name === c.name)).toBe(true)
    }

    const payments = await listPayments()
    expect(payments.length).toBe(SUBS.reduce((n, s) => n + (s.history ?? 0), 0))

    const rules = await listRules()
    expect(rules.length).toBe(SUBS.reduce((n, s) => n + (s.rules?.length ?? 0), 0))
    expect(rules.map((r) => r.kind)).toEqual(
      expect.arrayContaining(['advance', 'payment_day', 'recurring']),
    )

    const events = await listEvents(1000)
    // created event per sub + one payment event per history row
    expect(events.length).toBe(SUBS.length + payments.length)
  })

  it('covers the edge cases meant for bug-hunting', async () => {
    await seedDemoData()
    const all = await listSubscriptions(true)
    const today = todayIso()

    expect(all.some((s) => !s.isActive)).toBe(true) // archived
    expect(all.some((s) => s.nextPaymentDate < today && s.isActive)).toBe(true) // overdue
    expect(all.some((s) => !s.reminderEnabled)).toBe(true)
    expect(all.some((s) => s.categoryId === null)).toBe(true)
    expect(new Set(all.map((s) => s.currency)).size).toBeGreaterThanOrEqual(5)
    expect(all.some((s) => s.periodDays === 1)).toBe(true) // daily
    expect(all.some((s) => s.name.includes('<'))).toBe(true) // hostile string
    expect(all.some((s) => s.startDate === '2024-02-29')).toBe(true) // leap day
  })

  it('can be run twice without constraint errors', async () => {
    await seedCategoriesIfEmpty()
    await seedDemoData()
    const catsBefore = (await listCategories()).length
    await seedDemoData()
    // Categories dedupe by name; subscriptions intentionally duplicate.
    expect((await listCategories()).length).toBe(catsBefore)
    expect(await listSubscriptions(true)).toHaveLength(SUBS.length * 2)
  })
})
