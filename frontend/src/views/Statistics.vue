<template>
  <div class="min-h-screen bg-app-bg pb-24 text-app-text">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-app-border bg-app-bg/80 px-6 py-4 backdrop-blur-xl">
      <h1 class="text-xl font-bold">Статистика</h1>
    </header>

    <main class="space-y-8 p-6 animate-fade-in">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        <p class="mt-4 text-app-text-muted font-medium">Считаем ваши траты...</p>
      </div>

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
        <section class="rounded-[2rem] bg-gradient-to-br from-primary-600/10 to-primary-900/20 p-8 border border-primary-500/10 shadow-premium relative overflow-hidden">
          <div class="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-primary-500/5 blur-3xl"></div>
          <div class="flex flex-col gap-4 relative z-10">
            <div class="flex items-center gap-3">
              <div class="h-8 w-8 rounded-xl bg-primary-500/20 flex items-center justify-center text-lg">💡</div>
              <h3 class="font-bold text-primary-400 text-sm tracking-wide">Умный инсайт</h3>
            </div>
            <p class="text-sm leading-relaxed text-app-text">
              Ваши годовые расходы на подписки составляют <span class="text-app-text font-bold">{{ formatPrice(stats.total_yearly) }}</span>. 
              Это эквивалентно примерно <span class="text-primary-400 font-bold">{{ Math.round(stats.total_monthly / 450) }}</span> чашкам кофе каждый месяц! ☕️
            </p>
          </div>
        </section>
      </template>
    </main>

    <BottomNavigation />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BottomNavigation from '../components/BottomNavigation.vue'
import { getStatistics } from '../services/statistics'
import { formatPrice, formatPeriod } from '../services/subscriptions'

const stats = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    stats.value = await getStatistics()
  } catch (error) {
      // error

  } finally {
    loading.value = false
  }
})
</script>
