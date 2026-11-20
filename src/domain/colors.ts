/** Preset colors for the subscription icon tile. */
export const ICON_COLORS: { value: string; label: string }[] = [
  { value: '#ef4444', label: 'Красный' },
  { value: '#f15a24', label: 'Оранжевый' },
  { value: '#eab308', label: 'Жёлтый' },
  { value: '#84cc16', label: 'Лаймовый' },
  { value: '#22c55e', label: 'Зелёный' },
  { value: '#14b8a6', label: 'Бирюзовый' },
  { value: '#3b82f6', label: 'Синий' },
  { value: '#6366f1', label: 'Индиго' },
  { value: '#a855f7', label: 'Фиолетовый' },
  { value: '#ec4899', label: 'Розовый' },
  { value: '#6b7280', label: 'Серый' },
]

/**
 * Tinted background for an icon tile: the subscription's own color wins,
 * then its category color. The alpha keeps the line icon readable in both
 * themes, matching the category tint used on cards.
 */
export function iconTileBackground(
  iconColor: string | null | undefined,
  categoryColor: string | null | undefined,
): string {
  return `${iconColor ?? categoryColor ?? '#6b7280'}26`
}
