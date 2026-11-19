<script setup lang="ts" generic="T">
import { ref } from 'vue'
import Icon from './Icon.vue'
import OptionModal from './OptionModal.vue'
import type { Option } from './OptionModal.vue'

defineProps<{
  modelValue: T
  options: Option<T>[]
  label?: string
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [T] }>()

const open = ref(false)
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-xs font-medium text-app-text-muted">{{ label }}</label>
    <button
      type="button"
      class="flex h-9 w-full items-center justify-between rounded-xl border border-app-border bg-app-card px-4 text-left"
      @click="open = true"
    >
      <span :class="{ 'text-app-text-muted': modelValue == null }">
        {{ options.find((o) => o.value === modelValue)?.label ?? placeholder ?? 'Выбрать' }}
      </span>
      <Icon name="chevron-down" :size="16" class="text-app-text-muted" />
    </button>
    <OptionModal
      :open="open"
      :model-value="modelValue"
      :options="options"
      :title="label"
      @update:open="open = $event"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>
