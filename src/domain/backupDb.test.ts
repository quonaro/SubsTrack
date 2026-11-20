import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'
import { createCategory } from './categories'
import { createSubscription, listSubscriptions, markPaid } from './subscriptions'
import { listPayments } from './payments'
import { replaceRules, listRules } from './rules'
import { dumpTables, replaceTables } from './backupDb'

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
})

async function seed(): Promise<void> {
  const cat = await createCategory({ name: 'Кино', icon: 'film', color: '#f15a24' })
  const sub = await createSubscription({
    name: 'Netflix',
    priceMinor: 99900,
    currency: 'RUB',
    periodDays: 30,
    startDate: '2026-01-01',
    nextPaymentDate: '2026-02-01',
    icon: 'film',
    categoryId: cat.id,
  })
  await markPaid(sub.id, '2026-02-01')
  await replaceRules(sub.id, [{ kind: 'advance', daysBefore: 3, atTime: '10:00' }])
}

describe('dumpTables', () => {
  it('returns every table, settings included', async () => {
    await seed()
    const dump = await dumpTables()
    expect(Object.keys(dump).sort()).toEqual([
      'categories',
      'events',
      'notify_rules',
      'payments',
      'settings',
      'subscriptions',
    ])
    expect(dump.categories).toHaveLength(1)
    expect(dump.subscriptions).toHaveLength(1)
    expect(dump.payments).toHaveLength(1)
    expect(dump.notify_rules).toHaveLength(1)
  })

  it('is stable across two calls', async () => {
    await seed()
    expect(await dumpTables()).toEqual(await dumpTables())
  })
})

describe('replaceTables', () => {
  it('round-trips the whole database', async () => {
    await seed()
    const dump = await dumpTables()

    await replaceTables({})
    expect(await listSubscriptions(true)).toHaveLength(0)
    expect(await listPayments()).toHaveLength(0)

    await replaceTables(dump)
    const subs = await listSubscriptions(true)
    expect(subs).toHaveLength(1)
    expect(subs[0].name).toBe('Netflix')
    expect(subs[0].priceMinor).toBe(99900)
    expect(await listPayments()).toHaveLength(1)
    expect(await listRules()).toHaveLength(1)
    expect(await dumpTables()).toEqual(dump)
  })

  it('restores rows in FK order and keeps ids', async () => {
    await seed()
    const dump = await dumpTables()
    await replaceTables({})
    await replaceTables(dump)
    const sub = (await listSubscriptions(true))[0]
    expect(sub.id).toBe(dump.subscriptions?.[0].id)
    expect(sub.categoryId).toBe(dump.categories?.[0].id)
  })

  it('drops columns this build does not know and defaults missing ones', async () => {
    await seed()
    const dump = await dumpTables()
    const sub = { ...dump.subscriptions?.[0] }
    delete sub.icon_color
    sub.future_column = 'ignored'
    await replaceTables({ categories: dump.categories, subscriptions: [sub] })
    const restored = (await listSubscriptions(true))[0]
    expect(restored.name).toBe('Netflix')
    expect(restored.iconColor).toBeNull()
  })

  it('rejects a row missing a required column', async () => {
    await expect(replaceTables({ settings: [{ key: 'theme' }] })).rejects.toThrow(/settings\.value/)
  })

  it('rejects a section made of unknown fields only', async () => {
    await expect(replaceTables({ categories: [{ nope: 1 }] })).rejects.toThrow(
      /нет известных полей/,
    )
  })

  it('keeps the current data when the copy violates a foreign key', async () => {
    await seed()
    await expect(
      replaceTables({
        payments: [
          {
            id: 1,
            subscription_id: 999,
            amount_minor: 1,
            currency: 'RUB',
            paid_date: '2026-02-01',
            created_at: '2026-02-01T00:00:00.000Z',
          },
        ],
      }),
    ).rejects.toThrow(/Не удалось применить копию/)
    expect(await listPayments()).toHaveLength(1)
    expect(await listSubscriptions(true)).toHaveLength(1)
  })
})
