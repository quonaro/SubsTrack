<template>
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="w-full max-h-[95vh] sm:max-w-lg overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] bg-app-bg border-t sm:border border-app-border shadow-premium flex flex-col animate-slide-up">
      <!-- Header -->
      <div class="sticky top-0 z-10 flex items-center justify-between px-8 py-6 border-b border-app-border bg-app-bg/80 backdrop-blur-xl">
        <h2 class="text-xl font-bold text-app-text">{{ isEdit ? 'Редактировать' : 'Новая подписка' }}</h2>
        <button 
          class="rounded-2xl p-3 bg-surface-100 text-app-text-muted hover:bg-surface-200 hover:text-app-text transition-all active:scale-90"
          @click="$emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-8 scrollbar-hide">
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <!-- Name Input -->
          <div class="space-y-3">
            <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">Название сервиса</label>
            <div class="relative group">
              <input 
                v-model="formData.name" 
                type="text" 
                required 
                placeholder="Netflix, Spotify..." 
                class="w-full rounded-2xl bg-surface-50 border border-app-border px-5 py-4 text-app-text placeholder-zinc-700 focus:border-primary-500/50 focus:bg-surface-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all center-placeholder"
              />
            </div>
          </div>
          
          <!-- Price & Currency -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-3">
              <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">Стоимость</label>
              <input 
                v-model.number="formData.price" 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                placeholder="0.00" 
                class="w-full rounded-2xl bg-surface-50 border border-app-border px-5 py-4 text-app-text placeholder-zinc-700 focus:border-primary-500/50 focus:bg-surface-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-mono"
              />
            </div>
            
            <div class="space-y-3">
              <CustomSelect
                v-model="formData.currency"
                :options="currencyOptions"
                label="Валюта"
              />
            </div>
          </div>
          
          <!-- Period -->
          <div class="space-y-3">
            <CustomSelect
              v-model="formData.period_days"
              :options="periodOptions"
              label="Периодичность списания"
            />
          </div>
          
          <!-- Subscription Date (Day + Month) -->
          <div class="space-y-3">
            <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">Дата следующего платежа</label>
            <div class="grid grid-cols-5 gap-3">
              <div class="col-span-2">
                <CustomSelect
                  v-model="selectedDay"
                  :options="dayOptions"
                  placeholder="День"
                />
              </div>
              <div class="col-span-3">
                <CustomSelect
                  v-model="selectedMonth"
                  :options="monthOptions"
                  placeholder="Месяц"
                />
              </div>
            </div>
          </div>
          
          <!-- Icon Picker -->
          <div class="space-y-3">
            <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">Иконка</label>
            <button
              type="button"
              class="w-full flex items-center gap-4 rounded-2xl bg-surface-50 border border-app-border p-3 transition-all hover:bg-surface-100 active:scale-[0.98]"
              @click="showEmojiPicker = true"
            >
              <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-200 text-3xl shadow-inner">
                {{ formData.icon || '📦' }}
              </div>
              <div class="flex-1 text-left">
                <p class="text-sm font-bold text-app-text">Выбрать эмодзи</p>
                <p class="text-xs text-app-text-muted mt-0.5">Выберите иконку для сервиса</p>
              </div>
              <div class="p-2 text-zinc-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-5 w-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
            </button>
          </div>

          <!-- Reminders Toggle -->
          <div class="rounded-3xl bg-surface-50 p-6 border border-app-border space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-sm font-bold text-app-text">Напоминания</span>
                <span class="text-xs text-app-text-muted mt-0.5">Присылать уведомление об оплате</span>
              </div>
              <button 
                type="button"
                class="relative h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none"
                :class="formData.reminder_enabled ? 'bg-primary-500' : 'bg-zinc-700'"
                @click="formData.reminder_enabled = !formData.reminder_enabled"
              >
                <div 
                  class="absolute top-1 h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-sm"
                  :class="formData.reminder_enabled ? 'left-6' : 'left-1'"
                ></div>
              </button>
            </div>
            
            <transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="transform -translate-y-4 opacity-0"
              enter-to-class="transform translate-y-0 opacity-100"
            >
              <div v-if="formData.reminder_enabled" class="space-y-3 pt-4 border-t border-app-border">
                <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">Дней до оплаты</label>
                <div class="flex items-center gap-4">
                  <input 
                    v-model.number="formData.reminder_days_before" 
                    type="range" 
                    min="0" 
                    max="14" 
                    class="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <span class="min-w-[2rem] text-center font-bold text-primary-400">{{ formData.reminder_days_before }}</span>
                </div>
              </div>
            </transition>
          </div>
          
          <!-- Actions -->
          <div class="pt-4 flex flex-col gap-3">
            <button 
              type="submit" 
              class="w-full rounded-2xl bg-primary-600 px-6 py-5 text-sm font-bold text-white shadow-accent hover:bg-primary-500 active:scale-[0.98] transition-all disabled:opacity-50"
              :disabled="loading"
            >
              {{ loading ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Добавить подписку') }}
            </button>
            <button 
              type="button" 
              class="w-full rounded-2xl bg-surface-100 px-6 py-5 text-sm font-bold text-zinc-300 hover:bg-surface-200 transition-all active:scale-[0.98]"
              @click="$emit('close')"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Emoji Picker Modal -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showEmojiPicker" class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" @click.self="showEmojiPicker = false">
        <div class="w-full max-w-sm rounded-[2.5rem] bg-app-bg border border-app-border shadow-premium p-6">
          <EmojiPicker
            @close="showEmojiPicker = false"
            @select="handleEmojiSelect"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import EmojiPicker from './EmojiPicker.vue'
import CustomSelect from './CustomSelect.vue'

const props = defineProps({
  subscription: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.subscription)
const loading = ref(false)
const showEmojiPicker = ref(false)

const currencyOptions = [
  { label: 'RUB ₽', value: 'RUB' },
  { label: 'USD $', value: 'USD' },
  { label: 'EUR €', value: 'EUR' }
]

const periodOptions = [
  { label: 'Еженедельно (7 дней)', value: 7 },
  { label: 'Раз в 2 недели (14 дней)', value: 14 },
  { label: 'Ежемесячно (30 дней)', value: 30 },
  { label: 'Раз в 2 месяца (60 дней)', value: 60 },
  { label: 'Раз в 3 месяца (90 дней)', value: 90 },
  { label: 'Раз в 6 месяцев (180 дней)', value: 180 },
  { label: 'Ежегодно (365 дней)', value: 365 }
]

const monthOptions = [
  { label: 'Январь', value: 0 },
  { label: 'Февраль', value: 1 },
  { label: 'Март', value: 2 },
  { label: 'Апрель', value: 3 },
  { label: 'Май', value: 4 },
  { label: 'Июнь', value: 5 },
  { label: 'Июль', value: 6 },
  { label: 'Август', value: 7 },
  { label: 'Сентябрь', value: 8 },
  { label: 'Октябрь', value: 9 },
  { label: 'Ноябрь', value: 10 },
  { label: 'Декабрь', value: 11 }
]

const dayOptions = Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 }))

