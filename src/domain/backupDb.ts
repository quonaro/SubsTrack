// Reading and writing whole tables for backup/restore. Rows are filtered
// against the live schema on the way in, so a copy from another app version
// still applies: unknown columns are dropped, missing ones fall back to their
// SQL defaults.
import { getDb, rows } from '../db'
import {
  BACKUP_TABLES,
  type BackupRow,
  type BackupTable,
  type BackupTables,
  type BackupValue,
} from './backup'

// Children first on delete, parents first on insert — FK enforcement is ON in
// every backend, so the order matters even for a full replace.
const DELETE_ORDER: BackupTable[] = [
  'payments',
  'notify_rules',
  'events',
  'subscriptions',
  'categories',
  'settings',
]
const INSERT_ORDER: BackupTable[] = [
  'categories',
  'subscriptions',
  'payments',
  'notify_rules',
  'events',
  'settings',
]

interface ColumnInfo {
  name: string
  notNull: boolean
  hasDefault: boolean
}

interface PlannedTable {
  table: BackupTable
  columns: string[]
  values: BackupValue[][]
}

async function schemaOf(table: BackupTable): Promise<ColumnInfo[]> {
  const db = await getDb()
  const res = await db.query(`PRAGMA table_info(${table})`)
  return rows<{ name: string; notnull: number; dflt_value: string | null }>(res).map((c) => ({
    name: c.name,
    notNull: !!c.notnull,
    hasDefault: c.dflt_value !== null,
  }))
}

export async function dumpTables(): Promise<BackupTables> {
  const db = await getDb()
  const out: BackupTables = {}
  for (const table of INSERT_ORDER) {
    const res = await db.query(`SELECT * FROM ${table}`)
    out[table] = rows<Record<string, unknown>>(res).map((r) => {
      const row: BackupRow = {}
      for (const [key, value] of Object.entries(r)) {
        row[key] = value === null || value === undefined ? null : (value as BackupValue)
      }
      return row
    })
  }
  return out
}

/** Validates rows against the schema before anything is deleted. */
function plan(schemas: Map<BackupTable, ColumnInfo[]>, tables: BackupTables): PlannedTable[] {
  return INSERT_ORDER.map((table) => {
    const schema = schemas.get(table) ?? []
    const list = tables[table] ?? []
    const known = new Set(schema.map((c) => c.name))
    // One column list per table: every row is written with the same shape, in
    // schema order, so a hand-edited row with an extra field can't shift the
    // placeholders of the rows after it.
    const present = new Set<string>()
    for (const row of list) {
      for (const key of Object.keys(row)) if (known.has(key)) present.add(key)
    }
    const columns = schema.filter((c) => present.has(c.name)).map((c) => c.name)
    if (list.length > 0 && columns.length === 0) {
      throw new Error(`Повреждённая копия: в разделе «${table}» нет известных полей.`)
    }
    const required = schema.filter((c) => c.notNull && !c.hasDefault)
    const values = list.map((row, i) => {
      for (const col of required) {
        if (row[col.name] == null) {
          throw new Error(`В копии не хватает поля «${table}.${col.name}» (строка ${i + 1}).`)
        }
      }
      return columns.map((c) => row[c] ?? null)
    })
    return { table, columns, values }
  })
}

async function write(tables: PlannedTable[]): Promise<void> {
  const db = await getDb()
  for (const table of DELETE_ORDER) await db.run(`DELETE FROM ${table}`)
  for (const { table, columns, values } of tables) {
    if (values.length === 0) continue
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns
      .map(() => '?')
      .join(', ')})`
    for (const row of values) await db.run(sql, row)
  }
}

/**
 * Replaces every table with the backup's contents.
 *
 * No BEGIN/COMMIT: jeep-sqlite (web) rejects nested transactions, so instead
 * the current rows are dumped first and written back if the import fails
 * halfway — a broken backup never leaves the user with a half-empty list.
 */
export async function replaceTables(tables: BackupTables): Promise<void> {
  const schemas = new Map<BackupTable, ColumnInfo[]>()
  for (const table of BACKUP_TABLES) schemas.set(table, await schemaOf(table))
  const next = plan(schemas, tables)
  const previous = plan(schemas, await dumpTables())
  try {
    await write(next)
  } catch (e) {
    await write(previous).catch(() => {})
    const message = e instanceof Error ? e.message : String(e)
    throw new Error(`Не удалось применить копию: ${message}`)
  }
}
