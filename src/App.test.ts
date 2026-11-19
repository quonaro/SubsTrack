import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App.vue'
import { store } from './store'

const router = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  })

beforeEach(() => {
  store.ready = false
})

describe('App', () => {
  it('shows the loading state until the store is ready', () => {
    const w = mount(App, { global: { plugins: [router()] } })
    expect(w.text()).toContain('Загрузка')
  })

  it('renders the router view and bottom nav once ready', async () => {
    const w = mount(App, { global: { plugins: [router()] } })
    store.ready = true
    await flushPromises()
    expect(w.text()).not.toContain('Загрузка')
    const labels = w.findAll('nav a').map((l) => l.attributes('aria-label'))
    expect(labels).toContain('Главная')
    expect(labels).toContain('Подписки')
  })
})
