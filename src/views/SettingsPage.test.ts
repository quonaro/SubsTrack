import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import SettingsPage from './SettingsPage.vue'
import { store } from '../store'
import { getSetting } from '../domain/settings'
import { ACCENTS, THEME_PRESETS } from '../theme'
import { makeTestDb } from '../db/testdb'
import { setDbForTesting } from '../db'
import { migrate } from '../db/schema'

const router = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  })

beforeEach(async () => {
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

  it('currency radio persists the setting', async () => {
    const w = mount(SettingsPage, { global: { plugins: [router()] } })
    await flushPromises()
    const group = w.find('[role="radiogroup"][aria-label="Основная валюта"]')
    expect(group.exists()).toBe(true)
    const usd = group.findAll('[role="radio"]').find((b) => b.text().includes('USD'))
    expect(usd).toBeDefined()
    await usd?.trigger('click')
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
    const system = group.findAll('[role="radio"]').find((b) => b.text().includes('Системная'))
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
