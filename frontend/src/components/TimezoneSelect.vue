<template>
  <div class="relative">
    <!-- Trigger Button -->
    <button 
      @click="openPicker"
      :disabled="disabled"
      class="w-full text-left rounded-2xl bg-surface-100 border border-app-border px-6 py-4 text-app-text hover:bg-surface-200 transition-colors flex items-center justify-between group/trigger disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span class="font-medium truncate">{{ modelValue ? formatTimezone(modelValue) : 'Выберите из списка...' }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-app-text-muted group-hover/trigger:text-primary-500 transition-colors">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Full Screen Picker Modal -->
    <transition name="fade">
      <div v-if="showPicker" class="fixed inset-0 z-[150] bg-app-bg/95 backdrop-blur-xl flex flex-col animate-fade-in text-left transition-colors duration-300">
        <!-- Picker Header -->
        <div class="p-6 pb-4 border-b border-app-border flex items-center gap-4 bg-app-bg/50 backdrop-blur-lg">
          <button @click="showPicker = false" class="p-2 rounded-xl bg-surface-100 text-app-text hover:bg-surface-200 active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div class="flex-1 relative">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted">
              <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
            </svg>
            <input 
              ref="searchInput"
              v-model="searchQuery" 
              type="text" 
              placeholder="Поиск города..." 
              class="w-full bg-surface-100 rounded-xl py-3 pl-10 pr-4 text-app-text placeholder:text-app-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 border border-app-border text-base transition-colors"
            >
          </div>
        </div>

        <!-- Picker List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-1">
          <button 
            v-for="tz in filteredTimezones" 
            :key="tz.id"
            @click="selectTimezone(tz.id)"
            class="w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all group"
            :class="modelValue === tz.id ? 'bg-primary-500/20 border border-primary-500/50' : 'hover:bg-surface-100 border border-transparent'"
          >
            <div>
              <div class="font-bold text-app-text text-[15px] transition-colors" :class="modelValue === tz.id ? 'text-primary-500' : ''">{{ tz.name }}</div>
              <div class="text-[13px] text-app-text-muted mt-1 font-medium group-hover:text-app-text transition-colors">{{ tz.offset }} • {{ tz.id }}</div>
            </div>
            <div v-if="modelValue === tz.id" class="text-primary-500">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.124l-3.5-3.5a.75.75 0 011.06-1.06l2.873 2.873 7.42-9.74a.75.75 0 011.051-.15z" clip-rule="evenodd" />
              </svg>
            </div>
          </button>
           <div v-if="filteredTimezones.length === 0" class="text-center py-10 text-app-text-muted transition-colors">
            Ничего не найдено 😔
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { timezoneNamesRu, getTimezoneName } from '../services/timezone_names_ru'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const timezones = ref([])
const showPicker = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)

onMounted(() => {
  try {
    const rawTimezones = Intl.supportedValuesOf('timeZone')
    const now = new Date()
    
    timezones.value = rawTimezones.map(tz => {
        const name = getTimezoneName(tz)
        
        // Calculate offset
        let offset = ''
        try {
            offset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
                .formatToParts(now)
                .find(part => part.type === 'timeZoneName')?.value || 'GMT'
        } catch (e) { offset = 'GMT' }

        return {
            id: tz,
            name: name,
            offset: offset,
            searchStr: (name + ' ' + tz).toLowerCase()
        }
    }).sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  } catch (e) {
    console.error('Timezone API not supported', e)
     timezones.value = [
        { id: 'UTC', name: 'UTC', offset: 'GMT+0', searchStr: 'utc' },
        { id: 'Europe/Moscow', name: 'Москва', offset: 'GMT+3', searchStr: 'москва moscow' },
    ]
  }
})

function openPicker() {
    if (props.disabled) return
    showPicker.value = true
    nextTick(() => {
        searchInput.value?.focus()
    })
}

const filteredTimezones = computed(() => {
    if (!searchQuery.value) return timezones.value
    const q = searchQuery.value.toLowerCase()
    return timezones.value.filter(tz => tz.searchStr.includes(q))
})

function formatTimezone(id) {
  const tz = timezones.value.find(t => t.id === id)
  return tz ? tz.name : id
}

function selectTimezone(id) {
    emit('update:modelValue', id)
    showPicker.value = false
    searchQuery.value = ''
}
</script>
