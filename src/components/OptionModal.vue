<script setup lang="ts" generic="T">
import Icon from './Icon.vue'
import Modal from './Modal.vue'

export interface Option<T> {
  value: T
  label: string
  hint?: string
  icon?: string
}

defineProps<{
  open: boolean
  modelValue: T
  options: Option<T>[]
  title?: string
}>()
const emit = defineEmits<{ 'update:open': [boolean]; 'update:modelValue': [T] }>()

function pick(o: Option<T>) {
  emit('update:modelValue', o.value)
  emit('update:open', false)
}
</script>

<template>
  <Modal :open="open" :title="title" @update:open="emit('update:open', $event)">
    <div class="flex flex-col">
      <button
        v-for="o in options"
        :key="String(o.value)"
        type="button"
        class="flex min-h-9 items-center gap-3 rounded-xl px-3 py-1 text-left transition-colors hover:bg-app-card"
        :class="{ 'bg-app-card': o.value === modelValue }"
        @click="pick(o)"
      >
        <span v-if="o.icon" class="text-xl">{{ o.icon }}</span>
        <span class="flex-1">
          <span class="block">{{ o.label }}</span>
          <span v-if="o.hint" class="block text-xs text-app-text-muted">{{ o.hint }}</span>
        </span>
        <Icon v-if="o.value === modelValue" name="check" :size="18" class="text-accent-hi" />
      </button>
    </div>
  </Modal>
</template>
