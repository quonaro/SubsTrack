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
  store.payments = []
})

const sub = () => ({
  id: 1,
  name: 'Netflix',
  priceMinor: 99900,
  currency: 'RUB',
  periodDays: 30,
  periodMonths: 0,
  periodDay: 0,
  isOneTime: false,
  startDate: '2026-01-01',
  nextPaymentDate: '2026-02-01',
  icon: '🎬',
  iconColor: null,
  isActive: true,
  reminderEnabled: true,
  categoryId: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
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
        periodMonths: 0,
        periodDay: 0,
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
    expect(w.text()).toContain('след. 1 февраля')
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

  it('offers undo only for the newest payment of a subscription', async () => {
    store.subscriptions = [sub()]
    store.payments = [
      {
        id: 10,
        subscriptionId: 1,
        amountMinor: 99900,
        currency: 'RUB',
        paidDate: '2026-01-01',
        createdAt: '',
      },
      {
        id: 20,
        subscriptionId: 1,
        amountMinor: 99900,
        currency: 'RUB',
        paidDate: '2026-02-01',
        createdAt: '',
      },
    ]
    store.events = [
      {
        id: 3,
        subscriptionId: 1,
        type: 'payment',
        payload: JSON.stringify({
          paymentId: 20,
          amountMinor: 99900,
          currency: 'RUB',
          paidDate: '2026-02-01',
          nextPaymentDate: '2026-03-03',
          prevNextPaymentDate: '2026-02-01',
        }),
        createdAt: '2026-02-01T10:00:00.000Z',
      },
      {
        id: 2,
        subscriptionId: 1,
        type: 'payment',
        payload: JSON.stringify({
          paymentId: 10,
          amountMinor: 99900,
          currency: 'RUB',
          paidDate: '2026-01-01',
          nextPaymentDate: '2026-01-31',
          prevNextPaymentDate: '2026-01-01',
        }),
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ]
    const w = mount(HistoryPage, { global: { plugins: [router()] } })
    await flushPromises()
    const undoButtons = w.findAll('button').filter((b) => b.text() === 'Отменить')
    expect(undoButtons).toHaveLength(1)
    expect(undoButtons[0].classes()).toContain('bg-red-600')
  })

  it('colour-codes event icons by type', async () => {
    store.events = [
      {
        id: 2,
        subscriptionId: null,
        type: 'payment_cancelled',
        payload: JSON.stringify({ name: 'Netflix' }),
        createdAt: '2026-01-02T10:00:00.000Z',
      },
      {
        id: 1,
        subscriptionId: null,
        type: 'updated',
        payload: JSON.stringify({ name: 'Netflix' }),
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ]
    const w = mount(HistoryPage, { global: { plugins: [router()] } })
    await flushPromises()
    const tiles = w.findAll('div').filter((d) => d.classes().includes('rounded-full'))
    expect(tiles).toHaveLength(2)
    expect(tiles[0].classes()).toContain('text-rose-400')
    expect(tiles[1].classes()).toContain('text-sky-400')
  })

  it('resolves legacy payment events without a paymentId', async () => {
    store.subscriptions = [sub()]
    store.payments = [
      {
        id: 7,
        subscriptionId: 1,
        amountMinor: 99900,
        currency: 'RUB',
        paidDate: '2026-02-01',
        createdAt: '',
      },
    ]
    store.events = [
      {
        id: 1,
        subscriptionId: 1,
        type: 'payment',
        payload: JSON.stringify({
          amountMinor: 99900,
          currency: 'RUB',
          paidDate: '2026-02-01',
          nextPaymentDate: '2026-03-03',
        }),
        createdAt: '2026-02-01T10:00:00.000Z',
      },
    ]
    const w = mount(HistoryPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.findAll('button').filter((b) => b.text() === 'Отменить')).toHaveLength(1)
  })

  it('asks for confirmation before undoing the mark', async () => {
    store.subscriptions = [sub()]
    store.payments = [
      {
        id: 7,
        subscriptionId: 1,
        amountMinor: 99900,
        currency: 'RUB',
        paidDate: '2026-02-01',
        createdAt: '',
      },
    ]
    store.events = [
      {
        id: 1,
        subscriptionId: 1,
        type: 'payment',
        payload: JSON.stringify({
          paymentId: 7,
          amountMinor: 99900,
          currency: 'RUB',
          paidDate: '2026-02-01',
          nextPaymentDate: '2026-03-03',
          prevNextPaymentDate: '2026-02-01',
        }),
        createdAt: '2026-02-01T10:00:00.000Z',
      },
    ]
    const w = mount(HistoryPage, {
      global: { plugins: [router()] },
      attachTo: document.body,
    })
    await flushPromises()
    const undo = w.findAll('button').find((b) => b.text() === 'Отменить')
    expect(undo).toBeTruthy()
    await undo!.trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Снять отметку об оплате?')
    expect(document.body.textContent).toContain('Netflix')
    w.unmount()
  })
})
