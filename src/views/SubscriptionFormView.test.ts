// The view is a thin edit-page wrapper around SubscriptionForm: it feeds the
// route param in as subId and translates saved/deleted into navigation.
import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SubscriptionFormView from './SubscriptionFormView.vue'
import { createSubscription, store } from '../store'
import { getSubscription } from '../domain/subscriptions'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/subscriptions/:id(\\d+)/edit', name: 'sub-edit', component: SubscriptionFormView },
      { path: '/:pathMatch(.*)*', component: { template: '<div/>' } },
    ],
  })

const mountAt = async (router: Router, path: string) => {
  await router.push(path)
  vi.spyOn(router, 'back').mockImplementation(() => {})
  vi.spyOn(router, 'replace').mockImplementation(async () => {})
  return mount(SubscriptionFormView, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
}

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
  store.subscriptions = []
  store.categories = []
  store.events = []
  store.payments = []
})

const seed = () =>
  createSubscription({
    name: 'Old Name',
    priceMinor: 12300,
    currency: 'RUB',
    periodDays: 30,
    startDate: '2026-01-10',
    nextPaymentDate: '2026-02-10',
  })

describe('SubscriptionFormView', () => {
  it('renders the edit form for the route param and navigates back on save', async () => {
    const s = await seed()
    const router = makeRouter()
    const w = await mountAt(router, `/subscriptions/${s.id}/edit`)
    await flushPromises()
    expect(w.text()).toContain('Редактировать')
    const nameInput = w.find('input[placeholder="Netflix, Spotify…"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('Old Name')
    await nameInput.setValue('New Name')
    const save = w.findAll('button').find((b) => b.text() === 'Сохранить')!
    await save.trigger('click')
    await flushPromises()
    expect((await getSubscription(s.id))?.name).toBe('New Name')
    expect(router.back).toHaveBeenCalled()
    w.unmount()
  })

  it('replaces to the list after delete', async () => {
    const s = await seed()
    const router = makeRouter()
    const w = await mountAt(router, `/subscriptions/${s.id}/edit`)
    await flushPromises()
    const del = w.findAll('button').find((b) => b.text().includes('Удалить подписку'))!
    await del.trigger('click')
    await flushPromises()
    const confirm = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Удалить',
    )
    expect(confirm).toBeTruthy()
    await new DOMWrapper(confirm!).trigger('click')
    await flushPromises()
    expect(await getSubscription(s.id)).toBeNull()
    expect(router.replace).toHaveBeenCalledWith('/subscriptions')
    w.unmount()
  })
})
