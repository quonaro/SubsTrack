<template>
  <div class="space-y-3">
    <label v-if="label" class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">
      {{ label }}
    </label>
    
    <div class="grid grid-cols-7 gap-3">
      <!-- Day Selector -->
      <div class="col-span-2 relative" ref="dayContainer">
        <button 
          type="button"
          class="w-full h-14 flex items-center justify-between rounded-2xl bg-surface-50 border border-app-border px-5 text-app-text transition-all active:scale-[0.98] focus:outline-none"
          :class="{ 'ring-2 ring-primary-500/20 border-primary-500/50 bg-surface-100': openDropdown === 'day' }"
          @click="toggleDropdown('day')"
        >
          <span class="text-sm font-bold">{{ modelValue.day }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4 text-app-text-muted transition-transform" :class="{ 'rotate-180': openDropdown === 'day' }">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      <!-- Month Selector -->
      <div class="col-span-3 relative" ref="monthContainer">
        <button 
          type="button"
          class="w-full h-14 flex items-center justify-between rounded-2xl bg-surface-50 border border-app-border px-5 text-app-text transition-all active:scale-[0.98] focus:outline-none"
          :class="{ 'ring-2 ring-primary-500/20 border-primary-500/50 bg-surface-100': openDropdown === 'month' }"
          @click="toggleDropdown('month')"
        >
          <span class="text-sm font-bold">{{ monthOptions[modelValue.month].label }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4 text-app-text-muted transition-transform" :class="{ 'rotate-180': openDropdown === 'month' }">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      <!-- Year Selector -->
      <div class="col-span-2 relative" ref="yearContainer">
        <button 
          type="button"
          class="w-full h-14 flex items-center justify-between rounded-2xl bg-surface-50 border border-app-border px-5 text-app-text transition-all active:scale-[0.98] focus:outline-none"
          :class="{ 'ring-2 ring-primary-500/20 border-primary-500/50 bg-surface-100': openDropdown === 'year' }"
          @click="toggleDropdown('year')"
        >
          <span class="text-sm font-bold font-mono">{{ modelValue.year }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4 text-app-text-muted transition-transform" :class="{ 'rotate-180': openDropdown === 'year' }">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Dropdowns Teleport -->
    <Teleport to="body">
      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95 -translate-y-2"
        enter-to-class="transform opacity-100 scale-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="transform opacity-100 scale-100 translate-y-0"
        leave-to-class="transform opacity-0 scale-95 -translate-y-2"
      >
        <div 
          v-if="openDropdown"
          ref="dropdownMenu"
          class="fixed z-[9999] bg-[#27272a] border border-app-border rounded-2xl shadow-2xl overflow-hidden py-2 scrollbar-hide"
          :style="dropdownStyle"
        >
          <div class="max-h-[300px] overflow-y-auto scrollbar-hide">
            <button
              v-for="option in currentOptions"
              :key="option.value"
              type="button"
              class="w-full px-5 py-3.5 text-left text-sm transition-all hover:bg-white/5 flex items-center justify-between group"
              :class="{ 'text-primary-400 font-bold bg-primary-500/10': isSelected(option.value), 'text-zinc-300': !isSelected(option.value) }"
              @click="selectOption(option.value)"
            >
              <span>{{ option.label }}</span>
              <svg v-if="isSelected(option.value)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-primary-500 shadow-accent">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.124l-3.5-3.5a.75.75 0 011.06-1.06l2.873 2.873 7.42-9.74a.75.75 0 011.051-.15z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    // Expecting { day: number, month: number (0-11), year: number }
  },
  label: {
    type: String,
    default: 'Дата следующего платежа'
  }
})

const emit = defineEmits(['update:modelValue'])

const openDropdown = ref(null) // 'day', 'month', 'year' or null
const dropdownStyle = ref({})

const dayContainer = ref(null)
const monthContainer = ref(null)
const yearContainer = ref(null)
const dropdownMenu = ref(null)

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

const dayOptions = computed(() => {
  const daysInMonth = new Date(props.modelValue.year, props.modelValue.month + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 }))
})

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 7 }, (_, i) => {
  const year = currentYear - 1 + i
  return { label: year.toString(), value: year }
})

const currentOptions = computed(() => {
  if (openDropdown.value === 'day') return dayOptions.value
  if (openDropdown.value === 'month') return monthOptions
  if (openDropdown.value === 'year') return yearOptions
  return []
})

function toggleDropdown(type) {
  if (openDropdown.value === type) {
    openDropdown.value = null
  } else {
    openDropdown.value = type
    updateDropdownPosition()
  }
}

async function updateDropdownPosition() {
  await nextTick()
  let container = null
  if (openDropdown.value === 'day') container = dayContainer.value
  if (openDropdown.value === 'month') container = monthContainer.value
  if (openDropdown.value === 'year') container = yearContainer.value

  if (container) {
    const rect = container.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    }
  }
}

function selectOption(value) {
  const newVal = { ...props.modelValue }
  if (openDropdown.value === 'day') newVal.day = value
  if (openDropdown.value === 'month') newVal.month = value
  if (openDropdown.value === 'year') newVal.year = value

  // Correct day if month changed and day is now invalid
  const daysInNewMonth = new Date(newVal.year, newVal.month + 1, 0).getDate()
  if (newVal.day > daysInNewMonth) {
    newVal.day = daysInNewMonth
  }

  emit('update:modelValue', newVal)
  openDropdown.value = null
}

function isSelected(value) {
  if (openDropdown.value === 'day') return props.modelValue.day === value
  if (openDropdown.value === 'month') return props.modelValue.month === value
  if (openDropdown.value === 'year') return props.modelValue.year === value
  return false
}

function handleClickOutside(event) {
  if (openDropdown.value) {
    const triggerDay = dayContainer.value && dayContainer.value.contains(event.target)
    const triggerMonth = monthContainer.value && monthContainer.value.contains(event.target)
    const triggerYear = yearContainer.value && yearContainer.value.contains(event.target)
    const inDropdown = dropdownMenu.value && dropdownMenu.value.contains(event.target)

    if (!triggerDay && !triggerMonth && !triggerYear && !inDropdown) {
      openDropdown.value = null
    }
  }
}

function handleScroll(event) {
  if (!openDropdown.value) return
  
  // If user scrolls inside the dropdown, do nothing
  if (dropdownMenu.value && dropdownMenu.value.contains(event.target)) {
    return 
  }
  
  openDropdown.value = null
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', updateDropdownPosition)
  window.addEventListener('scroll', handleScroll, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', handleScroll, true)
})
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
