import byFlag from '../assets/flags/by.svg'
import euFlag from '../assets/flags/eu.svg'
import kzFlag from '../assets/flags/kz.svg'
import ruFlag from '../assets/flags/ru.svg'
import usFlag from '../assets/flags/us.svg'

// Static exchange rates ported from the old backend — value of one currency
// unit in RUB. Editable list is a deliberate trade-off: no network dependency.
export const CURRENCY_RATES: Record<string, number> = {
  RUB: 1.0,
  USD: 95.0,
  EUR: 103.0,
  KZT: 0.2,
  BYN: 28.0,
}

export const CURRENCIES = Object.keys(CURRENCY_RATES)

export const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  KZT: '₸',
  BYN: 'Br',
}

// Bundled flag SVGs (from lipis/flag-icons, MIT) instead of regional-indicator
// emoji: Android renders those in wildly different styles and some fonts fall
// back to bare letters.
export const CURRENCY_FLAGS: Record<string, string> = {
  RUB: ruFlag,
  USD: usFlag,
  EUR: euFlag,
  KZT: kzFlag,
  BYN: byFlag,
}

export const CURRENCY_NAMES: Record<string, string> = {
  RUB: 'Российский рубль',
  USD: 'Доллар США',
  EUR: 'Евро',
  KZT: 'Казахстанский тенге',
  BYN: 'Белорусский рубль',
}

/** Convert an amount in minor units between currencies. */
export function convertMinor(amountMinor: number, from: string, to: string): number {
  if (from === to) return amountMinor
  const fromRate = CURRENCY_RATES[from.toUpperCase()] ?? 1
  const toRate = CURRENCY_RATES[to.toUpperCase()] ?? 1
  if (toRate === 0) return amountMinor
  return Math.round((amountMinor * fromRate) / toRate)
}

const nf = new Map<string, Intl.NumberFormat>()

export function formatMoney(amountMinor: number, currency: string): string {
  const cur = currency.toUpperCase()
  let fmt = nf.get(cur)
  if (!fmt) {
    fmt = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })
    nf.set(cur, fmt)
  }
  return fmt.format(amountMinor / 100)
}

/** Parse '1 234,56' / '1234.56' user input into minor units. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[₽$€\s ]/g, '').replace(',', '.')
  if (!cleaned) return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}
