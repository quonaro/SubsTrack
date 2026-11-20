<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Subscription } from '../types'
import { categoryOf } from '../store'
import { formatMoney } from '../domain/currency'
import { iconTileBackground } from '../domain/colors'
import AppIcon from './AppIcon.vue'
import { daysUntilText, diffDays, formatDateRu, periodLabel, todayIso } from '../domain/dates'
import Modal from './Modal.vue'

const props = withDefaults(
  defineProps<{
    sub: Subscription
    compact?: boolean
    confirmOnClick?: boolean
    payable?: boolean
  }>(),
  { payable: true },
)
const emit = defineEmits<{ paid: [number] }>()

const cat = computed(() => categoryOf(props.sub))
const days = computed(() => diffDays(props.sub.nextPaymentDate, todayIso()))
const overdue = computed(() => props.sub.isActive && days.value < 0)

const confirmOpen = ref(false)
function onCardClick() {
  if (props.confirmOnClick && props.sub.isActive && !props.compact) confirmOpen.value = true
}
function confirmPaid() {
  confirmOpen.value = false
  emit('paid', props.sub.id)
}
function onPayClick() {
  confirmOpen.value = true
}
</script>

<template>
  <div
    class="flex select-none items-center gap-3 rounded-2xl border border-app-border bg-app-card p-4"
    :class="{ 'opacity-55': !sub.isActive, 'cursor-pointer': confirmOnClick }"
    @click="onCardClick"
  >
    <div
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-app-text"
      :style="{ backgroundColor: iconTileBackground(sub.iconColor, cat?.color) }"
    >
      <AppIcon :name="sub.icon" :size="22" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <span class="truncate font-medium">{{ sub.name }}</span>
        <span v-if="!sub.isActive || compact" class="shrink-0 font-semibold"
          >{{ formatMoney(sub.priceMinor, sub.currency) }}</span
        >
      </div>
      <div class="mt-0.5 flex items-center justify-between gap-2 text-xs text-app-text-muted">
        <span class="truncate">
          {{ periodLabel(sub.periodDays, sub.isOneTime) }}
          <template v-if="cat">
            · <AppIcon :name="cat.icon" :size="12" class="inline-block align-[-1px]" /> {{ cat.name }}
          </template>
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
      v-if="sub.isActive && !compact && payable"
      type="button"
      class="flex h-9 shrink-0 items-center rounded-full bg-accent/20 px-3 text-xs font-medium text-accent-hi transition-colors hover:bg-accent/40"
      @click.stop="onPayClick"
    >
      {{ formatMoney(sub.priceMinor, sub.currency) }}
    </button>
    <span
      v-else-if="sub.isActive && !compact"
      class="flex h-9 shrink-0 items-center rounded-full px-3 text-xs font-medium text-app-text-muted"
    >
      {{ formatMoney(sub.priceMinor, sub.currency) }}
    </span>
    <Modal :open="confirmOpen" title="Отметить платёж оплаченным?" @update:open="confirmOpen = $event">
      <p class="mb-5 text-sm text-app-text-muted">
        Отметить «{{ sub.name }}» оплаченным на {{ formatMoney(sub.priceMinor, sub.currency) }}?
      </p>
      <div class="flex gap-3">
        <button
          type="button"
          class="flex h-9 flex-1 items-center justify-center rounded-xl border border-app-border"
          @click="confirmOpen = false"
        >
          Отмена
        </button>
        <button
          type="button"
          class="flex h-9 flex-1 items-center justify-center rounded-xl bg-accent font-medium text-accent-fg"
          @click="confirmPaid"
        >
          Оплатить
        </button>
      </div>
    </Modal>
  </div>
</template>
