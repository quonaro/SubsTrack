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

    <!-- Dropdown Menu -->
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
          class="fixed z-[9999] overflow-hidden rounded-2xl bg-[#27272a] border border-app-border shadow-2xl ring-1 ring-black/20"
          :style="dropdownStyle"
        >
          <ul class="max-h-60 overflow-auto py-2">
            <li 
              v-for="option in options" 
              :key="option.value"
            >
              <button
                type="button"
                class="relative w-full cursor-pointer select-none px-5 py-3 text-left transition-colors hover:bg-white/5 flex items-center justify-between group"
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
  }
})

const emit = defineEmits(['update:modelValue'])
const isOpen = ref(false)
const container = ref(null)
const trigger = ref(null)
const dropdownStyle = ref({})

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option ? option.label : ''
})

function updatePosition() {
  if (trigger.value) {
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
  // Since dropdown is teleported, we need to check if click is in dropdown OR in container
  // However, simple check: if click is NOT in container, close.
  // Wait, if I click in the dropdown (which is outside container in DOM), it might close?
  // No, because the click on dropdown button propagates?
  // Actually, standard tactic: stop propagation in dropdown? Or explicit check.
  // Easier: Close on click is fine, but selecting an option closes it anyway.
  // If I click scrollbar? 
  // Let's implement a specific check.
  // Check if target is inside trigger. If not, close.
  // But if target is inside the dropdown... ?
  // With Teleport, the dropdown is in body.
  // The simplest way is to check if event.target is closest to dropdown or trigger.
  
  if (isOpen.value) {
    // If clicking trigger, toggle handles it (or we prevent default).
    // If clicking outside trigger AND outside dropdown...
    // Since dropdown is fixed/teleported, checking `container.contains` fails.
    // We can rely on the fact that `toggle` and `select` handle their interactions.
    // So we just need to detect "click somewhere else".
    const inTrigger = container.value && container.value.contains(event.target)
    const dropdownEl = document.querySelector('.fixed.z-\\[9999\\]') // fragile selector but works for this context
    const inDropdown = dropdownEl && dropdownEl.contains(event.target)
    
    if (!inTrigger && !inDropdown) {
      isOpen.value = false
    }
  }
}

function handleResize() {
  if (isOpen.value) {
    updatePosition()
    // Optional: close on scroll to avoid misalignment
    // isOpen.value = false 
  }
}

// Close on scroll of any parent to avoid misalignment, 
// but NOT if we are scrolling the dropdown itself.
function handleScroll(event) {
    if (!isOpen.value) return
    
    const dropdownEl = document.querySelector('.fixed.z-\\[9999\\]')
    if (dropdownEl && dropdownEl.contains(event.target)) {
        return // Allow scrolling within the dropdown
    }
    
    isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll, true) // capture phase to catch all scrolls
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll, true)
})
</script>
