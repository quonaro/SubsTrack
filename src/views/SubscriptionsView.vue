<script setup lang="ts">
import { useRouter } from 'vue-router'
import { markPaid, store, visibleSubscriptions } from '../store'
import type { SortMode } from '../types'
import SubCard from '../components/SubCard.vue'
import OptionField from '../components/OptionField.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import Icon from '../components/Icon.vue'
import { ref } from 'vue'

const router = useRouter()

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'next_date', label: 'По дате платежа' },
  { value: 'name', label: 'По имени' },
  { value: 'price', label: 'По цене' },
]

const sortOpen = ref(false)
</script>

<template>
  <div class="mx-auto max-w-xl px-4 pb-24 pt-6">
    <header class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Подписки</h1>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full border border-app-border bg-app-card px-3 py-2 text-sm text-app-text-muted"
        @click="sortOpen = !sortOpen"
      >
        Сортировка
      </button>
    </header>

    <div class="mb-4 flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-2.5">
      <span class="text-sm text-app-text-muted">Показывать архивные</span>
      <ToggleSwitch :checked="store.showArchived" @update:checked="store.showArchived = $event" />
    </div>

    <OptionField
      v-if="sortOpen"
      :model-value="store.sortMode"
      :options="sortOptions"
      label="Сортировка"
      @update:model-value="store.sortMode = $event; sortOpen = false"
    />

    <div v-if="visibleSubscriptions.length" class="mt-4 flex flex-col gap-2">
      <SubCard
        v-for="s in visibleSubscriptions"
        :key="s.id"
        :sub="s"
        @click="router.push(`/subscriptions/${s.id}/edit`)"
        @paid="markPaid"
      />
    </div>
    <div
      v-else
      class="mt-8 rounded-2xl border border-dashed border-app-border p-8 text-center text-app-text-muted"
    >
      Подписок пока нет.<br />Нажмите «+», чтобы добавить первую.
    </div>

    <router-link
      to="/subscriptions/new"
      class="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-900/40"
    >
      <Icon name="plus" :size="26" />
    </router-link>
  </div>
</template>
