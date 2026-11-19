// Router guard tests. The 'restored' flag is module-level, so each test
// re-imports a fresh module graph (resetModules) — the store that the guard
// consults is the fresh instance from the same import round.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fresh = async () => {
  vi.resetModules()
  const { router, NAV_KEY } = await import('./router')
  return { router, NAV_KEY }
}

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

  it('redirects the legacy edit path to the list', async () => {
    const { router } = await fresh()
    await router.push('/subscriptions/7/edit')
    expect(router.currentRoute.value.name).toBe('subscriptions')
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

describe('slideDirection', () => {
  it('slides forward along the display order', async () => {
    const { slideDirection } = await import('./router')
    expect(slideDirection('/history', '/')).toBe('fwd')
    expect(slideDirection('/subscriptions', '/')).toBe('fwd')
    expect(slideDirection('/calendar', '/subscriptions')).toBe('fwd')
    expect(slideDirection('/stats', '/calendar')).toBe('fwd')
    expect(slideDirection('/settings', '/stats')).toBe('fwd')
  })

  it('slides back against the display order', async () => {
    const { slideDirection } = await import('./router')
    expect(slideDirection('/', '/history')).toBe('back')
    expect(slideDirection('/', '/calendar')).toBe('back')
    expect(slideDirection('/subscriptions', '/stats')).toBe('back')
  })

  it('defaults to forward for unknown or equal paths', async () => {
    const { slideDirection } = await import('./router')
    expect(slideDirection('/nope', '/')).toBe('fwd')
    expect(slideDirection('/', '/nope')).toBe('fwd')
    expect(slideDirection('/', '/')).toBe('fwd')
  })
})
