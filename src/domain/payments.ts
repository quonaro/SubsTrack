import { getDb, rows } from '../db'
import type { Payment } from '../types'

interface PayRow {
  id: number
  subscription_id: number
  amount_minor: number
  currency: string
  paid_date: string
  created_at: string
}

const toPayment = (r: PayRow): Payment => ({
  id: r.id,
  subscriptionId: r.subscription_id,
  amountMinor: r.amount_minor,
  currency: r.currency,
  paidDate: r.paid_date,
  createdAt: r.created_at,
})

export async function listPayments(subscriptionId?: number): Promise<Payment[]> {
  const db = await getDb()
  const res = subscriptionId
    ? await db.query(
        'SELECT * FROM payments WHERE subscription_id = ? ORDER BY paid_date DESC, id DESC',
        [subscriptionId],
      )
    : await db.query('SELECT * FROM payments ORDER BY paid_date DESC, id DESC')
  return rows<PayRow>(res).map(toPayment)
}
