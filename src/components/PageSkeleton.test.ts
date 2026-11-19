import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PageSkeleton from './PageSkeleton.vue'

const tileArea = (el: Element): number => {
  const s = (el as HTMLElement).style
  return Number.parseFloat(s.width) * Number.parseFloat(s.height)
}

const tilesCoverArea = (w: ReturnType<typeof mount>) => {
  const tiles = w.findAll('[data-tile]')
  expect(tiles).toHaveLength(8)
  const area = tiles.reduce((sum, t) => sum + tileArea(t.element), 0)
  expect(area).toBeCloseTo(100 * 100, 0)
}

describe('PageSkeleton', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders nothing while inactive', () => {
    const w = mount(PageSkeleton, { props: { active: false } })
    expect(w.find('[data-tile]').exists()).toBe(false)
  })

  it('covers the whole area with tiles when active', () => {
    const w = mount(PageSkeleton, { props: { active: true } })
    tilesCoverArea(w)
  })

  it('keeps full tile coverage after reshuffles', async () => {
    const w = mount(PageSkeleton, { props: { active: true } })
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(2200)
      await flushPromises()
      tilesCoverArea(w)
    }
  })

  it('renders the header placeholder by default and skips it when header=false', () => {
    const withHeader = mount(PageSkeleton, { props: { active: true } })
    expect(withHeader.find('.rounded-full').exists()).toBe(true)
    const noHeader = mount(PageSkeleton, { props: { active: true, header: false } })
    expect(noHeader.find('.rounded-full').exists()).toBe(false)
  })

  it('stays visible for the minimum display time after deactivating', async () => {
    const w = mount(PageSkeleton, { props: { active: true } })
    vi.advanceTimersByTime(100)
    await w.setProps({ active: false })
    expect(w.find('[data-tile]').exists()).toBe(true)
    vi.advanceTimersByTime(500)
    await flushPromises()
    expect(w.find('[data-tile]').exists()).toBe(false)
  })

  it('hides right away once the minimum display time has passed', async () => {
    const w = mount(PageSkeleton, { props: { active: true } })
    vi.advanceTimersByTime(600)
    await w.setProps({ active: false })
    await flushPromises()
    expect(w.find('[data-tile]').exists()).toBe(false)
  })
})
