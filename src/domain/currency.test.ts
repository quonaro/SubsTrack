import { describe, expect, it } from 'vitest'
import { convertMinor, formatMoney, parseMoney } from './currency'

describe('currency', () => {
  it('converts between currencies via RUB rates', () => {
    expect(convertMinor(10000, 'RUB', 'RUB')).toBe(10000)
    // 100 RUB -> USD at 95 RUB/USD ≈ 105 US cents
    expect(convertMinor(10000, 'RUB', 'USD')).toBe(105)
    // 1 USD -> RUB
    expect(convertMinor(100, 'USD', 'RUB')).toBe(9500)
    // KZT -> RUB: 1000.00 KZT * 0.2 = 200.00 RUB
    expect(convertMinor(100000, 'KZT', 'RUB')).toBe(20000)
  })

  it('formats minor units', () => {
    expect(formatMoney(49900, 'RUB')).toContain('499')
    expect(formatMoney(49950, 'RUB')).toContain('499,5')
    expect(formatMoney(0, 'USD')).toContain('0')
  })

  it('parses user input into minor units', () => {
    expect(parseMoney('499')).toBe(49900)
    expect(parseMoney('499,50')).toBe(49950)
    expect(parseMoney('499.99')).toBe(49999)
    expect(parseMoney('1 234,56')).toBe(123456)
    expect(parseMoney('abc')).toBeNull()
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('-5')).toBeNull()
  })
})
