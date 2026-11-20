import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SubscriptionsPage from './SubscriptionsPage.vue'
import SubCard from '../components/SubCard.vue'
import { createSubscription, store } from '../store'
import { getSubscription } from '../domain/subscriptions'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'
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

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
  store.subscriptions = []
  store.categories = []
  store.showArchived = false
  store.sortMode = 'next_date'
})

afterEach(() => {
  vi.useRealTimers()
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
    expect(w.text()).toContain('Платежей пока нет')
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
    expect(document.body.textContent).toContain('Новый платёж')
    expect(document.body.querySelector('input[placeholder="Netflix, Spotify…"]')).toBeTruthy()
    w.unmount()
  })

  it('pays without the confirm sheet', async () => {
    store.subscriptions = [sub()]
    const w = mount(SubscriptionsPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.findComponent(SubCard).props('skipPayConfirm')).toBe(true)
  })

  it('opens the edit sheet on card tap', async () => {
    store.subscriptions = [sub()]
    const w = mount(SubscriptionsPage, {
      global: { plugins: [router()] },
      attachTo: document.body,
    })
    await flushPromises()
    await w.findComponent(SubCard).trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Следующий платёж')
    w.unmount()
  })

  it('opens the context menu on right-click and edits from it', async () => {
    store.subscriptions = [sub()]
    const w = mount(SubscriptionsPage, {
      global: { plugins: [router()] },
      attachTo: document.body,
    })
    await flushPromises()
    await w.findComponent(SubCard).trigger('contextmenu')
    await flushPromises()
    const edit = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Редактировать',
    )
    const del = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Удалить',
    )
    expect(edit).toBeTruthy()
    expect(del).toBeTruthy()
    await new DOMWrapper(edit!).trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Следующий платёж')
    w.unmount()
  })

  it('deletes a subscription via the context menu and confirm sheet', async () => {
    const s = await createSubscription({
      name: 'Doomed',
      priceMinor: 100,
      currency: 'RUB',
      periodDays: 30,
      startDate: '2026-01-10',
      nextPaymentDate: '2026-02-10',
    })
    const w = mount(SubscriptionsPage, {
      global: { plugins: [router()] },
      attachTo: document.body,
    })
    await flushPromises()
    await w.findComponent(SubCard).trigger('contextmenu')
    await flushPromises()
    const del = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Удалить',
    )!
    await new DOMWrapper(del).trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Удалить платёж?')
    const confirm = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Удалить',
    )!
    await new DOMWrapper(confirm).trigger('click')
    await flushPromises()
    expect(await getSubscription(s.id)).toBeNull()
    expect(document.body.textContent).not.toContain('Doomed')
    w.unmount()
  })

  it('opens the menu on long-press and swallows the trailing click', async () => {
    store.subscriptions = [sub()]
    const w = mount(SubscriptionsPage, {
      global: { plugins: [router()] },
      attachTo: document.body,
    })
    await flushPromises()
    const el = w.findComponent(SubCard).element as HTMLElement
    vi.useFakeTimers()
    const down = new Event('touchstart', { bubbles: true })
    Object.defineProperty(down, 'touches', { value: [{ clientX: 40, clientY: 40 }] })
    el.dispatchEvent(down)
    await vi.advanceTimersByTimeAsync(500)
    vi.useRealTimers()
    await flushPromises()
    expect(document.body.textContent).toContain('Редактировать')
    el.dispatchEvent(new Event('touchend', { bubbles: true }))
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(document.body.textContent).not.toContain('Следующий платёж')
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
