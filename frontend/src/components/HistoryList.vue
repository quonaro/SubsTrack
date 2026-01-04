<template>
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="relative w-full max-w-md transform overflow-hidden rounded-[2rem] bg-surface-50 p-6 shadow-premium transition-all">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <h3 class="text-xl font-bold text-app-text">История</h3>
        <button 
          @click="$emit('close')"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-200 text-app-text-muted hover:bg-surface-300 hover:text-app-text transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
      </div>

      <div v-else-if="history.length === 0" class="py-8 text-center text-sm text-app-text-muted">
        История пуста
      </div>

      <div v-else class="max-h-[60vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        <div 
          v-for="item in history" 
          :key="item.id || item.created_at"
          class="relative flex gap-4"
        >
          <!-- Timeline line -->
          <div class="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-surface-200 last:hidden"></div>

          <!-- Icon -->
          <div 
            class="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-surface-50"
            :class="getIconClass(item.event_type)"
          >
            <component :is="getIcon(item.event_type)" class="h-3 w-3 text-white" />
          </div>

          <!-- Details -->
          <div class="flex-1 pb-1">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-app-text">{{ getTitle(item) }}</span>
              <span class="text-[10px] text-app-text-muted select-none">{{ formatDate(item.created_at) }}</span>
            </div>
            
            <p v-if="formatDetails(item)" class="mt-1 text-xs text-app-text-muted leading-relaxed">
              {{ formatDetails(item) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  history: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const Icons = {
  payment: {
    template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>`
  },
  created: {
    template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`
  },
  updated: {
    template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>`
  },
  archived: {
    template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 11.25h-3.75m8.25-9.75h1.5m-1.5 0l-1.5 1.5m-9-1.5l1.5 1.5m1.125 11.25c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25" /></svg>`
  },
  default: {
    template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>`
  }
}

function getIcon(type) {
  return Icons[type] || Icons.default
}

function getIconClass(type) {
  const classes = {
    payment: 'bg-green-500',
    created: 'bg-primary-500',
    updated: 'bg-blue-500',
    archived: 'bg-zinc-500',
    default: 'bg-zinc-400'
  }
  return classes[type] || classes.default
}

function getTitle(item) {
  const titles = {
    payment: 'Оплата',
    created: 'Подписка создана',
    updated: 'Изменение',
    archived: 'В архиве',
    unarchive: 'Восстановлено' // assuming type might be 'unarchive'
  }
  return titles[item.event_type] || item.event_type
}

function formatDetails(item) {
  if (!item.details) return ''
  
  if (item.event_type === 'payment') {
    return `${item.details.amount} ${item.details.currency}`
  }
  
  if (item.event_type === 'created') {
      return `${item.details.name} (${item.details.price} ${item.details.currency})`
  }

  if (item.event_type === 'updated') {
    // details is a dict of changes
    const changes = Object.entries(item.details).map(([key, val]) => {
      const keyMap = {
        name: 'название',
        price: 'цену',
        currency: 'валюту',
        period_days: 'период',
        color: 'цвет',
        is_active: 'активность',
        notification_rules: 'уведомления'
      }

      if (key === 'notification_rules') {
        if (Array.isArray(val)) {
          if (val.length === 0) return 'уведомления: отключены'
          return `уведомления: обновлены (${val.length} шт.)`
        }
      }

      return `${keyMap[key] || key}: ${val}`
    })
    return changes.join(', ')
  }

  return JSON.stringify(item.details)
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleString('ru-RU', { 
    day: 'numeric', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
}
</style>
