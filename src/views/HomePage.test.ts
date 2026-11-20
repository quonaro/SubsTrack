import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import HomePage from './HomePage.vue'
import { store } from '../store'
import { addDays, todayIso } from '../domain/dates'
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
  nextPaymentDate: todayIso(),
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
  store.settings = {
    baseCurrency: 'RUB',
    theme: 'dark',
    themeMode: 'dark',
    accent: 'orange',
    preset: 'default',
  }
})

describe('HomePage', () => {
  it('shows totals and the upcoming list', async () => {
    store.subscriptions = [sub()]
    const w = mount(HomePage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Главная')
    expect(w.text()).toContain('В месяц')
    expect(w.text()).toContain('В год')
    expect(w.text()).toContain('Ближайшие платежи')
    expect(w.text()).toContain('Netflix')
  })

  it('shows the empty upcoming state and hides far-future subs', async () => {
    store.subscriptions = [sub({ nextPaymentDate: addDays(todayIso(), 30) })]
    const w = mount(HomePage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('В ближайшие 7 дней платежей нет')
  })
})
