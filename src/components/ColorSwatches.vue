<script setup lang="ts">
import { ICON_COLORS } from '../domain/colors'
import Icon from './Icon.vue'

const props = defineProps<{ modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [string | null] }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Цвет иконки">
    <button
      type="button"
      aria-label="Как у категории"
      title="Как у категории"
      :aria-pressed="props.modelValue == null"
      class="flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors"
      :class="props.modelValue == null ? 'border-accent' : 'border-app-border'"
      @click="emit('update:modelValue', null)"
    >
      <Icon name="ban" :size="16" class="text-app-text-muted" />
    </button>
    <button
      v-for="c in ICON_COLORS"
      :key="c.value"
      type="button"
      :aria-label="c.label"
      :title="c.label"
      :aria-pressed="props.modelValue === c.value"
      class="flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors"
      :class="props.modelValue === c.value ? 'border-accent' : 'border-app-border'"
      @click="emit('update:modelValue', c.value)"
    >
      <span class="h-6 w-6 rounded-full" :style="{ backgroundColor: c.value }" />
    </button>
  </div>
</template>
