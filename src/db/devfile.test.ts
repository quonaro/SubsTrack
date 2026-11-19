// Transport test for the dev-server file backend: fetch is stubbed to a real
// sql.js database, exercising openDevFile's execute/query/run contract and
// the ping probe that gates the jeep-sqlite fallback.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeTestDb } from './testdb'
import { openDevFile, type Db } from './index'

afterEach(() => {
  vi.unstubAllGlobals()
})

// Route /__substrack-db calls into a real in-memory Db, mimicking the vite
// middleware's { result } / { error } envelope.
function stubEndpoint(db: Db) {
  return vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (!init?.method || init.method === 'GET') return new Response(null, { status: 204 })
    const { method, statement, values } = JSON.parse(String(init.body)) as {
      method: string
      statement: string
      values?: unknown[]
    }
    const respond = (result: unknown) =>
      new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    try {
      if (method === 'execute') return respond(await db.execute(statement))
      if (method === 'query') return respond(await db.query(statement, values))
      if (method === 'run') return respond(await db.run(statement, values))
      return new Response(JSON.stringify({ error: 'unknown method' }), { status: 400 })
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
    }
  })
}

describe('openDevFile', () => {
  it('throws when the middleware is not there (drives the jeep fallback)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('no server'))),
    )
    await expect(openDevFile()).rejects.toThrow('dev db endpoint unavailable')
  })

  it('runs execute/query/run ops over the HTTP envelope', async () => {
    const inner = await makeTestDb()
    vi.stubGlobal('fetch', stubEndpoint(inner))
    const db = await openDevFile()

    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)')
    const run = await db.run('INSERT INTO t (v) VALUES (?)', ['hello'])
    expect(run.changes?.lastId).toBe(1)
    expect(run.changes?.changes).toBe(1)

    const res = await db.query('SELECT v FROM t WHERE id=?', [1])
    expect(res.values).toEqual([{ v: 'hello' }])
  })

  it('surfaces sql errors from the middleware', async () => {
    const inner = await makeTestDb()
    vi.stubGlobal('fetch', stubEndpoint(inner))
    const db = await openDevFile()
    await expect(db.execute('NOT VALID SQL')).rejects.toThrow()
  })
})
