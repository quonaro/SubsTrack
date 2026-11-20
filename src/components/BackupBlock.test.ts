import { DOMWrapper, mount } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BackupBlock from './BackupBlock.vue'
import { store } from '../store'
import { setDbForTesting } from '../db'
import { makeTestDb } from '../db/testdb'
import { migrate } from '../db/schema'
import { createCategory } from '../domain/categories'
import { createSubscription, listSubscriptions } from '../domain/subscriptions'
import { buildBackup, parseBackup, serializeBackup, type BackupFile } from '../domain/backup'

const saved = vi.hoisted(() => ({
  calls: [] as { text: string; name: string }[],
  result: { kind: 'downloaded' } as { kind: string; uri?: string },
}))

vi.mock('../domain/backupFile', () => ({
  saveBackup: async (text: string, name: string) => {
    saved.calls.push({ text, name })
    return saved.result
  },
}))

function backupWith(names: string[]): BackupFile {
  return buildBackup(
    {
      categories: [{ id: 1, name: 'Кино', color: '#f15a24', icon: 'film', created_at: 'now' }],
      subscriptions: names.map((name, i) => ({
        id: i + 1,
        name,
        price_minor: 10000,
        currency: 'RUB',
        period_days: 30,
        is_one_time: 0,
        start_date: '2026-01-01',
        next_payment_date: '2026-02-01',
        icon: 'film',
        icon_color: null,
        is_active: 1,
        reminder_enabled: 1,
        category_id: 1,
        notes: null,
        created_at: 'now',
        updated_at: 'now',
      })),
      settings: [{ key: 'baseCurrency', value: 'RUB' }],
    },
    { appVersion: 'test', schemaVersion: 4 },
  )
}

async function pick(w: ReturnType<typeof mount>, name: string, text: string): Promise<void> {
  const input = w.find('input[type="file"]')
  const file = new File([text], name, { type: 'application/json' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

const buttonByText = (text: string): HTMLButtonElement | undefined =>
  [...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)

beforeEach(async () => {
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
  saved.calls = []
  saved.result = { kind: 'downloaded' }
  store.subscriptions = []
  store.categories = []
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('BackupBlock', () => {
  it('shows what is currently stored', async () => {
    const cat = await createCategory({ name: 'Кино', icon: 'film', color: '#f15a24' })
    await createSubscription({
      name: 'Netflix',
      priceMinor: 99900,
      currency: 'RUB',
      periodDays: 30,
      startDate: '2026-01-01',
      nextPaymentDate: '2026-02-01',
      categoryId: cat.id,
    })
    store.subscriptions = await listSubscriptions(true)
    store.categories = [cat]

    const w = mount(BackupBlock)
    expect(w.text()).toContain('Резервная копия')
    expect(w.text()).toContain('1 подписка')
    expect(w.text()).toContain('1 категория')
    w.unmount()
  })

  it('exports a parseable copy of the database', async () => {
    const w = mount(BackupBlock)
    await w
      .findAll('button')
      .find((b) => b.text() === 'Экспорт')
      ?.trigger('click')
    await flushPromises()

    expect(saved.calls).toHaveLength(1)
    expect(saved.calls[0].name).toMatch(/^substrack-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const parsed = parseBackup(saved.calls[0].text)
    expect(parsed.ok).toBe(true)
    expect(w.text()).toContain('загрузки')
    w.unmount()
  })

  it('reports a file that is not a backup', async () => {
    const w = mount(BackupBlock, { attachTo: document.body })
    await pick(w, 'random.json', '{"hello":1}')
    expect(w.text()).toContain('не резервная копия')
    expect(buttonByText('Заменить')).toBeUndefined()
    w.unmount()
  })

  it('asks for confirmation and replaces the data on confirm', async () => {
    const w = mount(BackupBlock, { attachTo: document.body })
    await pick(w, 'backup.json', serializeBackup(backupWith(['Spotify', 'Netflix'])))

    // the confirmation sheet teleports to document.body
    expect(buttonByText('Заменить')).toBeDefined()
    expect(document.body.textContent).toContain('Заменить данные из копии?')
    expect(document.body.textContent).toContain('2 подписки')

    await new DOMWrapper(buttonByText('Заменить') as HTMLButtonElement).trigger('click')
    await flushPromises()

    expect(store.subscriptions.map((s) => s.name)).toEqual(['Spotify', 'Netflix'])
    expect(await listSubscriptions(true)).toHaveLength(2)
    expect(w.text()).toContain('Восстановлено')
    w.unmount()
  })

  it('leaves the data alone when the sheet is dismissed', async () => {
    const w = mount(BackupBlock, { attachTo: document.body })
    await pick(w, 'backup.json', serializeBackup(backupWith(['Spotify'])))
    await new DOMWrapper(buttonByText('Отмена') as HTMLButtonElement).trigger('click')
    await flushPromises()

    expect(await listSubscriptions(true)).toHaveLength(0)
    expect(store.subscriptions).toHaveLength(0)
    w.unmount()
  })

  it('tells the user the copy landed where they chose', async () => {
    saved.result = { kind: 'saved', uri: 'content://com.android.providers.downloads/x' }
    const w = mount(BackupBlock)
    await w
      .findAll('button')
      .find((b) => b.text() === 'Экспорт')
      ?.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('выбранную папку')
    w.unmount()
  })

  it('reports a dismissed save sheet instead of pretending it saved', async () => {
    saved.result = { kind: 'canceled' }
    const w = mount(BackupBlock)
    await w
      .findAll('button')
      .find((b) => b.text() === 'Экспорт')
      ?.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Сохранение отменено')
    w.unmount()
  })
})
