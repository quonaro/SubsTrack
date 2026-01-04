<template>
  <div class="fixed inset-0 z-[70] flex flex-col bg-app-bg animate-slide-up">
    <!-- Header -->
    <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-bg/80 backdrop-blur-xl">
      <div class="flex items-center gap-4">
        <button 
          class="rounded-xl p-2 text-app-text-muted hover:bg-surface-100 transition-all active:scale-90"
          @click="$emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-6 w-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 class="text-xl font-bold text-app-text">Новая категория</h2>
      </div>
      <button 
        class="text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors"
        @click="handleSubmit"
        :disabled="!name || loading"
      >
        Готово
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
      <!-- Preview -->
      <div class="flex flex-col items-center justify-center py-8">
        <div 
          class="w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl shadow-lg transition-all duration-300"
          :style="{ backgroundColor: selectedColor + '20', color: selectedColor, border: `2px solid ${selectedColor}40` }"
        >
          {{ selectedIcon }}
        </div>
      </div>

      <!-- Name input -->
      <div class="space-y-3">
        <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">Название</label>
        <input 
          v-model="name"
          type="text" 
          placeholder="Например: Развлечения" 
          class="w-full rounded-2xl bg-surface-50 border border-app-border px-5 py-4 text-app-text placeholder-zinc-700 focus:border-primary-500/50 focus:bg-surface-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
          autofocus
        />
      </div>

      <!-- Icon Selection -->
      <div class="space-y-3">
        <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">Иконка</label>
        <button
          type="button"
          class="w-full flex items-center justify-between rounded-2xl bg-surface-50 border border-app-border p-4 transition-all hover:bg-surface-100"
          @click="showEmojiPicker = true"
        >
          <span class="text-app-text font-medium">Выбрать эмодзи</span>
          <span class="text-2xl">{{ selectedIcon }}</span>
        </button>
      </div>

      <!-- Color Selection -->
      <div class="space-y-3">
        <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">Цвет категории</label>
        <div class="grid grid-cols-6 gap-3">
          <button 
            v-for="color in colorPresets" 
            :key="color"
            class="aspect-square rounded-2xl transition-all duration-200 flex items-center justify-center"
            :style="{ backgroundColor: color }"
            @click="selectedColor = color"
          >
            <div 
              v-if="selectedColor === color"
              class="w-2.5 h-2.5 rounded-full bg-white shadow-sm"
            ></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Sticky Action Button -->
    <div class="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-app-bg via-app-bg to-transparent">
      <button 
        class="w-full rounded-2xl bg-primary-600 px-6 py-5 text-sm font-bold text-white shadow-accent hover:bg-primary-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
        @click="handleSubmit"
        :disabled="!name || loading"
      >
        {{ loading ? 'Создание...' : 'Создать категорию' }}
      </button>
    </div>

    <!-- Emoji Picker -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <div v-if="showEmojiPicker" class="fixed inset-0 z-[80] flex items-end">
        <EmojiPicker
          @close="showEmojiPicker = false"
          @select="handleEmojiSelect"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import EmojiPicker from './EmojiPicker.vue'
import { createCategory } from '../services/categories'

const emit = defineEmits(['close', 'created'])

const name = ref('')
const selectedIcon = ref('🍿')
const selectedColor = ref('#8b5cf6')
const loading = ref(false)
const showEmojiPicker = ref(false)

const colorPresets = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#f43f5e', // Rose
  '#f97316', // Orange
]

function handleEmojiSelect(emoji) {
  selectedIcon.value = emoji
  showEmojiPicker.value = false
}

async function handleSubmit() {
  if (!name.value || loading.value) return
  
  loading.value = true
  try {
    const newCat = await createCategory({
      name: name.value,
      color: selectedColor.value,
      icon: selectedIcon.value
    })
    emit('created', newCat)
    emit('close')
  } catch (e) {
    console.error('Failed to create category:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
