import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { reactive } from 'vue'
import type { NotifyRule, Subscription } from '../types'
import { addDays, daysUntilText, diffDays, paymentDatesInRange, todayIso } from './dates'
import { formatMoney } from './currency'
import { logger } from '../log'
import { iconText } from './icons'

const log = logger('reminders')

export const DEFAULT_NOTIFY_TIME = '10:00'

/** How far ahead notifications are scheduled, so the chain survives a long
 *  stretch without opening the app. */
export const REMINDER_HORIZON_DAYS = 365
/** Occurrences scheduled per rule — monthly subs get a year, weekly ones a quarter. */
export const MAX_OCCURRENCES_PER_RULE = 12
/** Hard cap on pending alarms (AlarmManager gets unhappy with thousands). */
export const MAX_PENDING_REMINDERS = 200

/** Android 8+ channel created natively by AlarmsPlugin (high importance + sound). */
export const REMINDER_CHANNEL_ID = 'payments'
const REMINDER_ICON = 'ic_stat_reminder'

export interface PendingReminder {
  /** Deterministic LocalNotifications id. */
  id: number
  subscriptionId: number
  ruleId: number
  fireAt: Date
  title: string
  body: string
}

/** Last scheduling pass, surfaced in Settings as a health indicator. */
export const reminderState = reactive({
  scheduled: 0,
  at: 0,
})

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

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/**
 * Body text for a reminder firing on `fireIso` about the payment on
 * `paymentIso`. Days are counted from the fire date, not from today —
 * months-ahead occurrences must still read correctly.
 */
function reminderBody(sub: Subscription, paymentIso: string, fireIso: string): string {
  const days = diffDays(paymentIso, fireIso)
  const price = formatMoney(sub.priceMinor, sub.currency)
  const icon = iconText(sub.icon)
  const prefix = icon ? `${icon} ` : ''
  if (days === 0) return `${prefix}${sub.name} — платёж сегодня: ${price}`
  if (days > 0)
    return `${prefix}${sub.name} — платёж ${daysUntilText(days)} (${paymentIso}): ${price}`
  return `${prefix}${sub.name} — платёж просрочен на ${daysUntilText(Math.abs(days))}: ${price}`
}

interface Occurrence {
  fireAt: Date
  /** The payment the reminder is about — drives the body text. */
  paymentIso: string
}

/** Fire instants of one rule inside [now, horizon]. */
function occurrencesOf(
  sub: Subscription,
  rule: NotifyRule,
  paymentDates: string[],
  now: Date,
  horizonIso: string,
): Occurrence[] {
  const out: Occurrence[] = []
  if (rule.kind === 'recurring') {
    const step = Math.max(1, rule.intervalHours ?? 24) * 3600000
    for (let k = 1; k <= MAX_OCCURRENCES_PER_RULE; k++) {
      const fireAt = new Date(now.getTime() + k * step)
      if (isoOf(fireAt) > horizonIso) break
      out.push({ fireAt, paymentIso: sub.nextPaymentDate })
    }
    return out
  }
  for (const paymentIso of paymentDates.slice(0, MAX_OCCURRENCES_PER_RULE)) {
    const dateIso =
      rule.kind === 'advance' ? addDays(paymentIso, -(rule.daysBefore ?? 0)) : paymentIso
    out.push({ fireAt: fireDate(dateIso, rule.atTime), paymentIso })
  }
  return out
}

/**
 * Compute every reminder to schedule: all occurrences of every enabled rule of
 * every active, reminder-enabled subscription over the next year. Pure — tests
 * cover this without the plugin.
 *
 * Kinds (ported from the old backend):
 *  - advance:     next_payment_date - days_before, at at_time
 *  - payment_day: next_payment_date, at at_time
 *  - recurring:   now + interval_hours, repeated while inside the window (the
 *                 plugin has no per-hour repeat)
 *
 * Scheduling a window instead of a single "next" occurrence means reminders
 * keep firing for months without the app being opened; every pass (app start,
 * any mutation) recomputes and replaces the whole pending set.
 */
