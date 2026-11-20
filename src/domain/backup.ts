// Backup format: a versioned JSON envelope carrying raw table rows, so a
// restore rewrites the database exactly instead of replaying app mutations
// (no derived state, no per-row events, no reminder rescheduling storm).
//
// Rows are filtered against the live schema on restore (see backupDb.ts), so a
// copy stays importable in both directions: an older backup gets the missing
// columns filled with their defaults, a newer one drops columns this build
// doesn't know. Same compatibility rule as the migrations themselves.

export const BACKUP_APP = 'substrack'

/** Envelope version. Bump only for an incompatible layout change. */
export const BACKUP_FORMAT = 1

/** Guard against a hand-edited or truncated file filling the device storage. */
export const MAX_BACKUP_ROWS = 200_000

export const BACKUP_TABLES = [
  'categories',
  'subscriptions',
  'payments',
  'notify_rules',
  'events',
  'settings',
] as const

export type BackupTable = (typeof BACKUP_TABLES)[number]
export type BackupValue = string | number | null
export type BackupRow = Record<string, BackupValue>
export type BackupTables = Partial<Record<BackupTable, BackupRow[]>>

export interface BackupFile {
  app: typeof BACKUP_APP
  format: number
  /** ISO datetime of the export. */
  createdAt: string
  appVersion: string
  schemaVersion: number
  tables: BackupTables
}

export interface BackupMeta {
  appVersion: string
  schemaVersion: number
}

export interface BackupCounts {
  categories: number
  subscriptions: number
  payments: number
  rules: number
  events: number
}

export type BackupParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string }

export function buildBackup(
  tables: BackupTables,
  meta: BackupMeta,
  createdAt = new Date().toISOString(),
): BackupFile {
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    createdAt,
    appVersion: meta.appVersion,
    schemaVersion: meta.schemaVersion,
    tables,
  }
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2)
}

export function backupCounts(backup: BackupFile): BackupCounts {
  const count = (t: BackupTable) => backup.tables[t]?.length ?? 0
  return {
    categories: count('categories'),
    subscriptions: count('subscriptions'),
    payments: count('payments'),
    rules: count('notify_rules'),
    events: count('events'),
  }
}

/** Name for the exported file: substrack-backup-YYYY-MM-DD.json */
export function backupFileName(iso: string): string {
  return `substrack-backup-${iso.slice(0, 10)}.json`
}

/** Rejects booleans, objects and nested arrays — only real column values. */
function isScalar(v: unknown): v is BackupValue {
  if (v === null) return true
  if (typeof v === 'string') return true
  return typeof v === 'number' && Number.isFinite(v)
}

function parseRow(row: unknown): BackupRow | null {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null
  const out: BackupRow = {}
  let keys = 0
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    if (!key || !isScalar(value)) return null
    out[key] = value
    keys++
  }
  return keys > 0 ? out : null
}

const fail = (error: string): BackupParseResult => ({ ok: false, error })

export function parseBackup(text: string): BackupParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return fail('Файл не является JSON — это не резервная копия SubsTrack.')
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return fail('Это не резервная копия SubsTrack.')
  }
  const obj = raw as Record<string, unknown>
  if (obj.app !== BACKUP_APP) return fail('Это не резервная копия SubsTrack.')

  const format = obj.format
  if (typeof format !== 'number' || !Number.isInteger(format) || format < 1) {
    return fail('Неизвестный формат копии.')
  }
  if (format > BACKUP_FORMAT) {
    return fail(`Копия создана более новой версией приложения (формат ${format}).`)
  }

  const source = obj.tables
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return fail('В копии нет данных.')
  }

  const tables: BackupTables = {}
  let total = 0
  for (const table of BACKUP_TABLES) {
    const list = (source as Record<string, unknown>)[table]
    if (list === undefined) continue
    if (!Array.isArray(list)) return fail(`Повреждённая копия: раздел «${table}» испорчен.`)
    total += list.length
    if (total > MAX_BACKUP_ROWS) return fail('Копия слишком большая.')
    const parsed: BackupRow[] = []
    for (const [i, row] of list.entries()) {
      const parsedRow = parseRow(row)
      if (!parsedRow) return fail(`Повреждённая копия: строка ${i + 1} в «${table}».`)
      parsed.push(parsedRow)
    }
    tables[table] = parsed
  }

  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      format,
      createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : '',
      appVersion: typeof obj.appVersion === 'string' ? obj.appVersion : '',
      schemaVersion:
        typeof obj.schemaVersion === 'number' && Number.isFinite(obj.schemaVersion)
          ? obj.schemaVersion
          : 0,
      tables,
    },
  }
}
