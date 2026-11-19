<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createCategory,
  createSubscription,
  deleteCategory,
  deleteSubscription,
  listRulesFor,
  replaceRules,
  store,
  updateSubscription,
} from '../store'
import { CURRENCIES, formatMoney, parseMoney } from '../domain/currency'
import { PERIOD_PRESETS, todayIso } from '../domain/dates'
import type { RuleKind } from '../types'
import { DEFAULT_NOTIFY_TIME } from '../domain/reminders'
import EmojiPicker from '../components/EmojiPicker.vue'
import OptionField from '../components/OptionField.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import Sheet from '../components/Sheet.vue'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => editId.value != null)

// --- form state ---------------------------------------------------------------
const name = ref('')
const icon = ref('📦')
const priceText = ref('')
const currency = ref('RUB')
const periodPreset = ref<number | 'custom'>(30)
const customDays = ref(30)
const nextDate = ref(todayIso())
const categoryId = ref<number | null>(null)
const notes = ref('')
const reminderEnabled = ref(true)
const isActive = ref(true)

interface RuleDraft {
  kind: RuleKind
  daysBefore: number | null
  atTime: string | null
  intervalHours: number | null
}
const rules = ref<RuleDraft[]>([])

const periodDays = computed(() =>
  periodPreset.value === 'custom' ? Math.max(1, customDays.value || 1) : periodPreset.value,
)

const periodOptions = [
  ...PERIOD_PRESETS.map((p) => ({
    value: p.days as number | 'custom',
    label: p.label,
    hint: `${p.days} дней`,
  })),
  { value: 'custom' as const, label: 'Свой период', hint: 'указать дни вручную' },
]

const currencyOptions = CURRENCIES.map((c) => ({ value: c, label: c }))

const categoryOptions = computed(() => [
  { value: null as number | null, label: 'Без категории', icon: '🚫' },
  ...store.categories.map((c) => ({
    value: c.id as number | null,
    label: c.name,
    icon: c.icon,
  })),
])

const ruleKindOptions = [
  { value: 'advance' as RuleKind, label: 'За N дней', hint: 'напомнить заранее' },
  { value: 'payment_day' as RuleKind, label: 'В день платежа', hint: 'утром в день списания' },
  { value: 'recurring' as RuleKind, label: 'Повторять', hint: 'каждые N часов до оплаты' },
]

const error = ref('')
const saving = ref(false)
const confirmDelete = ref(false)
const catsOpen = ref(false)
const newCatName = ref('')
const newCatIcon = ref('📁')

onMounted(async () => {
  if (!editId.value) return
  const sub = store.subscriptions.find((s) => s.id === editId.value)
  if (!sub) return
  name.value = sub.name
  icon.value = sub.icon
  priceText.value = (sub.priceMinor / 100).toString()
  currency.value = sub.currency
  const preset = PERIOD_PRESETS.find((p) => p.days === sub.periodDays)
  if (preset) periodPreset.value = preset.days
  else {
    periodPreset.value = 'custom'
    customDays.value = sub.periodDays
  }
  nextDate.value = sub.nextPaymentDate
  categoryId.value = sub.categoryId
  notes.value = sub.notes ?? ''
  reminderEnabled.value = sub.reminderEnabled
  isActive.value = sub.isActive
  const existing = await listRulesFor(sub.id)
  rules.value = existing.map((r) => ({
    kind: r.kind,
    daysBefore: r.daysBefore,
    atTime: r.atTime,
    intervalHours: r.intervalHours,
  }))
})

function addRule(): void {
  rules.value.push({
    kind: 'advance',
    daysBefore: 1,
    atTime: DEFAULT_NOTIFY_TIME,
    intervalHours: null,
  })
}

