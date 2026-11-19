import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import SettingsView from './SettingsView.vue'
import { store } from '../store'
import { getSetting } from '../domain/settings'
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
  store.settings = { baseCurrency: 'RUB', theme: 'dark' }
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
})
