import api from './api'

export interface Subscription {
  id: number
  user_id: number
  name: string
  price: number
  currency: string
  period_days: number
  next_payment_date: string
  icon: string
  is_active: boolean
  reminder_enabled: boolean
  reminder_days_before: number
  created_at: string
  updated_at: string
}

export interface SubscriptionCreate {
  name: string
  price: number
  currency?: string
  period_days: number
  next_payment_date: string
  icon?: string
  reminder_enabled?: boolean
  reminder_days_before?: number
}

export interface SubscriptionUpdate {
  name?: string
  price?: number
  currency?: string
  period_days?: number
  next_payment_date?: string
  icon?: string
  is_active?: boolean
  reminder_enabled?: boolean
  reminder_days_before?: number
}

export interface NextMonthTotal {
  total: number
  currency: string
  count: number
}

export interface SubscriptionOccurrence {
  date: string
  subscription: Subscription
}

/**
 * Get all subscriptions for current user
 */
export async function getSubscriptions(isActive?: boolean): Promise<Subscription[]> {
  const params = isActive !== undefined ? { is_active: isActive } : {}
  const response = await api.get<Subscription[]>('/subscriptions', { params })
  return response.data
}

/**
 * Get subscription by ID
 */
export async function getSubscription(id: number): Promise<Subscription> {
  const response = await api.get<Subscription>(`/subscriptions/${id}`)
  return response.data
}

/**
 * Create new subscription
 */
export async function createSubscription(data: SubscriptionCreate): Promise<Subscription> {
  const response = await api.post<Subscription>('/subscriptions', data)
  return response.data
}

/**
 * Update subscription
 */
export async function updateSubscription(
  id: number,
  data: SubscriptionUpdate
): Promise<Subscription> {
  const response = await api.put<Subscription>(`/subscriptions/${id}`, data)
  return response.data
}

/**
 * Delete subscription
 */
export async function deleteSubscription(id: number): Promise<void> {
  await api.delete(`/subscriptions/${id}`)
}

/**
 * Archive subscription
 */
export async function archiveSubscription(id: number): Promise<Subscription> {
  const response = await api.post<Subscription>(`/subscriptions/${id}/archive`)
  return response.data
}

/**
 * Unarchive (restore) subscription
 */
export async function unarchiveSubscription(id: number): Promise<Subscription> {
  const response = await api.put<Subscription>(`/subscriptions/${id}`, { is_active: true } as SubscriptionUpdate)
  return response.data
}

/**
 * Get next month total
 */
export async function getNextMonthTotal(): Promise<NextMonthTotal> {
  const response = await api.get<NextMonthTotal>('/subscriptions/next-month-total')
  return response.data
}

/**
 * Get subscription occurrences for calendar
 */
export async function getCalendarOccurrences(startDate: string, endDate: string): Promise<SubscriptionOccurrence[]> {
  const params = { start_date: startDate, end_date: endDate }
  const response = await api.get<SubscriptionOccurrence[]>('/subscriptions/calendar', { params })
  return response.data
}

/**
 * Calculate days until next payment
 */
export function getDaysUntilPayment(nextPaymentDate: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const paymentDateFull = new Date(nextPaymentDate)
  const paymentDate = new Date(paymentDateFull.getFullYear(), paymentDateFull.getMonth(), paymentDateFull.getDate())

  const diffTime = paymentDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string = 'RUB'): string {
  return `${price.toLocaleString('ru-RU')} ${currency}`
}

/**
 * Format period in Russian
 */
export function formatPeriod(periodDays: number): string {
  if (periodDays === 7) return '1 неделя'
  if (periodDays === 14) return '2 недели'
  if (periodDays === 30) return '1 месяц'
  if (periodDays === 60) return '2 месяца'
  if (periodDays === 90) return '3 месяца'
  if (periodDays === 180) return '6 месяцев'
  if (periodDays === 365) return '1 год'
  if (periodDays < 30) return `${periodDays} ${getDayWord(periodDays)}`
  const months = Math.floor(periodDays / 30)
  return `${months} ${getMonthWord(months)}`
}

function getDayWord(days: number): string {
  if (days === 1) return 'день'
  if (days < 5) return 'дня'
  return 'дней'
}

function getMonthWord(months: number): string {
  if (months === 1) return 'месяц'
  if (months < 5) return 'месяца'
  return 'месяцев'
}


