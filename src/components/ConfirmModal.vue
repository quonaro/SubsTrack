<script setup lang="ts">
import Modal from './Modal.vue'

// Single place for destructive-action confirmation: every delete/reset goes
// through this sheet instead of firing straight from the tap.
withDefaults(
  defineProps<{
    open: boolean
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
  }>(),
  { confirmLabel: 'Удалить', cancelLabel: 'Отмена' },
)
const emit = defineEmits<{ 'update:open': [boolean]; confirm: [] }>()

function cancel(): void {
  emit('update:open', false)
}
</script>

<template>
  <Modal :open="open" :title="title" @update:open="emit('update:open', $event)">
    <p v-if="message" class="mb-5 text-sm text-app-text-muted">{{ message }}</p>
    <slot />
    <div class="flex gap-3">
      <button
        type="button"
        class="flex h-9 flex-1 items-center justify-center rounded-xl border border-app-border bg-app-bg text-sm font-medium text-app-text"
        @click="cancel"
      >
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        class="flex h-9 flex-1 items-center justify-center rounded-xl bg-red-600 text-sm font-medium text-white"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </Modal>
</template>
