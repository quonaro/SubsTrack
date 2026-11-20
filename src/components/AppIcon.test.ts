import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppIcon from './AppIcon.vue'

describe('AppIcon', () => {
  it('renders the line icon markup for a pack name', () => {
    const w = mount(AppIcon, { props: { name: 'tv', size: 18 } })
    const svg = w.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('width')).toBe('18')
    expect(svg.find('rect').exists()).toBe(true)
    expect(svg.find('polyline').exists()).toBe(true)
    w.unmount()
  })

  it('renders legacy emoji values as text', () => {
    const w = mount(AppIcon, { props: { name: '📦' } })
    expect(w.find('svg').exists()).toBe(false)
    expect(w.text()).toBe('📦')
    w.unmount()
  })

  it('falls back to the package icon for unknown names', () => {
    const w = mount(AppIcon, { props: { name: 'no-such-icon' } })
    expect(w.find('svg').exists()).toBe(true)
    w.unmount()
  })
})
