<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from './Modal.vue'
import SubscriptionForm from './SubscriptionForm.vue'

// Edit counterpart of the create modal on the subscriptions list: `subId`
// null → closed, set → open for that subscription.
const props = defineProps<{ subId: number | null }>()
const emit = defineEmits<{ close: [] }>()

const form = ref<{ flush: () => Promise<boolean> } | null>(null)
const closing = ref(false)

// The form is keyed by the subscription it edits, but clearing `subId` closes
// the sheet — and unmounting the form at that moment collapses the sheet to an
// empty stub, so the exit animation has nothing left to show. Keep the last id
// around: the form lives inside the dialog and is destroyed with it anyway.
const formId = ref<number | null>(null)
watch(
  () => props.subId,
  (id) => {
    if (id !== null) formId.value = id
  },
  { immediate: true },
)

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
    <SubscriptionForm v-if="formId != null" ref="form" :sub-id="formId" @saved="close" />
  </Modal>
</template>
