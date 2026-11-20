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

  it('renders a photo icon as an image', () => {
    const w = mount(AppIcon, {
      props: { name: 'data:image/avif;base64,AAAA', size: 24 },
    })
    const img = w.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('width')).toBe('24')
    expect(img.classes()).toContain('object-cover')
    expect(w.find('svg').exists()).toBe(false)
    w.unmount()
  })

  it('lets a photo icon fill its tile in cover mode', () => {
    const w = mount(AppIcon, {
      props: { name: 'data:image/avif;base64,AAAA', cover: true },
    })
    const img = w.find('img')
    expect(img.classes()).toContain('h-full')
    expect(img.attributes('width')).toBeUndefined()
    w.unmount()
  })
})
