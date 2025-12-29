<template>
  <div class="relative" ref="container">
    <button 
      type="button"
      class="rounded-xl bg-surface-100 p-2 text-app-text-muted hover:bg-surface-200 hover:text-app-text transition-all active:scale-95 flex items-center gap-2"
      :class="{ 'bg-surface-200 text-app-text ring-2 ring-primary-500/20': isOpen }"
      @click="toggle"
    >
      <span class="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">{{ selectedLabel }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
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
          v-if="isOpen" 
          class="fixed z-[9999] overflow-hidden rounded-2xl bg-[#27272a] border border-app-border shadow-2xl ring-1 ring-black/20 w-48"
          :style="dropdownStyle"
        >
          <ul class="py-1">
            <li v-for="option in options" :key="option.value">
              <button
                type="button"
                class="w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-white/5 flex items-center justify-between"
                :class="{ 'text-primary-400 font-bold bg-primary-500/5': modelValue === option.value, 'text-zinc-300': modelValue !== option.value }"
                @click="select(option)"
              >
                {{ option.label }}
                <span v-if="modelValue === option.value" class="text-primary-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.124l-3.5-3.5a.75.75 0 011.06-1.06l2.873 2.873 7.42-9.74a.75.75 0 011.051-.15z" clip-rule="evenodd" />
                  </svg>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const container = ref(null)
const dropdownStyle = ref({})

const options = [
  { label: 'Сначала ближайшие', value: 'date_asc' },
  { label: 'Сначала дальние', value: 'date_desc' },
  { label: 'По цене (возр.)', value: 'price_asc' },
  { label: 'По цене (убыв.)', value: 'price_desc' },
  { label: 'По названию (А-Я)', value: 'name_asc' }
]

const selectedLabel = computed(() => {
  const opt = options.find(o => o.value === props.modelValue)
  return opt ? opt.label : 'Сортировка'
})

function updatePosition() {
  if (container.value) {
    const rect = container.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
      // Align right edge
      position: 'fixed'
    }
  }
}

async function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    updatePosition()
  }
}

function select(option) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleClickOutside(event) {
  if (isOpen.value) {
    const inTrigger = container.value && container.value.contains(event.target)
    // Check if distinct dropdown
    const dropdownEl = document.querySelector('.fixed.z-\\[9999\\]')
    const inDropdown = dropdownEl && dropdownEl.contains(event.target)
    
    if (!inTrigger && !inDropdown) {
      isOpen.value = false
    }
  }
}

function handleResize() {
  if (isOpen.value) updatePosition()
}

function handleScroll(event) {
    if (!isOpen.value) return
    const dropdownEl = document.querySelector('.fixed.z-\\[9999\\]')
    if (dropdownEl && dropdownEl.contains(event.target)) return
    isOpen.value = false
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
