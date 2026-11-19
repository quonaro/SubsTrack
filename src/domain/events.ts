import { getDb, rows } from '../db'
import type { EventType, SubEvent } from '../types'

interface EvRow {
  id: number
  subscription_id: number | null
  type: string
  payload: string | null
  created_at: string
}

const toEvent = (r: EvRow): SubEvent => ({
  id: r.id,
  subscriptionId: r.subscription_id,
  type: r.type as EventType,
  payload: r.payload,
  createdAt: r.created_at,
})

export async function recordEvent(
  subscriptionId: number | null,
  type: EventType,
  details: unknown,
): Promise<void> {
  const db = await getDb()
  await db.run('INSERT INTO events (subscription_id, type, payload, created_at) VALUES (?,?,?,?)', [
    subscriptionId,
    type,
    details == null ? null : JSON.stringify(details),
    new Date().toISOString(),
  ])
}

export async function listEvents(limit = 200): Promise<SubEvent[]> {
  const db = await getDb()
  const res = await db.query('SELECT * FROM events ORDER BY created_at DESC, id DESC LIMIT ?', [
    limit,
  ])
  return rows<EvRow>(res).map(toEvent)
}
