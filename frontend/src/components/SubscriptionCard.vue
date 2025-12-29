<template>
  <div class="group relative overflow-hidden rounded-[2rem] bg-surface-50 p-5 border border-app-border transition-all duration-300 active:scale-[0.98] hover:bg-surface-100 shadow- premium">
    <!-- Background Gradient Glow -->
    <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-500/5 blur-2xl transition-all group-hover:bg-primary-500/10"></div>
    
    <div class="mb-4 flex items-center justify-between">
      <span 
        class="text-[10px] font-bold uppercase tracking-[0.1em]"
        :class="{
          'text-red-500 animate-pulse': daysUntil <= 0,
          'text-orange-500': daysUntil === 1,
          'text-app-text-muted/80': daysUntil > 1
        }"
      >
        {{ daysText }}
      </span>
      <div v-if="daysUntil <= 3" class="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
    </div>
    
    <div class="relative flex items-center gap-4">
      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-2xl shadow-inner ring-1 ring-white/5 transition-transform group-hover:scale-110 duration-500">
        {{ subscription.icon }}
      </div>
      
      <div class="flex-1 min-w-0">
        <h3 class="truncate text-lg font-bold text-app-text group-hover:text-primary-400 transition-colors">
          {{ subscription.name }}
        </h3>
        <p class="truncate text-sm font-medium text-app-text-muted">
          {{ formatPrice(subscription.price, subscription.currency) }} <span class="text-zinc-600 px-1">/</span> {{ formatPeriod(subscription.period_days) }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button 
          v-if="subscription.is_active"
          class="h-10 w-10 flex items-center justify-center rounded-full bg-green-500/10 text-green-500 transition-all hover:bg-green-500/20 hover:scale-110 active:scale-95 shadow-sm"
          title="Отметить как оплачено"
          @click.stop="$emit('paid', subscription.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </button>

        <button 
          v-if="subscription.is_active"
          class="h-10 w-10 flex items-center justify-center rounded-full bg-white/0 text-zinc-600 transition-all hover:bg-red-500/10 hover:text-red-500 hover:scale-110 active:scale-95"
          title="Архивировать"
          @click.stop="$emit('archive', subscription.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 11.25h-3.75m8.25-9.75h1.5m-1.5 0l-1.5 1.5m-9-1.5l1.5 1.5m1.125 11.25c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25" />
          </svg>
        </button>
        <button 
          v-else
          class="h-10 w-10 flex items-center justify-center rounded-full bg-white/0 text-zinc-600 transition-all hover:bg-green-500/10 hover:text-green-500 hover:scale-110 active:scale-95"
          title="Восстановить"
          @click.stop="$emit('unarchive', subscription.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </button>

        <div class="h-10 w-10 flex items-center justify-center rounded-full bg-white/0 text-zinc-600 transition-all group-hover:bg-white/5 group-hover:text-app-text">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getDaysUntilPayment, formatPrice, formatPeriod } from '../services/subscriptions'

const props = defineProps({
  subscription: {
    type: Object,
    required: true
  }
})

const daysUntil = computed(() => getDaysUntilPayment(props.subscription.next_payment_date))

const daysText = computed(() => {
  const days = daysUntil.value
  if (days < 0) return 'Просрочено'
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Завтра'
  if (days < 5) return `Через ${days} дня`
  return `Через ${days} дней`
})
</script>

