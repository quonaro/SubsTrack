<template>
  <div class="relative" ref="container">
    <!-- Label -->
    <label v-if="label" class="mb-3 block text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">
      {{ label }}
    </label>

    <!-- Trigger Button -->
    <button 
      ref="trigger"
      type="button"
      class="w-full flex items-center justify-between rounded-2xl bg-surface-50 border border-app-border px-5 py-4 text-left text-white transition-all active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-primary-500/10"
      :class="{ 'bg-surface-100 ring-4 ring-primary-500/10': isOpen }"
      @click="toggle"
    >
      <span class="block truncate font-medium" :class="{ 'text-app-text-muted': !modelValue }">
        {{ selectedLabel || placeholder }}
      </span>
      <span class="pointer-events-none flex items-center text-app-text-muted transition-transform duration-200" :class="{ 'rotate-180': isOpen }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </span>
    </button>

    <!-- Dropdown / Modal Menu -->
    <Teleport to="body">
      <transition
        :name="mode === 'modal' ? 'modal-fade' : ''"
        :enter-active-class="mode === 'modal' ? 'transition ease-out duration-300' : 'transition ease-out duration-200'"
        :enter-from-class="mode === 'modal' ? 'opacity-0 translate-y-full' : 'transform opacity-0 translate-y-2 scale-95'"
        :enter-to-class="mode === 'modal' ? 'opacity-100 translate-y-0' : 'transform opacity-100 translate-y-0 scale-100'"
        :leave-active-class="mode === 'modal' ? 'transition ease-in duration-200' : 'transition ease-in duration-150'"
        :leave-from-class="mode === 'modal' ? 'opacity-100 translate-y-0' : 'transform opacity-100 translate-y-0 scale-100'"
        :leave-to-class="mode === 'modal' ? 'opacity-0 translate-y-full' : 'transform opacity-0 translate-y-2 scale-95'"
      >
        <div 
          v-if="isOpen" 
          :class="[
            'z-[9999] overflow-hidden bg-[#27272a] border-app-border shadow-2xl ring-1 ring-black/20',
            mode === 'modal' 
              ? 'fixed inset-x-0 bottom-0 rounded-t-[2.5rem] border-t max-h-[90vh] flex flex-col' 
              : 'fixed rounded-2xl border'
          ]"
          :style="mode === 'modal' ? {} : dropdownStyle"
        >
          <!-- Modal Header -->
          <div v-if="mode === 'modal'" class="flex items-center justify-between px-8 py-6 border-b border-app-border bg-app-bg/80 backdrop-blur-xl shrink-0">
            <h3 class="text-lg font-bold text-app-text">{{ label || placeholder }}</h3>
            <button 
              class="rounded-2xl p-2 bg-surface-100 text-app-text-muted hover:bg-surface-200 transition-all"
              @click="isOpen = false"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ul class="overflow-y-auto scrollbar-hide py-2" :class="mode === 'modal' ? 'px-4 pb-8' : ''">
            <li 
              v-for="option in options" 
              :key="option.value"
              class="mb-1 last:mb-0"
            >
              <div class="flex flex-col">
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex-1 cursor-pointer select-none px-5 py-4 text-left transition-all hover:bg-white/5 flex items-center justify-between group rounded-2xl"
                    :class="{ 'bg-primary-500/10 text-primary-400 font-bold': modelValue === option.value, 'text-zinc-300': modelValue !== option.value }"
                    @click="select(option)"
                  >
                    <span class="block truncate">{{ option.label }}</span>
                    <span v-if="modelValue === option.value" class="flex items-center text-primary-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 shadow-accent">
                        <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.124l-3.5-3.5a.75.75 0 011.06-1.06l2.873 2.873 7.42-9.74a.75.75 0 011.051-.15z" clip-rule="evenodd" />
                      </svg>
                    </span>
                  </button>
                  
                  <!-- Info / Details Toggle -->
                  <button 
                    v-if="option.description"
                    type="button"
                    class="p-4 text-app-text-muted hover:text-primary-400 transition-colors rounded-2xl hover:bg-white/5"
                    @click.stop="toggleDescription(option.value)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5" :class="{ 'text-primary-400': expandedDescriptions.has(option.value) }">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </button>
                </div>

                <!-- Description content -->
                <transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-y-2"
                  enter-to-class="opacity-100 translate-y-0"
                >
                  <div v-if="expandedDescriptions.has(option.value)" class="mx-5 mb-4 p-4 rounded-xl bg-app-bg/50 border border-app-border text-xs leading-relaxed text-app-text-muted">
                    {{ option.description }}
                  </div>
                </transition>
              </div>
            </li>
          </ul>
        </div>
      </transition>
      
      <!-- Modal Backdrop -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isOpen && mode === 'modal'" class="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" @click="isOpen = false"></div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true,
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Выберите...'
  },
  mode: {
    type: String,
    default: 'dropdown', // 'dropdown' or 'modal'
    validator: (value) => ['dropdown', 'modal'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue'])
const isOpen = ref(false)
const container = ref(null)
const trigger = ref(null)
const dropdownStyle = ref({})
const expandedDescriptions = ref(new Set())

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option ? option.label : ''
})

function updatePosition() {
  if (trigger.value && props.mode === 'dropdown') {
    const rect = trigger.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    }
  }
}

async function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value && props.mode === 'dropdown') {
    await nextTick()
    updatePosition()
  }
}

function select(option) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function toggleDescription(value) {
  if (expandedDescriptions.value.has(value)) {
    expandedDescriptions.value.delete(value)
  } else {
    expandedDescriptions.value.add(value)
  }
}

function handleClickOutside(event) {
  if (isOpen.value && props.mode === 'dropdown') {
    const inTrigger = container.value && container.value.contains(event.target)
    const dropdownEl = document.querySelector('.fixed.z-\\[9999\\]:not(.inset-x-0)') 
    const inDropdown = dropdownEl && dropdownEl.contains(event.target)
    
    if (!inTrigger && !inDropdown) {
      isOpen.value = false
    }
  }
}

function handleResize() {
  if (isOpen.value && props.mode === 'dropdown') {
    updatePosition()
  }
}

function handleScroll(event) {
    if (!isOpen.value || props.mode === 'modal') return
    
    const dropdownEl = document.querySelector('.fixed.z-\\[9999\\]')
    if (dropdownEl && dropdownEl.contains(event.target)) {
        return 
    }
    
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

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
