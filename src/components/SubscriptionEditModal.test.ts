// The modal is a thin edit wrapper around SubscriptionForm: it feeds subId
// in as the edit target and translates saved into a close event.
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  // jsdom reports no animations, so Reka's Presence unmounts a closing dialog
  // on the same tick. Report a running animation to inspect the mid-exit DOM.
  function holdExitAnimations() {
    const original = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation(((el: Element) => {
      const style = original(el)
      return new Proxy(style, {
        get: (target, key) =>
          key === 'animationName' ? 'test-out' : Reflect.get(target, key, target),
      })
    }) as typeof window.getComputedStyle)
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('keeps the form in the sheet until the exit animation ends', async () => {
    const s = await seed()
    holdExitAnimations()
    const w = mountModal(s.id)
    await flushPromises()
    expect(nameInput().value).toBe('Old Name')

    // Clearing subId starts the close: the sheet slides out with its content
    // still inside, instead of collapsing to an empty stub.
    await w.setProps({ subId: null })
    await flushPromises()
    expect(document.body.textContent).toContain('Редактировать')
    expect(nameInput().value).toBe('Old Name')
    w.unmount()
  })

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
