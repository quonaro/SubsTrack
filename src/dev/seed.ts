// Demo-data seeder for manual bug-hunting. Fills the database with a broad
// spread of subscriptions the way a real user might — different currencies,
// odd periods, overdue/archived entries, hostile strings — plus synthesized
// payment history and notify rules. Dev tool, not a migration: invoked from
// Settings. Re-running adds another batch (subscription names aren't unique).
import { getDb } from '../db'
import { createCategory, listCategories } from '../domain/categories'
import { createSubscription } from '../domain/subscriptions'
import { replaceRules } from '../domain/rules'
import { addDays, firstPaymentOnOrAfter, ONE_TIME_PERIOD_DAYS, todayIso } from '../domain/dates'
import { EXTRA_CATEGORIES, SUBS, type SeedSub } from './seed-data'
import { logger } from '../log'

const log = logger('seed')

async function ensureCategory(
  name: string,
  icon: string,
  color: string,
  byName: Map<string, number>,
): Promise<number> {
  const existing = byName.get(name)
  if (existing != null) return existing
  const c = await createCategory({ name, icon, color })
  byName.set(c.name, c.id)
  return c.id
}

/**
 * Insert `count` past payment rows stepping back from the next payment date,
 * plus matching 'payment' events so the History feed looks real. The older
 * half of the history is written 20% cheaper — a fake price increase.
 */
async function seedHistory(subId: number, spec: SeedSub, nextPaymentDate: string): Promise<void> {
  if (spec.isOneTime) return
  const db = await getDb()
  const count = spec.history ?? 0
  for (let i = 1; i <= count; i++) {
    const paid = addDays(nextPaymentDate, -i * spec.periodDays)
    const amount = i > count / 2 ? Math.round(spec.priceMinor * 0.8) : spec.priceMinor
    const at = `${paid}T12:34:56.000`
    await db.run(
      'INSERT INTO payments (subscription_id, amount_minor, currency, paid_date, created_at) VALUES (?,?,?,?,?)',
      [subId, amount, spec.currency, paid, at],
    )
    await db.run(
      'INSERT INTO events (subscription_id, type, payload, created_at) VALUES (?,?,?,?)',
      [
        subId,
        'payment',
        JSON.stringify({
          amountMinor: amount,
          currency: spec.currency,
          paidDate: paid,
          nextPaymentDate: addDays(paid, spec.periodDays),
        }),
        at,
      ],
    )
  }
}

export async function seedDemoData(): Promise<{ subs: number }> {
  const today = todayIso()
  const byName = new Map((await listCategories()).map((c) => [c.name, c.id]))
  for (const c of EXTRA_CATEGORIES) await ensureCategory(c.name, c.icon, c.color, byName)

  let created = 0
  for (const spec of SUBS) {
    const start = spec.startDate ?? addDays(today, -(spec.startedAgo ?? 365))
    const next =
      spec.nextIn != null
        ? addDays(today, spec.nextIn)
        : spec.isOneTime
          ? start
          : firstPaymentOnOrAfter(start, spec.periodDays, today)
    const sub = await createSubscription({
      name: spec.name,
      priceMinor: spec.priceMinor,
      currency: spec.currency,
      periodDays: spec.isOneTime ? ONE_TIME_PERIOD_DAYS : spec.periodDays,
      isOneTime: spec.isOneTime,
      startDate: start,
      nextPaymentDate: next,
      icon: spec.icon,
      isActive: spec.isActive,
      reminderEnabled: spec.reminderEnabled,
      categoryId: spec.category ? (byName.get(spec.category) ?? null) : null,
      notes: spec.notes ?? null,
    })
    await seedHistory(sub.id, spec, next)
    if (spec.rules?.length) await replaceRules(sub.id, spec.rules)
    created += 1
  }
  log.info('seeded demo data', { subs: created })
  return { subs: created }
}
