<script setup lang="ts">
import { computed } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { useMediaQuery } from '../composables/useMediaQuery'
import { useModalStack } from '../composables/useModalStack'
import { useSwipeGesture } from '../composables/useSwipeGesture'

const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

// Bottom-sheet layout only applies below Tailwind's `sm` breakpoint; the
// swipe gesture is mobile-only for the same reason.
const isMobile = useMediaQuery('(max-width: 639.98px)')

const active = computed(() => props.open && isMobile.value)

// Swipe down on the header → close.
const closeGesture = useSwipeGesture({
  direction: 'down',
  follow: true,
  active,
  commitDelay: 200,
  onCommit: () => emit('update:open', false),
})

const { target: sheetRef, style: swipeStyle } = closeGesture

const contentClass = computed(() =>
  isMobile.value
    ? 'flex flex-col justify-end data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out'
    : 'flex items-center justify-center p-4 data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
)

// Stacking: a modal opened on top of another one takes the screen, so the one
// underneath slides down out of the way (its backdrop stays, so the dimming
// does not multiply). Only the bottom-most modal paints the dim backdrop.
const { isRoot, isTop } = useModalStack(() => props.open)

const pushedDown = computed(() => props.open && !isTop.value)

const overlayClass = computed(() =>
  isRoot.value
    ? 'bg-black/60 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out'
    : 'bg-transparent',
)
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-40"
        :class="overlayClass"
      />
      <DialogContent
        ref="sheetRef"
        :style="swipeStyle"
        :aria-describedby="undefined"
        class="fixed inset-0 z-50 outline-none"
        :class="contentClass"
        @click.self="isMobile && emit('update:open', false)"
      >
        <!-- Mobile: bottom sheet -->
        <div
          v-if="isMobile"
          :inert="pushedDown || undefined"
          class="flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-app-border bg-app-bg2 transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          :class="
            pushedDown
              ? 'pointer-events-none translate-y-full opacity-0'
              : 'pointer-events-auto translate-y-0 opacity-100'
          "
        >
          <div
            class="shrink-0 touch-none px-5 py-2 select-none"
            v-on="closeGesture.handlers"
          >
            <div class="flex h-5 items-center justify-center">
              <div class="h-1 w-10 rounded-full bg-app-border" />
            </div>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-safe sm:pb-5">
            <DialogTitle v-if="title" class="mb-4 text-lg font-semibold">{{ title }}</DialogTitle>
            <slot />
          </div>
        </div>

        <!-- Desktop: centered dialog box -->
        <div
          v-else
          :inert="pushedDown || undefined"
          class="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-app-border bg-app-bg2 p-5 transition-[translate,scale,opacity] duration-200 ease-out"
          :class="
            pushedDown
              ? 'pointer-events-none translate-y-6 scale-95 opacity-0'
              : 'translate-y-0 scale-100 opacity-100'
          "
        >
          <DialogTitle v-if="title" class="mb-4 text-lg font-semibold">{{ title }}</DialogTitle>
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
