// Domain model. Money is stored as integer minor units (kopecks/cents);
// dates are ISO 'YYYY-MM-DD', timestamps are ISO datetimes.

export interface Category {
  id: number
  name: string
  color: string
  icon: string
  createdAt: string
}

export interface Subscription {
  id: number
  name: string
  priceMinor: number
  currency: string
  /** Billing period in days (7 / 30 / 90 / 365 / custom). */
  periodDays: number
  /** One-off purchase: charged once and archived after payment. */
  isOneTime: boolean
  /** ISO date — initial payment anchor. */
  startDate: string
  /** ISO date — next scheduled payment. */
  nextPaymentDate: string
  icon: string
  /** Icon tile background; null → inherit the category color. */
  iconColor: string | null
  isActive: boolean
  reminderEnabled: boolean
  categoryId: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: number
  subscriptionId: number
  amountMinor: number
  currency: string
  /** ISO date the payment was made for. */
  paidDate: string
  createdAt: string
}

export type RuleKind = 'advance' | 'payment_day' | 'recurring'

export interface NotifyRule {
  id: number
  subscriptionId: number
  kind: RuleKind
  /** advance: days before the payment date. */
  daysBefore: number | null
  /** 'HH:MM' local time for advance/payment_day. */
  atTime: string | null
  /** recurring: repeat interval in hours. */
  intervalHours: number | null
  enabled: boolean
  createdAt: string
}

export type EventType =
  | 'created'
  | 'updated'
  | 'payment'
  | 'payment_cancelled'
  | 'archived'
  | 'restored'
  | 'deleted'
  | 'reminder_sent'

export interface SubEvent {
  id: number
  subscriptionId: number | null
  type: EventType
  /** Free-form JSON details. */
  payload: string | null
  createdAt: string
}

export type SortMode = 'next_date' | 'name' | 'price'

export type AccentKey = 'orange' | 'violet' | 'blue' | 'emerald' | 'pink' | 'amber' | 'cyan'

export type PresetKey = 'default' | 'nord' | 'solarized' | 'contrast' | 'warm'

export type ThemeMode = 'dark' | 'light' | 'system'

export interface Settings {
  baseCurrency: string
  /** Last explicitly chosen light/dark — kept in sync for older builds. */
  theme: 'dark' | 'light'
  /** Active theme preference; 'system' follows the OS color scheme. */
  themeMode: ThemeMode
  accent: AccentKey
  preset: PresetKey
}
