import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPage from './SettingsPage.vue'
import { store } from '../store'
import { getSetting } from '../domain/settings'
import { ACCENTS, THEME_PRESETS } from '../theme'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'

// Lets a test hold the wipe at full cover: the real wipe commits the theme
// in its apply() callback, so capturing it mimics the animation timings.
const wipe = vi.hoisted(() => ({
  defer: false,
  apply: null as null | (() => void | Promise<void>),
}))

vi.mock('../themeWipe', () => ({
  runThemeWipe: async (_e: unknown, apply: () => void | Promise<void>) => {
    if (wipe.defer) {
      wipe.apply = apply
      return
    }
    await apply()
  },
}))

const router = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  })

beforeEach(async () => {
  wipe.defer = false
  wipe.apply = null
  const db = await makeTestDb()
  setDbForTesting(db)
  await migrate(db)
  store.settings = {
    baseCurrency: 'RUB',
    theme: 'dark',
    themeMode: 'dark',
    accent: 'orange',
    preset: 'default',
  }
})

describe('SettingsPage', () => {
  it('renders sections, version and the update check button', async () => {
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Настройки')
    expect(w.text()).toContain('Версия')
    expect(w.text()).toContain('Проверить')
    expect(w.text()).toContain('Уведомления')
  })

  it('currency field opens a flag picker and persists the setting', async () => {
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const field = w.findAll('button').find((b) => b.text().includes('RUB'))
    expect(field).toBeDefined()
    await field?.trigger('click')
    await flushPromises()
    // the picker modal teleports to document.body
    const usd = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('USD'),
    )
    expect(usd).toBeDefined()
    usd?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(store.settings.baseCurrency).toBe('USD')
    expect(await getSetting('baseCurrency')).toBe('USD')
  })

  it('theme radio persists the setting', async () => {
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const group = w.find('[role="radiogroup"][aria-label="Тема"]')
    expect(group.exists()).toBe(true)
    const light = group.findAll('[role="radio"]').find((b) => b.text().includes('Светлая'))
    expect(light).toBeDefined()
    await light?.trigger('click')
    await flushPromises()
    expect(store.settings.themeMode).toBe('light')
    expect(store.settings.theme).toBe('light')
    expect(await getSetting('themeMode')).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    document.documentElement.classList.remove('light')
  })

  it('system theme persists and resolves via prefers-color-scheme', async () => {
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const group = w.find('[role="radiogroup"][aria-label="Тема"]')
    const system = group.findAll('[role="radio"]').find((b) => b.text().includes('Система'))
    await system?.trigger('click')
    await flushPromises()
    expect(store.settings.themeMode).toBe('system')
    expect(await getSetting('themeMode')).toBe('system')
    // legacy theme key keeps the last explicit choice for older builds
    expect(store.settings.theme).toBe('dark')
    // test.setup matchMedia stub reports matches: false → dark
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('accent swatch persists the setting and updates the DOM', async () => {
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const swatch = w.find('button[aria-label="Синий"]')
    expect(swatch.exists()).toBe(true)
    await swatch.trigger('click')
    await flushPromises()
    expect(store.settings.accent).toBe('blue')
    expect(await getSetting('accent')).toBe('blue')
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe(
      ACCENTS.blue.value,
    )
  })

  it('defers the accent border until the wipe fully covers the screen', async () => {
    wipe.defer = true
    document.documentElement.style.setProperty('--color-accent', ACCENTS.orange.value)
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const swatch = w.find('button[aria-label="Синий"]')
    await swatch.trigger('click')
    await flushPromises()
    // Under the growing fill nothing has changed yet — the border stays on the old accent.
    expect(store.settings.accent).toBe('orange')
    expect(swatch.attributes('aria-pressed')).toBe('false')
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe(
      ACCENTS.orange.value,
    )

    await wipe.apply?.()
    await flushPromises()
    expect(store.settings.accent).toBe('blue')
    expect(w.find('button[aria-label="Синий"]').attributes('aria-pressed')).toBe('true')
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe(
      ACCENTS.blue.value,
    )
  })

  it('defers the preset border and its accent until the wipe fully covers the screen', async () => {
    wipe.defer = true
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const card = w.find('button[aria-label="Nord"]')
    await card.trigger('click')
    await flushPromises()
    expect(store.settings.preset).toBe('default')
    expect(card.attributes('aria-pressed')).toBe('false')

    await wipe.apply?.()
    await flushPromises()
    expect(store.settings.preset).toBe('nord')
    expect(store.settings.accent).toBe(THEME_PRESETS.nord.accent)
    expect(w.find('button[aria-label="Nord"]').attributes('aria-pressed')).toBe('true')
  })

  it('dev section fills the database with demo data', async () => {
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Тестовые данные')
    const btn = w.findAll('button').find((b) => b.text() === 'Заполнить')
    expect(btn).toBeDefined()
    await btn?.trigger('click')
    await flushPromises()
    expect(store.subscriptions.length).toBeGreaterThan(0)
    expect(w.text()).toContain('Добавлено')
  })

  it('dev notification test button reports web platform', async () => {
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const btn = w.find('button[aria-label="Тестовое уведомление"]')
    expect(btn.exists()).toBe(true)
    await btn?.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('только на устройстве')
  })

  it('preset card persists the preset and its accent', async () => {
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const card = w.find('button[aria-label="Nord"]')
    expect(card.exists()).toBe(true)
    await card.trigger('click')
    await flushPromises()
    expect(store.settings.preset).toBe('nord')
    expect(await getSetting('preset')).toBe('nord')
    // picking a preset selects its linked accent automatically
    expect(store.settings.accent).toBe(THEME_PRESETS.nord.accent)
    expect(document.documentElement.style.getPropertyValue('--color-app-bg')).toBe(
      THEME_PRESETS.nord.dark['--color-app-bg'],
    )
    document.documentElement.style.removeProperty('--color-app-bg')
  })
})
