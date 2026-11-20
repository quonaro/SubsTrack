// Form component: mount in create/edit mode, fill fields, save — the write
// path goes through the store into a real in-memory SQLite db.
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SubscriptionForm from './SubscriptionForm.vue'
import { createSubscription, store } from '../store'
import { getSubscription, listSubscriptions } from '../domain/subscriptions'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'

const mountForm = (subId: number | null = null) =>
  mount(SubscriptionForm, { props: { subId }, attachTo: document.body })

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
  store.subscriptions = []
  store.categories = []
  store.events = []
  store.payments = []
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SubscriptionForm', () => {
  it('validates required fields before writing', async () => {
    const w = mountForm()
    const save = w.findAll('button').find((b) => b.text() === 'Добавить платёж')!
    await save.trigger('click')
    expect(w.text()).toContain('Введите название')
    await w.find('input[placeholder="Netflix, Spotify…"]').setValue('X')
    await save.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Введите корректную цену')
    expect(await listSubscriptions()).toHaveLength(0)
    w.unmount()
  })

  it('creates a subscription and emits saved', async () => {
    const w = mountForm()
    await w.find('input[placeholder="Netflix, Spotify…"]').setValue('Netflix')
    await w.find('input[inputmode="decimal"]').setValue('499.50')
    const save = w.findAll('button').find((b) => b.text() === 'Добавить платёж')!
    await save.trigger('click')
    await flushPromises()
    const subs = await listSubscriptions()
    expect(subs).toHaveLength(1)
    expect(subs[0].name).toBe('Netflix')
    expect(subs[0].priceMinor).toBe(49950)
    expect(w.emitted('saved')).toHaveLength(1)
    w.unmount()
  })

  it('prefills fields in edit mode and saves changes', async () => {
    const s = await createSubscription({
      name: 'Old Name',
      priceMinor: 12300,
      currency: 'RUB',
      periodDays: 30,
      startDate: '2026-01-10',
      nextPaymentDate: '2026-02-10',
    })
    const w = mountForm(s.id)
    await flushPromises()
    const nameInput = w.find('input[placeholder="Netflix, Spotify…"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('Old Name')
    await nameInput.setValue('New Name')
    const save = w.findAll('button').find((b) => b.text() === 'Сохранить')!
    await save.trigger('click')
    await flushPromises()
    expect((await getSubscription(s.id))?.name).toBe('New Name')
    // startDate is preserved from the stored row
    expect((await getSubscription(s.id))?.startDate).toBe('2026-01-10')
    expect(w.emitted('saved')).toHaveLength(1)
    w.unmount()
  })

  it('autosaves edits in edit mode without emitting saved', async () => {
    const s = await createSubscription({
      name: 'Old Name',
      priceMinor: 12300,
      currency: 'RUB',
      periodDays: 30,
      startDate: '2026-01-10',
      nextPaymentDate: '2026-02-10',
    })
    vi.useFakeTimers()
    const w = mountForm(s.id)
    await flushPromises()
    await w.find('input[placeholder="Netflix, Spotify…"]').setValue('Auto Name')
    await vi.advanceTimersByTimeAsync(900)
    await flushPromises()
    expect((await getSubscription(s.id))?.name).toBe('Auto Name')
    expect(w.emitted('saved')).toBeUndefined()
    w.unmount()
  })

  it('does not autosave in create mode', async () => {
    vi.useFakeTimers()
    const w = mountForm()
    await flushPromises()
    await w.find('input[placeholder="Netflix, Spotify…"]').setValue('Typed')
    await vi.advanceTimersByTimeAsync(900)
    await flushPromises()
    expect(await listSubscriptions()).toHaveLength(0)
    w.unmount()
  })
})
