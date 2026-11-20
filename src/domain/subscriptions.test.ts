// Integration tests against real SQLite (sql.js in memory) — exercises the
// migrations plus the CRUD/payment/event flows end to end.
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'
import {
  cancelPayment,
  createSubscription,
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  markPaid,
  setActive,
  updateSubscription,
} from './subscriptions'
import { listEvents } from './events'
import { listPayments } from './payments'
import { ONE_TIME_PERIOD_DAYS } from './dates'
import { listRules, replaceRules } from './rules'
import { listCategories, seedCategoriesIfEmpty } from './categories'
import { getSetting, setSetting } from './settings'

const input = () => ({
  name: 'Netflix',
  priceMinor: 99900,
  currency: 'RUB',
  periodDays: 30,
  startDate: '2026-03-01',
  nextPaymentDate: '2026-03-01',
  icon: '🎬',
  categoryId: null,
  notes: null,
})

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
})

describe('subscriptions (sqlite)', () => {
  it('runs migrations to the latest version', async () => {
    const db = await makeTestDb()
    await migrate(db)
    const res = await db.query('PRAGMA user_version')
    expect(Number(res.values?.[0]?.user_version)).toBeGreaterThanOrEqual(1)
    // second migrate is a no-op
    await migrate(db)
  })

  it('creates and reads back a subscription with a created event', async () => {
    const s = await createSubscription(input())
    expect(s.id).toBeGreaterThan(0)
    expect(s.name).toBe('Netflix')
    const back = await getSubscription(s.id)
    expect(back?.priceMinor).toBe(99900)
    const events = await listEvents()
    expect(events[0].type).toBe('created')
    expect(events[0].subscriptionId).toBe(s.id)
  })

  it('stores the icon color and clears it back to inherit', async () => {
    const s = await createSubscription({ ...input(), iconColor: '#a855f7' })
    expect(s.iconColor).toBe('#a855f7')
    expect((await getSubscription(s.id))?.iconColor).toBe('#a855f7')
    const cleared = await updateSubscription(s.id, { iconColor: null })
    expect(cleared?.iconColor).toBeNull()
    const ev = (await listEvents()).find((e) => e.type === 'updated')
    expect(JSON.parse(ev!.payload!).changes.iconColor).toEqual({ from: '#a855f7', to: null })
  })

  it('updates a subscription and records changed fields', async () => {
    const s = await createSubscription(input())
    const upd = await updateSubscription(s.id, { name: 'Netflix Premium', priceMinor: 129900 })
    expect(upd?.name).toBe('Netflix Premium')
    expect(upd?.priceMinor).toBe(129900)
    const events = await listEvents()
    const updEv = events.find((e) => e.type === 'updated')
    expect(updEv).toBeTruthy()
    const payload = JSON.parse(updEv!.payload!)
    expect(payload.changes.name.to).toBe('Netflix Premium')
  })

  it('archives and restores, hiding archived from the default list', async () => {
    const s = await createSubscription(input())
    await setActive(s.id, false)
    expect(await listSubscriptions()).toHaveLength(0)
    expect(await listSubscriptions(true)).toHaveLength(1)
    await setActive(s.id, true)
    expect(await listSubscriptions()).toHaveLength(1)
    const types = (await listEvents()).map((e) => e.type)
    expect(types).toContain('archived')
    expect(types).toContain('restored')
  })

  it('marks a payment: inserts a row, advances the date, logs the event', async () => {
    const s = await createSubscription(input()) // next: 2026-03-01
    const next = await markPaid(s.id, '2026-03-01')
    expect(next?.nextPaymentDate).toBe('2026-03-31')
    const pays = await listPayments(s.id)
    expect(pays).toHaveLength(1)
    expect(pays[0].amountMinor).toBe(99900)
    const ev = (await listEvents()).find((e) => e.type === 'payment')
    expect(ev).toBeTruthy()
  })

  it('skips missed periods when paying late', async () => {
    const s = await createSubscription({
      ...input(),
      nextPaymentDate: '2026-01-01',
      startDate: '2026-01-01',
    })
    const next = await markPaid(s.id, '2026-03-10')
    // next candidate strictly after 2026-03-10 stepping 30d from 2026-01-01:
    // 2026-03-02 is before, 2026-04-01 is after.
    expect(next?.nextPaymentDate).toBe('2026-04-01')
  })

  it('cancels the latest payment mark and restores the previous next date', async () => {
    const s = await createSubscription(input()) // next: 2026-03-01
    await markPaid(s.id, '2026-03-10')
    const [pay] = await listPayments(s.id)
    const ev = (await listEvents()).find((e) => e.type === 'payment')
    const payload = JSON.parse(ev!.payload!) as Record<string, unknown>
    expect(payload.paymentId).toBe(pay.id)
    expect(payload.prevNextPaymentDate).toBe('2026-03-01')

    const restored = await cancelPayment(pay.id, String(payload.prevNextPaymentDate))
    expect(restored?.nextPaymentDate).toBe('2026-03-01')
    expect(await listPayments(s.id)).toHaveLength(0)
    const types = (await listEvents()).map((e) => e.type)
    expect(types).toContain('payment_cancelled')
  })

  it('refuses to cancel an older mark of the same subscription', async () => {
    const s = await createSubscription(input())
    await markPaid(s.id, '2026-03-01')
    await markPaid(s.id, '2026-03-31')
    const pays = await listPayments(s.id)
    const older = pays.find((p) => p.paidDate === '2026-03-01')!
    expect(await cancelPayment(older.id)).toBeNull()
    expect(await listPayments(s.id)).toHaveLength(2)
  })

  it('cancelling a one-time mark brings the purchase back into the list', async () => {
    const s = await createSubscription({
      ...input(),
      periodDays: ONE_TIME_PERIOD_DAYS,
      isOneTime: true,
      nextPaymentDate: '2026-03-15',
    })
    await markPaid(s.id, '2026-03-15')
    expect(await listSubscriptions()).toHaveLength(0)
    const [pay] = await listPayments(s.id)
    const restored = await cancelPayment(pay.id)
    expect(restored?.isActive).toBe(true)
    expect(restored?.nextPaymentDate).toBe('2026-03-15')
    expect(await listSubscriptions()).toHaveLength(1)
    expect(await listPayments(s.id)).toHaveLength(0)
  })

  it('archives a one-time purchase after payment instead of rolling it', async () => {
    const s = await createSubscription({
      ...input(),
      periodDays: ONE_TIME_PERIOD_DAYS,
      isOneTime: true,
      nextPaymentDate: '2026-03-15',
    })
    expect(s.isOneTime).toBe(true)
    const after = await markPaid(s.id, '2026-03-15')
    expect(after?.isActive).toBe(false)
    // no roll — the paid date stays the anchor
    expect(after?.nextPaymentDate).toBe('2026-03-15')
    expect(await listSubscriptions()).toHaveLength(0)
    expect(await listSubscriptions(true)).toHaveLength(1)
    expect(await listPayments(s.id)).toHaveLength(1)
    const ev = (await listEvents()).find((e) => e.type === 'payment')
    expect(JSON.parse(ev!.payload!).archived).toBe(true)
  })

  it('clears the one-time flag when a purchase becomes recurring', async () => {
    const s = await createSubscription({ ...input(), isOneTime: true })
    const upd = await updateSubscription(s.id, { isOneTime: false, periodDays: 30 })
    expect(upd?.isOneTime).toBe(false)
  })

  it('deletes a subscription and nulls out history references', async () => {
    const s = await createSubscription(input())
    await markPaid(s.id, '2026-03-01')
    await replaceRules(s.id, [{ kind: 'advance', daysBefore: 1, atTime: '10:00' }])
    await deleteSubscription(s.id)
    expect(await getSubscription(s.id)).toBeNull()
    expect(await listRules(s.id)).toHaveLength(0)
    const events = await listEvents()
    expect(events.some((e) => e.type === 'deleted')).toBe(true)
  })

  it('replaces notification rules atomically', async () => {
    const s = await createSubscription(input())
    await replaceRules(s.id, [
      { kind: 'advance', daysBefore: 1, atTime: '10:00' },
      { kind: 'payment_day', atTime: '09:00' },
    ])
    let rules = await listRules(s.id)
    expect(rules).toHaveLength(2)
    await replaceRules(s.id, [{ kind: 'recurring', intervalHours: 12 }])
    rules = await listRules(s.id)
    expect(rules).toHaveLength(1)
    expect(rules[0].kind).toBe('recurring')
    expect(rules[0].intervalHours).toBe(12)
  })

  it('seeds default categories exactly once', async () => {
    await seedCategoriesIfEmpty()
    const cats = await listCategories()
    expect(cats.length).toBeGreaterThanOrEqual(5)
    await seedCategoriesIfEmpty()
    expect(await listCategories()).toHaveLength(cats.length)
  })

  it('persists settings', async () => {
    expect(await getSetting('baseCurrency')).toBe('RUB')
    await setSetting('baseCurrency', 'USD')
    expect(await getSetting('baseCurrency')).toBe('USD')
    expect(await getSetting('theme')).toBe('dark')
  })
})
