<template>
  <div class="min-h-screen bg-app-bg pb-24 text-app-text">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-app-border bg-app-bg/80 px-6 py-4 backdrop-blur-xl">
      <div class="flex items-center justify-between">
        <button 
          class="rounded-xl bg-surface-100 p-2 text-app-text-muted hover:bg-surface-200 hover:text-app-text transition-all active:scale-95"
          @click="previousMonth"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 class="text-lg font-bold capitalize">{{ monthYear }}</h1>
        <button 
          class="rounded-xl bg-surface-100 p-2 text-app-text-muted hover:bg-surface-200 hover:text-app-text transition-all active:scale-95"
          @click="nextMonth"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </header>

    <main class="space-y-6 p-6">
      <PageLoader v-if="loading" />
      
      <template v-else>
        <!-- Calendar Card -->
        <div class="rounded-3xl bg-surface-50 p-4 border border-app-border shadow-premium">
          <!-- Weekdays -->
          <div class="grid grid-cols-7 mb-2">
            <div 
              v-for="day in weekdays" 
              :key="day" 
              class="text-center text-[10px] font-bold uppercase tracking-widest text-app-text-muted py-2"
            >
              {{ day }}
            </div>
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="day in calendarDays"
              :key="day.date.toISOString()"
              class="relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all active:scale-90"
              :class="[
                !day.isCurrentMonth ? 'opacity-20' : '',
                day.isToday ? 'bg-primary-500/20 ring-1 ring-primary-500/50' : 'hover:bg-surface-100',
                selectedDay?.date.getTime() === day.date.getTime() ? 'bg-primary-500 text-app-text shadow-accent' : ''
              ]"
              @click="selectDay(day)"
            >
              <span class="text-sm font-semibold" :class="selectedDay?.date.getTime() === day.date.getTime() ? 'text-app-text' : (day.isToday ? 'text-primary-400' : 'text-app-text')">
                {{ day.day }}
              </span>
              
              <!-- Indicators -->
              <div class="absolute bottom-1.5 flex gap-0.5">
                <div 
                  v-if="day.hasPayment" 
                  class="h-1 w-1 rounded-full"
                  :class="selectedDay?.date.getTime() === day.date.getTime() ? 'bg-white' : 'bg-primary-500'"
                ></div>
              </div>
            </button>
          </div>
        </div>

        <!-- Selected Day Details -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform translate-y-4 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          mode="out-in"
        >
          <div v-if="selectedDay" :key="selectedDay.date.getTime()" class="space-y-4">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-app-text-muted px-1">
              {{ formatDate(selectedDay.date) }}
            </h2>

            <div v-if="selectedDay.subscriptions.length > 0" class="space-y-3">
              <div
                v-for="sub in selectedDay.subscriptions"
                :key="sub.id"
                class="flex items-center gap-4 rounded-2xl bg-surface-100 p-4 border border-app-border"
              >
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-200 text-2xl shadow-inner">
                  {{ sub.icon }}
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold truncate">{{ sub.name }}</h3>
                  <p class="text-xs text-app-text-muted">Ежемесячный платеж</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-primary-400">{{ formatPrice(sub.price, sub.currency) }}</p>
                </div>
              </div>
            </div>
            
            <div v-else class="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-app-border bg-white/2">
              <p class="text-sm text-app-text-muted">Нет запланированных платежей</p>
            </div>
          </div>
        </transition>
      </template>
    </main>

    <BottomNavigation />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import BottomNavigation from '../components/BottomNavigation.vue'
import PageLoader from '../components/PageLoader.vue'
import { getCalendarOccurrences, formatPrice } from '../services/subscriptions'

const currentDate = ref(new Date())
const selectedDay = ref(null)
const occurrences = ref([])
const loading = ref(false)

const monthYear = computed(() => {
  return currentDate.value.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
})

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const calendarRange = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  
  let startDay = firstDay.getDay()
  if (startDay === 0) startDay = 7
  const diff = 1 - startDay
  const startDate = new Date(year, month, diff)
  
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 41)
  
  return { start: startDate, end: endDate }
})

async function fetchOccurrences() {
  loading.value = true
  try {
    const { start, end } = calendarRange.value
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    occurrences.value = await getCalendarOccurrences(startStr, endStr)
    
    // Auto-update selected day if it's already set to sync with new data
    if (selectedDay.value) {
      const updatedDay = calendarDays.value.find(d => d.date.getTime() === selectedDay.value.date.getTime())
      if (updatedDay) selectedDay.value = updatedDay
    }
  } catch (error) {
      // error

  } finally {
    loading.value = false
  }
}

const calendarDays = computed(() => {
  const { start } = calendarRange.value
  const month = currentDate.value.getMonth()
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 42; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    date.setHours(0, 0, 0, 0)
    
    const isCurrentMonth = date.getMonth() === month
    const isToday = date.getTime() === today.getTime()
    
    const dayOccurrences = occurrences.value.filter(occ => {
      const occDate = new Date(occ.date)
      occDate.setHours(0, 0, 0, 0)
      return occDate.getTime() === date.getTime()
    })

    days.push({
      date: new Date(date),
      day: date.getDate(),
      isCurrentMonth,
      isToday,
      hasPayment: dayOccurrences.length > 0,
      paymentCount: dayOccurrences.length,
      subscriptions: dayOccurrences.map(o => o.subscription)
    })
  }

  return days
})

watch(currentDate, fetchOccurrences)

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function selectDay(day) {
  selectedDay.value = day
}

function formatDate(date) {
  return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
}

onMounted(async () => {
  await fetchOccurrences()
  
  // Select today by default after loading
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayObj = calendarDays.value.find(d => d.date.getTime() === today.getTime())
  if (todayObj) selectedDay.value = todayObj
})
</script>
