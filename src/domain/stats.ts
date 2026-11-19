import type { Category, Payment, Subscription } from '../types'
import { convertMinor } from './currency'
import { monthKey } from './dates'

// Pure statistics over already-loaded rows — no DB access so it's testable.

/** Cost of one active subscription expressed per `days` days, in minor units. */
export function perPeriodMinor(sub: Subscription, days: number, toCurrency: string): number {
  const perDay = sub.priceMinor / sub.periodDays
  return Math.round(convertMinor(perDay * days, sub.currency, toCurrency))
}

export function monthlyTotalMinor(subs: Subscription[], toCurrency: string): number {
  return subs
    .filter((s) => s.isActive)
    .reduce((acc, s) => acc + perPeriodMinor(s, 30, toCurrency), 0)
}

export function yearlyTotalMinor(subs: Subscription[], toCurrency: string): number {
  return subs
    .filter((s) => s.isActive)
    .reduce((acc, s) => acc + perPeriodMinor(s, 365, toCurrency), 0)
}

export interface CategorySlice {
  category: Category | null
  totalMinor: number
  count: number
}

/** Per-category monthly spend in `toCurrency`, descending. */
export function categoryBreakdown(
  subs: Subscription[],
  categories: Category[],
  toCurrency: string,
): CategorySlice[] {
  const map = new Map<number | null, CategorySlice>()
  for (const s of subs.filter((x) => x.isActive)) {
    const key = s.categoryId
    const slice =
      map.get(key) ??
      ({
        category: categories.find((c) => c.id === key) ?? null,
        totalMinor: 0,
        count: 0,
      } satisfies CategorySlice)
    slice.totalMinor += perPeriodMinor(s, 30, toCurrency)
    slice.count += 1
    map.set(key, slice)
  }
  return [...map.values()].sort((a, b) => b.totalMinor - a.totalMinor)
}

export interface MonthBucket {
  month: string // 'YYYY-MM'
  totalMinor: number
  count: number
}

/** Payments grouped by month for the last `months` months. */
export function paymentHistoryByMonth(
  payments: Payment[],
  toCurrency: string,
  months = 6,
): MonthBucket[] {
  const buckets = new Map<string, MonthBucket>()
  for (const p of payments) {
    const key = monthKey(p.paidDate)
    const b = buckets.get(key) ?? { month: key, totalMinor: 0, count: 0 }
    b.totalMinor += convertMinor(p.amountMinor, p.currency, toCurrency)
    b.count += 1
    buckets.set(key, b)
  }
  return [...buckets.values()].sort((a, b) => (a.month < b.month ? -1 : 1)).slice(-months)
}

/** Active subs whose next payment falls within `days` days of `todayIso`. */
export function upcomingPayments(
  subs: Subscription[],
  todayIso: string,
  days: number,
): Subscription[] {
  const horizon = addDaysLocal(todayIso, days)
  return subs
    .filter((s) => s.isActive && s.nextPaymentDate <= horizon)
    .sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate))
}

// Local copy of addDays to keep stats.ts dependency-free of Dates at module level.
function addDaysLocal(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}
