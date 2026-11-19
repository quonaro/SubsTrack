<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { store, updateSetting } from '../store'
import { CURRENCIES } from '../domain/currency'
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
import { applyThemeToDom } from '../theme'
import OptionField from '../components/OptionField.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import Icon from '../components/Icon.vue'
import { ref } from 'vue'

const currencyOptions = CURRENCIES.map((c) => ({ value: c, label: c }))
const notifPerm = ref('unknown')

onMounted(async () => {
  notifPerm.value = await notificationPermission()
  await refreshPermissions()
})

async function toggleTheme(v: boolean): Promise<void> {
  await updateSetting('theme', v ? 'light' : 'dark')
  applyThemeToDom(store.settings.theme)
}

async function askNotif(): Promise<void> {
  await requestNotificationPermission()
  notifPerm.value = await notificationPermission()
  await grantNotificationPermission()
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
  <div class="mx-auto max-w-xl px-4 pb-6 pt-6">
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
      <OptionField
        :model-value="store.settings.baseCurrency"
        :options="currencyOptions"
        label="Основная валюта"
        @update:model-value="updateSetting('baseCurrency', $event)"
      />
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
          class="rounded-full bg-violet-600/20 px-4 py-2 text-xs font-medium text-violet-300"
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
          class="rounded-full bg-violet-600/20 px-4 py-2 text-xs font-medium text-violet-300"
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
            class="rounded-full bg-violet-600/20 px-4 py-2 text-xs font-medium text-violet-300 disabled:opacity-50"
            :disabled="update.busy"
            @click="checkForUpdate"
          >
            Проверить
          </button>
        </div>
        <div v-if="update.status === 'available'" class="mt-3">
          <div v-if="update.dl === 'downloading'" class="mb-2">
            <div class="h-2 overflow-hidden rounded-full bg-app-bg">
              <div class="h-full bg-violet-500 transition-all" :style="{ width: `${update.progress}%` }" />
            </div>
            <div class="mt-1 text-xs text-app-text-muted">Загрузка… {{ update.progress }}%</div>
          </div>
          <button
            v-else
            type="button"
            class="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white"
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

    <p class="text-center text-xs text-app-text-muted/60">SubsTrack · local-first · данные хранятся на устройстве</p>
  </div>
</template>
