<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { seedDemoData, store, updateSetting } from '../store'
import { CURRENCIES, CURRENCY_SYMBOLS } from '../domain/currency'
import { notificationPermission, requestNotificationPermission } from '../domain/reminders'
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
  applyThemeToDom,
  type AccentMeta,
  type PresetVar,
  type ThemePreset,
} from '../theme'
import type { AccentKey, PresetKey } from '../types'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import Icon from '../components/Icon.vue'
import { ref } from 'vue'

const accentEntries = Object.entries(ACCENTS) as [AccentKey, AccentMeta][]
const presetEntries = Object.entries(THEME_PRESETS) as [PresetKey, ThemePreset][]

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
  const mode = store.settings.theme
  return THEME_PRESETS[key][mode][name] ?? PRESET_FALLBACK[mode][name]
}
const notifPerm = ref('unknown')

onMounted(async () => {
  notifPerm.value = await notificationPermission()
  await refreshPermissions()
})

function applyAppearance(): void {
  applyThemeToDom(store.settings.theme, store.settings.accent, store.settings.preset)
}

async function setPreset(v: PresetKey): Promise<void> {
  await updateSetting('preset', v)
  await updateSetting('accent', THEME_PRESETS[v].accent)
  applyAppearance()
}

async function toggleTheme(v: boolean): Promise<void> {
  await updateSetting('theme', v ? 'light' : 'dark')
  applyAppearance()
}

async function setAccent(v: AccentKey): Promise<void> {
  await updateSetting('accent', v)
  applyAppearance()
}

async function askNotif(): Promise<void> {
  await requestNotificationPermission()
  notifPerm.value = await notificationPermission()
  await grantNotificationPermission()
}

const seeding = ref(false)
const seeded = ref(false)

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

const updateLabel = computed(() => {
  if (update.status === 'checking') return 'Проверка…'
  if (update.status === 'available') return `Доступна ${update.latest}`
  if (update.status === 'uptodate') return 'Последняя версия'
  if (update.status === 'error') return 'Ошибка проверки'
  return 'Проверить обновления'
})
</script>

<template>
  <div class="mx-auto w-full max-w-xl px-4 pb-6 pt-6">
    <h1 class="mb-6 text-2xl font-bold">Настройки</h1>

    <div class="mb-6 flex flex-col gap-2">
      <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-app-text-muted">Внешний вид</h2>
      <div class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3">
        <span class="text-sm">Светлая тема</span>
        <ToggleSwitch
          :checked="store.settings.theme === 'light'"
          @update:checked="toggleTheme"
        />
      </div>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="mb-3 text-sm">Цветовая тема</div>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="[key, p] in presetEntries"
            :key="key"
            type="button"
            :aria-label="p.label"
            :aria-pressed="store.settings.preset === key"
            class="flex flex-col gap-2 rounded-lg border p-2.5 text-left transition"
            :class="
              store.settings.preset === key
                ? 'border-accent ring-1 ring-accent'
                : 'border-app-border hover:bg-app-bg'
            "
            @click="setPreset(key)"
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
            :aria-pressed="store.settings.accent === key"
            :title="meta.label"
            class="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
            :class="{
              'ring-2 ring-app-text ring-offset-2 ring-offset-app-card':
                store.settings.accent === key,
            }"
            :style="{ backgroundColor: meta.value }"
            @click="setAccent(key)"
          >
            <Icon
              v-if="store.settings.accent === key"
              name="check"
              :size="16"
              :style="{ color: meta.fg ?? '#ffffff' }"
            />
          </button>
        </div>
      </div>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="mb-3 text-sm">Основная валюта</div>
        <div class="flex gap-2" role="radiogroup" aria-label="Основная валюта">
          <button
            v-for="c in CURRENCIES"
            :key="c"
            type="button"
            role="radio"
            :aria-checked="store.settings.baseCurrency === c"
            class="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-sm font-medium transition"
            :class="
              store.settings.baseCurrency === c
                ? 'border-accent bg-accent/20 text-accent-hi'
                : 'border-app-border text-app-text-muted hover:bg-app-bg'
            "
            @click="updateSetting('baseCurrency', c)"
          >
            <span class="text-base">{{ CURRENCY_SYMBOLS[c] }}</span>
            {{ c }}
          </button>
        </div>
      </div>
    </div>

    <div class="mb-6 flex flex-col gap-2">
      <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-app-text-muted">
        Уведомления
      </h2>
      <div class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div>
          <div class="text-sm">Разрешение на уведомления</div>
          <div class="text-xs text-app-text-muted">
            {{ notifPerm === 'granted' ? 'выдано' : notifPerm === 'denied' ? 'запрещено' : 'не запрошено' }}
          </div>
        </div>
        <button
          v-if="notifPerm !== 'granted'"
          type="button"
          class="inline-flex h-8 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi"
          @click="askNotif"
        >
          Разрешить
        </button>
        <Icon v-else name="check" :size="18" class="text-green-400" />
      </div>
      <div
        v-if="permsRelevant() && perms.install === 'denied'"
        class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3"
      >
        <div class="text-sm">Установка из неизвестных источников</div>
        <button
          type="button"
          class="inline-flex h-8 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi"
          @click="grantInstallPermission"
        >
          Открыть настройки
        </button>
      </div>
    </div>

    <div class="mb-6 flex flex-col gap-2">
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
            class="inline-flex h-8 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi disabled:opacity-50"
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
            class="flex h-8 w-full items-center justify-center rounded-xl bg-accent text-sm font-medium text-accent-fg"
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

    <div class="mb-6 flex flex-col gap-2">
      <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-app-text-muted">
        Для разработчика
      </h2>
      <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm">Тестовые данные</div>
            <div class="text-xs text-app-text-muted">
              Подписки, платежи и напоминания для проверки багов
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-8 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi disabled:opacity-50"
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
    </div>

    <p class="text-center text-xs text-app-text-muted/60">SubsTrack · local-first · данные хранятся на устройстве</p>
  </div>
</template>
