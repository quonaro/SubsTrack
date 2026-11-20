import { describe, expect, it } from 'vitest'
import {
  BACKUP_FORMAT,
  MAX_BACKUP_ROWS,
  backupCounts,
  backupFileName,
  buildBackup,
  parseBackup,
  serializeBackup,
  type BackupTables,
} from './backup'

const tables: BackupTables = {
  categories: [{ id: 1, name: 'Кино', color: '#f15a24', icon: '📁', created_at: '2026-01-01' }],
  subscriptions: [
    {
      id: 2,
      name: 'Netflix',
      price_minor: 99900,
      period_days: 30,
      is_active: 1,
      category_id: 1,
    },
  ],
  payments: [{ id: 3, subscription_id: 2, amount_minor: 99900, paid_date: '2026-02-01' }],
  notify_rules: [{ id: 4, subscription_id: 2, kind: 'advance', days_before: 3 }],
  events: [{ id: 5, type: 'created', payload: null, created_at: '2026-01-01' }],
  settings: [{ key: 'theme', value: 'dark' }],
}

const meta = { appVersion: '1.2.3', schemaVersion: 4 }

describe('buildBackup', () => {
  it('stamps format, app and meta', () => {
    const file = buildBackup(tables, meta, '2026-11-20T10:00:00.000Z')
    expect(file.app).toBe('substrack')
    expect(file.format).toBe(BACKUP_FORMAT)
    expect(file.createdAt).toBe('2026-11-20T10:00:00.000Z')
    expect(file.appVersion).toBe('1.2.3')
    expect(file.schemaVersion).toBe(4)
  })

  it('survives a serialize/parse round trip', () => {
    const text = serializeBackup(buildBackup(tables, meta, '2026-11-20T10:00:00.000Z'))
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.backup.tables).toEqual(tables)
    expect(parsed.backup.schemaVersion).toBe(4)
  })

  it('counts rows per table', () => {
    expect(backupCounts(buildBackup(tables, meta))).toEqual({
      categories: 1,
      subscriptions: 1,
      payments: 1,
      rules: 1,
      events: 1,
    })
  })
})

describe('parseBackup', () => {
  const bad = (text: string): string => {
    const res = parseBackup(text)
    expect(res.ok).toBe(false)
    return res.ok ? '' : res.error
  }

  it('rejects non-JSON', () => {
    expect(bad('не json')).toContain('JSON')
  })

  it('rejects a foreign or array payload', () => {
    expect(bad('[]')).toContain('не резервная копия')
    expect(bad('{"app":"other","format":1,"tables":{}}')).toContain('не резервная копия')
  })

  it('rejects a newer format', () => {
    expect(bad(JSON.stringify({ app: 'substrack', format: 99, tables: {} }))).toContain(
      'более новой версией',
    )
  })

  it('rejects a missing format', () => {
    expect(bad(JSON.stringify({ app: 'substrack', tables: {} }))).toContain('формат')
  })

  it('rejects a broken table section', () => {
    expect(
      bad(JSON.stringify({ app: 'substrack', format: 1, tables: { subscriptions: 'nope' } })),
    ).toContain('испорчен')
  })

  it('rejects non-scalar values and empty rows', () => {
    const withObject = {
      app: 'substrack',
      format: 1,
      tables: { settings: [{ key: 'x', value: { nested: true } }] },
    }
    expect(bad(JSON.stringify(withObject))).toContain('строка 1')
    const withBoolean = {
      app: 'substrack',
      format: 1,
      tables: { subscriptions: [{ id: 1, is_active: true }] },
    }
    expect(bad(JSON.stringify(withBoolean))).toContain('строка 1')
    const emptyRow = { app: 'substrack', format: 1, tables: { payments: [{}] } }
    expect(bad(JSON.stringify(emptyRow))).toContain('строка 1')
  })

  it('rejects an absurdly large copy', () => {
    const rows = Array.from({ length: MAX_BACKUP_ROWS + 1 }, () => ({ id: 1 }))
    const text = JSON.stringify({ app: 'substrack', format: 1, tables: { events: rows } })
    expect(bad(text)).toContain('слишком большая')
  })

  it('treats missing tables and optional meta as empty', () => {
    const res = parseBackup(JSON.stringify({ app: 'substrack', format: 1, tables: {} }))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.backup.tables).toEqual({})
    expect(res.backup.createdAt).toBe('')
    expect(res.backup.appVersion).toBe('')
    expect(res.backup.schemaVersion).toBe(0)
  })

  it('ignores unknown top-level fields', () => {
    const res = parseBackup(
      JSON.stringify({ app: 'substrack', format: 1, tables: {}, extra: 42, v: 'x' }),
    )
    expect(res.ok).toBe(true)
  })
})

describe('backupFileName', () => {
  it('stamps the date', () => {
    expect(backupFileName('2026-11-20T10:00:00.000Z')).toBe('substrack-backup-2026-11-20.json')
  })
})
