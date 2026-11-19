<script setup lang="ts">
import { computed } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { useMediaQuery } from '../composables/useMediaQuery'
import { useSwipeGesture } from '../composables/useSwipeGesture'

const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

// Bottom-sheet layout only applies below Tailwind's `sm` breakpoint; the
// swipe-to-close gesture is mobile-only for the same reason.
const isMobile = useMediaQuery('(max-width: 639.98px)')

const {
  target: sheetRef,
  style: swipeStyle,
  handlers: swipeHandlers,
} = useSwipeGesture({
  direction: 'down',
  follow: true,
  active: computed(() => props.open && isMobile.value),
  // Match the 0.2s settle transition: the sheet slides fully off-screen
  // first, only then does Reka start its (already off-screen) exit animation.
  commitDelay: 200,
  onCommit: () => emit('update:open', false),
})
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <DialogContent
        ref="sheetRef"
        :style="swipeStyle"
        :aria-describedby="undefined"
        class="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border-t border-app-border bg-app-bg2 max-sm:data-[state=open]:animate-sheet-in max-sm:data-[state=closed]:animate-sheet-out sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-h-[85vh] sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:data-[state=open]:animate-dialog-in sm:data-[state=closed]:animate-dialog-out"
      >
        <div class="shrink-0 touch-none px-5 pt-5 select-none" v-on="swipeHandlers">
          <div class="mx-auto mb-3 flex w-16 justify-center py-1 sm:hidden">
            <div class="h-1 w-10 rounded-full bg-app-border" />
          </div>
          <DialogTitle v-if="title" class="mb-4 text-lg font-semibold">{{ title }}</DialogTitle>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-safe sm:pb-5">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
