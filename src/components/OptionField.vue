<script setup lang="ts" generic="T">
import { ref } from 'vue'
import Icon from './Icon.vue'
import Sheet from './Sheet.vue'

export interface Option<T> {
  value: T
  label: string
  hint?: string
  icon?: string
}

const props = defineProps<{
  modelValue: T
  options: Option<T>[]
  label?: string
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [T] }>()

const open = ref(false)

function pick(o: Option<T>) {
  emit('update:modelValue', o.value)
  open.value = false
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-xs font-medium text-app-text-muted">{{ label }}</label>
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-3 text-left"
      @click="open = true"
    >
      <span :class="{ 'text-app-text-muted': modelValue == null }">
        {{ options.find((o) => o.value === modelValue)?.label ?? placeholder ?? 'Выбрать' }}
      </span>
      <Icon name="chevron-down" :size="16" class="text-app-text-muted" />
    </button>
    <Sheet :open="open" :title="label" @update:open="open = $event">
      <div class="flex flex-col">
        <button
          v-for="o in options"
          :key="String(o.value)"
          type="button"
          class="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-app-card"
          :class="{ 'bg-app-card': o.value === modelValue }"
          @click="pick(o)"
        >
          <span v-if="o.icon" class="text-xl">{{ o.icon }}</span>
          <span class="flex-1">
            <span class="block">{{ o.label }}</span>
            <span v-if="o.hint" class="block text-xs text-app-text-muted">{{ o.hint }}</span>
          </span>
          <Icon v-if="o.value === modelValue" name="check" :size="18" class="text-violet-400" />
        </button>
      </div>
    </Sheet>
  </div>
</template>
