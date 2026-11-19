<script setup lang="ts">
import { computed } from 'vue'
import type { Subscription } from '../types'
import { categoryOf } from '../store'
import { formatMoney } from '../domain/currency'
import { daysUntilText, diffDays, formatDateRu, periodLabel, todayIso } from '../domain/dates'

const props = defineProps<{ sub: Subscription; compact?: boolean }>()
const emit = defineEmits<{ paid: [number] }>()

const cat = computed(() => categoryOf(props.sub))
const days = computed(() => diffDays(props.sub.nextPaymentDate, todayIso()))
const overdue = computed(() => props.sub.isActive && days.value < 0)
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-2xl border border-app-border bg-app-card p-4"
    :class="{ 'opacity-55': !sub.isActive }"
  >
    <div
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
      :style="{ backgroundColor: (cat?.color ?? '#6b7280') + '26' }"
    >
      {{ sub.icon }}
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <span class="truncate font-medium">{{ sub.name }}</span>
        <span class="shrink-0 font-semibold">{{ formatMoney(sub.priceMinor, sub.currency) }}</span>
      </div>
      <div class="mt-0.5 flex items-center justify-between gap-2 text-xs text-app-text-muted">
        <span class="truncate">
          {{ periodLabel(sub.periodDays) }}
          <template v-if="cat"> · {{ cat.icon }} {{ cat.name }}</template>
          <template v-if="!sub.isActive"> · архив</template>
        </span>
        <span
          v-if="sub.isActive"
          class="shrink-0"
          :class="overdue ? 'font-medium text-red-400' : days <= 3 ? 'text-amber-400' : ''"
        >
          {{ overdue ? 'просрочен' : daysUntilText(days) }} · {{ formatDateRu(sub.nextPaymentDate) }}
        </span>
      </div>
    </div>
    <button
      v-if="sub.isActive && !compact"
      type="button"
      class="flex h-8 shrink-0 items-center rounded-full bg-accent/20 px-3 text-xs font-medium text-accent-hi transition-colors hover:bg-accent/40"
      @click.stop="emit('paid', sub.id)"
    >
      Оплатить
    </button>
  </div>
</template>
