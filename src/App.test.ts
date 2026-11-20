import { flushPromises, mount } from '@vue/test-utils'
import { Capacitor } from '@capacitor/core'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
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
    expect(labels).toContain('Платежи')
  })

  it('does not show the skeleton on page switches once ready', async () => {
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
    await new Promise((res) => setTimeout(res, 600))
    await flushPromises()
    expect(w.find('[data-tile]').exists()).toBe(false)

    await r.push('/b')
    await flushPromises()
    expect(w.find('[data-tile]').exists()).toBe(false)
  })

  it('adds the status-bar scrim when Android draws edge-to-edge', async () => {
    const platform = vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android')
    const computed = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ paddingTop: '28px' } as CSSStyleDeclaration)
    const w = mount(App, { global: { plugins: [router()] } })
    await nextTick()
    expect(w.find('.status-scrim').exists()).toBe(true)
    platform.mockRestore()
    computed.mockRestore()
  })

  it('skips the scrim when there is no status-bar inset', async () => {
    const platform = vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android')
    const computed = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ paddingTop: '0px' } as CSSStyleDeclaration)
    const w = mount(App, { global: { plugins: [router()] } })
    await nextTick()
    expect(w.find('.status-scrim').exists()).toBe(false)
    platform.mockRestore()
    computed.mockRestore()
  })
})
