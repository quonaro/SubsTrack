import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import HistoryPage from './HistoryPage.vue'
import { store } from '../store'

const router = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  })

beforeEach(() => {
  store.events = []
  store.subscriptions = []
})

describe('HistoryPage', () => {
  it('shows the empty state', async () => {
    const w = mount(HistoryPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Событий пока нет')
  })

  it('renders labels, sub names and payment details', async () => {
    store.subscriptions = [
      {
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
      },
    ]
    store.events = [
      {
        id: 2,
        subscriptionId: 1,
        type: 'payment',
        payload: JSON.stringify({
          amountMinor: 99900,
          currency: 'RUB',
          nextPaymentDate: '2026-02-01',
        }),
        createdAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 1,
        subscriptionId: null,
        type: 'deleted',
        payload: JSON.stringify({ name: 'Old' }),
        createdAt: '2026-01-01T09:00:00.000Z',
      },
    ]
    const w = mount(HistoryPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Платёж')
    expect(w.text()).toContain('Netflix')
    expect(w.text()).toContain('след. 2026-02-01')
    expect(w.text()).toContain('Удалена')
    expect(w.text()).toContain('Old')
  })

  it('survives malformed event payloads', async () => {
    store.events = [
      {
        id: 1,
        subscriptionId: 1,
        type: 'updated',
        payload: '{broken json',
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ]
    const w = mount(HistoryPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Изменена')
  })
})
