<script setup lang="ts">
import { computed, ref } from 'vue'
import { activeSubscriptions, markPaid, monthlyTotal, store, yearlyTotal } from '../store'
import { upcomingPayments } from '../domain/stats'
import { formatMoney } from '../domain/currency'
import { todayIso } from '../domain/dates'
import { pluralRu } from '../domain/plural'
import SubCard from '../components/SubCard.vue'
import SubscriptionEditSheet from '../components/SubscriptionEditSheet.vue'
import EmptyState from '../components/EmptyState.vue'
import Icon from '../components/Icon.vue'

const editId = ref<number | null>(null)
const cur = computed(() => store.settings.baseCurrency)

const upcoming = computed(() => upcomingPayments(store.subscriptions, todayIso(), 7))
const overdue = computed(() => upcoming.value.filter((s) => s.nextPaymentDate < todayIso()))
const activeText = computed(
  () =>
    `${activeSubscriptions.value.length} ${pluralRu(activeSubscriptions.value.length, 'активный платёж', 'активных платежа', 'активных платежей')}`,
)
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-6 pt-6 sm:px-6 md:max-w-none lg:px-8">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold">
          <Icon name="home" :size="22" class="text-accent-hi" />SubsTrack
        </h1>
        <p class="text-sm text-app-text-muted">{{ activeText }}</p>
      </div>
      <router-link
        to="/history"
        class="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-card text-app-text-muted"
      >
        <Icon name="history" :size="16" />
      </router-link>
    </header>

    <div class="mb-6 grid grid-cols-2 gap-3">
      <div class="rounded-2xl border border-app-border bg-app-card p-4">
        <div class="text-xs text-app-text-muted">В месяц</div>
        <div class="mt-1 text-xl font-bold">{{ formatMoney(monthlyTotal, cur) }}</div>
      </div>
      <div class="rounded-2xl border border-app-border bg-app-card p-4">
        <div class="text-xs text-app-text-muted">В год</div>
        <div class="mt-1 text-xl font-bold">{{ formatMoney(yearlyTotal, cur) }}</div>
      </div>
    </div>

    <section class="flex flex-1 flex-col">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
          Ближайшие платежи
        </h2>
        <router-link to="/subscriptions" class="text-sm text-accent-hi">Все →</router-link>
      </div>

      <div v-if="upcoming.length" class="@container">
        <div class="flex flex-col gap-2 @2xl:grid @2xl:grid-cols-2 @2xl:items-start @2xl:gap-3 @5xl:grid-cols-3">
        <SubCard
          v-for="s in upcoming.slice(0, 6)"
          :key="s.id"
          :sub="s"
          @click="editId = s.id"
          @paid="markPaid"
        />
        </div>
      </div>
      <EmptyState v-else icon="calendar">В ближайшие 7 дней платежей нет</EmptyState>
    </section>

    <SubscriptionEditSheet
      :sub-id="editId"
      @close="editId = null"
      @deleted="editId = null"
    />
  </div>
</template>
