<script setup lang="ts">
import { computed, ref } from 'vue'
import { markPaid, store } from '../store'
import { paymentDatesInRange, todayIso } from '../domain/dates'
import { formatMoney } from '../domain/currency'
import Modal from '../components/Modal.vue'
import SubscriptionEditModal from '../components/SubscriptionEditModal.vue'
import Icon from '../components/Icon.vue'
import { pluralRu } from '../domain/plural'

const editId = ref<number | null>(null)

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth()) // 0-based

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]
const MONTHS_PREP = [
  'январе',
  'феврале',
  'марте',
  'апреле',
  'мае',
  'июне',
  'июле',
  'августе',
  'сентябре',
  'октябре',
  'ноябре',
  'декабре',
]
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const iso = (d: number) =>
  `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

interface DayCell {
  date: string
  day: number | null
  subs: number[]
  isToday: boolean
  overdue: boolean
}

const cells = computed<DayCell[]>(() => {
  const first = new Date(year.value, month.value, 1)
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  // Monday-first offset.
  const offset = (first.getDay() + 6) % 7
  const fromIso = iso(1)
  const toIso = iso(daysInMonth)
  const byDay = new Map<string, number[]>()
  for (const s of store.subscriptions.filter((x) => x.isActive)) {
    for (const d of paymentDatesInRange(s.nextPaymentDate, s.periodDays, fromIso, toIso)) {
      const list = byDay.get(d) ?? []
      list.push(s.id)
      byDay.set(d, list)
    }
  }
  const out: DayCell[] = []
  for (let i = 0; i < offset; i++)
    out.push({ date: '', day: null, subs: [], isToday: false, overdue: false })
  const today = todayIso()
  for (let d = 1; d <= daysInMonth; d++) {
    const date = iso(d)
    const subs = byDay.get(date) ?? []
    out.push({
      date,
      day: d,
      subs,
      isToday: date === today,
      overdue: subs.length > 0 && date < today,
    })
  }
  return out
})

const monthPayments = computed(() => cells.value.reduce((n, c) => n + c.subs.length, 0))
const paymentsWord = computed(() => pluralRu(monthPayments.value, 'платёж', 'платежа', 'платежей'))

const selected = ref<DayCell | null>(null)
const selectedSubs = computed(() =>
  (selected.value?.subs ?? [])
    .map((id) => store.subscriptions.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s),
)

function prev(): void {
  if (month.value === 0) {
    month.value = 11
    year.value -= 1
  } else month.value -= 1
}
function next(): void {
  if (month.value === 11) {
    month.value = 0
    year.value += 1
  } else month.value += 1
}
</script>

<template>
  <div class="mx-auto w-full max-w-xl px-4 pb-6 pt-6 sm:px-6 lg:max-w-3xl lg:px-8">
    <header class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold">
          <Icon name="calendar" :size="22" class="text-accent-hi" />Календарь
        </h1>
        <p class="text-sm text-app-text-muted">
          {{ monthPayments }} {{ paymentsWord }} в {{ MONTHS_PREP[month] }}
        </p>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-card"
          @click="prev"
        >
          <Icon name="chevron-left" :size="16" />
        </button>
        <span class="w-28 text-center text-sm font-medium">
          {{ MONTHS[month] }} {{ year }}
        </span>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-card"
          @click="next"
        >
          <Icon name="chevron-right" :size="16" />
        </button>
      </div>
    </header>

    <div class="grid grid-cols-7 gap-1 text-center text-xs text-app-text-muted">
      <div v-for="w in WEEKDAYS" :key="w" class="py-1">{{ w }}</div>
    </div>

    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="(c, i) in cells"
        :key="i"
        type="button"
        :disabled="c.day == null"
        class="relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors"
        :class="[
          c.day == null
            ? ''
            : c.isToday
              ? 'bg-accent/30 ring-1 ring-accent'
              : c.subs.length
                ? 'bg-app-card hover:bg-app-border'
                : 'hover:bg-app-card/60',
        ]"
        @click="c.subs.length && (selected = c)"
      >
        <span :class="{ 'font-semibold': c.isToday }">{{ c.day ?? '' }}</span>
        <div v-if="c.subs.length" class="mt-0.5 flex gap-0.5">
          <span
            v-for="(_, di) in c.subs.slice(0, 3)"
            :key="di"
            class="h-1.5 w-1.5 rounded-full"
            :class="c.overdue ? 'bg-red-400' : 'bg-accent'"
          />
        </div>
      </button>
    </div>

    <Modal
      :open="!!selected"
      :title="selected?.date"
      @update:open="!$event && (selected = null)"
    >
      <div class="flex flex-col gap-2">
        <div
          v-for="s in selectedSubs"
          :key="s.id"
          class="flex items-center gap-3 rounded-xl border border-app-border bg-app-card p-3"
        >
          <span class="text-2xl">{{ s.icon }}</span>
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">{{ s.name }}</div>
            <div class="text-xs text-app-text-muted">
              {{ formatMoney(s.priceMinor, s.currency) }}
            </div>
          </div>
          <button
            type="button"
            class="flex h-9 items-center rounded-full bg-accent/20 px-3 text-xs font-medium text-accent-hi"
            @click="markPaid(s.id, selected!.date); selected = null"
          >
            Оплатить
          </button>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-app-text-muted"
            @click="selected = null; editId = s.id"
          >
            <Icon name="chevron-right" :size="16" />
          </button>
        </div>
      </div>
    </Modal>

    <SubscriptionEditModal
      :sub-id="editId"
      @close="editId = null"
      @deleted="editId = null"
    />
  </div>
</template>
