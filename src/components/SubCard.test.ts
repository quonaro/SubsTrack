import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SubCard from './SubCard.vue'
import { store } from '../store'
import type { Subscription } from '../types'

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 1,
  name: 'Netflix',
  priceMinor: 99900,
  currency: 'RUB',
  periodDays: 30,
  startDate: '2026-01-01',
  nextPaymentDate: '2099-01-01',
  icon: '🎬',
  isActive: true,
  reminderEnabled: true,
  categoryId: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

describe('SubCard', () => {
  it('renders the name, price and period', () => {
    const w = mount(SubCard, { props: { sub: sub() } })
    expect(w.text()).toContain('Netflix')
    expect(w.text()).toContain('999')
    expect(w.text()).toContain('Ежемесячно')
  })

  it('emits paid with the subscription id after confirming in the sheet', async () => {
    const w = mount(SubCard, { props: { sub: sub({ id: 42 }) } })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(w.emitted('paid')).toBeUndefined()
    const confirm = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Оплатить',
    )
    expect(confirm).toBeTruthy()
    await new DOMWrapper(confirm!).trigger('click')
    expect(w.emitted('paid')).toEqual([[42]])
    w.unmount()
  })

  it('does not emit paid when the sheet is cancelled', async () => {
    const w = mount(SubCard, { props: { sub: sub() } })
    await w.find('button').trigger('click')
    await flushPromises()
    const cancel = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Отмена',
    )
    expect(cancel).toBeTruthy()
    await new DOMWrapper(cancel!).trigger('click')
    expect(w.emitted('paid')).toBeUndefined()
    w.unmount()
  })

  it('hides the pay button for archived subs and compact mode', () => {
    expect(
      mount(SubCard, { props: { sub: sub({ isActive: false }) } })
        .find('button')
        .exists(),
    ).toBe(false)
    expect(
      mount(SubCard, { props: { sub: sub(), compact: true } })
        .find('button')
        .exists(),
    ).toBe(false)
  })

  it('marks overdue payments', () => {
    const w = mount(SubCard, { props: { sub: sub({ nextPaymentDate: '2020-01-01' }) } })
    expect(w.text()).toContain('просрочен')
  })

  it('shows the category badge when the store knows the category', () => {
    store.categories = [{ id: 3, name: 'Видео', color: '#fff', icon: '🎬', createdAt: '' }]
    const w = mount(SubCard, { props: { sub: sub({ categoryId: 3 }) } })
    expect(w.text()).toContain('Видео')
    store.categories = []
  })
})
