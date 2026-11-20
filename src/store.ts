import { reactive, computed } from 'vue'
import type { Category, Payment, Settings, SortMode, Subscription, SubEvent } from './types'
import * as subs from './domain/subscriptions'
import * as cats from './domain/categories'
import * as pays from './domain/payments'
import * as evs from './domain/events'
import * as rulesApi from './domain/rules'
import { listRules } from './domain/rules'
import { loadSettings, setSetting } from './domain/settings'
import { rescheduleAll, requestNotificationPermission } from './domain/reminders'
import { monthlyTotalMinor, yearlyTotalMinor } from './domain/stats'
import { seedDemoData as runDemoSeed } from './dev/seed'
import { logger } from './log'

const log = logger('store')

export const store = reactive({
  ready: false,
  subscriptions: [] as Subscription[],
  categories: [] as Category[],
  events: [] as SubEvent[],
  payments: [] as Payment[],
  settings: {
    baseCurrency: 'RUB',
    theme: 'dark',
    themeMode: 'dark',
    accent: 'orange',
    preset: 'warm',
  } as Settings,
  sortMode: 'next_date' as SortMode,
  showArchived: false,
})

export const activeSubscriptions = computed(() => store.subscriptions.filter((s) => s.isActive))
export const visibleSubscriptions = computed(() => {
  const list = store.showArchived
    ? store.subscriptions
    : store.subscriptions.filter((s) => s.isActive)
  const sorted = [...list]
  if (store.sortMode === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  else if (store.sortMode === 'price') sorted.sort((a, b) => b.priceMinor - a.priceMinor)
  else sorted.sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate))
  return sorted
})

export const monthlyTotal = computed(() =>
  monthlyTotalMinor(store.subscriptions, store.settings.baseCurrency),
)
export const yearlyTotal = computed(() =>
  yearlyTotalMinor(store.subscriptions, store.settings.baseCurrency),
)

export function categoryOf(sub: Subscription): Category | null {
  return store.categories.find((c) => c.id === sub.categoryId) ?? null
}

async function refreshReminders(): Promise<void> {
  const rules = await listRules()
  await rescheduleAll(store.subscriptions, rules)
}

export async function initStore(): Promise<void> {
  const [subscriptions, categories, events, payments, settings] = await Promise.all([
    subs.listSubscriptions(true),
    cats.listCategories(),
    evs.listEvents(),
    pays.listPayments(),
    loadSettings(),
  ])
  store.subscriptions = subscriptions
  store.categories = categories
  store.events = events
  store.payments = payments
  store.settings = settings
  store.ready = true
  log.info('store ready', {
    subs: subscriptions.length,
    cats: categories.length,
  })
  await requestNotificationPermission()
  await refreshReminders()
}

async function reload(): Promise<void> {
  store.subscriptions = await subs.listSubscriptions(true)
  store.events = await evs.listEvents()
  store.payments = await pays.listPayments()
}

export async function createSubscription(input: subs.SubscriptionInput): Promise<Subscription> {
  const sub = await subs.createSubscription(input)
  await reload()
  await refreshReminders()
  return sub
}

export async function updateSubscription(
  id: number,
  patch: Partial<subs.SubscriptionInput>,
): Promise<Subscription | null> {
  const sub = await subs.updateSubscription(id, patch)
  await reload()
  await refreshReminders()
  return sub
}

export async function setSubActive(id: number, active: boolean): Promise<void> {
  await subs.setActive(id, active)
  await reload()
  await refreshReminders()
}

export async function deleteSubscription(id: number): Promise<void> {
  await subs.deleteSubscription(id)
  await reload()
  await refreshReminders()
}

export async function markPaid(id: number, paidIso?: string): Promise<void> {
  await subs.markPaid(id, paidIso)
  await reload()
  await refreshReminders()
}

/** Undo the newest payment mark of a subscription (see domain cancelPayment). */
export async function cancelPayment(
  paymentId: number,
  prevNextPaymentDate?: string | null,
): Promise<void> {
  await subs.cancelPayment(paymentId, prevNextPaymentDate)
  await reload()
  await refreshReminders()
}

export async function createCategory(input: {
  name: string
  icon?: string
  color?: string
}): Promise<Category> {
  const c = await cats.createCategory(input)
  store.categories = await cats.listCategories()
  return c
}

export async function updateCategory(
  id: number,
  patch: { name?: string; icon?: string; color?: string },
): Promise<void> {
  await cats.updateCategory(id, patch)
  store.categories = await cats.listCategories()
}

export async function deleteCategory(id: number): Promise<void> {
  await cats.deleteCategory(id)
  store.categories = await cats.listCategories()
  store.subscriptions = await subs.listSubscriptions(true)
}

export async function replaceRules(
  subscriptionId: number,
  rules: {
    kind: 'advance' | 'payment_day' | 'recurring'
    daysBefore?: number | null
    atTime?: string | null
    intervalHours?: number | null
  }[],
): Promise<void> {
  await rulesApi.replaceRules(subscriptionId, rules)
  await refreshReminders()
}

export async function listRulesFor(subscriptionId: number) {
  return listRules(subscriptionId)
}

/** Dev tool: fill the database with demo data for manual bug-hunting. */
export async function seedDemoData(): Promise<void> {
  await runDemoSeed()
  await reload()
  store.categories = await cats.listCategories()
  await refreshReminders()
}

export async function updateSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): Promise<void> {
  await setSetting(key, value)
  store.settings[key] = value
}
