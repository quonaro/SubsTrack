// Form component: mount in create/edit mode, fill fields, save — the write
// path goes through the store into a real in-memory SQLite db.
import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SubscriptionForm from './SubscriptionForm.vue'
import { createSubscription, createCategory, store } from '../store'
import { getSubscription, listSubscriptions } from '../domain/subscriptions'
import { listCategories } from '../domain/categories'
import { ONE_TIME_PERIOD_DAYS } from '../domain/dates'
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

  it('saves the chosen icon background color', async () => {
    const w = mountForm()
    await w.find('input[placeholder="Netflix, Spotify…"]').setValue('Netflix')
    await w.find('input[inputmode="decimal"]').setValue('499')
    const red = document.body.querySelector('button[aria-label="Красный"]')
    await new DOMWrapper(red!).trigger('click')
    const save = w.findAll('button').find((b) => b.text() === 'Добавить платёж')!
    await save.trigger('click')
    await flushPromises()
    const subs = await listSubscriptions()
    expect(subs).toHaveLength(1)
    expect(subs[0].iconColor).toBe('#ef4444')
    w.unmount()
  })

  it('tints the icon preview as soon as a color is picked', async () => {
    const w = mountForm()
    const tile = () => w.find('button[aria-label="Выбрать иконку"]').element as HTMLElement
    expect(tile().style.backgroundColor).toBe('rgba(107, 114, 128, 0.15)')
    const red = document.body.querySelector('button[aria-label="Красный"]')
    await new DOMWrapper(red!).trigger('click')
    expect(tile().style.backgroundColor).toBe('rgba(239, 68, 68, 0.15)')
    w.unmount()
  })

  it('keeps notes in a textarea and saves them multiline', async () => {
    const s = await createSubscription({
      name: 'Netflix',
      priceMinor: 12300,
      currency: 'RUB',
      periodDays: 30,
      startDate: '2026-01-10',
      nextPaymentDate: '2026-02-10',
      notes: 'первая\nвторая',
    })
    const w = mountForm(s.id)
    await flushPromises()
    const notes = w.find('textarea')
    expect((notes.element as HTMLTextAreaElement).value).toBe('первая\nвторая')
    await notes.setValue('первая\nвторая\nтретья')
    const save = w.findAll('button').find((b) => b.text() === 'Сохранить')!
    await save.trigger('click')
    await flushPromises()
    expect((await getSubscription(s.id))?.notes).toBe('первая\nвторая\nтретья')
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

  it('saves a one-time purchase with the non-recurring period', async () => {
    const w = mountForm()
    await w.find('input[placeholder="Netflix, Spotify…"]').setValue('Домен')
    await w.find('input[inputmode="decimal"]').setValue('1290')
    const periodButton = w.findAll('button').find((b) => b.text() === 'Ежемесячно')!
    await periodButton.trigger('click')
    await flushPromises()
    const once = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Разово'),
    )!
    await new DOMWrapper(once).trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Дата платежа')
    const save = w.findAll('button').find((b) => b.text() === 'Добавить платёж')!
    await save.trigger('click')
    await flushPromises()
    const subs = await listSubscriptions()
    expect(subs).toHaveLength(1)
    expect(subs[0].isOneTime).toBe(true)
    expect(subs[0].periodDays).toBe(ONE_TIME_PERIOD_DAYS)
    w.unmount()
  })

  it('prefills the one-time period in edit mode', async () => {
    const s = await createSubscription({
      name: 'Домен',
      priceMinor: 129000,
      currency: 'RUB',
      periodDays: ONE_TIME_PERIOD_DAYS,
      isOneTime: true,
      startDate: '2026-01-10',
      nextPaymentDate: '2026-02-10',
    })
    const w = mountForm(s.id)
    await flushPromises()
    expect(w.text()).toContain('Разово')
    expect(w.text()).toContain('Дата платежа')
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

  it('asks for confirmation before deleting a category', async () => {
    await createCategory({ name: 'Связь', icon: '📱' })
    const w = mountForm()
    await w.find('button[aria-label="Категории"]').trigger('click')
    await flushPromises()
    const trash = document.body.querySelector('button[aria-label="Удалить категорию Связь"]')
    expect(trash).toBeTruthy()
    await new DOMWrapper(trash as Element).trigger('click')
    await flushPromises()
    // The trash tap only opens the sheet — nothing is deleted yet.
    expect(document.body.textContent).toContain('Удалить категорию?')
    expect(await listCategories()).toHaveLength(1)

    const confirm = [...document.body.querySelectorAll('button')].filter(
      (b) => b.textContent?.trim() === 'Удалить',
    )
    await new DOMWrapper(confirm.at(-1) as Element).trigger('click')
    await flushPromises()
    expect(await listCategories()).toHaveLength(0)
    w.unmount()
  })
})
