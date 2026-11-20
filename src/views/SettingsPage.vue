<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { seedDemoData, store, updateSetting } from '../store'
import { CURRENCIES, CURRENCY_FLAGS, CURRENCY_NAMES, CURRENCY_SYMBOLS } from '../domain/currency'
import { sendTestNotification } from '../domain/reminders'
import {
  appVersion,
  checkForUpdate,
  downloadUpdate,
  grantInstallPermission,
  grantNotificationPermission,
  perms,
  permsRelevant,
  refreshPermissions,
  update,
} from '../update'
import {
  ACCENTS,
  THEME_PRESETS,
  appliedThemeMode,
  applyThemeToDom,
  effectiveTheme,
  type AccentMeta,
  type PresetVar,
  type ThemePreset,
} from '../theme'
import type { AccentKey, PresetKey, ThemeMode } from '../types'
import { runThemeWipe } from '../themeWipe'
import Icon from '../components/Icon.vue'
import Modal from '../components/Modal.vue'
import NotificationHealth from '../components/NotificationHealth.vue'
import { ref } from 'vue'

const isDev = import.meta.env.DEV

const accentEntries = Object.entries(ACCENTS) as [AccentKey, AccentMeta][]
const presetEntries = Object.entries(THEME_PRESETS) as [PresetKey, ThemePreset][]

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'dark', label: 'Темная', icon: 'moon' },
  { value: 'system', label: 'Система', icon: 'monitor' },
  { value: 'light', label: 'Светлая', icon: 'sun' },
]

const PRESET_FALLBACK: Record<'dark' | 'light', Record<PresetVar, string>> = {
  dark: {
    '--color-app-bg': '#0f1115',
    '--color-app-bg2': '#171a21',
    '--color-app-card': '#1e222b',
    '--color-app-border': '#2a2f3a',
    '--color-app-text': '#e8eaf0',
    '--color-app-text-muted': '#8a8f9e',
  },
  light: {
    '--color-app-bg': '#f5f6f8',
    '--color-app-bg2': '#ffffff',
    '--color-app-card': '#ffffff',
    '--color-app-border': '#e2e4ea',
    '--color-app-text': '#1a1d24',
    '--color-app-text-muted': '#6b7080',
  },
}

function presetVar(key: PresetKey, name: PresetVar): string {
  // Preview follows the theme actually on screen — during a wipe it still
  // shows the old mode until apply() runs under full cover.
  const mode = appliedThemeMode.value
  return THEME_PRESETS[key][mode][name] ?? PRESET_FALLBACK[mode][name]
}

// Pending choice: the wipe commits the settings only once the fill fully
// covers the screen, so the accent border on the tiles doesn't jump to the
// new selection while the old theme is still on screen.
const pendingPreset = ref<PresetKey | null>(null)
const pendingAccent = ref<AccentKey | null>(null)
const pendingThemeMode = ref<ThemeMode | null>(null)
const shownPreset = computed(() => pendingPreset.value ?? store.settings.preset)
const shownAccent = computed(() => pendingAccent.value ?? store.settings.accent)
const shownThemeMode = computed(() => pendingThemeMode.value ?? store.settings.themeMode)
const currencyOpen = ref(false)

onMounted(async () => {
  await refreshPermissions()
})

function applyAppearance(): void {
  applyThemeToDom(
    effectiveTheme(store.settings),
    store.settings.accent,
    store.settings.preset,
    store.settings.themeMode,
  )
}

async function setPreset(v: PresetKey, e: MouseEvent): Promise<void> {
  const accent = THEME_PRESETS[v].accent
  pendingPreset.value = v
  try {
    await runThemeWipe(
      e,
      async () => {
        await updateSetting('preset', v)
        await updateSetting('accent', accent)
        pendingPreset.value = null
        applyAppearance()
      },
      ACCENTS[accent].value,
    )
  } finally {
    pendingPreset.value = null
  }
}

async function setTheme(v: ThemeMode, e: MouseEvent): Promise<void> {
  pendingThemeMode.value = v
  // Theme mode switches wipe with plain black/white; presets & accent keep the accent color.
  const fill =
    effectiveTheme({ ...store.settings, themeMode: v }) === 'light' ? '#ffffff' : '#000000'
  try {
    await runThemeWipe(
      e,
      async () => {
        await updateSetting('themeMode', v)
        if (v !== 'system') await updateSetting('theme', v)
        pendingThemeMode.value = null
        applyAppearance()
      },
      fill,
    )
  } finally {
    pendingThemeMode.value = null
  }
}

async function setAccent(v: AccentKey, e: MouseEvent): Promise<void> {
  pendingAccent.value = v
  try {
    await runThemeWipe(
      e,
      async () => {
        await updateSetting('accent', v)
        pendingAccent.value = null
        applyAppearance()
      },
      ACCENTS[v].value,
    )
  } finally {
    pendingAccent.value = null
  }
}

async function pickCurrency(c: string): Promise<void> {
  await updateSetting('baseCurrency', c)
  currencyOpen.value = false
}

