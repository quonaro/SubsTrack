<script setup lang="ts">
import { computed } from 'vue'
import { store, monthlyTotal, yearlyTotal } from '../store'
import { categoryBreakdown, paymentHistoryByMonth } from '../domain/stats'
import { formatMoney } from '../domain/currency'
import EmptyState from '../components/EmptyState.vue'

const cur = computed(() => store.settings.baseCurrency)
const breakdown = computed(() =>
  categoryBreakdown(store.subscriptions, store.categories, cur.value),
)
const maxSlice = computed(() => Math.max(1, ...breakdown.value.map((b) => b.totalMinor)))
const byMonth = computed(() => paymentHistoryByMonth(store.payments, cur.value, 6))
const maxMonth = computed(() => Math.max(1, ...byMonth.value.map((b) => b.totalMinor)))

const MONTH_SHORT = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
]
const monthLabel = (m: string) => MONTH_SHORT[Number(m.slice(5)) - 1]
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-6 pt-6 sm:px-6 md:max-w-none lg:px-8">
    <h1 class="mb-6 text-2xl font-bold">Статистика</h1>

    <div class="mb-6 grid grid-cols-2 gap-3">
      <div class="rounded-2xl border border-app-border bg-app-card p-4">
        <div class="text-xs text-app-text-muted">В месяц</div>
        <div class="mt-1 text-xl font-bold">{{ formatMoney(monthlyTotal, cur) }}</div>
      </div>
      <div class="rounded-2xl border border-app-border bg-app-card p-4">
        <div class="text-xs text-app-text-muted">В год</div>
        <div class="mt-1 text-xl font-bold">{{ formatMoney(yearlyTotal, cur) }}</div>
      </div>
    </div>

    <div class="flex flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
    <section class="mb-6 flex flex-col" :class="{ 'flex-1': !breakdown.length }">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-app-text-muted">
        По категориям / месяц
      </h2>
      <div v-if="breakdown.length" class="flex flex-col gap-3 rounded-2xl border border-app-border bg-app-card p-4">
        <div v-for="b in breakdown" :key="b.category?.id ?? 'none'">
          <div class="mb-1 flex justify-between text-sm">
            <span>{{ b.category?.icon ?? '📦' }} {{ b.category?.name ?? 'Без категории' }}</span>
            <span class="font-medium">{{ formatMoney(b.totalMinor, cur) }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-app-bg">
            <div
              class="h-full rounded-full transition-all"
              :style="{
                width: `${(b.totalMinor / maxSlice) * 100}%`,
                backgroundColor: b.category?.color ?? 'var(--color-accent)',
              }"
            />
          </div>
        </div>
      </div>
      <EmptyState v-else icon="chart">Нет данных</EmptyState>
    </section>

    <section class="flex flex-col" :class="{ 'flex-1': !byMonth.length }">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-app-text-muted">
        Платежи по месяцам
      </h2>
      <div v-if="byMonth.length" class="rounded-2xl border border-app-border bg-app-card p-4">
        <div class="flex h-36 items-stretch gap-2">
          <div
            v-for="b in byMonth"
            :key="b.month"
            class="flex flex-1 flex-col items-center gap-1"
          >
            <div class="text-[10px] text-app-text-muted">
              {{ formatMoney(b.totalMinor, cur).replace(/[ \s]/g, ' ') }}
            </div>
            <div class="flex min-h-0 w-full flex-1 flex-col justify-end">
              <div
                class="w-full rounded-t-lg bg-accent/70"
                :style="{ height: `${Math.max(4, (b.totalMinor / maxMonth) * 100)}%` }"
              />
            </div>
            <div class="text-[10px] text-app-text-muted">{{ monthLabel(b.month) }}</div>
          </div>
        </div>
      </div>
      <EmptyState v-else icon="chart">Платежей ещё не было</EmptyState>
    </section>
    </div>
  </div>
</template>
