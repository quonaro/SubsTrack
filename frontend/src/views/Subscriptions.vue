<template>
  <div class="min-h-screen bg-app-bg pb-24 text-app-text">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-app-border bg-app-bg/80 px-6 py-4 backdrop-blur-xl">
      <div class="flex items-center justify-between mb-4">
        <button class="rounded-xl bg-surface-100 p-2.5 text-app-text-muted hover:bg-surface-200 hover:text-app-text transition-all active:scale-95 shadow- premium">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
          </svg>
        </button>
        <div class="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" class="h-8 w-8 object-contain rounded-xl shadow-sm" />
          <h1 class="text-xl font-bold tracking-tight">SubsTrack</h1>
        </div>
        <div class="w-10"></div> <!-- Spacer for center alignment -->
      </div>

      <!-- Segmented Control Tabs -->
      <div class="relative flex w-full rounded-2xl bg-surface-100 p-1.5 shadow-inner">
        <div 
          class="absolute h-[calc(100%-12px)] rounded-[0.8rem] bg-surface-300 shadow- premium transition-all duration-300 ease-out border border-app-border"
          :style="{ 
            left: activeTab === 'active' ? '6px' : 'calc(50% + 3px)', 
            width: 'calc(50% - 9px)' 
          }"
        ></div>
        <button 
          class="relative z-10 w-1/2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200"
          :class="activeTab === 'active' ? 'text-app-text' : 'text-app-text-muted hover:text-zinc-300'"
          @click="activeTab = 'active'"
        >
          Активные
        </button>
        <button 
          class="relative z-10 w-1/2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200"
          :class="activeTab === 'archived' ? 'text-app-text' : 'text-app-text-muted hover:text-zinc-300'"
          @click="activeTab = 'archived'"
        >
          Архивные
        </button>
      </div>
    </header>

    <main class="p-6 space-y-8 animate-fade-in">
      <!-- Summary Card -->
      <div class="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-600 to-primary-800 p-8 shadow-accent relative group">
        <!-- Abstract Decorations -->
        <div class="absolute top-0 right-0 -mr-8 -mt-8 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-125 duration-1000"></div>
        <div class="absolute bottom-0 left-0 -ml-12 -mb-12 h-48 w-48 rounded-full bg-black/20 blur-3xl"></div>
        
        <div class="relative z-10 flex flex-col gap-1">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text/50">Прогноз на месяц</p>
          <div class="flex items-end gap-2 mt-1">
            <h2 class="text-4xl font-black text-app-text leading-none">{{ formatTotal(nextMonthTotal.total) }}</h2>
            <span class="text-lg font-bold text-app-text/60 mb-1">{{ nextMonthTotal.currency }}</span>
          </div>
          
          <div class="mt-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/10 border border-app-border w-fit">
            <div class="h-2 w-2 rounded-full bg-white shadow-sm shadow-white/50"></div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-app-text/80">
              {{ nextMonthTotal.count }} подписки к оплате
            </p>
          </div>
        </div>
      </div>

      <!-- List Section -->
      <PageLoader v-if="loading" />

      <div v-else-if="subscriptions.length === 0" class="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div class="relative">
          <div class="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full"></div>
          <div class="relative rounded-[2.5rem] bg-surface-50 p-10 border border-app-border shadow-premium">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-12 w-12 text-app-text-muted">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-bold text-app-text">Список пуст</h3>
          <p class="mt-2 max-w-[240px] text-sm text-app-text-muted font-medium">Добавьте свою первую подписку, чтобы мы следили за расходами</p>
        </div>
        <button 
          class="rounded-[2rem] bg-primary-500 px-8 py-4 text-sm font-black text-white hover:bg-primary-600 transition-all active:scale-95 shadow-accent"
          @click="showForm = true"
        >
          СОЗДАТЬ
        </button>
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-[10px] font-bold uppercase tracking-[0.15em] text-app-text-muted">{{ activeTab === 'active' ? 'Ближайшие списания' : 'Архивированные' }}</h2>
          <span class="text-[10px] font-bold text-primary-400">Сортировка</span>
        </div>
        
        <transition-group 
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="transform translate-y-8 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-300 ease-in absolute w-full"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
          tag="div"
          class="space-y-4"
        >
          <SubscriptionCard
            v-for="subscription in filteredSubscriptions"
            :key="subscription.id"
            :subscription="subscription"
            @click="editSubscription(subscription)"
          />
        </transition-group>
      </div>
    </main>

    <!-- FAB -->
    <button 
      class="fixed bottom-28 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-app-text shadow-accent transition-all active:scale-90 hover:scale-110 duration-300"
      @click="showForm = true"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="h-6 w-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>

    <BottomNavigation />

    <!-- Form Transition Overlay -->
    <transition
      enter-active-class="duration-400 ease-out"
      enter-from-class="transform translate-y-full"
      enter-to-class="transform translate-y-0"
      leave-active-class="duration-300 ease-in"
      leave-from-class="transform translate-y-0"
      leave-to-class="transform translate-y-full"
    >
      <SubscriptionForm
        v-if="showForm"
        :subscription="editingSubscription"
        @close="closeForm"
        @submit="handleFormSubmit"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SubscriptionCard from '../components/SubscriptionCard.vue'
import SubscriptionForm from '../components/SubscriptionForm.vue'
import BottomNavigation from '../components/BottomNavigation.vue'
import PageLoader from '../components/PageLoader.vue'
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  getNextMonthTotal
} from '../services/subscriptions'

const activeTab = ref('active')
const subscriptions = ref([])
const nextMonthTotal = ref({ total: 0, currency: 'RUB', count: 0 })
const loading = ref(false)
const showForm = ref(false)
const editingSubscription = ref(null)

const filteredSubscriptions = computed(() => {
  return subscriptions.value.filter(sub => {
    if (activeTab.value === 'active') {
      return sub.is_active
    } else {
      return !sub.is_active
    }
  })
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [subs, total] = await Promise.all([
      getSubscriptions(),
      getNextMonthTotal()
    ])
    subscriptions.value = subs
    nextMonthTotal.value = total
  } catch (error) {
    // error

  } finally {
    loading.value = false
  }
}

function formatTotal(total) {
  return total.toLocaleString('ru-RU')
}

function editSubscription(subscription) {
  editingSubscription.value = subscription
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingSubscription.value = null
}

async function handleFormSubmit(data) {
  try {
    if (editingSubscription.value) {
      await updateSubscription(editingSubscription.value.id, data)
    } else {
      await createSubscription(data)
    }
    await loadData()
    closeForm()
  } catch (error) {
    // error

    alert('Ошибка при сохранении подписки')
  }
}
</script>
