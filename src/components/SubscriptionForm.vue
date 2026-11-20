<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  createCategory,
  createSubscription,
  deleteCategory,
  listRulesFor,
  replaceRules,
  store,
  updateSubscription,
} from '../store'
import { ICON_TILE_ALPHA } from '../domain/colors'
import { CURRENCIES, parseMoney } from '../domain/currency'
import { ONE_TIME_PERIOD_DAYS, PERIOD_PRESETS, todayIso } from '../domain/dates'
import type { RuleKind } from '../types'
import { DEFAULT_NOTIFY_TIME } from '../domain/reminders'
import AppIcon from './AppIcon.vue'
import ColorSwatches from './ColorSwatches.vue'
import IconPicker from './IconPicker.vue'
import OptionField from './OptionField.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import Modal from './Modal.vue'
import ConfirmModal from './ConfirmModal.vue'
import Icon from './Icon.vue'

// The same form serves both surfaces: `subId` set → edit mode (modal),
// null/undefined → create mode (modal on the subscriptions list).
const props = defineProps<{ subId?: number | null }>()
const emit = defineEmits<{ saved: [] }>()

const isEdit = computed(() => props.subId != null)

// --- form state ---------------------------------------------------------------
const name = ref('')
const icon = ref('package')
const iconColor = ref<string | null>(null)
const priceText = ref('')
const currency = ref('RUB')
const periodPreset = ref<number | 'custom' | 'once'>(30)
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

const isOneTime = computed(() => periodPreset.value === 'once')

const periodDays = computed(() => {
  if (periodPreset.value === 'once') return ONE_TIME_PERIOD_DAYS
  return periodPreset.value === 'custom' ? Math.max(1, customDays.value || 1) : periodPreset.value
})

const dateLabel = computed(() =>
  isOneTime.value ? 'Дата платежа' : isEdit.value ? 'Следующий платёж' : 'Дата первого платежа',
)

const periodOptions = [
  ...PERIOD_PRESETS.map((p) => ({
    value: p.days as number | 'custom' | 'once',
    label: p.label,
    hint: `${p.days} дней`,
  })),
  { value: 'custom' as const, label: 'Свой период', hint: 'указать дни вручную' },
  { value: 'once' as const, label: 'Разово', hint: 'единоразовый платёж' },
]

const currencyOptions = CURRENCIES.map((c) => ({ value: c, label: c }))

const categoryOptions = computed(() => [
  { value: null as number | null, label: 'Без категории', icon: 'ban' },
  ...store.categories.map((c) => ({
    value: c.id as number | null,
    label: c.name,
    icon: c.icon,
  })),
])

// The icon tile inherits the category tint until the user picks its own color.
const categoryColor = computed(
  () => store.categories.find((c) => c.id === categoryId.value)?.color ?? null,
)

const ruleKindOptions = [
  { value: 'advance' as RuleKind, label: 'За N дней', hint: 'напомнить заранее' },
  { value: 'payment_day' as RuleKind, label: 'В день платежа', hint: 'утром в день списания' },
  { value: 'recurring' as RuleKind, label: 'Повторять', hint: 'каждые N часов до оплаты' },
]

// Notes grow from a single 36px line with whatever is typed.
const notesEl = ref<HTMLTextAreaElement | null>(null)

