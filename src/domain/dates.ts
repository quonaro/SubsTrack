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

/** 'YYYY-MM' month key for grouping. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

/**
 * Next payment date strictly after `fromIso`, advancing by `periodDays` from
 * `anchorIso`. When the user marks a payment made, the anchor is usually the
 * previous next_payment_date and `fromIso` the pay date — missed periods are
 * skipped so the next date always lands in the future.
 */
export function nextPaymentAfter(anchorIso: string, periodDays: number, fromIso: string): string {
  let candidate = addDays(anchorIso, periodDays)
  // Guard against pathological period values and runaway loops.
  const step = Math.max(1, periodDays)
  let guard = 0
  while (candidate <= fromIso && guard < 4000) {
    candidate = addDays(candidate, step)
    guard += 1
  }
  return candidate
}

/**
 * First date >= `fromIso` reachable from `anchorIso` stepping by `periodDays`.
 * Used to roll a user-entered start date forward to the next occurrence.
 */
export function firstPaymentOnOrAfter(
  anchorIso: string,
  periodDays: number,
  fromIso: string,
): string {
  if (anchorIso >= fromIso) return anchorIso
  const diff = diffDays(fromIso, anchorIso)
  const periods = Math.ceil(diff / Math.max(1, periodDays))
  return addDays(anchorIso, periods * Math.max(1, periodDays))
}

/**
 * All payment dates of a subscription inside [fromIso, toIso], stepping
 * `periodDays` from `anchorIso` (the start/next_payment anchor). One-time
 * purchases only ever hit the single anchored date. The loop is bounded — a
 * degenerate range or period can't hang the UI.
 */
export function paymentDatesInRange(
  anchorIso: string,
  periodDays: number,
  fromIso: string,
  toIso: string,
  isOneTime = false,
): string[] {
  if (isOneTime) return anchorIso >= fromIso && anchorIso <= toIso ? [anchorIso] : []
  const step = Math.max(1, periodDays)
  let cursor = anchorIso
  let guard = 0
  while (cursor < fromIso && guard < 4000) {
    cursor = addDays(cursor, step)
    guard += 1
  }
  const out: string[] = []
  while (cursor <= toIso && guard < 4000) {
    out.push(cursor)
    cursor = addDays(cursor, step)
    guard += 1
  }
  return out
}

export const PERIOD_PRESETS = [
  { label: 'Еженедельно', days: 7 },
  { label: 'Ежемесячно', days: 30 },
  { label: 'Ежеквартально', days: 90 },
  { label: 'Ежегодно', days: 365 },
] as const

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
