<template>
  <div class="group relative overflow-hidden rounded-[2rem] bg-surface-50 p-5 border border-app-border transition-all duration-300 active:scale-[0.98] hover:bg-surface-100 shadow-premium" @click="$emit('edit', subscription)">
    <!-- Background Gradient Glow -->
    <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-500/5 blur-2xl transition-all group-hover:bg-primary-500/10"></div>
    
    <div class="mb-4 flex items-center justify-between">
      <div class="flex flex-col gap-0.5">
        <span 
          v-if="showDaysLabel"
          class="text-[10px] font-bold uppercase tracking-[0.1em]"
          :class="{
            'text-red-500 animate-pulse': daysUntil <= 0,
            'text-orange-500': daysUntil === 1,
            'text-app-text-muted/80': daysUntil > 1
          }"
        >
          {{ daysText }}
        </span>
        <h3 class="truncate text-lg font-bold text-app-text group-hover:text-primary-400 transition-colors">
          {{ subscription.name }}
        </h3>
      </div>
      
      <div class="flex items-center gap-2">
        <div v-if="daysUntil <= 3" class="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
        
        <!-- Hamburger Menu Button -->
        <div class="relative" ref="menuContainer">
          <button 
            type="button"
            class="h-8 w-8 flex items-center justify-center rounded-full text-app-text-muted transition-all hover:bg-white/10 hover:text-app-text active:scale-90"
            :class="{ 'bg-white/10 text-app-text': isMenuOpen }"
            @click.stop="toggleMenu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
            </svg>
          </button>

          <Teleport to="body">
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 translate-y-2 scale-95"
              enter-to-class="transform opacity-100 translate-y-0 scale-100"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="transform opacity-100 translate-y-0 scale-100"
              leave-to-class="transform opacity-0 translate-y-2 scale-95"
            >
              <div 
                v-if="isMenuOpen" 
                class="fixed z-[9999] overflow-hidden rounded-2xl bg-app-bg/95 backdrop-blur-xl border border-app-border shadow-premium w-48 py-1"
                :style="menuStyle"
              >
                <!-- Actions -->
                <button 
                  v-if="subscription.is_active"
                  class="w-full text-left px-4 py-3 text-xs font-semibold text-green-500 hover:bg-surface-100 flex items-center gap-3 transition-colors"
                  @click.stop="handleAction('paid')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Оплачено
                </button>

                <button 
                  class="w-full text-left px-4 py-3 text-xs font-semibold text-app-text hover:bg-surface-100 flex items-center gap-3 transition-colors"
                  @click.stop="handleAction('edit')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                  Изменить
                </button>

                <button 
                  v-if="subscription.is_active"
                  class="w-full text-left px-4 py-3 text-xs font-semibold text-app-text hover:bg-surface-100 flex items-center gap-3 transition-colors"
                  @click.stop="handleAction('archive')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 11.25h-3.75m8.25-9.75h1.5m-1.5 0l-1.5 1.5m-9-1.5l1.5 1.5m1.125 11.25c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25" />
                  </svg>
                  В архив
                </button>

                <button 
                  v-else
                  class="w-full text-left px-4 py-3 text-xs font-semibold text-app-text hover:bg-surface-100 flex items-center gap-3 transition-colors"
                  @click.stop="handleAction('unarchive')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                  </svg>
                  Восстановить
                </button>

                <div class="my-1 border-t border-app-border"></div>

                <button 
                  v-if="canTestNotification"
                  class="w-full text-left px-4 py-3 text-xs font-semibold text-yellow-500 hover:bg-surface-100 flex items-center gap-3 transition-colors"
                  @click.stop="handleTestNotification"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  Тест уведомления
                </button>

                <button 
                  class="w-full text-left px-4 py-3 text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                  @click.stop="handleAction('delete')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.34 9m-4.72 0-.34-9m9.27-2.31a.75.75 0 0 0-.71-.51L14.5 6H9.5l-1.07.18a.75.75 0 0 0-.71.51l-.31 1.31h13.18l-.31-1.31ZM4.5 9h15l-1 12a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2L4.5 9Z" />
                  </svg>
                  Удалить
                </button>
              </div>
            </transition>
          </Teleport>
        </div>
      </div>
    </div>
    
    <div class="relative flex items-center gap-4">
      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-2xl shadow-inner ring-1 ring-white/5 transition-transform group-hover:scale-110 duration-500">
        {{ subscription.icon }}
      </div>
      
      <div class="flex-1 min-w-0">
        <p class="truncate text-sm font-medium text-app-text-muted">
          {{ formatPrice(subscription.price, subscription.currency) }} <span class="text-zinc-600 px-1">/</span> {{ formatPeriod(subscription.period_days) }}
        </p>
        <p v-if="firstNotificationRule" class="truncate text-[10px] text-primary-400 mt-1 flex items-center gap-1 font-bold uppercase tracking-wider">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3 w-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          {{ formatNotificationRule(firstNotificationRule) }}
        </p>
      </div>

      <div class="h-10 w-10 flex items-center justify-center rounded-full bg-white/0 text-zinc-600 transition-all group-hover:bg-white/5 group-hover:text-app-text">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { getDaysUntilPayment, formatPrice, formatPeriod, formatDaysUntil, formatNotificationRule, sendTestNotification } from '../services/subscriptions'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  subscription: {
    type: Object,
    required: true
  },
  showDaysLabel: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['edit', 'paid', 'archive', 'unarchive', 'delete'])

const isMenuOpen = ref(false)
const menuContainer = ref(null)
const menuStyle = ref({})
const isDev = import.meta.env.DEV
const { user } = useAuth()

const canTestNotification = computed(() => isDev || user.value?.is_admin)

const daysUntil = computed(() => getDaysUntilPayment(props.subscription.next_payment_date))

const daysText = computed(() => formatDaysUntil(daysUntil.value))

const firstNotificationRule = computed(() => {
  if (!props.subscription.notification_rules || props.subscription.notification_rules.length === 0) {
    return null
  }
  return props.subscription.notification_rules[0]
})

function updateMenuPosition() {
  if (menuContainer.value) {
    const rect = menuContainer.value.getBoundingClientRect()
    menuStyle.value = {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
      position: 'fixed'
    }
  }
}

async function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
  if (isMenuOpen.value) {
    await nextTick()
    updateMenuPosition()
  }
}

function handleAction(action) {
  isMenuOpen.value = false
  if (action === 'edit') {
    emit('edit', props.subscription)
  } else {
    emit(action, props.subscription.id)
  }
}

async function handleTestNotification() {
  isMenuOpen.value = false
  try {
    await sendTestNotification(props.subscription.id)
    // Maybe show a toast/alert? For now just log since it's dev tool
    console.log('Test notification sent')
  } catch (e) {
    console.error('Failed to send test notification', e)
  }
}

function handleClickOutside(event) {
  if (isMenuOpen.value) {
    const inTrigger = menuContainer.value && menuContainer.value.contains(event.target)
    const dropdownEl = document.querySelector('.fixed.z-\\[9999\\]')
    const inDropdown = dropdownEl && dropdownEl.contains(event.target)
    
    if (!inTrigger && !inDropdown) {
      isMenuOpen.value = false
    }
  }
}

function handleResize() {
  if (isMenuOpen.value) updateMenuPosition()
}

function handleScroll(event) {
  if (!isMenuOpen.value) return
  const dropdownEl = document.querySelector('.fixed.z-\\[9999\\]')
  if (dropdownEl && dropdownEl.contains(event.target)) return
  isMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll, true)
})
</script>

