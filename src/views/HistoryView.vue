<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store'
import type { SubEvent } from '../types'
import { formatMoney } from '../domain/currency'
import Icon from '../components/Icon.vue'

const router = useRouter()

const LABELS: Record<string, string> = {
  created: 'Создана',
  updated: 'Изменена',
  payment: 'Платёж',
  archived: 'В архиве',
  restored: 'Восстановлена',
  deleted: 'Удалена',
  reminder_sent: 'Напоминание',
}

const ICONS: Record<string, string> = {
  created: 'plus',
  updated: 'cog',
  payment: 'check',
  archived: 'archive',
  restored: 'archive',
  deleted: 'trash',
  reminder_sent: 'bell',
}

const subName = (e: SubEvent) =>
  e.subscriptionId != null
    ? (store.subscriptions.find((s) => s.id === e.subscriptionId)?.name ?? `#${e.subscriptionId}`)
    : (payloadOf(e)?.name ?? '')

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
  if (e.type === 'payment' && typeof p.amountMinor === 'number')
    return `${formatMoney(p.amountMinor, String(p.currency ?? 'RUB'))} → след. ${String(p.nextPaymentDate ?? '')}`
  if (e.type === 'updated' && p.changes && typeof p.changes === 'object')
    return Object.keys(p.changes as object).join(', ')
  return ''
}

const fmtTime = (iso: string) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
}

const events = computed(() => store.events)
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-6 pt-6">
    <header class="mb-6 flex items-center gap-3">
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-full border border-app-border bg-app-card"
        @click="router.back()"
      >
        <Icon name="chevron-left" :size="16" />
      </button>
      <h1 class="text-xl font-bold">История</h1>
    </header>

    <div v-if="events.length" class="flex flex-col gap-1">
      <div v-for="e in events" :key="e.id" class="flex items-start gap-3 rounded-xl px-2 py-2.5">
        <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-card text-app-text-muted">
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
      </div>
    </div>
    <div
      v-else
      class="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-app-border p-8 text-center text-app-text-muted"
    >
      Событий пока нет
    </div>
  </div>
</template>
