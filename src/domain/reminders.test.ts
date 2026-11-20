import { describe, expect, it } from 'vitest'
import {
  MAX_OCCURRENCES_PER_RULE,
  computeReminders,
  fireDate,
  sendTestNotification,
} from './reminders'
import type { NotifyRule, Subscription } from '../types'

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 1,
  name: 'Netflix',
  priceMinor: 99900,
  currency: 'RUB',
  periodDays: 30,
  isOneTime: false,
  startDate: '2026-01-15',
  nextPaymentDate: '2026-03-15',
  icon: '🎬',
  iconColor: null,
  isActive: true,
  reminderEnabled: true,
  categoryId: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

const rule = (over: Partial<NotifyRule> = {}): NotifyRule => ({
  id: 1,
  subscriptionId: 1,
  kind: 'advance',
  daysBefore: 1,
  atTime: '10:00',
  intervalHours: null,
  enabled: true,
  createdAt: '',
  ...over,
})

const NOW = new Date(2026, 2, 10, 12, 0, 0) // 2026-03-10 12:00 local

describe('reminders', () => {
  it('fires an advance rule N days before at the set time', () => {
    const out = computeReminders([sub()], [rule()], NOW)
    expect(out[0].fireAt).toEqual(new Date(2026, 2, 14, 10, 0, 0))
    expect(out[0].body).toContain('Netflix')
  })

  it('fires a payment_day rule on the payment date', () => {
    const out = computeReminders([sub()], [rule({ kind: 'payment_day', atTime: '09:30' })], NOW)
    expect(out[0].fireAt).toEqual(new Date(2026, 2, 15, 9, 30, 0))
  })

  it('fires a recurring rule one interval from now', () => {
    const out = computeReminders([sub()], [rule({ kind: 'recurring', intervalHours: 6 })], NOW)
    expect(out[0].fireAt.getTime()).toBe(NOW.getTime() + 6 * 3600000)
  })

  it('schedules a whole window of occurrences per rule', () => {
    const out = computeReminders([sub()], [rule()], NOW)
    expect(out).toHaveLength(MAX_OCCURRENCES_PER_RULE)
    // 12 monthly payments ≈ a year ahead, all strictly in the future.
    expect(out.every((r) => r.fireAt.getTime() > NOW.getTime())).toBe(true)
    const last = out[out.length - 1]
    expect(last.fireAt.getTime()).toBeGreaterThan(NOW.getTime() + 300 * 86400000)
  })

  it('uses each occurrence payment date in the body', () => {
    const out = computeReminders([sub()], [rule()], NOW)
    // second monthly payment is 2026-04-14, reminded a day earlier
    expect(out[1].fireAt).toEqual(new Date(2026, 3, 13, 10, 0, 0))
    expect(out[1].body).toContain('2026-04-14')
    expect(out[1].body).toContain('завтра')
  })

  it('skips occurrences whose fire time is already past', () => {
    // advance 10 days before 2026-03-15 → 2026-03-05, before NOW → skipped
    const out = computeReminders([sub()], [rule({ daysBefore: 10 })], NOW)
    expect(out[0].fireAt).toEqual(new Date(2026, 3, 4, 10, 0, 0))
    expect(out.every((r) => r.fireAt.getTime() > NOW.getTime())).toBe(true)
  })

  it('schedules nothing for a past one-time purchase', () => {
    const oneTime = sub({ isOneTime: true, startDate: '2026-03-01', nextPaymentDate: '2026-03-01' })
    expect(computeReminders([oneTime], [rule()], NOW)).toHaveLength(0)
  })

  it('does not duplicate a reminder when two rules fire at the same instant', () => {
    const rules = [
      rule({ id: 1, kind: 'advance', daysBefore: 0 }),
      rule({ id: 2, kind: 'payment_day' }),
    ]
    const out = computeReminders([sub()], rules, NOW)
    expect(out).toHaveLength(MAX_OCCURRENCES_PER_RULE)
  })

  it('skips inactive subs, reminder-disabled subs and disabled rules', () => {
    expect(computeReminders([sub({ isActive: false })], [rule()], NOW)).toHaveLength(0)
    expect(computeReminders([sub({ reminderEnabled: false })], [rule()], NOW)).toHaveLength(0)
    expect(computeReminders([sub()], [rule({ enabled: false })], NOW)).toHaveLength(0)
  })

  it('produces deterministic unique ids per rule/date', () => {
    const rules = [rule({ id: 1 }), rule({ id: 2, daysBefore: 3 })]
    const a = computeReminders([sub()], rules, NOW)
    const b = computeReminders([sub()], rules, NOW)
    expect(a.map((r) => r.id)).toEqual(b.map((r) => r.id))
    expect(new Set(a.map((r) => r.id)).size).toBe(a.length)
  })

  it('orders reminders by fire time', () => {
    const subs = [sub({ id: 1 }), sub({ id: 2, nextPaymentDate: '2026-03-20' })]
    const out = computeReminders(
      subs,
      [rule({ daysBefore: 0 }), rule({ id: 2, subscriptionId: 2, daysBefore: 0 })],
      NOW,
    )
    const times = out.map((r) => r.fireAt.getTime())
    expect([...times].sort((x, y) => x - y)).toEqual(times)
  })

  it('falls back to the default notification time', () => {
    expect(fireDate('2026-03-15', null).getHours()).toBe(10)
    expect(fireDate('2026-03-15', '07:45').getHours()).toBe(7)
  })

  it('sendTestNotification is a no-op off native platforms', async () => {
    expect(await sendTestNotification()).toBe('web')
  })
})
