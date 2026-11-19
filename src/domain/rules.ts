import { getDb, rows, lastId } from '../db'
import type { NotifyRule, RuleKind } from '../types'

interface RuleRow {
  id: number
  subscription_id: number
  kind: string
  days_before: number | null
  at_time: string | null
  interval_hours: number | null
  enabled: number
  created_at: string
}

const toRule = (r: RuleRow): NotifyRule => ({
  id: r.id,
  subscriptionId: r.subscription_id,
  kind: r.kind as RuleKind,
  daysBefore: r.days_before,
  atTime: r.at_time,
  intervalHours: r.interval_hours,
  enabled: !!r.enabled,
  createdAt: r.created_at,
})

export async function listRules(subscriptionId?: number): Promise<NotifyRule[]> {
  const db = await getDb()
  const res = subscriptionId
    ? await db.query('SELECT * FROM notify_rules WHERE subscription_id = ? ORDER BY id', [
        subscriptionId,
      ])
    : await db.query('SELECT * FROM notify_rules ORDER BY id')
  return rows<RuleRow>(res).map(toRule)
}

export async function createRule(input: {
  subscriptionId: number
  kind: RuleKind
  daysBefore?: number | null
  atTime?: string | null
  intervalHours?: number | null
}): Promise<NotifyRule> {
  const db = await getDb()
  const res = await db.run(
    `INSERT INTO notify_rules
      (subscription_id, kind, days_before, at_time, interval_hours, enabled, created_at)
     VALUES (?,?,?,?,?,1,?)`,
    [
      input.subscriptionId,
      input.kind,
      input.daysBefore ?? null,
      input.atTime ?? null,
      input.intervalHours ?? null,
      new Date().toISOString(),
    ],
  )
  const id = lastId(res)
  const all = await listRules(input.subscriptionId)
  return all.find((r) => r.id === id)!
}

export async function deleteRule(id: number): Promise<void> {
  const db = await getDb()
  await db.run('DELETE FROM notify_rules WHERE id=?', [id])
}

/**
 * Replace all rules of a subscription. No explicit transaction — the
 * jeep-sqlite web backend rejects nested transactions; a mid-failure
 * leaves a partial rule set that the next replaceRules call fixes.
 */
export async function replaceRules(
  subscriptionId: number,
  rules: {
    kind: RuleKind
    daysBefore?: number | null
    atTime?: string | null
    intervalHours?: number | null
  }[],
): Promise<void> {
  const db = await getDb()
  const now = new Date().toISOString()
  await db.run('DELETE FROM notify_rules WHERE subscription_id=?', [subscriptionId])
  for (const r of rules) {
    await db.run(
      `INSERT INTO notify_rules
        (subscription_id, kind, days_before, at_time, interval_hours, enabled, created_at)
       VALUES (?,?,?,?,?,1,?)`,
      [
        subscriptionId,
        r.kind,
        r.daysBefore ?? null,
        r.atTime ?? null,
        r.intervalHours ?? null,
        now,
      ],
    )
  }
}
