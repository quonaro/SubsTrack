import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BottomNav from './BottomNav.vue'

describe('BottomNav', () => {
  it('renders a link for every section', () => {
    const w = mount(BottomNav, { global: { stubs: { RouterLink: RouterLinkStub } } })
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
})
