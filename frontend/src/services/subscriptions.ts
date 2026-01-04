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
  last_paid_at?: string
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

export interface PaymentHistory {
  id: number
  subscription_id: number
  amount: number
  currency: string
  date: string
  subscription?: Subscription
}

export interface HistoryResponse {
  id: number
  subscription_id: number
  event_type: string
  details?: any
  created_at: string
  subscription?: Subscription
}

/**
 * Get all subscriptions for current user
 */
export async function getSubscriptions(isActive?: boolean, sortBy: string = 'date_asc'): Promise<Subscription[]> {
  const params: any = { sort_by: sortBy }
  if (isActive !== undefined) params.is_active = isActive
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
 * Get payment history (global or for a subscription)
 */
export async function getHistory(subscriptionId?: number): Promise<HistoryResponse[]> {
  const url = subscriptionId
    ? `/subscriptions/${subscriptionId}/history`
    : '/subscriptions/history'
  const response = await api.get<HistoryResponse[]>(url)
  return response.data
}

/**
 * Mark subscription as paid
 */
export async function markAsPaid(id: number): Promise<Subscription> {
  const response = await api.post<Subscription>(`/subscriptions/${id}/paid`)
  return response.data
}

/**
 * Send test notification for a specific subscription
 */
export async function sendTestNotification(id: number): Promise<void> {
  await api.post(`/subscriptions/${id}/test-notification`)
}

/**
 * Calculate days until next payment
 */
export function getDaysUntilPayment(nextPaymentDate: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)

  const paymentDateFull = new Date(nextPaymentDate)
  const paymentDate = new Date(paymentDateFull.getFullYear(), paymentDateFull.getMonth(), paymentDateFull.getDate(), 12, 0, 0)

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


export function formatDaysUntil(days: number): string {
  if (days < 0) return 'Просрочено'
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Завтра'
  if (days < 5) return `Через ${days} дня`
  return `Через ${days} дней`
}

export function formatNotificationRule(rule: any): string {
  if (!rule) return ''

  const timeStr = rule.at_time ? ` в ${rule.at_time.substring(0, 5)}` : ''

  if (rule.rule_type === 'advance_notice') {
    const days = rule.days_before || 0
    if (days === 0) return `В день оплаты${timeStr}`
    if (days === 1) return `За 1 день${timeStr}`
    if (days < 5) return `За ${days} дня${timeStr}`
    return `За ${days} дней${timeStr}`
  }

  if (rule.rule_type === 'payment_day_alert') {
    return `В день оплаты${timeStr}`
  }

  if (rule.rule_type === 'recurring_reminder') {
    const hours = rule.interval_hours || 0
    if (hours === 1) return 'Каждый час'
    if (hours < 5) return `Каждые ${hours} часа`
    return `Каждые ${hours} часов`
  }

  if (rule.rule_type === 'single_reminder') {
    return `В день оплаты${timeStr}`
  }

  return ''
}
