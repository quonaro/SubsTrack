import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { update } from '../update'
import BottomNav from './BottomNav.vue'

const mountNav = () => mount(BottomNav, { global: { stubs: { RouterLink: RouterLinkStub } } })

afterEach(() => {
  update.status = 'idle'
})

describe('BottomNav', () => {
  it('renders a link for every section', () => {
    const w = mountNav()
    const links = w.findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(5)
    expect(links.map((l) => l.props('to'))).toEqual([
      '/',
      '/subscriptions',
      '/calendar',
      '/stats',
      '/settings',
    ])
    expect(links.map((l) => l.attributes('aria-label'))).toEqual([
      'Главная',
      'Платежи',
      'Календарь',
      'Статистика',
      'Параметры',
    ])
  })

  it('marks the settings link with a dot when a newer release exists', async () => {
    update.status = 'available'
    const w = mountNav()
    await w.vm.$nextTick()
    const link = w.findAllComponents(RouterLinkStub).find((l) => l.props('to') === '/settings')
    expect(link?.find('[data-testid="update-dot"]').exists()).toBe(true)
    expect(link?.attributes('aria-label')).toBe('Параметры — доступно обновление')
  })

  it('hides the dot otherwise', () => {
    for (const status of ['idle', 'checking', 'uptodate', 'error'] as const) {
      update.status = status
      expect(mountNav().find('[data-testid="update-dot"]').exists()).toBe(false)
    }
  })
})
