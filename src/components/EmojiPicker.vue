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
      class="flex h-9 w-9 items-center justify-center rounded-xl border border-app-border bg-app-card text-xl"
      @click="open = true"
    >
      {{ modelValue }}
    </button>
    <Sheet :open="open" title="Иконка" @update:open="open = $event">
      <div class="grid grid-cols-6 gap-1 sm:grid-cols-8">
        <button
          v-for="e in EMOJIS"
          :key="e"
          type="button"
          class="flex h-9 items-center justify-center rounded-xl text-xl transition-colors"
          :class="e === modelValue ? 'bg-accent/30 ring-1 ring-accent' : 'hover:bg-app-card'"
          @click="pick(e)"
        >
          {{ e }}
        </button>
      </div>
    </Sheet>
  </div>
</template>
