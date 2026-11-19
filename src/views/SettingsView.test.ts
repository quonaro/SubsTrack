import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import SettingsView from './SettingsView.vue'
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
  store.settings = { baseCurrency: 'RUB', theme: 'dark', accent: 'orange', preset: 'default' }
})

describe('SettingsView', () => {
  it('renders sections, version and the update check button', async () => {
    const w = mount(SettingsView, { global: { plugins: [router()] } })
    await flushPromises()
    expect(w.text()).toContain('Настройки')
    expect(w.text()).toContain('Версия')
    expect(w.text()).toContain('Проверить')
    expect(w.text()).toContain('Уведомления')
  })

  it('currency radio persists the setting', async () => {
    const w = mount(SettingsView, { global: { plugins: [router()] } })
    await flushPromises()
    const group = w.find('[role="radiogroup"]')
    expect(group.exists()).toBe(true)
    const usd = group.findAll('[role="radio"]').find((b) => b.text().includes('USD'))
    expect(usd).toBeDefined()
    await usd?.trigger('click')
    await flushPromises()
    expect(store.settings.baseCurrency).toBe('USD')
    expect(await getSetting('baseCurrency')).toBe('USD')
  })

  it('theme switch persists the setting', async () => {
    const w = mount(SettingsView, { global: { plugins: [router()] } })
    await flushPromises()
    await w.find('[role="switch"]').trigger('click')
    await flushPromises()
    expect(store.settings.theme).toBe('light')
    expect(await getSetting('theme')).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    document.documentElement.classList.remove('light')
  })

  it('accent swatch persists the setting and updates the DOM', async () => {
    const w = mount(SettingsView, { global: { plugins: [router()] } })
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

  it('preset card persists the preset and its accent', async () => {
    const w = mount(SettingsView, { global: { plugins: [router()] } })
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
