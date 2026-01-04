<template>
  <div class="min-h-screen bg-app-bg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
     <!-- Background Gradient Glow -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary-500/10 blur-[100px]"></div>

    <div v-if="loading" class="relative z-10 flex flex-col items-center gap-4">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-surface-200 border-t-primary-500"></div>
      <p class="text-app-text-muted animate-pulse">Загрузка...</p>
    </div>

    <div v-else-if="error" class="relative z-10 max-w-sm w-full bg-surface-50 p-6 rounded-2xl border border-red-500/20 shadow-premium">
      <div class="h-16 w-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-red-500 mb-2">Ошибка</h2>
      <p class="text-app-text-muted mb-6">{{ error }}</p>
      <button 
        @click="closeApp"
        class="w-full py-3.5 px-6 rounded-xl bg-surface-200 text-app-text font-semibold hover:bg-surface-300 active:scale-[0.98] transition-all"
      >
        Закрыть
      </button>
    </div>

    <div v-else-if="success" class="relative z-10 max-w-sm w-full bg-surface-50 p-6 rounded-2xl border border-green-500/20 shadow-premium">
       <div class="h-20 w-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 animate-slide-up">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-10 h-10">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
       <h1 class="text-2xl font-bold text-green-500 mb-2">Оплачено!</h1>
       <p class="text-app-text-muted mb-4">Подписка успешно обновлена.</p>
       <p class="text-sm text-app-text-muted mb-6">Окно закроется автоматически...</p>
    </div>

    <div v-else-if="subscription" class="relative z-10 w-full max-w-sm flex flex-col gap-6 animate-fade-in">
        <div class="flex flex-col items-center">
            <div class="h-24 w-24 bg-surface-100 rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-premium ring-1 ring-white/10">
                {{ subscription.icon }}
            </div>
            <h1 class="text-3xl font-bold text-app-text mb-2">{{ subscription.name }}</h1>
            <p class="text-lg text-app-text-muted">
                {{ formatPrice(subscription.price, subscription.currency) }} 
                <span class="text-zinc-600">/</span> 
                {{ formatPeriod(subscription.period_days) }}
            </p>
        </div>

        <div class="bg-surface-100/50 rounded-xl p-4 border border-app-border">
            <p class="text-sm text-app-text-muted mb-1 uppercase tracking-wider font-bold">Дата платежа</p>
            <p class="text-xl font-medium text-app-text">{{ formatDate(subscription.next_payment_date) }}</p>
        </div>

        <div v-if="isAlreadyPaid" class="bg-green-500/10 rounded-xl p-4 border border-green-500/20 text-green-500 flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                 <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
             </svg>
             <div class="text-left">
                 <p class="font-bold">Уже оплачено</p>
                 <p class="text-xs opacity-80">Вы уже отметили этот платеж сегодня</p>
             </div>
        </div>

        <button 
            v-if="!isAlreadyPaid"
            @click="handlePayment"
            :disabled="processing"
            class="w-full py-4 px-6 rounded-2xl bg-primary-500 text-white text-lg font-bold shadow-accent hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
        >
            <span v-if="processing" class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
             {{ processing ? 'Обработка...' : 'Подтвердить оплату' }}
        </button>

        <button 
            v-else
            @click="closeApp"
            class="w-full py-4 px-6 rounded-2xl bg-surface-200 text-app-text text-lg font-bold hover:bg-surface-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
             Закрыть окно
        </button>

         <button 
            @click="closeApp"
            class="w-full py-3 px-6 rounded-xl text-app-text-muted font-medium hover:text-app-text transition-colors"
        >
            Отмена
        </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getSubscription, markAsPaid, type Subscription, formatPrice, formatPeriod } from '../services/subscriptions'

const route = useRoute()
const subscriptionId = Number(route.params.id)

const subscription = ref<Subscription | null>(null)
const loading = ref(true)
const error = ref('')
const success = ref(false)
const processing = ref(false)

const isAlreadyPaid = computed(() => {
    if (!subscription.value?.last_paid_at) return false
    const lastPaid = new Date(subscription.value.last_paid_at)
    const now = new Date()
    
    // Check if it was paid today (within last 12 hours or same calendar day)
    const diffMs = now.getTime() - lastPaid.getTime()
    const isToday = lastPaid.getDate() === now.getDate() && 
                   lastPaid.getMonth() === now.getMonth() && 
                   lastPaid.getFullYear() === now.getFullYear()
                   
    return isToday || diffMs < 12 * 60 * 60 * 1000
})

// Telegram WebApp
const tg = (window as any).Telegram?.WebApp

onMounted(async () => {
    if (tg) {
        tg.ready()
         // Adapt theme
        const isDark = tg.colorScheme === 'dark'
        document.documentElement.setAttribute('data-theme', isDark ? 'deep-sea' : 'clean') // mapping telegram theme to ours roughly
        if(isDark) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        
        tg.expand()
    }

    try {
        subscription.value = await getSubscription(subscriptionId)
    } catch (e) {
        error.value = 'Не удалось загрузить подписку. Возможно она удалена.'
    } finally {
        loading.value = false
    }
})

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

async function handlePayment() {
    processing.value = true
    try {
        await markAsPaid(subscriptionId)
        success.value = true
        if (tg) tg.HapticFeedback.notificationOccurred('success')
        setTimeout(() => {
            closeApp()
        }, 2000)
    } catch (e) {
        error.value = 'Ошибка при обработке платежа'
        if (tg) tg.HapticFeedback.notificationOccurred('error')
    } finally {
        processing.value = false
    }
}

function closeApp() {
    if (tg) {
        tg.close()
    } else {
        window.close()
        // Fallback info
        if(!success.value) alert('Вы можете закрыть это окно')
    }
}
</script>
