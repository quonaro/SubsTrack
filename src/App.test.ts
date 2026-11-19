import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import PageSkeleton from './components/PageSkeleton.vue'
import { store } from './store'

const router = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  })

beforeEach(() => {
  store.ready = false
})

afterEach(() => {
  vi.useRealTimers()
})

describe('App', () => {
  it('shows the page skeleton until the store is ready', () => {
    const w = mount(App, { global: { plugins: [router()] } })
    const skeleton = w.findComponent(PageSkeleton)
    expect(skeleton.props('active')).toBe(true)
    expect(w.find('[data-tile]').exists()).toBe(true)
  })

  it('renders the router view and bottom nav once ready', async () => {
    const w = mount(App, { global: { plugins: [router()] } })
    store.ready = true
    await flushPromises()
    expect(w.findComponent(PageSkeleton).props('active')).toBe(false)
    const labels = w.findAll('nav a').map((l) => l.attributes('aria-label'))
    expect(labels).toContain('Главная')
    expect(labels).toContain('Подписки')
  })

  it('shows the skeleton again on every page switch', async () => {
    vi.useFakeTimers()
    const r = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/a', component: { template: '<div>a</div>' } },
        { path: '/b', component: { template: '<div>b</div>' } },
        { path: '/:pathMatch(.*)*', component: { template: '<div/>' } },
      ],
    })
    const w = mount(App, { global: { plugins: [r] } })
    store.ready = true
    await r.push('/a')
    await r.isReady()
    await flushPromises()

    vi.advanceTimersByTime(600)
    await flushPromises()
    expect(w.find('[data-tile]').exists()).toBe(false)

    await r.push('/b')
    await flushPromises()
    expect(w.find('[data-tile]').exists()).toBe(true)
  })
})
