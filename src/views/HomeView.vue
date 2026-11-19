<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { activeSubscriptions, markPaid, monthlyTotal, store, yearlyTotal } from '../store'
import { upcomingPayments } from '../domain/stats'
import { formatMoney } from '../domain/currency'
import { todayIso } from '../domain/dates'
import SubCard from '../components/SubCard.vue'
import EmptyState from '../components/EmptyState.vue'
import Icon from '../components/Icon.vue'

const router = useRouter()
const cur = computed(() => store.settings.baseCurrency)

const upcoming = computed(() => upcomingPayments(store.subscriptions, todayIso(), 7))
const overdue = computed(() => upcoming.value.filter((s) => s.nextPaymentDate < todayIso()))
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-6 pt-6">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">SubsTrack</h1>
        <p class="text-sm text-app-text-muted">{{ activeSubscriptions.length }} активных платежей</p>
      </div>
      <router-link
        to="/history"
        class="flex h-8 w-8 items-center justify-center rounded-full border border-app-border bg-app-card text-app-text-muted"
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

      <div v-if="upcoming.length" class="flex flex-col gap-2">
        <SubCard
          v-for="s in upcoming.slice(0, 6)"
          :key="s.id"
          :sub="s"
          @click="router.push(`/subscriptions/${s.id}/edit`)"
          @paid="markPaid"
        />
      </div>
      <EmptyState v-else icon="calendar">В ближайшие 7 дней платежей нет</EmptyState>
    </section>
  </div>
</template>
