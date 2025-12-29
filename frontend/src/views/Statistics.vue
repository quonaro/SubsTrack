<template>
  <div class="min-h-screen bg-app-bg pb-24 text-app-text">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-app-border bg-app-bg/80 px-6 py-4 backdrop-blur-xl">
      <h1 class="text-xl font-bold">Статистика</h1>
    </header>

    <main class="space-y-8 p-6 animate-fade-in">
      <!-- Loading State -->
      <!-- Loading State -->
      <PageLoader v-if="loading" text="Считаем ваши траты..." />

      <template v-else-if="stats">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-3xl bg-surface-50 p-5 border border-app-border shadow-premium overflow-hidden relative">
            <div class="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary-500/5 blur-xl"></div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">В месяц</p>
            <p class="mt-2 text-xl font-bold text-app-text">{{ formatPrice(stats.total_monthly) }}</p>
          </div>
          <div class="rounded-3xl bg-surface-50 p-5 border border-app-border shadow-premium overflow-hidden relative">
            <div class="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary-500/5 blur-xl"></div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">В год</p>
            <p class="mt-2 text-xl font-bold text-app-text">{{ formatPrice(stats.total_yearly) }}</p>
          </div>
        </div>

        <!-- Activity Overview -->
        <section class="space-y-4">
          <h2 class="text-[10px] font-bold uppercase tracking-[0.15em] text-app-text-muted px-1">Общий обзор</h2>
          <div class="rounded-3xl bg-surface-50 p-6 border border-app-border shadow-premium">
            <div class="flex items-center justify-between px-2">
              <div class="text-center">
                <p class="text-3xl font-bold text-primary-400 tracking-tight">{{ stats.active_count }}</p>
                <p class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted mt-1">Активных</p>
              </div>
              <div class="h-8 w-[1px] bg-surface-200"></div>
              <div class="text-center">
                <p class="text-3xl font-bold text-app-text-muted tracking-tight">{{ stats.inactive_count }}</p>
                <p class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted mt-1">В архиве</p>
              </div>
            </div>
            
            <!-- Premium Progress Bar -->
            <div class="relative mt-8 h-3 w-full overflow-hidden rounded-full bg-surface-100">
              <div 
                class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                :style="{ width: (stats.active_count / Math.max(1, (stats.active_count + stats.inactive_count)) * 100) + '%' }"
              ></div>
            </div>
          </div>
        </section>

        <!-- Category Breakdown -->
        <section class="space-y-4">
          <h2 class="text-[10px] font-bold uppercase tracking-[0.15em] text-app-text-muted px-1">По категориям</h2>
          <div class="grid grid-cols-1 gap-3">
             <div 
              v-for="cat in categoryStats" 
              :key="cat.name"
              class="rounded-3xl bg-surface-50 p-4 border border-app-border relative overflow-hidden"
             >
                <div class="flex items-center justify-between relative z-10">
                   <div class="flex items-center gap-3">
                      <div class="h-10 w-10 rounded-xl bg-surface-200 flex items-center justify-center text-xl">{{ cat.icon }}</div>
                      <div>
                        <p class="text-xs font-bold text-app-text uppercase tracking-wider">{{ cat.name }}</p>
                        <p class="text-[10px] text-app-text-muted font-bold">{{ cat.percent }}%</p>
                      </div>
                   </div>
                   <p class="text-sm font-bold text-app-text">{{ formatPrice(cat.total) }}</p>
                </div>
                <!-- Progress bar bg -->
                <div class="absolute bottom-0 left-0 h-1 bg-primary-500/20 w-full">
                   <div class="h-full bg-primary-500" :style="{ width: cat.percent + '%' }"></div>
                </div>
             </div>
          </div>
        </section>

        <!-- Top Expenses -->
        <section class="space-y-4">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-[10px] font-bold uppercase tracking-[0.15em] text-app-text-muted">Топ расходов</h2>
            <span class="text-[10px] font-bold text-primary-400">Смотреть все</span>
          </div>
          <div class="space-y-3">
            <div 
              v-for="sub in stats.top_subscriptions" 
              :key="sub.id"
              class="flex items-center gap-4 rounded-3xl bg-surface-100 p-5 border border-app-border transition-transform active:scale-[0.98]"
            >
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-200 text-3xl shadow-inner">
                {{ sub.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold truncate text-app-text uppercase text-xs tracking-wider">{{ sub.name }}</h3>
                <p class="text-[10px] font-bold text-app-text-muted mt-1">{{ formatPeriod(sub.period_days) }}</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-primary-400">{{ formatPrice(sub.price) }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Insights -->
        <section 
          v-if="currentInsight"
          class="rounded-[2rem] bg-gradient-to-br from-primary-600/10 to-primary-900/20 p-8 border border-primary-500/10 shadow-premium relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer select-none"
          @click="nextInsight"
        >
          <div class="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-primary-500/5 blur-3xl"></div>
          <div class="flex flex-col gap-4 relative z-10">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-xl bg-primary-500/20 flex items-center justify-center text-lg">{{ currentInsight.icon }}</div>
                <h3 class="font-bold text-primary-400 text-sm tracking-wide">Умный инсайт</h3>
              </div>
              <span class="text-[10px] text-app-text-muted opacity-50">Нажми для следующего</span>
            </div>
            
            <p class="text-sm leading-relaxed text-app-text" v-html="currentInsight.text"></p>
          </div>
        </section>
      </template>
    </main>

    <BottomNavigation />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import BottomNavigation from '../components/BottomNavigation.vue'
import PageLoader from '../components/PageLoader.vue'
import { getStatistics } from '../services/statistics'
import { formatPrice, formatPeriod } from '../services/subscriptions'

const stats = ref(null)
const loading = ref(true)
const currentInsightIndex = ref(0)
const insights = ref([])

const categoryStats = computed(() => {
  if (!stats.value || !stats.value.top_subscriptions) return []
  
  // Note: effectively we need all subscriptions to calculate full category stats
  // For now we will assume the backend returns enough info or we accept approximation based on top subs
  // Ideally backend should return category breakdown. 
  // TODO: Add category_stats to backend response. 
  
  // Checking if we have category stats in response (if backend is updated)
  if (stats.value.category_stats) {
    return stats.value.category_stats
  }
  
  return [] 
})

const currentInsight = computed(() => {
  if (!insights.value.length) return null
  return insights.value[currentInsightIndex.value]
})

function generateInsights(data) {
  const list = []
  
  // Coffee
  const coffeeCups = Math.round(data.total_monthly / 350) 
  if (coffeeCups > 0) {
    list.push({
      icon: '☕️',
      text: `Ваши месячные расходы эквивалентны примерно <span class="text-primary-400 font-bold">${coffeeCups}</span> чашкам кофе.`
    })
  }
  
  // Pizza
  const pizzas = Math.round(data.total_yearly / 800)
  if (pizzas > 0) {
    list.push({
      icon: '🍕',
      text: `В год вы тратите сумму, на которую можно купить <span class="text-primary-400 font-bold">${pizzas}</span> больших пицц.`
    })
  }
  
  // Cinema
  const tickets = Math.round(data.total_monthly / 500)
  if (tickets > 0) {
    list.push({
      icon: '🍿',
      text: `В месяц это как сходить в кино <span class="text-primary-400 font-bold">${tickets}</span> раз(а).`
    })
  }

  // Streaming
  const netflix = Math.round(data.total_monthly / 1000)
  if (netflix > 1) {
    list.push({
      icon: '🎬',
      text: `На эти деньги можно оплатить <span class="text-primary-400 font-bold">${netflix}</span> разных стриминговых сервисов одновременно.`
    })
  }

  // Work hours (assuming avg 500 rub/hour)
  const workHours = Math.round(data.total_monthly / 500)
  if (workHours > 0) {
    list.push({
      icon: '💼',
      text: `Чтобы оплатить все подписки, вам нужно работать примерно <span class="text-primary-400 font-bold">${workHours}</span> часов в месяц.`
    })
  }
  
  // New IPhone
  const yearsForIphone = (120000 / data.total_yearly).toFixed(1)
  if (data.total_yearly > 10000) {
      list.push({
      icon: '📱',
      text: `Если откладывать эти деньги, вы сможете покупать новый iPhone каждые <span class="text-primary-400 font-bold">${yearsForIphone}</span> года.`
    })
  }

  // Gym
  const gymMonths = Math.round(data.total_yearly / 25000)
  if (gymMonths >= 1) {
       list.push({
      icon: '💪',
      text: `Ваши годовые траты равны стоимости <span class="text-primary-400 font-bold">${gymMonths}</span> годовых абонементов в фитнес-клуб.`
    })
  }

  return list
}

function nextInsight() {
  if (insights.value.length > 1) {
    currentInsightIndex.value = (currentInsightIndex.value + 1) % insights.value.length
  }
}

onMounted(async () => {
  try {
    stats.value = await getStatistics()
    if (stats.value) {
      insights.value = generateInsights(stats.value)
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})
</script>
