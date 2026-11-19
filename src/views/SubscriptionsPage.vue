<script setup lang="ts">
import { markPaid, store, visibleSubscriptions } from '../store'
import type { SortMode } from '../types'
import SubCard from '../components/SubCard.vue'
import EmptyState from '../components/EmptyState.vue'
import OptionModal from '../components/OptionModal.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import Modal from '../components/Modal.vue'
import SubscriptionForm from '../components/SubscriptionForm.vue'
import SubscriptionEditModal from '../components/SubscriptionEditModal.vue'
import Icon from '../components/Icon.vue'
import { pluralRu } from '../domain/plural'
import { computed, ref } from 'vue'

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'next_date', label: 'По дате платежа' },
  { value: 'name', label: 'По имени' },
  { value: 'price', label: 'По цене' },
]

const sortOpen = ref(false)
const formOpen = ref(false)
const editId = ref<number | null>(null)

const subsWord = computed(() =>
  pluralRu(visibleSubscriptions.value.length, 'подписка', 'подписки', 'подписок'),
)
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-6 sm:px-6 md:max-w-none lg:px-8"
    :class="visibleSubscriptions.length ? 'pb-24' : 'pb-6'"
  >
    <header class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold">
          <Icon name="list" :size="22" class="text-accent-hi" />Подписки
        </h1>
        <p class="text-sm text-app-text-muted">{{ visibleSubscriptions.length }} {{ subsWord }}</p>
      </div>
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-full border border-app-border bg-app-card px-3 text-sm text-app-text-muted"
        @click="sortOpen = true"
      >
        <Icon name="sort" :size="16" />Сортировка
      </button>
    </header>

    <div class="mb-2 flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-2.5">
      <span class="text-sm text-app-text-muted">Показывать архивные</span>
      <ToggleSwitch :checked="store.showArchived" @update:checked="store.showArchived = $event" />
    </div>

    <OptionModal
      :open="sortOpen"
      title="Сортировка"
      :model-value="store.sortMode"
      :options="sortOptions"
      @update:open="sortOpen = $event"
      @update:model-value="store.sortMode = $event"
    />

    <div v-if="visibleSubscriptions.length" class="@container mt-2">
      <div
        class="flex flex-col gap-2 @2xl:grid @2xl:grid-cols-2 @2xl:items-start @2xl:gap-3 @5xl:grid-cols-3 @[88rem]:grid-cols-4"
      >
        <SubCard
          v-for="s in visibleSubscriptions"
          :key="s.id"
          :sub="s"
          @click="editId = s.id"
          @paid="markPaid"
        />
      </div>
    </div>
    <EmptyState v-else class="mt-4" icon="list">
      Подписок пока нет.<br />Нажмите «+», чтобы добавить первую.
    </EmptyState>

    <button
      type="button"
      aria-label="Добавить подписку"
      class="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/40 md:bottom-8 md:right-8"
      @click="formOpen = true"
    >
      <Icon name="plus" :size="26" />
    </button>

    <Modal :open="formOpen" title="Новая подписка" @update:open="formOpen = $event">
      <SubscriptionForm @saved="formOpen = false" />
    </Modal>

    <SubscriptionEditModal
      :sub-id="editId"
      @close="editId = null"
      @deleted="editId = null"
    />
  </div>
</template>
