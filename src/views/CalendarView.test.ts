import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import CalendarView from './CalendarView.vue'
import { store } from '../store'
import { todayIso } from '../domain/dates'
import type { Subscription } from '../types'

const router = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  })

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 1,
  name: 'Netflix',
  priceMinor: 99900,
  currency: 'RUB',
  periodDays: 30,
  startDate: '2026-01-01',
  nextPaymentDate: todayIso(),
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
})

describe('CalendarView', () => {
  it('shows the current month and marks today', async () => {
    const now = new Date()
    const w = mount(CalendarView, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`)
    expect(w.find('.ring-violet-500').exists()).toBe(true)
  })

  it('renders payment dots for subscriptions in the month', async () => {
    store.subscriptions = [sub()]
    const w = mount(CalendarView, { global: { plugins: [router()] } })
    await flushPromises()
    // dot spans carry w-1.5; the today cell shows them for the anchored date
    expect(w.find('span[class*="w-1.5"]').exists()).toBe(true)
  })

  it('navigates between months', async () => {
    const now = new Date()
    const w = mount(CalendarView, { global: { plugins: [router()] } })
    const [prevBtn, nextBtn] = w.findAll('header button')
    await nextBtn.trigger('click')
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    expect(w.text()).toContain(`${MONTHS[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`)
    await prevBtn.trigger('click')
    await prevBtn.trigger('click')
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    expect(w.text()).toContain(`${MONTHS[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`)
  })
})
