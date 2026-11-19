<script setup lang="ts">
import { ref } from 'vue'
import Sheet from './Sheet.vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const open = ref(false)

// Curated subscription-friendly set — a full emoji DB is overkill here.
const EMOJIS = [
  '📦',
  '🎬',
  '🎵',
  '🎮',
  '☁️',
  '💼',
  '📱',
  '💻',
  '📺',
  '🎧',
  '📚',
  '✏️',
  '🖥️',
  '🗞️',
  '🏋️',
  '🧘',
  '🍔',
  '🍕',
  '☕',
  '🍷',
  '✈️',
  '🚗',
  '🏠',
  '💳',
  '💰',
  '📈',
  '🔐',
  '🌐',
  '📡',
  '🛒',
  '👕',
  '💄',
  '🐾',
  '🌱',
  '🔧',
  '💡',
  '🎨',
  '📷',
  '🎤',
  '⭐',
  '🔥',
  '💎',
  '🎁',
  '🏆',
  '⚽',
  '🎯',
  '🧩',
  '📖',
  '🖊️',
  '❤️',
]

function pick(e: string) {
  emit('update:modelValue', e)
  open.value = false
}
</script>

<template>
  <div>
    <button
      type="button"
      class="flex h-12 w-12 items-center justify-center rounded-xl border border-app-border bg-app-card text-2xl"
      @click="open = true"
    >
      {{ modelValue }}
    </button>
    <Sheet :open="open" title="Иконка" @update:open="open = $event">
      <div class="grid grid-cols-6 gap-1">
        <button
          v-for="e in EMOJIS"
          :key="e"
          type="button"
          class="flex h-12 items-center justify-center rounded-xl text-2xl transition-colors"
          :class="e === modelValue ? 'bg-violet-600/30 ring-1 ring-violet-500' : 'hover:bg-app-card'"
          @click="pick(e)"
        >
          {{ e }}
        </button>
      </div>
    </Sheet>
  </div>
</template>
