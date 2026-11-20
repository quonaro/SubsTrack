<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { cancelPayment, store } from '../store'
import type { Payment, SubEvent } from '../types'
import { formatMoney } from '../domain/currency'
import { formatDateRu } from '../domain/dates'
import EmptyState from '../components/EmptyState.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import Icon from '../components/Icon.vue'
import { pluralRu } from '../domain/plural'

const router = useRouter()

const LABELS: Record<string, string> = {
  created: 'Создана',
  updated: 'Изменена',
  payment: 'Платёж',
  payment_cancelled: 'Отмена платежа',
  archived: 'В архиве',
  restored: 'Восстановлена',
  deleted: 'Удалена',
  reminder_sent: 'Напоминание',
}

const ICONS: Record<string, string> = {
  created: 'plus',
  updated: 'cog',
  payment: 'check',
  payment_cancelled: 'x',
  archived: 'archive',
  restored: 'archive',
  deleted: 'trash',
  reminder_sent: 'bell',
}

// Tiles are colour-coded by event kind so the feed can be skimmed by hue:
// creation, edits, payments, cancellations, archive moves, reminders.
const TONES: Record<string, string> = {
  created: 'bg-emerald-500/10 text-emerald-400',
  updated: 'bg-sky-500/10 text-sky-400',
  payment: 'bg-amber-500/10 text-amber-400',
  payment_cancelled: 'bg-rose-500/10 text-rose-400',
  archived: 'bg-zinc-500/15 text-zinc-400',
  restored: 'bg-teal-500/10 text-teal-400',
  deleted: 'bg-red-500/10 text-red-400',
  reminder_sent: 'bg-violet-500/10 text-violet-400',
}

const subName = (e: SubEvent) =>
  e.subscriptionId != null
    ? (store.subscriptions.find((s) => s.id === e.subscriptionId)?.name ?? `#${e.subscriptionId}`)
    : String(payloadOf(e)?.name ?? '')

const payloadOf = (e: SubEvent): Record<string, unknown> | null => {
  if (!e.payload) return null
  try {
    return JSON.parse(e.payload) as Record<string, unknown>
  } catch {
    return null
  }
}

const detail = (e: SubEvent): string => {
  const p = payloadOf(e)
  if (!p) return ''
  if (e.type === 'payment' && typeof p.amountMinor === 'number') {
    const money = formatMoney(p.amountMinor, String(p.currency ?? 'RUB'))
    const next = typeof p.nextPaymentDate === 'string' ? formatDateRu(p.nextPaymentDate) : ''
    return next ? `${money} → след. ${next}` : money
  }
  if (e.type === 'payment_cancelled' && typeof p.amountMinor === 'number') {
    const money = formatMoney(p.amountMinor, String(p.currency ?? 'RUB'))
    const paid = typeof p.paidDate === 'string' ? ` за ${formatDateRu(p.paidDate)}` : ''
    return `${money}${paid}`
  }
  if (e.type === 'updated' && p.changes && typeof p.changes === 'object')
    return Object.keys(p.changes as object).join(', ')
  return ''
}

// --- undo a payment mark ------------------------------------------------------
// Only the newest mark of a subscription can be rolled back; older ones would
// rewrite next_payment_date from the wrong base, so their button is hidden.
const paymentsById = computed(() => new Map(store.payments.map((p) => [p.id, p])))
const latestPaymentId = computed(() => {
  const latest = new Map<number, number>()
  for (const p of store.payments) {
    const cur = latest.get(p.subscriptionId)
    if (cur == null || p.id > cur) latest.set(p.subscriptionId, p.id)
  }
  return latest
})

function paymentOf(e: SubEvent): Payment | null {
  if (e.type !== 'payment' || e.subscriptionId == null) return null
  const p = payloadOf(e)
  if (!p) return null
  if (typeof p.paymentId === 'number') {
    const byId = paymentsById.value.get(p.paymentId)
    if (byId) return byId
  }
  // Legacy events (before paymentId was stored): match the newest identical row.
  if (typeof p.paidDate !== 'string') return null
  let hit: Payment | null = null
  for (const pay of store.payments) {
    if (pay.subscriptionId !== e.subscriptionId || pay.paidDate !== p.paidDate) continue
    if (typeof p.amountMinor === 'number' && pay.amountMinor !== p.amountMinor) continue
    if (typeof p.currency === 'string' && pay.currency !== p.currency) continue
    if (!hit || pay.id > hit.id) hit = pay
  }
  return hit
}

