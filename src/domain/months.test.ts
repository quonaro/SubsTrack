import { describe, expect, it } from 'vitest'
import { monthId, monthWindow, shiftMonth } from './months'

describe('shiftMonth', () => {
  it('moves across year boundaries', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
  })

  it('handles multi-month deltas', () => {
    expect(shiftMonth({ year: 2026, month: 5 }, 19)).toEqual({ year: 2028, month: 0 })
    expect(shiftMonth({ year: 2026, month: 5 }, -7)).toEqual({ year: 2025, month: 10 })
  })

  it('keeps the day reset to the first of the month', () => {
    expect(shiftMonth({ year: 2026, month: 0 }, 31)).toEqual({ year: 2028, month: 7 })
  })
})

describe('monthWindow', () => {
  it('builds a contiguous range around the anchor', () => {
    const months = monthWindow({ year: 2026, month: 0 }, 1, 2)
    expect(months).toEqual([
      { year: 2025, month: 11 },
      { year: 2026, month: 0 },
      { year: 2026, month: 1 },
      { year: 2026, month: 2 },
    ])
  })
})

describe('monthId', () => {
  it('zero-pads the month number', () => {
    expect(monthId({ year: 2026, month: 0 })).toBe('2026-01')
    expect(monthId({ year: 2026, month: 11 })).toBe('2026-12')
  })
})
