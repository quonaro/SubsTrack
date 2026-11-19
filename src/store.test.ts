// Store tests against real SQLite: mutations go through the repositories
// (rescheduleAll/requestNotificationPermission are no-ops off native), the
// computed views are pure Vue reactivity.
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from './db/testdb'
import { setDbForTesting } from './db'
import { migrate } from './db/schema'
import { getSetting } from './domain/settings'
import {
  activeSubscriptions,
  categoryOf,
  createCategory,
  createSubscription,
  deleteCategory,
  deleteSubscription,
  initStore,
  listRulesFor,
  markPaid,
  monthlyTotal,
  replaceRules,
  setSubActive,
  store,
  updateSetting,
  updateSubscription,
  visibleSubscriptions,
  yearlyTotal,
} from './store'
import type { Subscription } from './types'

const subInput = (name: string, over: Record<string, unknown> = {}) => ({
  name,
  priceMinor: 30000,
  currency: 'RUB',
  periodDays: 30,
  startDate: '2026-01-01',
  nextPaymentDate: '2026-01-15',
  ...over,
})

const fakeSub = (over: Partial<Subscription>): Subscription => ({
  id: 0,
  name: 'X',
  priceMinor: 0,
  currency: 'RUB',
  periodDays: 30,
  startDate: '2026-01-01',
  nextPaymentDate: '2026-01-01',
  icon: '📦',
  isActive: true,
  reminderEnabled: true,
  categoryId: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
  store.ready = false
  store.subscriptions = []
  store.categories = []
  store.events = []
  store.payments = []
  store.settings = {
    baseCurrency: 'RUB',
    theme: 'dark',
    themeMode: 'dark',
    accent: 'orange',
    preset: 'default',
  }
  store.sortMode = 'next_date'
  store.showArchived = false
})

describe('store', () => {
  it('initStore loads slices and marks itself ready', async () => {
    expect(store.ready).toBe(false)
    await initStore()
    expect(store.ready).toBe(true)
    expect(store.subscriptions).toEqual([])
    expect(store.settings.baseCurrency).toBe('RUB')
  })

  it('visibleSubscriptions sorts by next date, name and price', async () => {
    store.subscriptions = [
      fakeSub({ id: 1, name: 'В', priceMinor: 100, nextPaymentDate: '2026-03-01' }),
      fakeSub({ id: 2, name: 'А', priceMinor: 900, nextPaymentDate: '2026-01-01' }),
      fakeSub({ id: 3, name: 'Б', priceMinor: 500, nextPaymentDate: '2026-02-01' }),
    ]
    expect(visibleSubscriptions.value.map((s) => s.id)).toEqual([2, 3, 1])
    store.sortMode = 'name'
    expect(visibleSubscriptions.value.map((s) => s.name)).toEqual(['А', 'Б', 'В'])
    store.sortMode = 'price'
    expect(visibleSubscriptions.value.map((s) => s.priceMinor)).toEqual([900, 500, 100])
  })

  it('visibleSubscriptions hides archived unless showArchived', async () => {
    store.subscriptions = [fakeSub({ id: 1, isActive: true }), fakeSub({ id: 2, isActive: false })]
    expect(visibleSubscriptions.value.map((s) => s.id)).toEqual([1])
    store.showArchived = true
    expect(visibleSubscriptions.value.map((s) => s.id)).toEqual([1, 2])
    expect(activeSubscriptions.value.map((s) => s.id)).toEqual([1])
  })

  it('monthly/yearly totals honor the base currency', async () => {
    store.subscriptions = [
      fakeSub({ id: 1, priceMinor: 30000, periodDays: 30 }),
      fakeSub({ id: 2, priceMinor: 999999, isActive: false }),
    ]
    expect(monthlyTotal.value).toBe(30000)
    store.settings.baseCurrency = 'USD'
    // 300 RUB/mo at 95 RUB/USD ≈ 316 US cents
    expect(monthlyTotal.value).toBe(316)
    expect(yearlyTotal.value).toBe(3842)
  })

  it('categoryOf resolves the category or null', async () => {
    store.categories = [{ id: 5, name: 'Видео', color: '#fff', icon: '🎬', createdAt: '' }]
    expect(categoryOf(fakeSub({ id: 1, categoryId: 5 }))?.name).toBe('Видео')
    expect(categoryOf(fakeSub({ id: 1, categoryId: 6 }))).toBeNull()
    expect(categoryOf(fakeSub({ id: 1, categoryId: null }))).toBeNull()
  })

  it('createSubscription refreshes subscriptions and events', async () => {
    const s = await createSubscription(subInput('Netflix'))
    expect(store.subscriptions.map((x) => x.id)).toEqual([s.id])
    expect(store.events[0].type).toBe('created')
  })

  it('updateSubscription patches fields and reloads', async () => {
    const s = await createSubscription(subInput('Old'))
    await updateSubscription(s.id, { name: 'New', priceMinor: 11100 })
    const back = store.subscriptions.find((x) => x.id === s.id)
    expect(back?.name).toBe('New')
    expect(back?.priceMinor).toBe(11100)
  })

  it('markPaid appends a payment and rolls the date', async () => {
    const s = await createSubscription(subInput('P', { nextPaymentDate: '2026-01-01' }))
    await markPaid(s.id, '2026-01-01')
    expect(store.payments).toHaveLength(1)
    expect(store.subscriptions[0].nextPaymentDate).toBe('2026-01-31')
  })

  it('setSubActive archives and restores', async () => {
    const s = await createSubscription(subInput('A'))
    await setSubActive(s.id, false)
    expect(store.subscriptions[0].isActive).toBe(false)
    expect(visibleSubscriptions.value).toHaveLength(0)
    await setSubActive(s.id, true)
    expect(store.subscriptions[0].isActive).toBe(true)
  })

  it('deleteSubscription removes it from the store', async () => {
    const s = await createSubscription(subInput('D'))
    await deleteSubscription(s.id)
    expect(store.subscriptions).toHaveLength(0)
    expect(store.events.some((e) => e.type === 'deleted')).toBe(true)
  })

  it('category CRUD keeps store.categories in sync', async () => {
    const c = await createCategory({ name: 'Облако' })
    expect(store.categories.map((x) => x.name)).toEqual(['Облако'])
    const s = await createSubscription(subInput('S', { categoryId: c.id }))
    await deleteCategory(c.id)
    expect(store.categories).toHaveLength(0)
    // subscription reloaded with the FK cleared
    expect(store.subscriptions.find((x) => x.id === s.id)?.categoryId).toBeNull()
  })

  it('replaceRules + listRulesFor round-trip rule drafts', async () => {
    const s = await createSubscription(subInput('R'))
    await replaceRules(s.id, [{ kind: 'payment_day', atTime: '09:00' }])
    const rules = await listRulesFor(s.id)
    expect(rules).toHaveLength(1)
    expect(rules[0].kind).toBe('payment_day')
  })

  it('updateSetting writes through to the db and the store', async () => {
    await updateSetting('baseCurrency', 'EUR')
    expect(store.settings.baseCurrency).toBe('EUR')
    expect(await getSetting('baseCurrency')).toBe('EUR')
  })
})
