import { describe, expect, it } from 'vitest'
import { pluralRu } from './plural'

describe('pluralRu', () => {
  const sub = (n: number) => pluralRu(n, 'подписка', 'подписки', 'подписок')

  it('picks the singular form for 1, 21, 101', () => {
    expect(sub(1)).toBe('подписка')
    expect(sub(21)).toBe('подписка')
    expect(sub(101)).toBe('подписка')
  })

  it('picks the paucal form for 2–4, 22–24', () => {
    expect(sub(2)).toBe('подписки')
    expect(sub(4)).toBe('подписки')
    expect(sub(23)).toBe('подписки')
  })

  it('picks the plural form for 5–20, 11–14', () => {
    expect(sub(0)).toBe('подписок')
    expect(sub(5)).toBe('подписок')
    expect(sub(11)).toBe('подписок')
    expect(sub(14)).toBe('подписок')
    expect(sub(25)).toBe('подписок')
  })

  it('ignores the sign', () => {
    expect(sub(-3)).toBe('подписки')
  })
})
