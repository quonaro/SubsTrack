import { describe, expect, it } from 'vitest'
import {
  categoryBreakdown,
  monthlyCostMinor,
  monthlyTotalMinor,
  paymentHistoryByMonth,
  perPeriodMinor,
  upcomingPayments,
  yearlyCostMinor,
  yearlyTotalMinor,
} from './stats'
import type { Category, Payment, Subscription } from '../types'
import { ONE_TIME_PERIOD_DAYS } from './dates'

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 1,
  name: 'Test',
  priceMinor: 30000,
  currency: 'RUB',
  periodDays: 30,
  periodMonths: 0,
  periodDay: 0,
  isOneTime: false,
  startDate: '2026-01-01',
  nextPaymentDate: '2026-03-01',
  icon: '📦',
  iconColor: null,
  isActive: true,
  reminderEnabled: true,
  categoryId: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

describe('stats', () => {
  it('treats calendar periods as exact months, not 30-day slices', () => {
    // 315 RUB monthly → exactly 315/month, 3780/year (not 315 * 365/30)
    expect(monthlyCostMinor(sub({ priceMinor: 31500, periodMonths: 1 }), 'RUB')).toBe(31500)
    expect(yearlyCostMinor(sub({ priceMinor: 31500, periodMonths: 1 }), 'RUB')).toBe(378000)
    // quarterly 900 RUB → 300/month, 3600/year
    expect(
      monthlyCostMinor(sub({ priceMinor: 90000, periodDays: 90, periodMonths: 3 }), 'RUB'),
    ).toBe(30000)
    // yearly 1200 RUB → 100/month, 1200/year
    expect(
      monthlyCostMinor(sub({ priceMinor: 120000, periodDays: 365, periodMonths: 12 }), 'RUB'),
    ).toBe(10000)
    expect(
      yearlyCostMinor(sub({ priceMinor: 120000, periodDays: 365, periodMonths: 12 }), 'RUB'),
    ).toBe(120000)
  })

  it('multiplies monthly subs by 12 without kopecks in the yearly total', () => {
    // The bug: 47800/month was reported as 581556.66/year (47800 * 365/30).
    const prices = [
      3150000, 200000, 170000, 150000, 70000, 40000, 50000, 50000, 60000, 40000, 800000,
    ]
    const subs = prices.map((priceMinor, i) =>
      sub({ id: i + 1, priceMinor, periodDays: 30, periodMonths: 1 }),
    )
    expect(monthlyTotalMinor(subs, 'RUB')).toBe(4780000)
    expect(yearlyTotalMinor(subs, 'RUB')).toBe(4780000 * 12)
  })

  it('normalizes any period to a monthly cost', () => {
    // 300 RUB / 30 days → 300 RUB/month
    expect(perPeriodMinor(sub(), 30, 'RUB')).toBe(30000)
    // weekly 100 RUB → ~428.57 RUB per 30 days
    expect(perPeriodMinor(sub({ periodDays: 7, priceMinor: 10000 }), 30, 'RUB')).toBe(42857)
    // yearly 1200 RUB → 100 RUB/month
    expect(perPeriodMinor(sub({ periodDays: 365, priceMinor: 120000 }), 30, 'RUB')).toBe(9863)
  })

  it('sums monthly total only for active subs', () => {
    const subs = [
      sub({ id: 1, priceMinor: 30000 }),
      sub({ id: 2, priceMinor: 10000, isActive: false }),
    ]
    expect(monthlyTotalMinor(subs, 'RUB')).toBe(30000)
  })

  it('leaves one-time purchases out of the recurring run rate', () => {
    const oneTime = sub({
      id: 2,
      priceMinor: 500000,
      isOneTime: true,
      periodDays: ONE_TIME_PERIOD_DAYS,
    })
    expect(perPeriodMinor(oneTime, 30, 'RUB')).toBe(0)
    const subs = [sub({ id: 1, priceMinor: 30000 }), oneTime]
    expect(monthlyTotalMinor(subs, 'RUB')).toBe(30000)
    expect(yearlyTotalMinor(subs, 'RUB')).toBe(365000)
  })

  it('converts totals into the base currency', () => {
    // 95 USD/month at 95 RUB/USD → 9025 RUB/month
    const total = monthlyTotalMinor([sub({ currency: 'USD', priceMinor: 9500 })], 'RUB')
    expect(total).toBe(902500)
  })

  it('groups spend by category, descending', () => {
    const cats: Category[] = [
      { id: 1, name: 'A', color: '#000', icon: '', createdAt: '' },
      { id: 2, name: 'B', color: '#000', icon: '', createdAt: '' },
    ]
    const subs = [
      sub({ id: 1, categoryId: 1, priceMinor: 10000 }),
      sub({ id: 2, categoryId: 2, priceMinor: 60000 }),
      sub({ id: 3, categoryId: null, priceMinor: 30000 }),
      sub({ id: 4, categoryId: 1, priceMinor: 5000, isActive: false }),
      sub({
        id: 5,
        categoryId: 2,
        priceMinor: 500000,
        isOneTime: true,
        periodDays: ONE_TIME_PERIOD_DAYS,
      }),
    ]
    const bd = categoryBreakdown(subs, cats, 'RUB')
    expect(bd[0].category?.id).toBe(2)
    expect(bd[0].totalMinor).toBe(60000)
    expect(bd[1].category).toBeNull()
    expect(bd[1].totalMinor).toBe(30000)
    expect(bd[2].category?.id).toBe(1)
    expect(bd[2].totalMinor).toBe(10000)
    expect(bd[2].count).toBe(1)
  })

  it('buckets payments by month', () => {
    const pays: Payment[] = [
      {
        id: 1,
        subscriptionId: 1,
        amountMinor: 10000,
        currency: 'RUB',
        paidDate: '2026-01-05',
        createdAt: '',
      },
      {
        id: 2,
        subscriptionId: 1,
        amountMinor: 10000,
        currency: 'RUB',
        paidDate: '2026-01-20',
        createdAt: '',
      },
      {
        id: 3,
        subscriptionId: 1,
        amountMinor: 5000,
        currency: 'USD',
        paidDate: '2026-02-03',
        createdAt: '',
      },
    ]
    const buckets = paymentHistoryByMonth(pays, 'RUB', 6)
    expect(buckets).toHaveLength(2)
    expect(buckets[0].month).toBe('2026-01')
    expect(buckets[0].totalMinor).toBe(20000)
    expect(buckets[0].count).toBe(2)
    // 50 USD → 4750 RUB
    expect(buckets[1].totalMinor).toBe(475000)
  })

  it('finds upcoming payments within the horizon', () => {
    const subs = [
      sub({ id: 1, nextPaymentDate: '2026-03-03' }),
      sub({ id: 2, nextPaymentDate: '2026-03-10' }),
      sub({ id: 3, nextPaymentDate: '2026-03-01', isActive: false }),
      sub({ id: 4, nextPaymentDate: '2026-02-28' }), // overdue still counts
    ]
    const up = upcomingPayments(subs, '2026-03-01', 7)
    // horizon = 2026-03-08: id 2 is beyond it, id 3 is archived → [4, 1]
    expect(up.map((s) => s.id)).toEqual([4, 1])
  })
})
