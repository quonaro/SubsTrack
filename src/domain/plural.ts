/**
 * Russian plural form picker. `one` — for numbers ending in 1 but not 11
 * (1 подписка, 21 подписка), `few` — ending 2–4 but not 12–14
 * (2 подписки), `many` — everything else (5 подписок, 11 подписок).
 */
export function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n)
  const lastTwo = abs % 100
  if (lastTwo >= 11 && lastTwo <= 14) return many
  const last = abs % 10
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}
