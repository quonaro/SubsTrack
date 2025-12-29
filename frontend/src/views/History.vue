<template>
  <div class="min-h-screen bg-app-bg pb-24 text-app-text">
    <!-- Header -->
    <AppHeader>
      <template #center>
        <h1 class="text-xs font-bold uppercase tracking-widest text-app-text">История платежей</h1>
      </template>
    </AppHeader>

    <main class="space-y-6 p-6 animate-fade-in">
      <PageLoader v-if="loading" text="Загружаем историю..." />

      <template v-else>
        <!-- Empty State -->
        <div v-if="history.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
          <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-100 text-4xl shadow-inner">
            ⏳
          </div>
          <h2 class="text-lg font-bold">История пуста</h2>
          <p class="mt-2 text-sm text-app-text-muted">Как только вы начнете подтверждать оплаты, они появятся здесь.</p>
        </div>

        <!-- History List -->
        <div v-else class="space-y-4">
          <div 
            v-for="group in groupedHistory" 
            :key="group.month" 
            class="space-y-3"
          >
            <h3 class="sticky top-[72px] z-30 -mx-6 bg-app-bg/80 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted backdrop-blur-md">
              {{ group.month }}
            </h3>

            <div class="space-y-3">
              <div 
                v-for="item in group.items" 
                :key="item.id"
                class="group relative flex items-center gap-4 rounded-[2rem] bg-surface-50 p-5 border border-app-border shadow-premium transition-all hover:bg-surface-100"
              >
                <!-- Sub Icon -->
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-200 text-2xl shadow-inner group-hover:scale-105 transition-transform">
                  {{ item.subscription?.icon || '📦' }}
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h4 class="font-bold truncate text-app-text text-sm uppercase tracking-wide">
                      {{ item.subscription?.name || 'Удаленная подписка' }}
                    </h4>
                    <span class="text-sm font-bold text-primary-400">{{ formatPrice(item.amount, item.currency) }}</span>
                  </div>
                  <p class="text-[10px] font-bold text-app-text-muted mt-1 opacity-70">
                    {{ formatDate(item.date) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <BottomNavigation />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import BottomNavigation from '../components/BottomNavigation.vue'
import AppHeader from '../components/AppHeader.vue'
import PageLoader from '../components/PageLoader.vue'
import { getHistory, formatPrice } from '../services/subscriptions'

const history = ref([])
const loading = ref(true)

const groupedHistory = computed(() => {
  const groups = {}
  
  history.value.forEach(item => {
    const d = new Date(item.date)
    const month = d.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
    if (!groups[month]) groups[month] = []
    groups[month].push(item)
  })
  
  return Object.entries(groups).map(([month, items]) => ({
    month: month.charAt(0).toUpperCase() + month.slice(1),
    items
  })).sort((a, b) => {
    // Sort by date descending (assuming latest months first)
    // Here we can just sort by the date of the first item
    return new Date(b.items[0].date) - new Date(a.items[0].date)
  })
})

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'long' })
}

onMounted(async () => {
  try {
    history.value = await getHistory()
  } catch (e) {
    console.error('Failed to load history', e)
  } finally {
    loading.value = false
  }
})
</script>
