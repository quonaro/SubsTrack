import { RAW_ICON_PACK } from './iconPack'

export interface IconDef {
  name: string
  keywords: string[]
}

export interface IconGroup {
  id: string
  label: string
  icons: IconDef[]
}

/**
 * Parses `# Group label` headers and `name keyword …` lines into groups.
 * Unknown/blank lines are skipped so the pack can be reordered freely.
 */
export function parseIconPack(raw: string): IconGroup[] {
  const groups: IconGroup[] = []
  for (const line of raw.split('\n')) {
    const entry = line.trim()
    if (!entry) continue
    if (entry.startsWith('#')) {
      groups.push({ id: `group-${groups.length}`, label: entry.slice(1).trim(), icons: [] })
      continue
    }
    const [name, ...keywords] = entry.split(/\s+/)
    const group = groups.at(-1)
    if (!name || !group) continue
    group.icons.push({ name, keywords: keywords.map(normalizeIconQuery) })
  }
  return groups.filter((group) => group.icons.length > 0)
}

export function normalizeIconQuery(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').trim()
}

export const ICON_GROUPS = parseIconPack(RAW_ICON_PACK)

/**
 * Filters the pack by every whitespace-separated token. A token matches when
 * it starts a keyword, a group-label word or a part of the icon name, so both
 * «кино» and «медиа» find the film icon and «спорт» does not leak into
 * «транспорт».
 */
export function searchIcons(query: string): IconGroup[] {
  const tokens = normalizeIconQuery(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return ICON_GROUPS
  return ICON_GROUPS.map((group) => {
    const labelWords = normalizeIconQuery(group.label)
      .split(/\s+/)
      .filter((word) => word.length > 1)
    const icons = group.icons.filter((icon) => {
      const haystack = [...icon.name.split('-'), ...labelWords, ...icon.keywords]
      return tokens.every((token) => haystack.some((word) => word.startsWith(token)))
    })
    return { ...group, icons }
  }).filter((group) => group.icons.length > 0)
}

/**
 * Notification text is plain text, so line icons contribute nothing there.
 * Emoji chosen before the line-icon pack keep their glyph. Custom photo icons
 * are data URLs and must never end up in a notification body.
 */
export function iconText(icon: string): string {
  if (icon.startsWith('data:')) return ''
  return /^[\w-]+$/.test(icon) ? '' : icon
}
