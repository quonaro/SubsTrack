// Test helper: an in-memory SQLite database backed by sql.js that implements
// the same `Db` interface as the native/jeep backends. Lets tests run real
// SQL — migrations, CRUD, constraints — without a device or IndexedDB.
import initSqlJs, { type Database } from 'sql.js'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { Db } from './index'

const require = createRequire(import.meta.url)
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')

export async function makeTestDb(): Promise<Db> {
  const SQL = await initSqlJs({ wasmBinary: readFileSync(wasmPath) })
  const raw: Database = new SQL.Database()
  // Match the production backends: foreign keys enforce CASCADE/SET NULL.
  raw.exec('PRAGMA foreign_keys = ON')

  const queryRows = (statement: string, values?: unknown[]): Record<string, unknown>[] => {
    const stmt = raw.prepare(statement)
    try {
      if (values) stmt.bind(values as never)
      const out: Record<string, unknown>[] = []
      while (stmt.step()) out.push(stmt.getAsObject() as Record<string, unknown>)
      return out
    } finally {
      stmt.free()
    }
  }

  return {
    async execute(statement: string) {
      raw.exec(statement)
      return {}
    },
    async query(statement: string, values?: unknown[]) {
      return { values: queryRows(statement, values) }
    },
    async run(statement: string, values?: unknown[]) {
      raw.run(statement, values as never)
      const lastId = queryRows('SELECT last_insert_rowid() AS id')[0]?.id as number
      return { changes: { changes: raw.getRowsModified(), lastId } }
    },
  }
}