function canUndo(e: SubEvent): boolean {
  const pay = paymentOf(e)
  return !!pay && latestPaymentId.value.get(pay.subscriptionId) === pay.id
}

interface PendingUndo {
  payment: Payment
  name: string
  prevNext: string | null
  isOneTime: boolean
  paidDate: string
}
const pendingUndo = ref<PendingUndo | null>(null)

function askUndo(e: SubEvent): void {
  const pay = paymentOf(e)
  if (!pay) return
  const p = payloadOf(e)
  const prevNext = p && typeof p.prevNextPaymentDate === 'string' ? p.prevNextPaymentDate : null
  const sub = store.subscriptions.find((s) => s.id === pay.subscriptionId)
  pendingUndo.value = {
    payment: pay,
    name: sub?.name ?? subName(e),
    prevNext,
    isOneTime: !!sub?.isOneTime,
    paidDate: pay.paidDate,
  }
}

const undoReturnDate = computed(() =>
  pendingUndo.value ? (pendingUndo.value.prevNext ?? pendingUndo.value.paidDate) : '',
)

async function confirmUndo(): Promise<void> {
  const pending = pendingUndo.value
  pendingUndo.value = null
  if (pending) await cancelPayment(pending.payment.id, pending.prevNext)
}

const fmtTime = (iso: string) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
}

const events = computed(() => store.events)
const eventsWord = computed(() => pluralRu(events.value.length, 'событие', 'события', 'событий'))
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-6 pt-6 sm:px-6 lg:max-w-3xl lg:px-8">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-xl font-bold">
          <Icon name="history" :size="20" class="text-accent-hi" />История
        </h1>
        <p class="text-sm text-app-text-muted">{{ events.length }} {{ eventsWord }}</p>
      </div>
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-full border border-app-border bg-app-card px-3 text-sm text-app-text-muted"
        @click="router.back()"
      >
        <Icon name="chevron-left" :size="16" />Назад
      </button>
    </header>

    <div v-if="events.length" class="flex flex-col gap-1">
      <div v-for="e in events" :key="e.id" class="flex items-start gap-3 rounded-xl py-2.5">
        <div
          :class="[
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            TONES[e.type] ?? 'bg-app-card text-app-text-muted',
          ]"
        >
          <Icon :name="ICONS[e.type] ?? 'history'" :size="15" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm">
            <span class="font-medium">{{ LABELS[e.type] ?? e.type }}</span>
            <span class="text-app-text-muted"> · {{ subName(e) }}</span>
          </div>
          <div v-if="detail(e)" class="mt-0.5 truncate text-xs text-app-text-muted">{{ detail(e) }}</div>
          <div class="mt-0.5 text-xs text-app-text-muted/70">{{ fmtTime(e.createdAt) }}</div>
        </div>
        <button
          v-if="canUndo(e)"
          type="button"
          class="mt-0.5 flex h-9 shrink-0 items-center rounded-full bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-500"
          @click="askUndo(e)"
        >
          Отменить
        </button>
      </div>
    </div>
    <EmptyState v-else icon="history">Событий пока нет</EmptyState>

    <ConfirmModal
      :open="pendingUndo != null"
      title="Снять отметку об оплате?"
      :message="
        pendingUndo
          ? `«${pendingUndo.name}» — ${formatMoney(pendingUndo.payment.amountMinor, pendingUndo.payment.currency)} за ${formatDateRu(pendingUndo.paidDate)}. ${
              pendingUndo.isOneTime
                ? 'Подписка снова станет активной.'
                : `Дата следующего платежа вернётся на ${formatDateRu(undoReturnDate)}.`
            }`
          : undefined
      "
      confirm-label="Снять отметку"
      cancel-label="Оставить"
      @update:open="!$event && (pendingUndo = null)"
      @confirm="confirmUndo"
    />
  </div>
</template>