export function computeReminders(
  subs: Subscription[],
  rules: NotifyRule[],
  now: Date = new Date(),
): PendingReminder[] {
  const nowIso = todayIso(now)
  const horizonIso = addDays(nowIso, REMINDER_HORIZON_DAYS)
  const bySub = new Map<number, NotifyRule[]>()
  for (const r of rules) {
    const list = bySub.get(r.subscriptionId) ?? []
    list.push(r)
    bySub.set(r.subscriptionId, list)
  }
  const out: PendingReminder[] = []
  // Two rules firing at the same instant for one subscription (e.g. "за день"
  // at 10:00 and "в день платежа" at 10:00 on a 0-day advance) would show two
  // identical notifications — keep the first.
  const seen = new Set<string>()
  for (const sub of subs) {
    if (!sub.isActive || !sub.reminderEnabled) continue
    const dates = paymentDatesInRange(
      sub.nextPaymentDate,
      sub.periodDays,
      nowIso,
      horizonIso,
      sub.isOneTime,
      sub.periodMonths,
      sub.periodDay,
    )
    for (const rule of bySub.get(sub.id) ?? []) {
      if (!rule.enabled) continue
      for (const { fireAt, paymentIso } of occurrencesOf(sub, rule, dates, now, horizonIso)) {
        if (fireAt.getTime() <= now.getTime()) continue
        const key = `${sub.id}:${fireAt.getTime()}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({
          id: notifId(sub.id, rule.id, fireAt),
          subscriptionId: sub.id,
          ruleId: rule.id,
          fireAt,
          title: 'Платёж',
          body: reminderBody(sub, paymentIso, isoOf(fireAt)),
        })
      }
    }
  }
  out.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
  return out.slice(0, MAX_PENDING_REMINDERS)
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

// The channel is normally created by AlarmsPlugin.load(); recreating it from
// here is idempotent (Android ignores existing channels) and guarantees the
// channelId below resolves — a notification on a missing channel never fires.
async function ensureChannel(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Напоминания о платежах',
      description: 'Платежи по подпискам',
      importance: 4,
      visibility: 1,
      vibration: true,
    })
    return true
  } catch (e) {
    log.warn('createChannel failed, falling back to the default channel', e)
    return false
  }
}

function reminderNotification(p: PendingReminder, channelOk: boolean) {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    schedule: { at: p.fireAt, allowWhileIdle: true },
    smallIcon: REMINDER_ICON,
    extra: { subscriptionId: p.subscriptionId },
    ...(channelOk ? { channelId: REMINDER_CHANNEL_ID } : {}),
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
    const channelOk = await ensureChannel()
    await LocalNotifications.schedule({
      notifications: [
        {
          id: (Date.now() % 2000000000) + 1,
          title: 'SubsTrack',
          body: 'Тестовое уведомление — всё работает',
          schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
          smallIcon: REMINDER_ICON,
          ...(channelOk ? { channelId: REMINDER_CHANNEL_ID } : {}),
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
 * start, on resume and after any mutation affecting rules or payment dates —
 * full cancel-then-schedule keeps the pending set consistent without
 * bookkeeping.
 */
export async function rescheduleAll(subs: Subscription[], rules: NotifyRule[]): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0
  const pending = computeReminders(subs, rules)
  try {
    const channelOk = await ensureChannel()
    const existing = await LocalNotifications.getPending()
    if (existing.notifications.length) {
      await LocalNotifications.cancel({ notifications: existing.notifications })
    }
    if (pending.length) {
      await LocalNotifications.schedule({
        notifications: pending.map((p) => reminderNotification(p, channelOk)),
      })
    }
    reminderState.scheduled = pending.length
    reminderState.at = Date.now()
    log.info('rescheduled notifications', { pending: pending.length, channelOk })
  } catch (e) {
    log.error('rescheduleAll failed', e)
  }
  return pending.length
}
