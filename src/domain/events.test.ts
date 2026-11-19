// Integration tests against real SQLite (sql.js in memory).
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting, type Db } from '../db'
import { migrate } from '../db/schema'
import { listEvents, recordEvent } from './events'

let db: Db
let subId: number

beforeEach(async () => {
  db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
  const r = await db.run(
    `INSERT INTO subscriptions (name, price_minor, currency, period_days, start_date, next_payment_date, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    ['Netflix', 999, 'RUB', 30, '2024-01-01', '2024-02-01', '2024-01-01', '2024-01-01'],
  )
  subId = r.changes?.lastId ?? 0
})

describe('events (sqlite)', () => {
  it('stores a JSON payload and reads it back', async () => {
    await recordEvent(subId, 'created', { name: 'Netflix' })
    const [e] = await listEvents()
    expect(e.subscriptionId).toBe(subId)
    expect(e.type).toBe('created')
    expect(JSON.parse(e.payload!)).toEqual({ name: 'Netflix' })
    expect(e.createdAt).toBeTruthy()
  })

  it('keeps a null payload for detail-less events', async () => {
    await recordEvent(subId, 'archived', null)
    const [e] = await listEvents()
    expect(e.payload).toBeNull()
  })

  it('allows a null subscription id', async () => {
    await recordEvent(null, 'deleted', { id: 5 })
    const [e] = await listEvents()
    expect(e.subscriptionId).toBeNull()
  })

  it('nulls the subscription id when the subscription is deleted', async () => {
    await recordEvent(subId, 'created', null)
    await db.run('DELETE FROM subscriptions WHERE id = ?', [subId])
    const [e] = await listEvents()
    expect(e.subscriptionId).toBeNull()
  })

  it('returns newest first and honors the limit', async () => {
    for (let i = 0; i < 5; i++) await recordEvent(subId, 'updated', { i })
    const all = await listEvents()
    expect(all).toHaveLength(5)
    // rows are ordered created_at DESC, id DESC — ids decrease down the list
    const ids = all.map((e) => e.id)
    expect(ids).toEqual([...ids].sort((a, b) => b - a))
    expect(await listEvents(2)).toHaveLength(2)
  })
})