const selectedDay = ref(new Date().getDate())
const selectedMonth = ref(new Date().getMonth())

function handleEmojiSelect(emoji) {
  formData.value.icon = emoji
  showEmojiPicker.value = false
}

const formData = ref({
  name: '',
  price: 0,
  currency: 'RUB',
  period_days: 30,
  start_date: '',
  next_payment_date: '',
  icon: '📦',
  reminder_enabled: true,
  reminder_days_before: 1
})

watch(() => props.subscription, (sub) => {
  if (sub) {
    const date = new Date(sub.next_payment_date)
    selectedDay.value = date.getDate()
    selectedMonth.value = date.getMonth()
    
    formData.value = {
      name: sub.name,
      price: sub.price,
      currency: sub.currency,
      period_days: sub.period_days,
      next_payment_date: sub.next_payment_date.split('T')[0],
      icon: sub.icon,
      reminder_enabled: sub.reminder_enabled,
      reminder_days_before: sub.reminder_days_before
    }
  }
}, { immediate: true })

function handleSubmit() {
  const now = new Date()
  let year = now.getFullYear()
  
  // Construct user selected target date for current year
  let targetDate = new Date(year, selectedMonth.value, selectedDay.value)
  
  // Fix month overflow (e.g. Feb 31)
  if (targetDate.getMonth() !== selectedMonth.value) {
    targetDate = new Date(year, selectedMonth.value + 1, 0)
  }
  
  // If the target date is in the past (ignoring time), bump to next year
  // Reset time for accurate comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (targetDate < today) {
    year++
    targetDate = new Date(year, selectedMonth.value, selectedDay.value)
     // Fix month overflow again for next year (leap year check etc)
    if (targetDate.getMonth() !== selectedMonth.value) {
       targetDate = new Date(year, selectedMonth.value + 1, 0)
    }
  }

  // Anchor start_date also aligns with this, but can be in previous year if needed for logic, 
  // but simpler to just use the target date as the fresh new anchor, or keep it same as next payment.
  // We'll set start_date = next_payment_date effectively re-anchoring the series.
  // Or, to be safe, stick to what it was, but we are essentially saying "The payment is on X".
  
  const finalDate = targetDate
  
  // Update form data
  formData.value.start_date = finalDate.toISOString().split('T')[0]
  formData.value.next_payment_date = finalDate.toISOString().split('T')[0]
  
  emit('submit', { ...formData.value })
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
