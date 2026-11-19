// Integration tests against real SQLite (sql.js in memory). Payment rows are
// created through markPaid — there is no standalone payments insert API.
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'
import { createSubscription, markPaid } from './subscriptions'
import { listPayments } from './payments'

const input = (name: string) => ({
  name,
  priceMinor: 50000,
  currency: 'RUB',
  periodDays: 30,
  startDate: '2026-01-01',
  nextPaymentDate: '2026-01-01',
})

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
})

describe('payments (sqlite)', () => {
  it('starts empty', async () => {
    expect(await listPayments()).toEqual([])
  })

  it('lists all payments newest paid_date first', async () => {
    const s = await createSubscription(input('A'))
    await markPaid(s.id, '2026-01-05')
    await markPaid(s.id, '2026-03-10')
    await markPaid(s.id, '2026-02-01')
    const pays = await listPayments()
    expect(pays.map((p) => p.paidDate)).toEqual(['2026-03-10', '2026-02-01', '2026-01-05'])
    expect(pays[0].amountMinor).toBe(50000)
    expect(pays[0].currency).toBe('RUB')
    expect(pays[0].subscriptionId).toBe(s.id)
  })

  it('filters by subscription', async () => {
    const a = await createSubscription(input('A'))
    const b = await createSubscription(input('B'))
    await markPaid(a.id, '2026-01-05')
    await markPaid(b.id, '2026-01-06')
    await markPaid(a.id, '2026-02-05')
    const paysA = await listPayments(a.id)
    expect(paysA).toHaveLength(2)
    expect(paysA.every((p) => p.subscriptionId === a.id)).toBe(true)
    expect(await listPayments(b.id)).toHaveLength(1)
    expect(await listPayments(999)).toHaveLength(0)
  })
})
