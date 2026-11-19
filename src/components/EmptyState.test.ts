import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmptyState from './EmptyState.vue'

describe('EmptyState', () => {
  it('renders the slot text and the icon', () => {
    const w = mount(EmptyState, {
      props: { icon: 'history' },
      slots: { default: 'Событий пока нет' },
    })
    expect(w.text()).toContain('Событий пока нет')
    expect(w.find('svg').exists()).toBe(true)
  })

  it('stretches vertically and centers content', () => {
    const w = mount(EmptyState, { props: { icon: 'list' } })
    const cls = w.classes()
    for (const c of ['flex-1', 'flex-col', 'items-center', 'justify-center'])
      expect(cls).toContain(c)
  })
})
