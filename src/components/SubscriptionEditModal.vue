<script setup lang="ts">
import Modal from './Modal.vue'
import SubscriptionForm from './SubscriptionForm.vue'

// Edit counterpart of the create modal on the subscriptions list: `subId`
// null → closed, set → open for that subscription.
defineProps<{ subId: number | null }>()
const emit = defineEmits<{ close: []; deleted: [] }>()
</script>

<template>
  <Modal :open="subId != null" title="Редактировать" @update:open="!$event && emit('close')">
    <SubscriptionForm
      v-if="subId != null"
      :sub-id="subId"
      @saved="emit('close')"
      @deleted="emit('deleted')"
    />
  </Modal>
</template>
