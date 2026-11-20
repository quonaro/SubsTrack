// The modal is a thin edit wrapper around SubscriptionForm: it feeds subId
// in as the edit target and translates saved into a close event.
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import SubscriptionEditModal from './SubscriptionEditModal.vue'
import { createSubscription, store } from '../store'
import { getSubscription } from '../domain/subscriptions'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'

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

const mountModal = (subId: number | null) =>
  mount(SubscriptionEditModal, { props: { subId }, attachTo: document.body })

describe('SubscriptionEditModal', () => {
  it('stays closed while subId is null', async () => {
    const w = mountModal(null)
    await flushPromises()
    expect(document.body.textContent).not.toContain('Редактировать')
    w.unmount()
  })

  it('renders the edit form for subId and emits close on save', async () => {
    const s = await seed()
    const w = mountModal(s.id)
    await flushPromises()
    expect(document.body.textContent).toContain('Редактировать')
    const nameInput = document.body.querySelector<HTMLInputElement>(
      'input[placeholder="Netflix, Spotify…"]',
    )!
    expect(nameInput.value).toBe('Old Name')
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(nameInput, 'New Name')
    nameInput.dispatchEvent(new Event('input'))
    await flushPromises()
    const save = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Сохранить',
    )!
    save.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect((await getSubscription(s.id))?.name).toBe('New Name')
    expect(w.emitted('close')).toBeTruthy()
    w.unmount()
  })

  const nameInput = () =>
    document.body.querySelector<HTMLInputElement>('input[placeholder="Netflix, Spotify…"]')!

  async function typeName(value: string): Promise<void> {
    const input = nameInput()
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, value)
    input.dispatchEvent(new Event('input'))
    await flushPromises()
  }

  function pressEscape(): void {
    const dialog = document.body.querySelector('[role="dialog"]')!
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  }

  it('saves a debounced edit when the sheet is closed instead of waiting for the timer', async () => {
    const s = await seed()
    const w = mountModal(s.id)
    await flushPromises()
    await typeName('Closed Early')
    // closed before the 800ms autosave tick fires
    pressEscape()
    await flushPromises()
    expect((await getSubscription(s.id))?.name).toBe('Closed Early')
    expect(w.emitted('close')).toBeTruthy()
    w.unmount()
  })

  it('keeps the sheet open and shows the error when the draft is invalid', async () => {
    const s = await seed()
    const w = mountModal(s.id)
    await flushPromises()
    await typeName('')
    pressEscape()
    await flushPromises()
    expect((await getSubscription(s.id))?.name).toBe('Old Name')
    expect(w.emitted('close')).toBeUndefined()
    expect(document.body.textContent).toContain('Введите название')
    expect(document.body.textContent).toContain('Редактировать')
    w.unmount()
  })
})
