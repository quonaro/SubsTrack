// Router guard tests. The 'restored' flag is module-level, so each test
// re-imports a fresh module graph (resetModules) — the store that the guard
// consults is the fresh instance from the same import round.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fresh = async () => {
  vi.resetModules()
  const { router, NAV_KEY } = await import('./router')
  const { store } = await import('./store')
  return { router, store, NAV_KEY }
}

const sub = (id: number) => ({
  id,
  name: 'S',
  priceMinor: 100,
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
})

beforeEach(() => {
  localStorage.clear()
})

describe('router guards', () => {
  it('persists the current path after each navigation', async () => {
    const { router, NAV_KEY } = await fresh()
    await router.push('/stats')
    expect(localStorage.getItem(NAV_KEY)).toBe('/stats')
    await router.push('/calendar')
    expect(localStorage.getItem(NAV_KEY)).toBe('/calendar')
  })

  it('restores the saved route on the first navigation', async () => {
    localStorage.setItem('substrack:nav', '/history')
    const { router } = await fresh()
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/history')
  })

  it('does not restore "/" and ignores a missing flag', async () => {
    localStorage.setItem('substrack:nav', '/')
    const { router } = await fresh()
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('restores only once — later navigations go where asked', async () => {
    localStorage.setItem('substrack:nav', '/history')
    const { router } = await fresh()
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/history')
    await router.push('/stats')
    expect(router.currentRoute.value.path).toBe('/stats')
  })

  it('redirects sub-edit to the list when the subscription is gone', async () => {
    const { router, store } = await fresh()
    store.ready = true
    store.subscriptions = []
    await router.push('/subscriptions/7/edit')
    expect(router.currentRoute.value.name).toBe('subscriptions')
  })

  it('lets sub-edit through for an existing subscription', async () => {
    const { router, store } = await fresh()
    store.ready = true
    store.subscriptions = [sub(7)]
    await router.push('/subscriptions/7/edit')
    expect(router.currentRoute.value.name).toBe('sub-edit')
    expect(router.currentRoute.value.params.id).toBe('7')
  })

  it('lets sub-edit through while the store is not ready yet', async () => {
    const { router, store } = await fresh()
    store.ready = false
    await router.push('/subscriptions/7/edit')
    expect(router.currentRoute.value.name).toBe('sub-edit')
  })

  it('redirects the legacy /subscriptions/new path to the list', async () => {
    const { router } = await fresh()
    await router.push('/subscriptions/new')
    expect(router.currentRoute.value.name).toBe('subscriptions')
  })

  it('redirects unknown paths to home', async () => {
    const { router } = await fresh()
    await router.push('/no/such/page')
    expect(router.currentRoute.value.path).toBe('/')
  })
})
