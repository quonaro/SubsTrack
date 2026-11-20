import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysUntilText,
  diffDays,
  firstPaymentOnOrAfter,
  formatDateRu,
  nextPaymentAfter,
  ONE_TIME_PERIOD_DAYS,
  parseIsoDate,
  paymentDatesInRange,
  periodLabel,
  toIsoDate,
} from './dates'

describe('dates', () => {
  it('round-trips ISO dates', () => {
    expect(toIsoDate(parseIsoDate('2026-03-04'))).toBe('2026-03-04')
    expect(parseIsoDate('2026-12-31').getFullYear()).toBe(2026)
  })

  it('adds days across month/year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    // 2026-02 is not a leap year... wait, 2026 isn't leap; check 2028.
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('computes day diffs', () => {
    expect(diffDays('2026-03-10', '2026-03-04')).toBe(6)
    expect(diffDays('2026-03-04', '2026-03-10')).toBe(-6)
    expect(diffDays('2026-03-04', '2026-03-04')).toBe(0)
  })

  it('rolls next payment forward past the pay date', () => {
    // paid on the scheduled day → next is +period
    expect(nextPaymentAfter('2026-03-01', 30, '2026-03-01')).toBe('2026-03-31')
    // paid late, periods missed → skips ahead (01-31, 03-02, then 04-01)
    expect(nextPaymentAfter('2026-01-01', 30, '2026-03-10')).toBe('2026-04-01')
    // weekly
    expect(nextPaymentAfter('2026-03-04', 7, '2026-03-04')).toBe('2026-03-11')
  })

  it('finds first payment on/after a date', () => {
    expect(firstPaymentOnOrAfter('2026-03-10', 30, '2026-03-01')).toBe('2026-03-10')
    expect(firstPaymentOnOrAfter('2026-01-01', 30, '2026-03-01')).toBe('2026-03-02')
    expect(firstPaymentOnOrAfter('2026-01-01', 30, '2026-01-01')).toBe('2026-01-01')
  })

  it('lists payment dates inside a range', () => {
    const dates = paymentDatesInRange('2026-01-05', 7, '2026-01-01', '2026-01-31')
    expect(dates).toEqual(['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26'])
    // anchor before range start gets stepped forward
    const d2 = paymentDatesInRange('2025-12-20', 30, '2026-01-01', '2026-03-01')
    expect(d2).toEqual(['2026-01-19', '2026-02-18'])
    // empty when nothing falls inside
    expect(paymentDatesInRange('2026-01-01', 365, '2026-02-01', '2026-02-28')).toEqual([])
  })

  it('labels presets, custom periods and one-time purchases', () => {
    expect(periodLabel(30)).toBe('Ежемесячно')
    expect(periodLabel(45)).toBe('Каждые 45 дн.')
    expect(periodLabel(ONE_TIME_PERIOD_DAYS, true)).toBe('Разово')
  })

  it('keeps a one-time purchase on its single date', () => {
    expect(
      paymentDatesInRange('2026-01-05', ONE_TIME_PERIOD_DAYS, '2026-01-01', '2026-01-31', true),
    ).toEqual(['2026-01-05'])
    // outside the range the one-time payment is not repeated
    expect(
      paymentDatesInRange('2025-12-05', ONE_TIME_PERIOD_DAYS, '2026-01-01', '2026-01-31', true),
    ).toEqual([])
  })

  it('formats russian dates and relative days', () => {
    expect(formatDateRu('2026-03-04')).toBe('4 марта')
    expect(daysUntilText(0)).toBe('сегодня')
    expect(daysUntilText(1)).toBe('завтра')
    expect(daysUntilText(2)).toBe('через 2 дня')
    expect(daysUntilText(5)).toBe('через 5 дней')
    expect(daysUntilText(11)).toBe('через 11 дней')
    expect(daysUntilText(21)).toBe('через 21 день')
    expect(daysUntilText(-3)).toBe('3 дня назад')
  })
})
