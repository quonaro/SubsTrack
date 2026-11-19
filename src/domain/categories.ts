import { getDb, rows, lastId } from '../db'
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
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#ef4444',
]

const DEFAULT_CATEGORIES: { name: string; icon: string; color: string }[] = [
  { name: 'Видео', icon: '🎬', color: '#ef4444' },
  { name: 'Музыка', icon: '🎵', color: '#22c55e' },
  { name: 'Игры', icon: '🎮', color: '#8b5cf6' },
  { name: 'Облако', icon: '☁️', color: '#3b82f6' },
  { name: 'Работа', icon: '💼', color: '#eab308' },
  { name: 'Прочее', icon: '📦', color: '#6b7280' },
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
  const res = await db.run(
    'INSERT INTO categories (name, icon, color, created_at) VALUES (?,?,?,?)',
    [input.name, input.icon ?? '📁', input.color ?? CATEGORY_COLORS[0], new Date().toISOString()],
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
