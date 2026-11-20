import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import CalendarPage from './CalendarPage.vue'
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

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 1,
  name: 'Netflix',
  priceMinor: 99900,
  currency: 'RUB',
  periodDays: 30,
  periodMonths: 0,
  periodDay: 0,
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
})

describe('CalendarPage', () => {
  it('renders the page title', async () => {
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.find('h1').text()).toBe('Календарь')
  })

  it('shows a subtitle with the current month payment count and total', async () => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    store.subscriptions = [
      sub({ nextPaymentDate: `${ym}-15`, periodDays: 300, priceMinor: 10000, currency: 'RUB' }),
    ]
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.find('header p').text()).toMatch(/^1 платёж · 100\s₽$/)
  })

  it('shows an empty subtitle when nothing is due this month', async () => {
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.find('header p').text()).toBe('Нет платежей в этом месяце')
  })

  it('shows the current month and marks today', async () => {
    const now = new Date()
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`)
    expect(w.find('.ring-accent').exists()).toBe(true)
  })

  it('renders payment dots for subscriptions in the month', async () => {
    store.subscriptions = [sub()]
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    // dot spans carry w-1.5; the today cell shows them for the anchored date
    expect(w.find('span[class*="w-1.5"]').exists()).toBe(true)
  })

  it('renders a scrolling window of months starting at the current one', async () => {
    const now = new Date()
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const sections = w.findAll('section[data-month]')
    expect(sections.length).toBe(13)
    expect(sections[0].attributes('data-month')).toBe(key)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    expect(w.text()).toContain(`${MONTHS[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`)
  })

  it('does not extend the window backwards past the current month', async () => {
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    const grid = w.find('div[class*="overflow-y-auto"]')
    const el = grid.element as HTMLElement
    Object.defineProperty(el, 'clientHeight', { value: 600, configurable: true })
    Object.defineProperty(el, 'scrollHeight', { value: 1200, configurable: true })
    el.scrollTop = 0
    await grid.trigger('scroll')
    await flushPromises()
    expect(w.findAll('section[data-month]').length).toBe(13)
  })

  it('extends the window downwards on scroll', async () => {
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    const grid = w.find('div[class*="overflow-y-auto"]')
    const el = grid.element as HTMLElement
    Object.defineProperty(el, 'clientHeight', { value: 600, configurable: true })
    Object.defineProperty(el, 'scrollHeight', { value: 1200, configurable: true })
    el.scrollTop = 1200
    await grid.trigger('scroll')
    await flushPromises()
    expect(w.findAll('section[data-month]').length).toBe(19)
  })

  it('opens the day sheet with the date spelled out', async () => {
    store.subscriptions = [sub()]
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    await w.find('.ring-accent').trigger('click')
    await flushPromises()
    const [y, m, d] = todayIso().split('-').map(Number)
    expect(document.body.textContent).toContain(`${d} ${MONTHS_GENITIVE[m - 1]} ${y}`)
  })

  it('fills leading and trailing blanks with disabled dates of adjacent months', async () => {
    const now = new Date()
    const w = mount(CalendarPage, { global: { plugins: [router()] } })
    await flushPromises()
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const offset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7
    const prevDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const section = w.find(`section[data-month="${key}"]`)
    const cells = section.findAll('div.grid.grid-cols-7 > button')
    expect(cells.length % 7).toBe(0)
    const leading = cells.slice(0, offset)
    expect(leading.map((b) => b.text())).toEqual(
      Array.from({ length: offset }, (_, i) => String(prevDays - offset + 1 + i)),
    )
    for (const b of leading) expect(b.attributes('disabled')).toBeDefined()
    const trailing = cells.slice(offset + daysInMonth)
    expect(trailing.map((b) => b.text())).toEqual(
      Array.from({ length: trailing.length }, (_, i) => String(i + 1)),
    )
    for (const b of trailing) expect(b.attributes('disabled')).toBeDefined()
  })
})
