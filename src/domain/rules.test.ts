// Integration tests against real SQLite (sql.js in memory).
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'
import { createSubscription } from './subscriptions'
import { createRule, deleteRule, listRules, replaceRules } from './rules'

const input = (name: string) => ({
  name,
  priceMinor: 10000,
  currency: 'RUB',
  periodDays: 30,
  startDate: '2026-01-01',
  nextPaymentDate: '2026-01-01',
})

let subId = 0
let otherId = 0

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
  subId = (await createSubscription(input('A'))).id
  otherId = (await createSubscription(input('B'))).id
})

describe('rules (sqlite)', () => {
  it('creates a rule with explicit fields and enabled by default', async () => {
    const r = await createRule({
      subscriptionId: subId,
      kind: 'advance',
      daysBefore: 3,
      atTime: '08:30',
    })
    expect(r.id).toBeGreaterThan(0)
    expect(r.subscriptionId).toBe(subId)
    expect(r.kind).toBe('advance')
    expect(r.daysBefore).toBe(3)
    expect(r.atTime).toBe('08:30')
    expect(r.enabled).toBe(true)
  })

  it('nulls out unused fields per kind', async () => {
    const r = await createRule({ subscriptionId: subId, kind: 'recurring', intervalHours: 6 })
    expect(r.intervalHours).toBe(6)
    expect(r.daysBefore).toBeNull()
    expect(r.atTime).toBeNull()
  })

  it('lists rules globally or per subscription', async () => {
    await createRule({ subscriptionId: subId, kind: 'payment_day', atTime: '09:00' })
    await createRule({ subscriptionId: otherId, kind: 'payment_day', atTime: '09:00' })
    expect(await listRules()).toHaveLength(2)
    const mine = await listRules(subId)
    expect(mine).toHaveLength(1)
    expect(mine[0].subscriptionId).toBe(subId)
  })

  it('deletes a single rule', async () => {
    const r = await createRule({ subscriptionId: subId, kind: 'payment_day', atTime: '09:00' })
    await deleteRule(r.id)
    expect(await listRules(subId)).toHaveLength(0)
  })

  it('replaceRules swaps the whole set, including down to empty', async () => {
    await replaceRules(subId, [
      { kind: 'advance', daysBefore: 1, atTime: '10:00' },
      { kind: 'payment_day', atTime: '09:00' },
    ])
    expect(await listRules(subId)).toHaveLength(2)
    await replaceRules(subId, [])
    expect(await listRules(subId)).toHaveLength(0)
    // other subscription untouched
    await replaceRules(subId, [{ kind: 'recurring', intervalHours: 24 }])
    expect(await listRules(otherId)).toHaveLength(0)
  })
})
