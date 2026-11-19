<script setup lang="ts">
import Sheet from './Sheet.vue'
import SubscriptionForm from './SubscriptionForm.vue'

// Edit counterpart of the create sheet on the subscriptions list: `subId`
// null → closed, set → open for that subscription.
defineProps<{ subId: number | null }>()
const emit = defineEmits<{ close: []; deleted: [] }>()
</script>

<template>
  <Sheet :open="subId != null" title="Редактировать" @update:open="!$event && emit('close')">
    <SubscriptionForm
      v-if="subId != null"
      :sub-id="subId"
      @saved="emit('close')"
      @deleted="emit('deleted')"
    />
  </Sheet>
</template>
