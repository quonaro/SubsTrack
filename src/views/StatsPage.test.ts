import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import StatsPage from './StatsPage.vue'
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
  isOneTime: false,
  startDate: '2026-01-01',
  nextPaymentDate: '2026-01-01',
  icon: '🎬',
  iconColor: null,
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
  store.payments = []
  store.settings = {
    baseCurrency: 'RUB',
    theme: 'dark',
    themeMode: 'dark',
    accent: 'orange',
    preset: 'default',
  }
})

describe('StatsPage', () => {
  it('renders totals and the category breakdown', async () => {
    store.categories = [{ id: 4, name: 'Видео', color: '#fff', icon: '🎬', createdAt: '' }]
    store.subscriptions = [sub({ categoryId: 4 })]
    const w = mount(StatsPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Статистика')
    expect(w.text()).toContain('В месяц')
    expect(w.text()).toContain('Видео')
  })

  it('renders an empty state gracefully', async () => {
    const w = mount(StatsPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Статистика')
  })
})
