import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { NotifyRule, Subscription } from '../types'
import { addDays, daysUntilText, diffDays } from './dates'
import { formatMoney } from './currency'
import { logger } from '../log'

const log = logger('reminders')

export const DEFAULT_NOTIFY_TIME = '10:00'

export interface PendingReminder {
  /** Deterministic LocalNotifications id. */
  id: number
  subscriptionId: number
  ruleId: number
  fireAt: Date
  title: string
  body: string
}

function notifId(subId: number, ruleId: number, at: Date): number {
  const s = `${subId}:${ruleId}:${at.getTime()}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return (Math.abs(h) % 2000000000) + 1
}

/** 'HH:MM' + ISO date -> local Date; falls back to DEFAULT_NOTIFY_TIME. */
export function fireDate(dateIso: string, atTime: string | null): Date {
  const [y, m, d] = dateIso.split('-').map(Number)
  const [hh, mm] = (atTime ?? DEFAULT_NOTIFY_TIME).split(':').map(Number)
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0)
}

function reminderBody(sub: Subscription, todayIso: string): string {
  const days = diffDays(sub.nextPaymentDate, todayIso)
  const price = formatMoney(sub.priceMinor, sub.currency)
  if (days === 0) return `${sub.icon} ${sub.name} — платёж сегодня: ${price}`
  if (days > 0)
    return `${sub.icon} ${sub.name} — платёж ${daysUntilText(days)} (${sub.nextPaymentDate}): ${price}`
  return `${sub.icon} ${sub.name} — платёж просрочен на ${daysUntilText(Math.abs(days))}: ${price}`
}

/**
 * Compute the next fire instant for every enabled rule of every active,
 * reminder-enabled subscription. Pure — tests cover this without the plugin.
 *
 * Kinds (ported from the old backend):
 *  - advance:     next_payment_date - days_before, at at_time
 *  - payment_day: next_payment_date, at at_time
 *  - recurring:   now + interval_hours (the plugin has no per-hour repeat, so
 *                 the next occurrence is scheduled and everything is
 *                 recomputed on the next rescheduleAll() pass)
 */
export function computeReminders(
  subs: Subscription[],
  rules: NotifyRule[],
  now: Date = new Date(),
): PendingReminder[] {
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
  const bySub = new Map<number, NotifyRule[]>()
  for (const r of rules) {
    const list = bySub.get(r.subscriptionId) ?? []
    list.push(r)
    bySub.set(r.subscriptionId, list)
  }
  const out: PendingReminder[] = []
  for (const sub of subs) {
    if (!sub.isActive || !sub.reminderEnabled) continue
    for (const rule of bySub.get(sub.id) ?? []) {
      if (!rule.enabled) continue
      let fireAt: Date | null = null
      if (rule.kind === 'advance') {
        const target = addDays(sub.nextPaymentDate, -(rule.daysBefore ?? 0))
        fireAt = fireDate(target, rule.atTime)
      } else if (rule.kind === 'payment_day') {
        fireAt = fireDate(sub.nextPaymentDate, rule.atTime)
      } else if (rule.kind === 'recurring') {
        fireAt = new Date(now.getTime() + Math.max(1, rule.intervalHours ?? 24) * 3600000)
      }
      if (!fireAt || fireAt.getTime() <= now.getTime()) continue
      out.push({
        id: notifId(sub.id, rule.id, fireAt),
        subscriptionId: sub.id,
        ruleId: rule.id,
        fireAt,
        title: 'Платёж',
        body: reminderBody(sub, todayIso),
      })
    }
  }
  return out
}

// --- Native scheduling --------------------------------------------------------

export async function notificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!Capacitor.isNativePlatform()) return 'granted'
  try {
    const res = await LocalNotifications.checkPermissions()
    return res.display as 'granted' | 'denied' | 'prompt'
  } catch {
    return 'denied'
  }
}

export async function requestNotificationPermission(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.requestPermissions()
  } catch (e) {
    log.warn('notification permission request failed', e)
  }
}

export type TestNotificationResult = 'sent' | 'denied' | 'web' | 'error'

/** Dev helper: schedule a one-shot notification ~5s ahead to verify the pipeline. */
export async function sendTestNotification(): Promise<TestNotificationResult> {
  if (!Capacitor.isNativePlatform()) return 'web'
  if ((await notificationPermission()) !== 'granted') {
    await requestNotificationPermission()
    if ((await notificationPermission()) !== 'granted') return 'denied'
  }
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: (Date.now() % 2000000000) + 1,
          title: 'SubsTrack',
          body: 'Тестовое уведомление — всё работает',
          schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
        },
      ],
    })
    return 'sent'
  } catch (e) {
    log.error('test notification failed', e)
    return 'error'
  }
}

/**
 * Recompute and reschedule all pending local notifications. Called on app
 * start and after any mutation affecting rules or payment dates — full
 * cancel-then-schedule keeps the pending set consistent without bookkeeping.
 */
export async function rescheduleAll(subs: Subscription[], rules: NotifyRule[]): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0
  const pending = computeReminders(subs, rules)
  try {
    const existing = await LocalNotifications.getPending()
    if (existing.notifications.length) {
      await LocalNotifications.cancel({ notifications: existing.notifications })
    }
    if (pending.length) {
      await LocalNotifications.schedule({
        notifications: pending.map((p) => ({
          id: p.id,
          title: p.title,
          body: p.body,
          schedule: { at: p.fireAt, allowWhileIdle: true },
          extra: { subscriptionId: p.subscriptionId },
        })),
      })
    }
    log.info('rescheduled notifications', { pending: pending.length })
  } catch (e) {
    log.error('rescheduleAll failed', e)
  }
  return pending.length
}
