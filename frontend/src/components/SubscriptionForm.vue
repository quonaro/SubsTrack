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
          
          <!-- Category -->
          <div class="space-y-3">
             <CustomSelect
               v-model="formData.category_id"
               :options="categoryOptions"
               label="Категория"
               :searchable="true"
             />
             <div v-if="formData.category_id === 'new'" class="animate-fade-in space-y-3 pt-2">
                <input 
                  v-model="newCategoryName"
                  type="text" 
                  placeholder="Название новой категории" 
                  class="w-full rounded-2xl bg-surface-50 border border-app-border px-5 py-4 text-app-text placeholder-zinc-700 focus:border-primary-500/50 focus:bg-surface-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all center-placeholder"
                  @keydown.enter.prevent="createNewCategory"
                />
                <button 
                  type="button"
                  class="w-full rounded-2xl bg-primary-500/10 px-4 py-3 text-sm font-bold text-primary-400 hover:bg-primary-500/20 active:scale-95 transition-all"
                  @click="createNewCategory"
                >
                  Создать категорию
                </button>
             </div>
          </div>
          

          <!-- Subscription Date (Day + Month + Year) -->
          <div class="space-y-3">
            <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">
              Дата следующего платежа
            </label>
            <div class="grid grid-cols-7 gap-3">
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
              <div class="col-span-2">
                <CustomSelect
                  v-model="selectedYear"
                  :options="yearOptions"
                  placeholder="Год"
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
                <span class="text-xs text-app-text-muted mt-0.5">Гибкое управление уведомлениями</span>
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
              <div v-if="formData.reminder_enabled" class="space-y-6 pt-4 border-t border-app-border">
                <div v-for="(rule, index) in formData.notification_rules" :key="index" class="relative p-4 rounded-2xl bg-surface-100 border border-app-border space-y-4">
                  <button 
                    type="button"
                    class="absolute top-2 right-2 p-2 text-app-text-muted hover:text-red-400 transition-colors"
                    @click="removeNotificationRule(index)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div class="space-y-3">
                    <label class="text-[9px] font-bold uppercase tracking-widest text-app-text-muted">Тип правила</label>
                    <CustomSelect v-model="rule.rule_type" :options="ruleTypeOptions" placeholder="Выберите тип" mode="modal" />
                  </div>

                  <!-- Conditional fields -->
                  <div v-if="rule.rule_type === 'advance_notice'" class="animate-fade-in space-y-3">
                    <label class="text-[9px] font-bold uppercase tracking-widest text-app-text-muted">За сколько дней</label>
                    <div class="flex items-center gap-3">
                      <input v-model.number="rule.days_before" type="number" min="0" max="30" class="flex-1 rounded-xl bg-surface-50 border border-app-border px-4 py-3 text-sm text-app-text" />
                      <input v-model="rule.at_time" type="time" class="rounded-xl bg-surface-50 border border-app-border px-4 py-3 text-sm text-app-text uppercase" />
                    </div>
                  </div>

                  <div v-if="rule.rule_type === 'recurring_reminder'" class="animate-fade-in space-y-3">
                    <label class="text-[9px] font-bold uppercase tracking-widest text-app-text-muted">Интервал (в часах)</label>
                    <input v-model.number="rule.interval_hours" type="number" min="1" max="24" class="w-full rounded-xl bg-surface-50 border border-app-border px-4 py-3 text-sm text-app-text" />
                  </div>

                  <div v-if="rule.rule_type === 'payment_day_alert'" class="animate-fade-in space-y-3">
                    <label class="text-[9px] font-bold uppercase tracking-widest text-app-text-muted">В какое время</label>
                    <input v-model="rule.at_time" type="time" class="w-full rounded-xl bg-surface-50 border border-app-border px-4 py-3 text-sm text-app-text" />
                  </div>

                  <div v-if="rule.rule_type === 'weekly_summary'" class="animate-fade-in space-y-3">
                    <label class="text-[9px] font-bold uppercase tracking-widest text-app-text-muted">Время отчета (Пн)</label>
                    <input v-model="rule.at_time" type="time" class="w-full rounded-xl bg-surface-50 border border-app-border px-4 py-3 text-sm text-app-text" />
                  </div>
                </div>

                <button 
                  type="button" 
                  class="w-full p-4 rounded-2xl border-2 border-dashed border-app-border text-app-text-muted hover:border-primary-500/50 hover:text-primary-400 transition-all flex items-center justify-center gap-2"
                  @click="addNotificationRule"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span class="text-xs font-bold uppercase tracking-widest">Добавить правило</span>
                </button>
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
import { ref, watch, computed, onMounted } from 'vue'
import EmojiPicker from './EmojiPicker.vue'
import CustomSelect from './CustomSelect.vue'
import { getCategories, createCategory as apiCreateCategory } from '../services/categories'

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

