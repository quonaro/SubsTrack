// Pure date helpers. All calendar dates are ISO 'YYYY-MM-DD' strings in the
// device-local timezone; timestamps are ISO datetimes.
import { pluralRu } from './plural'

export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now)
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export function diffDays(aIso: string, bIso: string): number {
  return Math.round((parseIsoDate(aIso).getTime() - parseIsoDate(bIso).getTime()) / 86400000)
}

export function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10))
}

/**
 * `months` calendar months after `iso`, keeping day-of-month `day` and clamping
 * it to the last day of the target month (31 Jan + 1 month → 28 Feb).
 *
 * The day is an explicit argument because a clamped occurrence must not drag
 * the rest of the schedule with it: stepping from 28 Feb has to land on 31 Mar
 * for a subscription anchored on the 31st.
 */
export function addMonthsOnDay(iso: string, months: number, day = dayOfMonth(iso)): string {
  const [y, m] = iso.split('-').map(Number)
  const target = new Date(y, m - 1 + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(Math.max(1, day), lastDay))
  return toIsoDate(target)
}

/**
 * One schedule step. A month-based period (monthly = 1, quarterly = 3, yearly =
 * 12) keeps `periodDay`, so "каждый месяц" means the same day of the month
 * instead of "every 30 days", which drifts.
 */
export function stepPeriod(
  iso: string,
  periodDays: number,
  periodMonths = 0,
  periodDay = 0,
): string {
  if (periodMonths > 0) return addMonthsOnDay(iso, periodMonths, periodDay || dayOfMonth(iso))
  return addDays(iso, Math.max(1, periodDays))
}

/** 'YYYY-MM' month key for grouping. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

/**
 * Next payment date strictly after `fromIso`, advancing from `anchorIso` by the
 * subscription's period. When the user marks a payment made, the anchor is
 * usually the previous next_payment_date and `fromIso` the pay date — missed
 * periods are skipped so the next date always lands in the future.
 */
export function nextPaymentAfter(
  anchorIso: string,
  periodDays: number,
  fromIso: string,
  periodMonths = 0,
  periodDay = 0,
): string {
  const day = periodDay > 0 ? periodDay : dayOfMonth(anchorIso)
  let candidate = stepPeriod(anchorIso, periodDays, periodMonths, day)
  // Guard against pathological period values and runaway loops.
  let guard = 0
  while (candidate <= fromIso && guard < 4000) {
    candidate = stepPeriod(candidate, periodDays, periodMonths, day)
    guard += 1
  }
  return candidate
}

/**
 * First date >= `fromIso` reachable from `anchorIso` stepping by the period.
 * Used to roll a user-entered start date forward to the next occurrence.
 */
export function firstPaymentOnOrAfter(
  anchorIso: string,
  periodDays: number,
  fromIso: string,
  periodMonths = 0,
  periodDay = 0,
): string {
  if (anchorIso >= fromIso) return anchorIso
  if (periodMonths > 0) {
    const day = periodDay > 0 ? periodDay : dayOfMonth(anchorIso)
    let cursor = anchorIso
    let guard = 0
    while (cursor < fromIso && guard < 4000) {
      cursor = stepPeriod(cursor, periodDays, periodMonths, day)
      guard += 1
    }
    return cursor
  }
  const step = Math.max(1, periodDays)
  const diff = diffDays(fromIso, anchorIso)
  const periods = Math.ceil(diff / step)
  return addDays(anchorIso, periods * step)
}

/**
 * All payment dates of a subscription inside [fromIso, toIso], stepping from
 * `anchorIso` (the start/next_payment anchor). One-time purchases only ever hit
 * the single anchored date. The loop is bounded — a degenerate range or period
 * can't hang the UI.
 */
export function paymentDatesInRange(
  anchorIso: string,
  periodDays: number,
  fromIso: string,
  toIso: string,
  isOneTime = false,
  periodMonths = 0,
  periodDay = 0,
): string[] {
  if (isOneTime) return anchorIso >= fromIso && anchorIso <= toIso ? [anchorIso] : []
  const day = periodDay > 0 ? periodDay : dayOfMonth(anchorIso)
  let cursor = anchorIso
  let guard = 0
  while (cursor < fromIso && guard < 4000) {
    cursor = stepPeriod(cursor, periodDays, periodMonths, day)
    guard += 1
  }
  const out: string[] = []
  while (cursor <= toIso && guard < 4000) {
    out.push(cursor)
    cursor = stepPeriod(cursor, periodDays, periodMonths, day)
    guard += 1
  }
  return out
}

export const PERIOD_PRESETS = [
  { label: 'Еженедельно', days: 7, months: 0 },
  { label: 'Ежемесячно', days: 30, months: 1 },
  { label: 'Ежеквартально', days: 90, months: 3 },
  { label: 'Ежегодно', days: 365, months: 12 },
] as const

/** Calendar months a preset day count stands for (30 → 1, 90 → 3, 365 → 12). */
export function presetPeriodMonths(days: number): number {
  return PERIOD_PRESETS.find((p) => p.days === days)?.months ?? 0
}

/**
 * `period_days` stored for one-time purchases (~100 years): builds that don't
 * know about `is_one_time` read it literally and thus never roll the payment.
 */
export const ONE_TIME_PERIOD_DAYS = 36500

export function periodLabel(days: number, isOneTime = false): string {
  if (isOneTime) return 'Разово'
  const preset = PERIOD_PRESETS.find((p) => p.days === days)
  if (preset) return preset.label
  return `Каждые ${days} дн.`
}

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

/** '2026-03-04' -> '4 марта' */
export function formatDateRu(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_RU[m - 1]}`
}

/** '2026-03-04' -> '4 марта 2026' */
export function formatDateRuFull(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_RU[m - 1]} ${y}`
}

export function daysUntilText(days: number): string {
  if (days === 0) return 'сегодня'
  if (days === 1) return 'завтра'
  const abs = Math.abs(days)
  const word = pluralRu(abs, 'день', 'дня', 'дней')
  return days > 0 ? `через ${abs} ${word}` : `${abs} ${word} назад`
}
