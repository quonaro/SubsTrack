import { getDb, rows, lastId } from '../db'
import { getSetting } from './settings'
import { ACCENTS } from '../theme'
import type { Category } from '../types'

interface CatRow {
  id: number
  name: string
  color: string
  icon: string
  created_at: string
}

const toCat = (r: CatRow): Category => ({
  id: r.id,
  name: r.name,
  color: r.color,
  icon: r.icon,
  createdAt: r.created_at,
})

export const CATEGORY_COLORS = [
  '#f15a24',
  '#ec4899',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#ef4444',
  '#84cc16',
]

const DEFAULT_CATEGORIES: { name: string; icon: string; color: string }[] = [
  { name: 'Видео', icon: 'film', color: '#ef4444' },
  { name: 'Музыка', icon: 'music', color: '#22c55e' },
  { name: 'Игры', icon: 'gamepad-2', color: '#f15a24' },
  { name: 'Облако', icon: 'cloud', color: '#3b82f6' },
  { name: 'Работа', icon: 'briefcase', color: '#eab308' },
  { name: 'Прочее', icon: 'package', color: '#6b7280' },
]

export async function listCategories(): Promise<Category[]> {
  const db = await getDb()
  const res = await db.query('SELECT * FROM categories ORDER BY name')
  return rows<CatRow>(res).map(toCat)
}

export async function createCategory(input: {
  name: string
  icon?: string
  color?: string
}): Promise<Category> {
  const db = await getDb()
  const accent = ACCENTS[await getSetting('accent')]?.value ?? ACCENTS.orange.value
  const res = await db.run(
    'INSERT INTO categories (name, icon, color, created_at) VALUES (?,?,?,?)',
    [input.name, input.icon ?? 'folder', input.color ?? accent, new Date().toISOString()],
  )
  const id = lastId(res)
  const cats = await listCategories()
  return cats.find((c) => c.id === id)!
}

export async function updateCategory(
  id: number,
  patch: { name?: string; icon?: string; color?: string },
): Promise<void> {
  const db = await getDb()
  const cur = (await listCategories()).find((c) => c.id === id)
  if (!cur) return
  await db.run('UPDATE categories SET name=?, icon=?, color=? WHERE id=?', [
    patch.name ?? cur.name,
    patch.icon ?? cur.icon,
    patch.color ?? cur.color,
    id,
  ])
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb()
  await db.run('DELETE FROM categories WHERE id=?', [id])
}

/** Seed default categories on first launch. */
export async function seedCategoriesIfEmpty(): Promise<void> {
  const db = await getDb()
  const res = await db.query('SELECT COUNT(*) AS n FROM categories')
  const n = Number((res.values?.[0] as { n?: number } | undefined)?.n ?? 0)
  if (n > 0) return
  const now = new Date().toISOString()
  for (const c of DEFAULT_CATEGORIES) {
    await db.run(
      'INSERT OR IGNORE INTO categories (name, icon, color, created_at) VALUES (?,?,?,?)',
      [c.name, c.icon, c.color, now],
    )
  }
}
