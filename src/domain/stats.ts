import type { Category, Payment, Subscription } from '../types'
import { convertMinor } from './currency'
import { monthKey } from './dates'

// Pure statistics over already-loaded rows — no DB access so it's testable.

/** Cost of one active subscription expressed per `days` days, in minor units. */
export function perPeriodMinor(sub: Subscription, days: number, toCurrency: string): number {
  // One-time purchases have no run rate — they only show up in payment history.
  if (sub.isOneTime || sub.periodDays <= 0) return 0
  const perDay = sub.priceMinor / sub.periodDays
  return Math.round(convertMinor(perDay * days, sub.currency, toCurrency))
}

/** Price converted into `toCurrency` (integer minor units). */
function priceIn(sub: Subscription, toCurrency: string): number {
  return convertMinor(sub.priceMinor, sub.currency, toCurrency)
}

/**
 * Monthly run rate of one subscription, in minor units. Calendar periods
 * (monthly / quarterly / yearly) divide exactly — a 30-day approximation
 * would turn «ежемесячно» into 365/30 = 12.17 charges a year and produce
 * kopecks that don't exist. Day-based periods (weekly, custom) keep the
 * `periodDays` normalization.
 */
export function monthlyCostMinor(sub: Subscription, toCurrency: string): number {
  if (sub.isOneTime || sub.periodDays <= 0) return 0
  if (sub.periodMonths > 0) return Math.round(priceIn(sub, toCurrency) / sub.periodMonths)
  return perPeriodMinor(sub, 30, toCurrency)
}

/** Yearly run rate of one subscription, in minor units (see `monthlyCostMinor`). */
export function yearlyCostMinor(sub: Subscription, toCurrency: string): number {
  if (sub.isOneTime || sub.periodDays <= 0) return 0
  if (sub.periodMonths > 0) return Math.round((priceIn(sub, toCurrency) * 12) / sub.periodMonths)
  return perPeriodMinor(sub, 365, toCurrency)
}

export function monthlyTotalMinor(subs: Subscription[], toCurrency: string): number {
  return subs
    .filter((s) => s.isActive && !s.isOneTime)
    .reduce((acc, s) => acc + monthlyCostMinor(s, toCurrency), 0)
}

export function yearlyTotalMinor(subs: Subscription[], toCurrency: string): number {
  return subs
    .filter((s) => s.isActive && !s.isOneTime)
    .reduce((acc, s) => acc + yearlyCostMinor(s, toCurrency), 0)
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
  for (const s of subs.filter((x) => x.isActive && !x.isOneTime)) {
    const key = s.categoryId
    const slice =
      map.get(key) ??
      ({
        category: categories.find((c) => c.id === key) ?? null,
        totalMinor: 0,
        count: 0,
      } satisfies CategorySlice)
    slice.totalMinor += monthlyCostMinor(s, toCurrency)
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
