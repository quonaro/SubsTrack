import { getDb, rows, lastId } from '../db'
import type { Subscription } from '../types'
import { nextPaymentAfter, todayIso } from './dates'
import { recordEvent } from './events'
import { logger } from '../log'

const log = logger('subs')

interface SubRow {
  id: number
  name: string
  price_minor: number
  currency: string
  period_days: number
  start_date: string
  next_payment_date: string
  icon: string
  is_active: number
  reminder_enabled: number
  category_id: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

const SELECT = `SELECT id, name, price_minor, currency, period_days, start_date,
  next_payment_date, icon, is_active, reminder_enabled, category_id, notes,
  created_at, updated_at FROM subscriptions`

function toSub(r: SubRow): Subscription {
  return {
    id: r.id,
    name: r.name,
    priceMinor: r.price_minor,
    currency: r.currency,
    periodDays: r.period_days,
    startDate: r.start_date,
    nextPaymentDate: r.next_payment_date,
    icon: r.icon,
    isActive: !!r.is_active,
    reminderEnabled: !!r.reminder_enabled,
    categoryId: r.category_id,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export interface SubscriptionInput {
  name: string
  priceMinor: number
  currency: string
  periodDays: number
  startDate: string
  nextPaymentDate: string
  icon?: string
  isActive?: boolean
  reminderEnabled?: boolean
  categoryId?: number | null
  notes?: string | null
}

export async function listSubscriptions(includeArchived = false): Promise<Subscription[]> {
  const db = await getDb()
  const where = includeArchived ? '' : 'WHERE is_active = 1'
  const res = await db.query(`${SELECT} ${where} ORDER BY next_payment_date, id`)
  return rows<SubRow>(res).map(toSub)
}

export async function getSubscription(id: number): Promise<Subscription | null> {
  const db = await getDb()
  const res = await db.query(`${SELECT} WHERE id = ?`, [id])
  const row = rows<SubRow>(res)[0]
  return row ? toSub(row) : null
}

export async function createSubscription(input: SubscriptionInput): Promise<Subscription> {
  const db = await getDb()
  const now = new Date().toISOString()
  const res = await db.run(
    `INSERT INTO subscriptions
      (name, price_minor, currency, period_days, start_date, next_payment_date,
       icon, is_active, reminder_enabled, category_id, notes, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      input.name,
      input.priceMinor,
      input.currency,
      input.periodDays,
      input.startDate,
      input.nextPaymentDate,
      input.icon ?? '📦',
      input.isActive === false ? 0 : 1,
      input.reminderEnabled === false ? 0 : 1,
      input.categoryId ?? null,
      input.notes ?? null,
      now,
      now,
    ],
  )
  const id = lastId(res)
  log.info('created subscription', id, input.name)
  await recordEvent(id, 'created', { name: input.name })
  const sub = await getSubscription(id)
  if (!sub) throw new Error('subscription insert failed')
  return sub
}

export async function updateSubscription(
  id: number,
  patch: Partial<SubscriptionInput>,
): Promise<Subscription | null> {
  const db = await getDb()
  const before = await getSubscription(id)
  if (!before) return null
  const merged = { ...before, ...patch }
  await db.run(
    `UPDATE subscriptions SET name=?, price_minor=?, currency=?, period_days=?,
       start_date=?, next_payment_date=?, icon=?, is_active=?, reminder_enabled=?,
       category_id=?, notes=?, updated_at=? WHERE id=?`,
    [
      merged.name,
      merged.priceMinor,
      merged.currency,
      merged.periodDays,
      merged.startDate,
      merged.nextPaymentDate,
      merged.icon,
      merged.isActive ? 1 : 0,
      merged.reminderEnabled ? 1 : 0,
      merged.categoryId,
      merged.notes,
      new Date().toISOString(),
      id,
    ],
  )
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  for (const k of Object.keys(patch) as (keyof SubscriptionInput)[]) {
    const a = before[k as keyof Subscription]
    const b = merged[k as keyof Subscription]
    if (a !== b) changes[k] = { from: a ?? null, to: b ?? null }
  }
  if (Object.keys(changes).length) await recordEvent(id, 'updated', { changes })
  return getSubscription(id)
}

export async function setActive(id: number, active: boolean): Promise<void> {
  const db = await getDb()
  await db.run('UPDATE subscriptions SET is_active=?, updated_at=? WHERE id=?', [
    active ? 1 : 0,
    new Date().toISOString(),
    id,
  ])
  await recordEvent(id, active ? 'restored' : 'archived', null)
}

export async function deleteSubscription(id: number): Promise<void> {
  const db = await getDb()
  const sub = await getSubscription(id)
  await db.run('DELETE FROM subscriptions WHERE id=?', [id])
  await recordEvent(null, 'deleted', { id, name: sub?.name ?? '?' })
  log.info('deleted subscription', id)
}

/**
 * Record a payment for `paidIso` (defaults to today) and roll
 * next_payment_date forward past it, skipping any missed periods.
 */
export async function markPaid(id: number, paidIso?: string): Promise<Subscription | null> {
  const db = await getDb()
  const sub = await getSubscription(id)
  if (!sub) return null
  const paid = paidIso ?? todayIso()
  await db.run(
    'INSERT INTO payments (subscription_id, amount_minor, currency, paid_date, created_at) VALUES (?,?,?,?,?)',
    [sub.id, sub.priceMinor, sub.currency, paid, new Date().toISOString()],
  )
  const next = nextPaymentAfter(sub.nextPaymentDate, sub.periodDays, paid)
  await db.run('UPDATE subscriptions SET next_payment_date=?, updated_at=? WHERE id=?', [
    next,
    new Date().toISOString(),
    id,
  ])
  await recordEvent(id, 'payment', {
    amountMinor: sub.priceMinor,
    currency: sub.currency,
    paidDate: paid,
    nextPaymentDate: next,
  })
  log.info('payment recorded', id, paid, '->', next)
  return getSubscription(id)
}