function autosizeNotes(): void {
  const el = notesEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(notes, () => void nextTick(autosizeNotes))

const error = ref('')
const saving = ref(false)
const justSaved = ref(false)
const catsOpen = ref(false)
const newCatName = ref('')
const newCatIcon = ref('folder')

onMounted(async () => {
  if (props.subId == null) return
  const sub = store.subscriptions.find((s) => s.id === props.subId)
  if (!sub) return
  name.value = sub.name
  icon.value = sub.icon
  iconColor.value = sub.iconColor
  priceText.value = (sub.priceMinor / 100).toString()
  currency.value = sub.currency
  const preset = PERIOD_PRESETS.find((p) => p.days === sub.periodDays)
  if (sub.isOneTime) periodPreset.value = 'once'
  else if (preset) periodPreset.value = preset.days
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
  hydrated = true
  lastSavedSnapshot = snapshot()
})

function addRule(): void {
  rules.value.push({
    kind: 'advance',
    daysBefore: 1,
    atTime: DEFAULT_NOTIFY_TIME,
    intervalHours: null,
  })
}

function validate(): string | null {
  if (!name.value.trim()) return 'Введите название'
  const price = parseMoney(priceText.value)
  if (price == null || price <= 0) return 'Введите корректную цену'
  if (!nextDate.value) return 'Укажите дату платежа'
  return null
}

async function persist(): Promise<boolean> {
  const err = validate()
  error.value = err ?? ''
  if (err) return false
  const price = parseMoney(priceText.value) as number
  saving.value = true
  try {
    const input = {
      name: name.value.trim(),
      priceMinor: price,
      currency: currency.value,
      periodDays: periodDays.value,
      isOneTime: isOneTime.value,
      startDate: nextDate.value,
      nextPaymentDate: nextDate.value,
      icon: icon.value,
      iconColor: iconColor.value,
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
    if (isEdit.value && props.subId != null) {
      const sub = await updateSubscription(props.subId, {
        ...input,
        startDate:
          store.subscriptions.find((s) => s.id === props.subId)?.startDate ?? input.startDate,
      })
      if (sub) await replaceRules(sub.id, ruleDrafts)
    } else {
      const sub = await createSubscription(input)
      await replaceRules(sub.id, ruleDrafts)
    }
    return true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения'
    return false
  } finally {
    saving.value = false
  }
}

async function save(): Promise<void> {
  if (isEdit.value && hydrated) {
    // The queued write also covers a debounce tick that is already pending.
    if (await flushAutosave()) emit('saved')
    return
  }
  if (await persist()) {
    lastSavedSnapshot = snapshot()
    emit('saved')
  }
}

// --- autosave (edit mode only) -------------------------------------------------
// Debounced whole-form persist, same idea as the task page in yourtask-next:
// every field change schedules a save; a snapshot guard skips no-op writes and
// post-hydration flushes. Invalid drafts show the usual validation error and
// are retried on the next change.
const AUTOSAVE_DELAY_MS = 800
let hydrated = false
let lastSavedSnapshot = ''
let autosaveTimer: ReturnType<typeof setTimeout> | null = null
// Writes are chained so a debounce tick and a close-time flush never persist
// the same draft twice or overwrite each other.
let saveQueue: Promise<boolean> = Promise.resolve(true)

function snapshot(): string {
  return JSON.stringify([
    name.value,
    icon.value,
    iconColor.value,
    priceText.value,
    currency.value,
    periodPreset.value,
    customDays.value,
    nextDate.value,
    categoryId.value,
    notes.value,
    reminderEnabled.value,
    isActive.value,
    rules.value,
  ])
}

function scheduleAutosave(): void {
  if (!isEdit.value || !hydrated) return
  if (snapshot() === lastSavedSnapshot) return
  justSaved.value = false
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => void flushAutosave(), AUTOSAVE_DELAY_MS)
}

/** Persist the draft right now instead of waiting for the autosave timer. */
async function flushAutosave(): Promise<boolean> {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer)
    autosaveTimer = null
  }
  if (!isEdit.value || !hydrated) return true
  const queued = saveQueue.then(async () => {
    const draft = snapshot()
    if (draft === lastSavedSnapshot) return true
    if (!(await persist())) return false
    lastSavedSnapshot = draft
    justSaved.value = true
    return true
  })
  saveQueue = queued.catch(() => false)
  return queued
}

// The edit modal awaits this before closing, so a debounced edit is never lost.
defineExpose({ flush: flushAutosave })

watch(
  [
    name,
    icon,
    iconColor,
    priceText,
    currency,
    periodPreset,
    customDays,
    nextDate,
    categoryId,
    notes,
    reminderEnabled,
    isActive,
    rules,
  ],
  scheduleAutosave,
  { deep: true },
)

onBeforeUnmount(() => {
  // Unmount paths that bypass the modal close (route change, list refresh)
  // still persist their draft.
  void flushAutosave()
})

async function addCategory(): Promise<void> {
  const n = newCatName.value.trim()
  if (!n) return
  const c = await createCategory({ name: n, icon: newCatIcon.value })
  categoryId.value = c.id
  newCatName.value = ''
}

// Deleting a category is destructive (subs lose the link), so it goes through
// a confirmation sheet instead of firing on the trash tap.
const pendingCat = ref<{ id: number; name: string } | null>(null)

function askDeleteCategory(id: number, catName: string): void {
  pendingCat.value = { id, name: catName }
}