const ruleTypeOptions = [
  { 
    label: '🔔 Предварительное уведомление', 
    value: 'advance_notice',
    description: 'Присылает уведомление заранее, чтобы вы успели подготовить нужную сумму на счету.'
  },
  { 
    label: '🔄 Повторяющееся напоминание', 
    value: 'recurring_reminder',
    description: 'Повторяет уведомление через заданный интервал прямо В ДЕНЬ оплаты, пока вы не отметите подписку как оплаченную.'
  },
  { 
    label: '🌅 Уведомление в день оплаты', 
    value: 'payment_day_alert',
    description: 'Уведомление утром в день списания средств.'
  }
]

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

const currentYear = new Date().getFullYear()
// Simple range of years: Current year - 1 to Current year + 5
const yearOptions = Array.from({ length: 7 }, (_, i) => {
  const year = currentYear - 1 + i
  return { label: year.toString(), value: year }
})

const selectedDay = ref(new Date().getDate())
const selectedMonth = ref(new Date().getMonth())
const selectedYear = ref(new Date().getFullYear())

function handleEmojiSelect(emoji) {
  formData.value.icon = emoji
  showEmojiPicker.value = false
}

const categories = ref([])
const newCategoryName = ref('')

const categoryOptions = computed(() => {
  const opts = categories.value.map(c => ({
    label: c.icon + ' ' + c.name,
    value: c.id
  }))
  opts.push({ label: '➕ Создать новую...', value: 'new' })
  return opts
})

async function fetchCategories() {
  try {
    categories.value = await getCategories()
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
}

async function createNewCategory() {
  if (!newCategoryName.value) return
  
  try {
    const defaultIcons = ['🍿', '🎮', '💡', '🏠', '🛒', '🎓']
    const randomIcon = defaultIcons[Math.floor(Math.random() * defaultIcons.length)]
    
    const newCat = await apiCreateCategory({
      name: newCategoryName.value,
      color: '#8b5cf6',
      icon: randomIcon
    })
    
    categories.value.push(newCat)
    formData.value.category_id = newCat.id
    newCategoryName.value = ''
  } catch (e) {
    console.error('Failed to create category', e)
  }
}

onMounted(() => {
  fetchCategories()
})

const ruleTypeLabels = {
  'advance_notice': 'Предварительное',
  'recurring_reminder': 'Повторяющееся',
  'payment_day_alert': 'В день оплаты',
  'urgent_reminder': 'Срочное',
  'weekly_summary': 'Отчет'
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
  reminder_days_before: 1,
  category_id: null,
  notification_rules: []
})

watch(() => props.subscription, (sub) => {
  if (sub) {
    const date = new Date(sub.next_payment_date)
    selectedDay.value = date.getDate()
    selectedMonth.value = date.getMonth()
    selectedYear.value = date.getFullYear()
    
    formData.value = {
      name: sub.name,
      price: sub.price,
      currency: sub.currency,
      period_days: sub.period_days,
      next_payment_date: sub.next_payment_date.split('T')[0],
      icon: sub.icon,
      reminder_enabled: sub.reminder_enabled,
      reminder_days_before: sub.reminder_days_before,
      category_id: sub.category ? sub.category.id : null,
      notification_rules: sub.notification_rules ? sub.notification_rules.map(rule => ({
        ...rule,
        at_time: rule.at_time ? rule.at_time.substring(0, 5) : rule.at_time
      })) : []
    }
  }
}, { immediate: true })

function formatLocalYYYYMMDD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addNotificationRule() {
  formData.value.notification_rules.push({
    rule_type: 'advance_notice',
    days_before: 1,
    at_time: '10:00'
  })
}

function removeNotificationRule(index) {
  formData.value.notification_rules.splice(index, 1)
}

function handleSubmit() {
  const year = selectedYear.value
  
  // Construct user selected target date for current year
  // Note: This constructs in LOCAL time
  let targetDate = new Date(year, selectedMonth.value, selectedDay.value)
  
  // Fix month overflow (e.g. Feb 31)
  if (targetDate.getMonth() !== selectedMonth.value) {
    targetDate = new Date(year, selectedMonth.value + 1, 0)
  }
  
  const finalDate = targetDate
  
  // Use local formatted string instead of toISOString() to avoid timezone shifts
  const dateStr = formatLocalYYYYMMDD(finalDate)
  
  // Update form data
  formData.value.start_date = dateStr
  formData.value.next_payment_date = dateStr
  
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
