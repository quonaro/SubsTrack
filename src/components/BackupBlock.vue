<script setup lang="ts">
import { computed, ref } from 'vue'
import ConfirmModal from './ConfirmModal.vue'
import { exportBackup, importBackup, store } from '../store'
import { backupCounts, backupFileName, parseBackup, type BackupCounts } from '../domain/backup'
import { saveBackup } from '../domain/backupFile'
import { applyThemeToDom, effectiveTheme } from '../theme'
import { pluralRu } from '../domain/plural'

const busy = ref(false)
const error = ref('')
const notice = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const pending = ref<{ text: string; counts: BackupCounts } | null>(null)

const summary = computed(() => {
  const subs = store.subscriptions.length
  const cats = store.categories.length
  return `${subs} ${pluralRu(subs, 'подписка', 'подписки', 'подписок')} · ${cats} ${pluralRu(
    cats,
    'категория',
    'категории',
    'категорий',
  )}`
})

const confirmMessage = computed(() => {
  const c = pending.value?.counts
  if (!c) return ''
  return `Текущие данные будут заменены на содержимое копии: ${c.subscriptions} ${pluralRu(
    c.subscriptions,
    'подписка',
    'подписки',
    'подписок',
  )}, ${c.payments} ${pluralRu(c.payments, 'платёж', 'платежа', 'платежей')}, ${c.categories} ${pluralRu(
    c.categories,
    'категория',
    'категории',
    'категорий',
  )}. Настройки и напоминания тоже заменятся. Отменить это нельзя.`
})

function reset(): void {
  error.value = ''
  notice.value = ''
}

async function doExport(): Promise<void> {
  if (busy.value) return
  busy.value = true
  reset()
  try {
    const { name, text } = await exportBackup()
    const res = await saveBackup(text, name || backupFileName(new Date().toISOString()))
    if (res.kind === 'downloaded') notice.value = 'Копия сохранена в загрузки.'
    else if (res.kind === 'saved') notice.value = 'Копия сохранена в выбранную папку.'
    else notice.value = 'Сохранение отменено — файл не записан.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось сохранить копию.'
  } finally {
    busy.value = false
  }
}

async function pickFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // allow re-picking the same file after an error
  if (!file) return
  reset()
  try {
    const text = await file.text()
    const parsed = parseBackup(text)
    if (!parsed.ok) {
      error.value = parsed.error
      return
    }
    pending.value = { text, counts: backupCounts(parsed.backup) }
  } catch {
    error.value = 'Не удалось прочитать файл.'
  }
}

async function confirmImport(): Promise<void> {
  const job = pending.value
  if (!job || busy.value) return
  busy.value = true
  reset()
  try {
    const counts = await importBackup(job.text)
    // A backup carries theme settings too — repaint without a reload.
    applyThemeToDom(
      effectiveTheme(store.settings),
      store.settings.accent,
      store.settings.preset,
      store.settings.themeMode,
    )
    notice.value = `Восстановлено: ${counts.subscriptions} ${pluralRu(
      counts.subscriptions,
      'подписка',
      'подписки',
      'подписок',
    )}, ${counts.payments} ${pluralRu(counts.payments, 'платёж', 'платежа', 'платежей')}.`
    pending.value = null
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось применить копию.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="rounded-xl border border-app-border bg-app-card px-4 py-3">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="text-sm">Резервная копия</div>
        <div class="text-xs text-app-text-muted">Сейчас: {{ summary }}</div>
      </div>
      <div class="flex shrink-0 gap-2">
        <button
          type="button"
          class="inline-flex h-9 items-center rounded-xl border border-app-border bg-app-bg px-3 text-sm font-medium text-app-text transition hover:border-app-text-muted disabled:opacity-50"
          :disabled="busy"
          @click="fileInput?.click()"
        >
          Импорт
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center rounded-xl bg-accent px-3 text-sm font-medium text-accent-fg transition disabled:opacity-50"
          :disabled="busy"
          @click="doExport"
        >
          Экспорт
        </button>
      </div>
    </div>
    <p v-if="busy" class="mt-2 text-xs text-app-text-muted">Работаю…</p>
    <p v-else-if="error" class="mt-2 text-xs text-red-400">{{ error }}</p>
    <p v-else-if="notice" class="mt-2 text-xs text-green-400">{{ notice }}</p>
    <p v-else class="mt-2 text-xs text-app-text-muted">
      JSON-файл со всеми подписками, платежами и настройками.
    </p>

    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      class="hidden"
      aria-hidden="true"
      tabindex="-1"
      @change="pickFile"
    />

    <ConfirmModal
      :open="pending !== null"
      title="Заменить данные из копии?"
      :message="confirmMessage"
      confirm-label="Заменить"
      @update:open="pending = null"
      @confirm="confirmImport"
    />
  </div>
</template>
