import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import SubscriptionsView from './SubscriptionsView.vue'
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

describe('SubscriptionsView', () => {
  it('renders the subscription list', async () => {
    store.subscriptions = [sub({ id: 1, name: 'Netflix' }), sub({ id: 2, name: 'Spotify' })]
    const w = mount(SubscriptionsView, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Netflix')
    expect(w.text()).toContain('Spotify')
  })

  it('shows the empty state', async () => {
    const w = mount(SubscriptionsView, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Подписок пока нет')
  })

  it('hides archived subs until the toggle is on', async () => {
    store.subscriptions = [sub({ name: 'Active' }), sub({ id: 2, name: 'Gone', isActive: false })]
    const w = mount(SubscriptionsView, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Active')
    expect(w.text()).not.toContain('Gone')
    store.showArchived = true
    await flushPromises()
    expect(w.text()).toContain('Gone')
  })

  it('opens the sort picker', async () => {
    const w = mount(SubscriptionsView, { global: { plugins: [router()] } })
    await w.find('header button').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('По дате платежа')
  })
})
