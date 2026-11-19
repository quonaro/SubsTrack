import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import SubscriptionsPage from './SubscriptionsPage.vue'
import { store } from '../store'
import type { Subscription } from '../types'

const router = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  })

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 1,
  name: 'Netflix',
  priceMinor: 99900,
  currency: 'RUB',
  periodDays: 30,
  startDate: '2026-01-01',
  nextPaymentDate: '2026-01-01',
  icon: '🎬',
  isActive: true,
  reminderEnabled: true,
  categoryId: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

beforeEach(() => {
  store.subscriptions = []
  store.categories = []
  store.showArchived = false
  store.sortMode = 'next_date'
})

describe('SubscriptionsPage', () => {
  it('renders the subscription list', async () => {
    store.subscriptions = [sub({ id: 1, name: 'Netflix' }), sub({ id: 2, name: 'Spotify' })]
    const w = mount(SubscriptionsPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Netflix')
    expect(w.text()).toContain('Spotify')
  })

  it('shows the empty state', async () => {
    const w = mount(SubscriptionsPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Подписок пока нет')
  })

  it('reserves bottom padding for the FAB only when the list is non-empty', async () => {
    const w = mount(SubscriptionsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const root = w.find('div')
    expect(root.classes()).toContain('pb-6')
    expect(root.classes()).not.toContain('pb-24')
    store.subscriptions = [sub()]
    await flushPromises()
    expect(root.classes()).toContain('pb-24')
    expect(root.classes()).not.toContain('pb-6')
  })

  it('hides archived subs until the toggle is on', async () => {
    store.subscriptions = [sub({ name: 'Active' }), sub({ id: 2, name: 'Gone', isActive: false })]
    const w = mount(SubscriptionsPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Active')
    expect(w.text()).not.toContain('Gone')
    store.showArchived = true
    await flushPromises()
    expect(w.text()).toContain('Gone')
  })

  it('opens the new-subscription sheet from the FAB', async () => {
    const w = mount(SubscriptionsPage, {
      global: { plugins: [router()] },
      attachTo: document.body,
    })
    await flushPromises()
    expect(document.body.textContent).not.toContain('Дата первого платежа')
    await w.find('button.fixed').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Новая подписка')
    expect(document.body.querySelector('input[placeholder="Netflix, Spotify…"]')).toBeTruthy()
    w.unmount()
  })

  it('opens the sort sheet and applies the picked option', async () => {
    const w = mount(SubscriptionsPage, {
      global: { plugins: [router()] },
      attachTo: document.body,
    })
    await w.find('header button').trigger('click')
    await flushPromises()
    const btn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('По цене'),
    )
    expect(btn).toBeTruthy()
    await new DOMWrapper(btn!).trigger('click')
    expect(store.sortMode).toBe('price')
    w.unmount()
  })
})
