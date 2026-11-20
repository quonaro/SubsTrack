export interface CalendarMonth {
  year: number
  /** 0-based, like `Date#getMonth`. */
  month: number
}

export function monthId(m: CalendarMonth): string {
  return `${m.year}-${String(m.month + 1).padStart(2, '0')}`
}

export function shiftMonth(m: CalendarMonth, delta: number): CalendarMonth {
  const d = new Date(m.year, m.month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function monthWindow(anchor: CalendarMonth, before: number, after: number): CalendarMonth[] {
  const out: CalendarMonth[] = []
  for (let i = -before; i <= after; i++) out.push(shiftMonth(anchor, i))
  return out
}
