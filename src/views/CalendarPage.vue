<script setup lang="ts">
import { computed, ref } from 'vue'
import { categoryOf, markPaid, store } from '../store'
import { formatDateRuFull, paymentDatesInRange, todayIso } from '../domain/dates'
import { convertMinor, formatMoney } from '../domain/currency'
import { iconTileBackground } from '../domain/colors'
import { type CalendarMonth, monthId, monthWindow, shiftMonth } from '../domain/months'
import AppIcon from '../components/AppIcon.vue'
import Modal from '../components/Modal.vue'
import SubscriptionEditModal from '../components/SubscriptionEditModal.vue'
import Icon from '../components/Icon.vue'
import { pluralRu } from '../domain/plural'

const editId = ref<number | null>(null)
const scroller = ref<HTMLElement | null>(null)

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
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const today = todayIso()
const anchor = new Date()
const currentMonth: CalendarMonth = { year: anchor.getFullYear(), month: anchor.getMonth() }

const WINDOW_BEFORE = 0
const WINDOW_AFTER = 12
const STEP = 6
const EDGE = 320

const months = ref<CalendarMonth[]>(monthWindow(currentMonth, WINDOW_BEFORE, WINDOW_AFTER))

interface DayCell {
  date: string
  day: number | null
  subs: number[]
  isToday: boolean
  overdue: boolean
  outside: boolean
}

interface MonthBlock extends CalendarMonth {
  key: string
  cells: DayCell[]
  count: number
  word: string
}

function buildCells(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-first offset.
  const offset = (first.getDay() + 6) % 7
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`
  const byDay = new Map<string, number[]>()
  for (const s of store.subscriptions.filter((x) => x.isActive)) {
    for (const d of paymentDatesInRange(
      s.nextPaymentDate,
      s.periodDays,
      iso(1),
      iso(daysInMonth),
      s.isOneTime,
      s.periodMonths,
      s.periodDay,
    )) {
      const list = byDay.get(d) ?? []
      list.push(s.id)
      byDay.set(d, list)
    }
  }
  const out: DayCell[] = []
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = offset; i > 0; i--)
    out.push({
      date: '',
      day: prevMonthDays - i + 1,
      subs: [],
      isToday: false,
      overdue: false,
      outside: true,
    })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = iso(d)
    const subs = byDay.get(date) ?? []
    out.push({
      date,
      day: d,
      subs,
      isToday: date === today,
      overdue: subs.length > 0 && date < today,
      outside: false,
    })
  }
  for (let d = 1; out.length % 7 !== 0; d++)
    out.push({ date: '', day: d, subs: [], isToday: false, overdue: false, outside: true })
  return out
}

const blocks = computed<MonthBlock[]>(() =>
  months.value.map((m) => {
    const cells = buildCells(m.year, m.month)
    const count = cells.reduce((n, c) => n + c.subs.length, 0)
    return {
      ...m,
      key: monthId(m),
      cells,
      count,
      word: pluralRu(count, 'платёж', 'платежа', 'платежей'),
    }
  }),
)

const monthSummary = computed(() => {
  const [first] = blocks.value
  if (!first || first.count === 0) return 'Нет платежей в этом месяце'
  let total = 0
  for (const id of new Set(first.cells.flatMap((c) => c.subs))) {
    const s = store.subscriptions.find((x) => x.id === id)
    if (s) total += convertMinor(s.priceMinor, s.currency, store.settings.baseCurrency)
  }
  return `${first.count} ${first.word} · ${formatMoney(total, store.settings.baseCurrency)}`
})

const selected = ref<DayCell | null>(null)
const selectedTitle = computed(() =>
  selected.value?.date ? formatDateRuFull(selected.value.date) : '',
)
const selectedSubs = computed(() =>
  (selected.value?.subs ?? [])
    .map((id) => store.subscriptions.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s),
)

let extending = false

async function extend(): Promise<void> {
  const el = scroller.value
  if (!el) return
  extending = true
  try {
    const last = months.value[months.value.length - 1]
    const append: CalendarMonth[] = []
    for (let i = 1; i <= STEP; i++) append.push(shiftMonth(last, i))
    months.value = [...months.value, ...append]
  } finally {
    extending = false
  }
}

function onScroll(): void {
  const el = scroller.value
  if (!el || extending) return
  // The current month is the first block, so the top of the list is also the
  // hard "no further back" limit.
  if (el.scrollHeight - el.scrollTop - el.clientHeight < EDGE) void extend()
}
</script>

<template>
  <div class="mx-auto flex h-full min-h-0 w-full max-w-xl flex-col px-4 sm:px-6 lg:max-w-3xl lg:px-8">
    <header class="pb-2 pt-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <Icon name="calendar" :size="22" class="text-accent-hi" />Календарь
      </h1>
      <p class="text-sm text-app-text-muted">{{ monthSummary }}</p>
    </header>

    <div
      ref="scroller"
      class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-6"
      @scroll.passive="onScroll"
    >
      <section
        v-for="b in blocks"
        :key="b.key"
        :data-month="b.key"
        class="pb-6"
      >
        <div
          class="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-app-bg py-2"
        >
          <span class="text-xs text-app-text-muted">{{ b.count }} {{ b.word }}</span>
          <span class="text-base font-bold tracking-[0.2em] uppercase">
            {{ MONTHS[b.month] }} {{ b.year }}
          </span>
          <span />
        </div>

        <div class="grid grid-cols-7 gap-1 text-center text-xs text-app-text-muted">
          <div v-for="w in WEEKDAYS" :key="w" class="py-1">{{ w }}</div>
        </div>

        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="(c, i) in b.cells"
            :key="i"
            type="button"
            :disabled="c.day == null || c.outside"
            class="relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors disabled:cursor-default"
            :class="[
              c.outside || c.day == null
                ? 'text-app-text-muted/40'
                : c.isToday
                  ? 'bg-accent/30 inset-ring-1 inset-ring-accent'
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
      </section>
    </div>

    <Modal
      :open="!!selected"
      :title="selectedTitle"
      @update:open="!$event && (selected = null)"
    >
      <div class="flex flex-col gap-2">
        <div
          v-for="s in selectedSubs"
          :key="s.id"
          class="flex items-center gap-3 rounded-xl border border-app-border bg-app-card p-3"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            :style="{ backgroundColor: iconTileBackground(s.iconColor, categoryOf(s)?.color) }"
          >
            <AppIcon :name="s.icon" :size="18" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">{{ s.name }}</div>
            <div class="text-xs text-app-text-muted">
              {{ formatMoney(s.priceMinor, s.currency) }}
            </div>
          </div>
          <button
            type="button"
            class="flex h-9 items-center rounded-full bg-accent px-3 text-xs font-medium text-accent-fg"
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
