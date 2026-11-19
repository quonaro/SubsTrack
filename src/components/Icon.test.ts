import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Icon from './Icon.vue'

describe('Icon', () => {
  it('renders an svg with a path for a known name', () => {
    const w = mount(Icon, { props: { name: 'home' } })
    expect(w.find('svg path').attributes('d')).toBeTruthy()
  })

  it('falls back to the home icon for unknown names', () => {
    const known = mount(Icon, { props: { name: 'home' } })
    const unknown = mount(Icon, { props: { name: 'no-such-icon' } })
    expect(unknown.find('svg path').attributes('d')).toBe(known.find('svg path').attributes('d'))
  })

  it('honors the size prop', () => {
    const w = mount(Icon, { props: { name: 'cog', size: 10 } })
    expect(w.find('svg').attributes('width')).toBe('10')
  })
})
