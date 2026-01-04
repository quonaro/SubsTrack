<template>
  <div class="min-h-screen bg-app-bg pb-24 text-app-text">
    <AppHeader />

    <main class="space-y-6 p-6 animate-fade-in">
      <PageLoader v-if="loading" text="Загружаем историю..." />

      <template v-else>
        <!-- Empty State -->
        <div v-if="history.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
          <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-100 text-4xl shadow-inner">
            ⏳
          </div>
          <h2 class="text-lg font-bold">История пуста</h2>
          <p class="mt-2 text-sm text-app-text-muted">Здесь будут отображаться все события ваших подписок.</p>
        </div>

        <!-- History List -->
        <div v-else class="space-y-8">
          <div 
            v-for="group in groupedHistory" 
            :key="group.date" 
            class="space-y-3"
          >
            <h3 class="sticky top-[72px] z-30 -mx-6 bg-app-bg/80 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted backdrop-blur-md border-b border-app-border">
              {{ group.date }}
            </h3>

            <div class="space-y-0 relative">
               <!-- Vertical Line -->
               <div class="absolute left-[39px] top-4 bottom-4 w-px bg-surface-200"></div>

               <div 
                v-for="(item, index) in group.items" 
                :key="item.id + item.event_type"
                class="group relative flex gap-4 py-3"
              >
                <!-- Icon -->
                <div 
                    class="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-app-bg shadow-sm"
                    :class="getIconClass(item.event_type)"
                >
                    <span v-if="item.subscription?.icon" class="text-base leading-none select-none grayscale-0">{{ item.subscription.icon }}</span>
                    <component v-else :is="getIcon(item.event_type)" class="h-4 w-4" :class="item.event_type === 'payment' ? 'text-green-500' : 'text-current'" />
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 pr-2 pt-1">
                  <div class="flex items-start justify-between gap-4">
                     <div>
                        <h4 class="font-bold text-sm text-app-text leading-tight">
                            {{ item.subscription?.name || 'Удаленная подписка' }}
                        </h4>
                        <p class="text-xs font-semibold text-app-text-muted/80 mt-0.5">
                            {{ getTitle(item) }}
                        </p>
                     </div>
                     <span class="text-[10px] font-bold text-app-text-muted bg-surface-100 px-2 py-1 rounded-full whitespace-nowrap">
                        {{ formatTime(item.created_at) }}
                     </span>
                  </div>
                  
                  <!-- Details Box -->
                  <div v-if="formatDetails(item)" class="mt-2 text-[11px] bg-surface-50 rounded-xl p-3 text-app-text border border-app-border leading-relaxed">
                    {{ formatDetails(item) }}
                  </div>
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
import { ref, onMounted, computed, h } from 'vue'
import BottomNavigation from '../components/BottomNavigation.vue'
import AppHeader from '../components/AppHeader.vue'
import PageLoader from '../components/PageLoader.vue'
import { getHistory } from '../services/subscriptions'

const history = ref([])
const loading = ref(true)

// Icon components using render functions
const PaymentIcon = {
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    'stroke-width': '2.5',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z'
    })
  ])
}

const CreatedIcon = {
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    'stroke-width': '3',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M12 4.5v15m7.5-7.5h-15'
    })
  ])
}

const UpdatedIcon = {
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    'stroke-width': '2.5',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125'
    })
  ])
}

const ArchivedIcon = {
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    'stroke-width': '2.5',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'm20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 11.25h-3.75m8.25-9.75h1.5m-1.5 0l-1.5 1.5m-9-1.5l1.5 1.5m1.125 11.25c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25'
    })
  ])
}

const DefaultIcon = {
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    'stroke-width': '2.5',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
    })
  ])
}

const Icons = {
  payment: PaymentIcon,
  created: CreatedIcon,
  updated: UpdatedIcon,
  archived: ArchivedIcon,
  default: DefaultIcon
}

function getIcon(type) {
  return Icons[type] || Icons.default
}

// Styles for outline circles
function getIconClass(type) {
  const classes = {
    payment: 'border-green-500 text-green-500',
    created: 'border-primary-500 text-primary-500',
    updated: 'border-blue-500 text-blue-500',
    archived: 'border-zinc-500 text-zinc-500',
    default: 'border-zinc-400 text-zinc-400'
  }
  return classes[type] || classes.default
}

function getTitle(item) {
  const titles = {
    payment: 'Оплата прошла успешно',
    created: 'Подписка добавлена',
    updated: 'Обновление данных',
    archived: 'В архиве',
    unarchive: 'Подписка восстановлена'
  }
  return titles[item.event_type] || item.event_type
}

function formatDetails(item) {
  if (!item.details) return ''
  
  if (item.event_type === 'payment') {
      // Payment details are simple
      // Maybe return nothing if title says "Payment successful"? 
      // User wants understandable view.
      return `Списано: ${item.details.amount} ${item.details.currency}`
  }
  
  if (item.event_type === 'created') {
      return `Стоимость: ${item.details.price} ${item.details.currency}`
  }

  if (item.event_type === 'updated') {
    const changes = []
    const d = item.details

    if (d.name) changes.push(`Новое название: «${d.name}»`)
    if (d.price) changes.push(`Цена изменена на ${d.price} ${d.currency || ''}`)
    // If currency changed alone? Rare but possible.
    if (d.currency && !d.price) changes.push(`Валюта: ${d.currency}`)
    
    if (d.period_days) changes.push(`Период: ${d.period_days} дн.`)
    
    if (d.next_payment_date) {
        // Format date nice?
        changes.push(`Дата следующей оплаты: ${formatDate(d.next_payment_date)}`)
    }

    if (d.notification_rules) {
       if (Array.isArray(d.notification_rules)) {
          changes.push(d.notification_rules.length > 0 
            ? `Уведомления обновлены (${d.notification_rules.length} шт.)`
            : `Уведомления отключены`
          )
       }
    }
    
    if (d.is_active !== undefined) {
        changes.push(d.is_active ? 'Подписка активирована' : 'Подписка приостановлена')
    }

    // Capture others
    const handledKeys = ['name', 'price', 'currency', 'period_days', 'next_payment_date', 'notification_rules', 'is_active']
    Object.keys(d).forEach(k => {
        if (!handledKeys.includes(k) && k !== 'icon' && k !== 'color') {
             changes.push(`${k}: ${d[k]}`)
        }
    })

    return changes.join('. ')
  }

  return JSON.stringify(item.details)
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
}

function formatTime(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}


const groupedHistory = computed(() => {
  const groups = {}
  
  history.value.forEach(item => {
    const d = new Date(item.created_at)
    const day = d.getDate()
    const month = d.toLocaleString('ru-RU', { month: 'long' })
    const year = d.getFullYear()
    
    // Group by nice date e.g. "4 Января 2024"
    const dateKey = `${day} ${month} ${year}`
    // But we need comparable key for sorting if default dict iteration is unreliable, 
    // but in JS object keys order is reliable for non-numeric.
    // However, better store array.
    
    if (!groups[dateKey]) {
        groups[dateKey] = {
            date: dateKey,
            rawDate: d,
            items: []
        }
    }
    groups[dateKey].items.push(item)
  })
  
  return Object.values(groups).sort((a, b) => b.rawDate - a.rawDate)
})

onMounted(async () => {
  try {
    const data = await getHistory()
    // Ensure all items have created_at valid
    // Backend sorts desc, so local grouping should maintain that
    history.value = data
  } catch (e) {
    console.error('Failed to load history', e)
    // Mock data for dev if failed? 
    // history.value = []
  } finally {
    loading.value = false
  }
})
</script>

