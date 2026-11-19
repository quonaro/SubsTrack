<script setup lang="ts">
import { useRouter } from 'vue-router'
import { markPaid, store, visibleSubscriptions } from '../store'
import type { SortMode } from '../types'
import SubCard from '../components/SubCard.vue'
import EmptyState from '../components/EmptyState.vue'
import OptionSheet from '../components/OptionSheet.vue'
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
  <div
    class="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-6"
    :class="visibleSubscriptions.length ? 'pb-24' : 'pb-6'"
  >
    <header class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Подписки</h1>
      <button
        type="button"
        class="flex h-8 items-center gap-1.5 rounded-full border border-app-border bg-app-card px-3 text-sm text-app-text-muted"
        @click="sortOpen = true"
      >
        Сортировка
      </button>
    </header>

    <div class="mb-4 flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-2.5">
      <span class="text-sm text-app-text-muted">Показывать архивные</span>
      <ToggleSwitch :checked="store.showArchived" @update:checked="store.showArchived = $event" />
    </div>

    <OptionSheet
      :open="sortOpen"
      title="Сортировка"
      :model-value="store.sortMode"
      :options="sortOptions"
      @update:open="sortOpen = $event"
      @update:model-value="store.sortMode = $event"
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
    <EmptyState v-else class="mt-4" icon="list">
      Подписок пока нет.<br />Нажмите «+», чтобы добавить первую.
    </EmptyState>

    <router-link
      to="/subscriptions/new"
      class="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/40"
    >
      <Icon name="plus" :size="26" />
    </router-link>
  </div>
</template>
