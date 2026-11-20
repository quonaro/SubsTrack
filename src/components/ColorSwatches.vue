<script setup lang="ts">
import { computed, ref } from 'vue'
import { ICON_COLORS } from '../domain/colors'
import ColorPickerModal from './ColorPickerModal.vue'
import Icon from './Icon.vue'

const props = defineProps<{ modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [string | null] }>()

// Any value outside the presets came from the custom picker.
const isCustom = computed(
  () =>
    props.modelValue != null &&
    !ICON_COLORS.some((c) => c.value.toLowerCase() === props.modelValue?.toLowerCase()),
)

const customValue = computed(() => props.modelValue?.slice(0, 7).toLowerCase() ?? '#6b7280')

const rainbow =
  'conic-gradient(#ef4444, #f59e0b, #84cc16, #14b8a6, #3b82f6, #a855f7, #ec4899, #ef4444)'

const openCustom = ref(false)
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Цвет фона">
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
    <button
      type="button"
      aria-label="Свой цвет"
      title="Свой цвет"
      :aria-pressed="isCustom"
      class="flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors"
      :class="isCustom ? 'border-accent' : 'border-app-border'"
      @click="openCustom = true"
    >
      <span
        class="h-6 w-6 rounded-full"
        :style="isCustom ? { backgroundColor: customValue } : { backgroundImage: rainbow }"
      />
    </button>

    <ColorPickerModal
      v-model:open="openCustom"
      :model-value="props.modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>