const seeding = ref(false)
const seeded = ref(false)

type TestNotifState = 'idle' | 'sending' | 'sent' | 'denied' | 'web' | 'error'
const testNotif = ref<TestNotifState>('idle')

async function testNotifSend(): Promise<void> {
  if (testNotif.value === 'sending') return
  testNotif.value = 'sending'
  try {
    testNotif.value = await sendTestNotification()
  } catch {
    testNotif.value = 'error'
  }
}

async function seed(): Promise<void> {
  if (seeding.value) return
  seeding.value = true
  seeded.value = false
  try {
    await seedDemoData()
    seeded.value = true
  } finally {
    seeding.value = false
  }
}

const checkedAtLabel = computed(() => {
  const ts = update.checkedAt
  if (!ts) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
})

const updateLabel = computed(() => {
  if (update.status === 'checking') return 'Проверка…'
  if (update.status === 'available') return `Доступна ${update.latest}`
  if (update.status === 'uptodate') {
    return checkedAtLabel.value ? `Обновлено ${checkedAtLabel.value}` : 'Обновлений нет'
  }
  if (update.status === 'error') return 'Ошибка проверки'
  return checkedAtLabel.value ? `Обновлено ${checkedAtLabel.value}` : 'Проверить обновления'
})
</script>

<template>
  <div class="mx-auto w-full max-w-xl px-4 pb-6 pt-6 sm:px-6 md:max-w-none lg:px-8">
    <header class="mb-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <Icon name="cog" :size="22" class="text-accent-hi" />Параметры
      </h1>
      <p class="text-sm text-app-text-muted">Версия {{ appVersion }}</p>
    </header>

    <div class="lg:columns-2 lg:gap-6 2xl:columns-3">
    <div class="mb-6 flex break-inside-avoid flex-col gap-2">
      <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-app-text-muted">Внешний вид</h2>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="mb-3 text-sm">Тема</div>
        <div class="flex gap-2" role="radiogroup" aria-label="Тема">
          <button
            v-for="t in THEME_OPTIONS"
            :key="t.value"
            type="button"
            role="radio"
            :aria-checked="shownThemeMode === t.value"
            class="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border text-sm font-medium transition"
            :class="
              shownThemeMode === t.value
                ? 'border-accent bg-accent text-accent-fg shadow-sm'
                : 'border-app-border bg-app-bg text-app-text hover:border-app-text-muted hover:bg-app-bg2'
            "
            @click="setTheme(t.value, $event)"
          >
            <Icon :name="t.icon" :size="16" />
            {{ t.label }}
          </button>
        </div>
      </div>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="mb-3 text-sm">Цветовая тема</div>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="[key, p] in presetEntries"
            :key="key"
            type="button"
            :aria-label="p.label"
            :aria-pressed="shownPreset === key"
            class="flex flex-col gap-2 rounded-lg border bg-app-bg p-2.5 text-left transition"
            :class="
              shownPreset === key
                ? 'border-accent ring-1 ring-accent'
                : 'border-app-border hover:bg-app-bg2'
            "
            @click="setPreset(key, $event)"
          >
            <span class="flex h-10 w-full overflow-hidden rounded-md border border-app-border">
              <span
                class="flex-1"
                :style="{ backgroundColor: presetVar(key, '--color-app-bg') }"
              />
              <span
                class="flex-1"
                :style="{ backgroundColor: presetVar(key, '--color-app-card') }"
              />
            </span>
            <span class="flex items-center gap-1.5">
              <span
                class="h-2.5 w-2.5 shrink-0 rounded-full"
                :style="{ backgroundColor: ACCENTS[p.accent].value }"
              />
              <span class="truncate text-xs font-medium">{{ p.label }}</span>
            </span>
          </button>
        </div>
      </div>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="mb-3 text-sm">Акцентный цвет</div>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="[key, meta] in accentEntries"
            :key="key"
            type="button"
            :aria-label="meta.label"
            :aria-pressed="shownAccent === key"
            :title="meta.label"
            class="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
            :class="{
              'ring-2 ring-app-text': shownAccent === key,
            }"
            :style="{ backgroundColor: meta.value }"
            @click="setAccent(key, $event)"
          >
            <Icon
              v-if="shownAccent === key"
              name="check"
              :size="16"
              :style="{ color: meta.fg ?? '#ffffff' }"
            />
          </button>
        </div>
      </div>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="mb-3 text-sm">Основная валюта</div>
        <button
          type="button"
          class="flex h-9 w-full items-center justify-between rounded-xl border border-app-text-muted/40 bg-app-bg px-4 text-left text-app-text transition hover:border-accent"
          @click="currencyOpen = true"
        >
          <span class="flex items-center gap-2">
            <img
              :src="CURRENCY_FLAGS[store.settings.baseCurrency]"
              :alt="store.settings.baseCurrency"
              class="h-4 w-[22px] rounded-[2px] object-cover ring-1 ring-black/10"
            />
            <span class="text-sm font-medium">{{ store.settings.baseCurrency }}</span>
            <span class="text-xs text-app-text-muted">
              {{ CURRENCY_SYMBOLS[store.settings.baseCurrency] }}
            </span>
          </span>
          <Icon name="chevron-down" :size="16" class="text-app-text" />
        </button>
      </div>
    </div>

    <div class="mb-6 flex break-inside-avoid flex-col gap-2">
      <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-app-text-muted">
        Уведомления
      </h2>
      <NotificationHealth />
      <div
        v-if="permsRelevant() && perms.install === 'denied'"
        class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3"
      >
        <div class="text-sm">Установка из неизвестных источников</div>
        <button
          type="button"
          class="inline-flex h-9 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi"
          @click="grantInstallPermission"
        >
          Открыть настройки
        </button>
      </div>
    </div>

    <div class="mb-6 flex break-inside-avoid flex-col gap-2">
      <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-app-text-muted">
        Обновление
      </h2>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm">Версия {{ appVersion }}</div>
            <div class="text-xs text-app-text-muted">{{ updateLabel }}</div>
          </div>
          <button
            v-if="update.status !== 'available'"
            type="button"
            class="inline-flex h-9 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi disabled:opacity-50"
            :disabled="update.busy"
            @click="checkForUpdate"
          >
            Проверить
          </button>
        </div>
        <div v-if="update.status === 'available'" class="mt-3">
          <div v-if="update.dl === 'downloading'" class="mb-2">
            <div class="h-2 overflow-hidden rounded-full bg-app-bg">
              <div class="h-full bg-accent transition-all" :style="{ width: `${update.progress}%` }" />
            </div>
            <div class="mt-1 text-xs text-app-text-muted">Загрузка… {{ update.progress }}%</div>
          </div>
          <button
            v-else
            type="button"
            class="flex h-9 w-full items-center justify-center rounded-xl bg-accent text-sm font-medium text-accent-fg"
            @click="downloadUpdate"
          >
            {{ update.dl === 'ready' ? 'Установить снова' : 'Скачать и установить' }}
          </button>
          <p v-if="update.dl === 'error'" class="mt-2 text-xs text-red-400">
            Ошибка загрузки — попробуйте ещё раз.
          </p>
        </div>
      </div>
    </div>

    <div v-if="isDev" class="mb-6 flex break-inside-avoid flex-col gap-2">
      <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-app-text-muted">
        Для разработчика
      </h2>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm">Тестовые данные</div>
            <div class="text-xs text-app-text-muted">
              Платежи и напоминания для проверки багов
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-9 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi disabled:opacity-50"
            :disabled="seeding"
            @click="seed"
          >
            {{ seeding ? 'Заполняю…' : 'Заполнить' }}
          </button>
        </div>
        <p v-if="seeded" class="mt-2 text-xs text-green-400">
          Добавлено. Повторное нажатие добавит ещё одну порцию.
        </p>
      </div>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm">Уведомления</div>
            <div class="text-xs text-app-text-muted">
              Тестовое уведомление через ~5 секунд (Capacitor)
            </div>
          </div>
          <button
            type="button"
            aria-label="Тестовое уведомление"
            class="inline-flex h-9 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi disabled:opacity-50"
            :disabled="testNotif === 'sending'"
            @click="testNotifSend"
          >
            {{ testNotif === 'sending' ? 'Отправляю…' : 'Проверить' }}
          </button>
        </div>
        <p
          v-if="testNotif !== 'idle' && testNotif !== 'sending'"
          class="mt-2 text-xs"
          :class="testNotif === 'sent' ? 'text-green-400' : 'text-red-400'"
        >
          <template v-if="testNotif === 'sent'">Запланировано — проверьте шторку через ~5 секунд.</template>
          <template v-else-if="testNotif === 'denied'">Нет разрешения на уведомления.</template>
          <template v-else-if="testNotif === 'web'">Недоступно в браузере — только на устройстве.</template>
          <template v-else>Ошибка планирования уведомления.</template>
        </p>
      </div>
    </div>
    </div>

    <Modal :open="currencyOpen" title="Основная валюта" @update:open="currencyOpen = $event">
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="c in CURRENCIES"
          :key="c"
          type="button"
          class="relative flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition"
          :class="
            store.settings.baseCurrency === c
              ? 'border-accent bg-accent/20'
              : 'border-app-border hover:bg-app-card'
          "
          @click="pickCurrency(c)"
        >
          <img
            :src="CURRENCY_FLAGS[c]"
            :alt="c"
            class="h-8 w-[43px] rounded-[3px] object-cover ring-1 ring-black/10"
          />
          <span class="text-sm font-semibold">{{ c }}</span>
          <span class="text-xs text-app-text-muted">{{ CURRENCY_NAMES[c] }}</span>
          <Icon
            v-if="store.settings.baseCurrency === c"
            name="check"
            :size="16"
            class="absolute right-2 top-2 text-accent-hi"
          />
        </button>
      </div>
    </Modal>

    <p class="text-center text-xs text-app-text-muted/60">SubsTrack · local-first · данные хранятся на устройстве</p>
  </div>
</template>
