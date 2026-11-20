import { describe, expect, it } from 'vitest'
import { ICON_GROUPS, iconText, parseIconPack, searchIcons } from './icons'
import { ICON_PATHS } from '../icons/paths'

const names = (query: string) =>
  searchIcons(query).flatMap((group) => group.icons.map((icon) => icon.name))

describe('icon pack', () => {
  it('parses groups and skips entries without a header', () => {
    const groups = parseIconPack('film кино\n# Медиа\nclapperboard плёнка фильм\n\n# Пусто')
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Медиа')
    expect(groups[0].icons).toEqual([{ name: 'clapperboard', keywords: ['пленка', 'фильм'] }])
  })

  it('ships a large pack of unique, renderable icons', () => {
    const all = ICON_GROUPS.flatMap((group) => group.icons)
    expect(ICON_GROUPS.length).toBeGreaterThan(5)
    expect(all.length).toBeGreaterThan(400)
    expect(new Set(all.map((icon) => icon.name)).size).toBe(all.length)
    expect(all.every((icon) => icon.keywords.length > 0)).toBe(true)
    expect(all.every((icon) => ICON_PATHS[icon.name])).toBe(true)
  })
})

describe('searchIcons', () => {
  it('returns the whole pack for an empty or whitespace query', () => {
    expect(searchIcons('')).toBe(ICON_GROUPS)
    expect(searchIcons('   ')).toBe(ICON_GROUPS)
  })

  it('finds icons by Russian keyword', () => {
    expect(names('кино')).toContain('clapperboard')
    expect(names('кофе')).toContain('coffee')
    expect(names('пицца')).toContain('pizza')
  })

  it('ignores case and treats ё as е', () => {
    expect(names('ЁЛКА')).toContain('tree-pine')
    expect(names('елка')).toContain('tree-pine')
  })

  it('matches group labels and icon names', () => {
    expect(names('спорт')).toContain('dumbbell')
    expect(names('youtube')).toContain('youtube')
    expect(names('gamepad')).toContain('gamepad-2')
  })

  it('requires every token to match', () => {
    const narrow = names('спорт шаги')
    expect(narrow).toContain('footprints')
    expect(narrow).not.toContain('dumbbell')
    // «спорт» must not match the «Транспорт» group label
    expect(names('спорт пляж')).toEqual([])
  })

  it('drops empty groups and reports no matches', () => {
    expect(searchIcons('кино').every((group) => group.icons.length > 0)).toBe(true)
    expect(searchIcons('нет-такого-слова')).toEqual([])
  })
})

describe('iconText', () => {
  it('drops line-icon names from plain-text notifications', () => {
    expect(iconText('tv')).toBe('')
    expect(iconText('gamepad-2')).toBe('')
  })

  it('never leaks a photo icon into a notification', () => {
    expect(iconText('data:image/avif;base64,AAAA')).toBe('')
  })

  it('keeps emoji picked before the line-icon pack', () => {
    expect(iconText('🎬')).toBe('🎬')
  })
})
