<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'

defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in" />
      <DialogContent
        class="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-app-border bg-app-bg2 p-5 pb-safe outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom"
      >
        <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-app-border" />
        <DialogTitle v-if="title" class="mb-4 text-lg font-semibold">{{ title }}</DialogTitle>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