async function save(): Promise<void> {
  error.value = ''
  const price = parseMoney(priceText.value)
  if (!name.value.trim()) {
    error.value = 'Введите название'
    return
  }
  if (price == null || price <= 0) {
    error.value = 'Введите корректную цену'
    return
  }
  if (!nextDate.value) {
    error.value = 'Укажите дату платежа'
    return
  }
  saving.value = true
  try {
    const input = {
      name: name.value.trim(),
      priceMinor: price,
      currency: currency.value,
      periodDays: periodDays.value,
      startDate: nextDate.value,
      nextPaymentDate: nextDate.value,
      icon: icon.value,
      reminderEnabled: reminderEnabled.value,
      isActive: isActive.value,
      categoryId: categoryId.value,
      notes: notes.value.trim() || null,
    }
    const ruleDrafts = rules.value.map((r) => ({
      kind: r.kind,
      daysBefore: r.kind === 'advance' ? (r.daysBefore ?? 1) : null,
      atTime: r.kind === 'recurring' ? null : r.atTime || DEFAULT_NOTIFY_TIME,
      intervalHours: r.kind === 'recurring' ? (r.intervalHours ?? 24) : null,
    }))
    if (isEdit.value && editId.value) {
      const sub = await updateSubscription(editId.value, {
        ...input,
        startDate:
          store.subscriptions.find((s) => s.id === editId.value)?.startDate ?? input.startDate,
      })
      if (sub) await replaceRules(sub.id, ruleDrafts)
    } else {
      const sub = await createSubscription(input)
      await replaceRules(sub.id, ruleDrafts)
    }
    router.back()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
}

async function remove(): Promise<void> {
  if (!editId.value) return
  await deleteSubscription(editId.value)
  confirmDelete.value = false
  router.replace('/subscriptions')
}

async function addCategory(): Promise<void> {
  const n = newCatName.value.trim()
  if (!n) return
  const c = await createCategory({ name: n, icon: newCatIcon.value })
  categoryId.value = c.id
  newCatName.value = ''
}
</script>

<template>
  <div class="mx-auto w-full max-w-xl px-4 pb-10 pt-6">
    <header class="mb-6 flex items-center gap-3">
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-full border border-app-border bg-app-card"
        @click="router.back()"
      >
        <Icon name="chevron-left" :size="16" />
      </button>
      <h1 class="text-xl font-bold">{{ isEdit ? 'Редактировать' : 'Новая подписка' }}</h1>
    </header>

    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <EmojiPicker v-model="icon" />
        <div class="flex-1">
          <label class="mb-1.5 block text-xs font-medium text-app-text-muted">Название</label>
          <input
            v-model="name"
            type="text"
            placeholder="Netflix, Spotify…"
            class="w-full rounded-xl border border-app-border bg-app-card px-4 py-3 focus:border-accent"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-app-text-muted">Цена</label>
          <input
            v-model="priceText"
            inputmode="decimal"
            placeholder="499"
            class="w-full rounded-xl border border-app-border bg-app-card px-4 py-3 focus:border-accent"
          />
        </div>
        <OptionField v-model="currency" :options="currencyOptions" label="Валюта" />
      </div>

      <OptionField v-model="periodPreset" :options="periodOptions" label="Период оплаты" />

      <div v-if="periodPreset === 'custom'">
        <label class="mb-1.5 block text-xs font-medium text-app-text-muted">Дней в периоде</label>
        <input
          v-model.number="customDays"
          type="number"
          min="1"
          class="w-full rounded-xl border border-app-border bg-app-card px-4 py-3 focus:border-accent"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-app-text-muted">
          {{ isEdit ? 'Следующий платёж' : 'Дата первого платежа' }}
        </label>
        <input
          v-model="nextDate"
          type="date"
          class="w-full rounded-xl border border-app-border bg-app-card px-4 py-3 text-app-text focus:border-accent"
        />
      </div>

      <div class="flex items-end gap-2">
        <div class="flex-1">
          <OptionField v-model="categoryId" :options="categoryOptions" label="Категория" />
        </div>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-xl border border-app-border bg-app-card text-app-text-muted"
          @click="catsOpen = true"
        >
          <Icon name="cog" :size="18" />
        </button>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-app-text-muted">Заметка</label>
        <input
          v-model="notes"
          type="text"
          placeholder="необязательно"
          class="w-full rounded-xl border border-app-border bg-app-card px-4 py-3 focus:border-accent"
        />
      </div>

      <div class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3">
        <span class="text-sm">Напоминания</span>
        <ToggleSwitch :checked="reminderEnabled" @update:checked="reminderEnabled = $event" />
      </div>

      <div v-if="reminderEnabled" class="rounded-xl border border-app-border bg-app-card p-4">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium">Правила напоминаний</span>
          <button type="button" class="inline-flex h-8 items-center text-sm text-accent-hi" @click="addRule">+ Добавить</button>
        </div>
        <div v-if="!rules.length" class="text-xs text-app-text-muted">
          Нет правил — уведомлений не будет.
        </div>
        <div
          v-for="(r, i) in rules"
          :key="i"
          class="mb-2 flex flex-col gap-2 rounded-lg border border-app-border p-3"
        >
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <OptionField v-model="r.kind" :options="ruleKindOptions" />
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-app-text-muted hover:text-red-400"
              @click="rules.splice(i, 1)"
            >
              <Icon name="x" :size="16" />
            </button>
          </div>
          <div v-if="r.kind === 'advance'" class="flex items-center gap-2 text-sm">
            <span class="text-app-text-muted">за</span>
            <input
              v-model.number="r.daysBefore"
              type="number"
              min="0"
              class="w-16 rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-center"
            />
            <span class="text-app-text-muted">дн. в</span>
            <input
              v-model="r.atTime"
              type="time"
              class="rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-app-text"
            />
          </div>
          <div v-else-if="r.kind === 'payment_day'" class="flex items-center gap-2 text-sm">
            <span class="text-app-text-muted">в</span>
            <input
              v-model="r.atTime"
              type="time"
              class="rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-app-text"
            />
          </div>
          <div v-else class="flex items-center gap-2 text-sm">
            <span class="text-app-text-muted">каждые</span>
            <input
              v-model.number="r.intervalHours"
              type="number"
              min="1"
              class="w-16 rounded-lg border border-app-border bg-app-bg px-2 py-1.5 text-center"
            />
            <span class="text-app-text-muted">ч.</span>
          </div>
        </div>
      </div>

      <div
        v-if="isEdit"
        class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3"
      >
        <span class="text-sm">Активна</span>
        <ToggleSwitch :checked="isActive" @update:checked="isActive = $event" />
      </div>

      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

      <button
        type="button"
        :disabled="saving"
        class="flex h-8 items-center justify-center rounded-xl bg-accent font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
        @click="save"
      >
        {{ saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Добавить подписку' }}
      </button>

      <button
        v-if="isEdit"
        type="button"
        class="flex h-8 items-center justify-center gap-2 rounded-xl border border-red-900/50 text-sm text-red-400"
        @click="confirmDelete = true"
      >
        <Icon name="trash" :size="16" /> Удалить подписку
      </button>
    </div>

    <Sheet :open="confirmDelete" title="Удалить подписку?" @update:open="confirmDelete = $event">
      <p class="mb-5 text-sm text-app-text-muted">
        «{{ name }}» и история её платежей будут удалены безвозвратно.
      </p>
      <div class="flex gap-3">
        <button
          type="button"
          class="flex h-8 flex-1 items-center justify-center rounded-xl border border-app-border"
          @click="confirmDelete = false"
        >
          Отмена
        </button>
        <button type="button" class="flex h-8 flex-1 items-center justify-center rounded-xl bg-red-600 font-medium" @click="remove">
          Удалить
        </button>
      </div>
    </Sheet>

    <Sheet :open="catsOpen" title="Категории" @update:open="catsOpen = $event">
      <div class="mb-4 flex items-center gap-2">
        <EmojiPicker v-model="newCatIcon" />
        <input
          v-model="newCatName"
          type="text"
          placeholder="Новая категория"
          class="flex-1 rounded-xl border border-app-border bg-app-card px-4 py-2.5"
          @keyup.enter="addCategory"
        />
        <button
          type="button"
          class="flex h-8 items-center rounded-xl bg-accent px-4 font-medium text-accent-fg"
          @click="addCategory"
        >
          +
        </button>
      </div>
      <div class="flex flex-col">
        <div
          v-for="c in store.categories"
          :key="c.id"
          class="flex items-center gap-3 rounded-xl px-2 py-2.5"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
            :style="{ backgroundColor: c.color + '26' }"
            >{{ c.icon }}</span
          >
          <span class="flex-1">{{ c.name }}</span>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-app-text-muted hover:text-red-400"
            @click="deleteCategory(c.id)"
          >
            <Icon name="trash" :size="15" />
          </button>
        </div>
      </div>
    </Sheet>
  </div>
</template>