async function confirmDeleteCategory(): Promise<void> {
  const cat = pendingCat.value
  pendingCat.value = null
  if (!cat) return
  if (categoryId.value === cat.id) categoryId.value = null
  await deleteCategory(cat.id)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start gap-3">
      <IconPicker v-model="icon" :size="58" :color="iconColor" :category-color="categoryColor" />
      <div class="flex-1">
        <label class="mb-1.5 block text-xs font-medium text-app-text-muted">Название</label>
        <input
          v-model="name"
          type="text"
          placeholder="Netflix, Spotify…"
          class="h-9 w-full rounded-xl border border-app-border bg-app-card px-4 focus:border-accent"
        />
      </div>
    </div>

    <div>
      <span class="mb-1.5 block text-xs font-medium text-app-text-muted">Цвет фона</span>
      <ColorSwatches v-model="iconColor" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-app-text-muted">Цена</label>
        <input
          v-model="priceText"
          inputmode="decimal"
          placeholder="499"
          class="h-9 w-full rounded-xl border border-app-border bg-app-card px-4 focus:border-accent"
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
        class="h-9 w-full rounded-xl border border-app-border bg-app-card px-4 focus:border-accent"
      />
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-medium text-app-text-muted">
        {{ dateLabel }}
      </label>
      <input
        v-model="nextDate"
        type="date"
        class="h-9 w-full rounded-xl border border-app-border bg-app-card px-4 text-app-text focus:border-accent"
      />
    </div>

    <div class="flex items-end gap-2">
      <div class="flex-1">
        <OptionField v-model="categoryId" :options="categoryOptions" label="Категория" />
      </div>
      <button
        type="button"
        aria-label="Категории"
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-app-border bg-app-card text-app-text-muted"
        @click="catsOpen = true"
      >
        <Icon name="cog" :size="18" />
      </button>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-medium text-app-text-muted">Заметка</label>
      <textarea
        ref="notesEl"
        v-model="notes"
        rows="1"
        placeholder="Необязательно"
        class="block min-h-9 w-full resize-none overflow-hidden rounded-xl border border-app-border bg-app-card px-4 py-2 leading-5 focus:border-accent"
      />
    </div>

    <div class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3">
      <span class="text-sm">Напоминания</span>
      <ToggleSwitch :checked="reminderEnabled" @update:checked="reminderEnabled = $event" />
    </div>

    <div v-if="reminderEnabled" class="rounded-xl border border-app-border bg-app-card p-4">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-medium">Правила напоминаний</span>
        <button type="button" class="inline-flex h-9 items-center text-sm text-accent-hi" @click="addRule">+ Добавить</button>
      </div>
      <div v-if="!rules.length" class="text-xs text-app-text-muted">
        Нет правил — уведомлений не будет.
      </div>
      <div
        v-for="(r, i) in rules"
        :key="i"
        class="mb-2 flex flex-col gap-2 rounded-lg border border-app-border bg-app-bg p-3"
      >
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <OptionField v-model="r.kind" :options="ruleKindOptions" bg="bg2" />
          </div>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-bg2 text-app-text-muted hover:text-red-400"
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
            class="h-9 w-16 rounded-lg border border-app-border bg-app-bg2 px-2 text-center"
          />
          <span class="text-app-text-muted">дн. в</span>
          <input
            v-model="r.atTime"
            type="time"
            class="h-9 rounded-lg border border-app-border bg-app-bg2 px-2 text-app-text"
          />
        </div>
        <div v-else-if="r.kind === 'payment_day'" class="flex items-center gap-2 text-sm">
          <span class="text-app-text-muted">в</span>
          <input
            v-model="r.atTime"
            type="time"
            class="h-9 rounded-lg border border-app-border bg-app-bg2 px-2 text-app-text"
          />
        </div>
        <div v-else class="flex items-center gap-2 text-sm">
          <span class="text-app-text-muted">каждые</span>
          <input
            v-model.number="r.intervalHours"
            type="number"
            min="1"
            class="h-9 w-16 rounded-lg border border-app-border bg-app-bg2 px-2 text-center"
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

    <p v-if="isEdit && justSaved && !saving" class="text-xs text-app-text-muted">Изменения сохранены</p>

    <button
      type="button"
      :disabled="saving"
      class="flex h-9 items-center justify-center rounded-xl bg-accent font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
      @click="save"
    >
      {{ saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Добавить платёж' }}
    </button>

    <Modal :open="catsOpen" title="Категории" @update:open="catsOpen = $event">
      <div class="mb-4 flex items-center gap-2">
        <IconPicker v-model="newCatIcon" />
        <input
          v-model="newCatName"
          type="text"
          placeholder="Новая категория"
          class="h-9 flex-1 rounded-xl border border-app-border bg-app-card px-4"
          @keyup.enter="addCategory"
        />
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent font-medium text-accent-fg"
          @click="addCategory"
        >
          +
        </button>
      </div>
      <div class="flex flex-col">
        <div
          v-for="c in store.categories"
          :key="c.id"
          class="flex items-center gap-3 rounded-xl py-2.5"
        >
          <span
            class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg"
            :style="{ backgroundColor: c.color + ICON_TILE_ALPHA }"
          >
            <AppIcon :name="c.icon" :size="18" cover />
          </span>
          <span class="flex-1">{{ c.name }}</span>
          <button
            type="button"
            :aria-label="`Удалить категорию ${c.name}`"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-app-text-muted hover:text-red-400"
            @click="askDeleteCategory(c.id, c.name)"
          >
            <Icon name="trash" :size="15" />
          </button>
        </div>
      </div>
    </Modal>

    <ConfirmModal
      :open="pendingCat != null"
      title="Удалить категорию?"
      :message="
        pendingCat
          ? `«${pendingCat.name}» будет удалена. Платежи из неё останутся, но без категории.`
          : undefined
      "
      @update:open="!$event && (pendingCat = null)"
      @confirm="confirmDeleteCategory"
    />
  </div>
</template>
