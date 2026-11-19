// Integration tests against real SQLite (sql.js in memory).
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '../db/testdb'
import { getDb, setDbForTesting } from '../db'
import { migrate } from '../db/schema'
import { ACCENTS } from '../theme'
import {
  createCategory,
  deleteCategory,
  listCategories,
  seedCategoriesIfEmpty,
  updateCategory,
} from './categories'
import { setSetting } from './settings'
import { createSubscription, getSubscription } from './subscriptions'

const catInput = { name: 'Стриминг', icon: '📺', color: '#123456' }

const subInput = (categoryId: number | null = null) => ({
  name: 'Sub',
  priceMinor: 10000,
  currency: 'RUB',
  periodDays: 30,
  startDate: '2026-01-01',
  nextPaymentDate: '2026-01-01',
  categoryId,
})

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
})

describe('categories (sqlite)', () => {
  it('creates a category with explicit fields', async () => {
    const c = await createCategory(catInput)
    expect(c.id).toBeGreaterThan(0)
    expect(c.name).toBe('Стриминг')
    expect(c.icon).toBe('📺')
    expect(c.color).toBe('#123456')
    expect(c.createdAt).toBeTruthy()
  })

  it('falls back to default icon and the accent color', async () => {
    const c = await createCategory({ name: 'Без всего' })
    expect(c.icon).toBe('📁')
    expect(c.color).toBe(ACCENTS.orange.value)
  })

  it('uses the currently selected accent for the default color', async () => {
    await setSetting('accent', 'blue')
    const c = await createCategory({ name: 'Синяя' })
    expect(c.color).toBe(ACCENTS.blue.value)
  })

  it('recolors legacy violet categories on migration', async () => {
    const db = await getDb()
    await db.execute('PRAGMA user_version = 1')
    await db.run(
      "INSERT INTO categories (name, color, created_at) VALUES ('Старая', '#8b5cf6', 'x')",
    )
    await migrate()
    expect((await listCategories())[0].color).toBe('#f15a24')
  })

  it('lists categories sorted by name', async () => {
    await createCategory({ name: 'Яблоко' })
    await createCategory({ name: 'Арбуз' })
    const names = (await listCategories()).map((c) => c.name)
    expect(names).toEqual(['Арбуз', 'Яблоко'])
  })

  it('rejects duplicate names', async () => {
    await createCategory({ name: 'Дубль' })
    await expect(createCategory({ name: 'Дубль' })).rejects.toThrow()
  })

  it('updates only the patched fields', async () => {
    const c = await createCategory(catInput)
    await updateCategory(c.id, { name: 'Новое имя' })
    const [back] = await listCategories()
    expect(back.name).toBe('Новое имя')
    expect(back.icon).toBe('📺')
    expect(back.color).toBe('#123456')
  })

  it('updateCategory on a missing id is a no-op', async () => {
    await updateCategory(999, { name: 'x' })
    expect(await listCategories()).toHaveLength(0)
  })

  it('deletes a category', async () => {
    const c = await createCategory(catInput)
    await deleteCategory(c.id)
    expect(await listCategories()).toHaveLength(0)
  })

  it('nulls subscription.category_id when the category is deleted', async () => {
    const c = await createCategory(catInput)
    const s = await createSubscription(subInput(c.id))
    expect(s.categoryId).toBe(c.id)
    await deleteCategory(c.id)
    expect((await getSubscription(s.id))?.categoryId).toBeNull()
  })

  it('seeds the default set once and only into an empty table', async () => {
    await seedCategoriesIfEmpty()
    const seeded = await listCategories()
    expect(seeded.length).toBeGreaterThanOrEqual(6)
    await seedCategoriesIfEmpty()
    expect(await listCategories()).toHaveLength(seeded.length)
    // a hand-made category also blocks seeding
    await deleteCategory(seeded[0].id)
    await deleteCategory(seeded[1].id)
    await seedCategoriesIfEmpty()
    expect((await listCategories()).length).toBe(seeded.length - 2)
  })
})
