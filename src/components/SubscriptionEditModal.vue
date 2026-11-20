<script setup lang="ts">
import { ref } from 'vue'
import Modal from './Modal.vue'
import SubscriptionForm from './SubscriptionForm.vue'

// Edit counterpart of the create modal on the subscriptions list: `subId`
// null → closed, set → open for that subscription.
defineProps<{ subId: number | null }>()
const emit = defineEmits<{ close: [] }>()

const form = ref<{ flush: () => Promise<boolean> } | null>(null)
const closing = ref(false)

// Closing (backdrop, swipe down, Esc) must not drop a debounced edit, so the
// pending draft is flushed first. An invalid draft keeps the sheet open with
// the validation error instead of discarding the changes.
async function close(): Promise<void> {
  if (closing.value) return
  closing.value = true
  try {
    if (form.value && !(await form.value.flush())) return
    emit('close')
  } finally {
    closing.value = false
  }
}
</script>

<template>
  <Modal :open="subId != null" title="Редактировать" @update:open="!$event && close()">
    <SubscriptionForm v-if="subId != null" ref="form" :sub-id="subId" @saved="close" />
  </Modal>
</template>
