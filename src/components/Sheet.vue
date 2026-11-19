<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'

defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <DialogContent
        class="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-app-border bg-app-bg2 p-5 pb-safe max-sm:data-[state=open]:animate-sheet-in max-sm:data-[state=closed]:animate-sheet-out sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-h-[85vh] sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-5 sm:data-[state=open]:animate-dialog-in sm:data-[state=closed]:animate-dialog-out"
      >
        <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-app-border sm:hidden" />
        <DialogTitle v-if="title" class="mb-4 text-lg font-semibold">{{ title }}</DialogTitle>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
