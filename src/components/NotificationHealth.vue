<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  alarms,
  alarmsRelevant,
  refreshAlarms,
  requestBatteryExemption,
  requestExactAlarms,
} from '../alarms'
import {
  notificationPermission,
  reminderState,
  requestNotificationPermission,
} from '../domain/reminders'
import { grantNotificationPermission } from '../update'
import Icon from './Icon.vue'

const notifPerm = ref('unknown')

onMounted(async () => {
  notifPerm.value = await notificationPermission()
  await refreshAlarms()
})

// The runtime dialog is one-shot; once hard-denied only the system app screen
// can re-enable notifications (update.ts decides which route to take).
async function askNotif(): Promise<void> {
  await requestNotificationPermission()
  notifPerm.value = await notificationPermission()
  await grantNotificationPermission()
}

const exactLabel = computed(() => {
  if (!alarms.checked) return 'проверяю…'
  return alarms.exact ? 'выдано' : 'нет — уведомления могут опаздывать'
})

const batteryLabel = computed(() => {
  if (!alarms.checked) return 'проверяю…'
  return alarms.battery ? 'не ограничивает' : 'ограничивает — напоминания могут не приходить'
})

const scheduledLabel = computed(() => {
  if (!reminderState.at) return 'ещё не планировались'
  const at = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(reminderState.at),
  )
  return `${reminderState.scheduled} шт. на год вперёд · обновлено в ${at}`
})
</script>

<template>
  <div class="flex flex-col gap-2">
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
        class="inline-flex h-9 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi"
        @click="askNotif"
      >
        Разрешить
      </button>
      <Icon v-else name="check" :size="18" class="text-green-400" />
    </div>

    <div v-if="alarmsRelevant() && !alarms.exact" class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3">
      <div>
        <div class="text-sm">Точные будильники</div>
        <div class="text-xs text-app-text-muted">{{ exactLabel }}</div>
      </div>
      <button
        type="button"
        class="inline-flex h-9 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi"
        @click="requestExactAlarms"
      >
        Разрешить
      </button>
    </div>

    <div v-if="alarmsRelevant() && !alarms.battery" class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3">
      <div>
        <div class="text-sm">Оптимизация батареи</div>
        <div class="text-xs text-app-text-muted">{{ batteryLabel }}</div>
      </div>
      <button
        type="button"
        class="inline-flex h-9 items-center rounded-full bg-accent/20 px-4 text-xs font-medium text-accent-hi"
        @click="requestBatteryExemption"
      >
        Отключить
      </button>
    </div>

    <div class="flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3">
      <div>
        <div class="text-sm">Запланировано напоминаний</div>
        <div class="text-xs text-app-text-muted">{{ scheduledLabel }}</div>
      </div>
      <Icon v-if="reminderState.scheduled > 0" name="check" :size="18" class="text-green-400" />
    </div>
  </div>
</template>
