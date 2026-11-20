<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import Icon from './Icon.vue'
import { useMediaQuery } from '../composables/useMediaQuery'
import { useModalStack } from '../composables/useModalStack'
import { useSwipeGesture } from '../composables/useSwipeGesture'

const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

// Bottom-sheet layout only applies below Tailwind's `sm` breakpoint; the
// swipe gestures are mobile-only for the same reason.
const isMobile = useMediaQuery('(max-width: 639.98px)')

// Mobile sheet state. `stretched` is the layout: the sheet box is already at
// the full viewport height while it slides, so the visible top edge is placed
// by a transform instead of an animated `height`. That keeps the grow/shrink
// off the layout path (no jank per frame) and stops Chrome from flashing the
// unpainted strip along the animating edge. `expanded` is the committed
// state, which swaps the header chrome (grab handle ↔ back button).
const stretched = ref(false)
const expanded = ref(false)
// Downward offset of the stretched sheet, in px: the distance from the
// viewport top to where the bottom sheet's top edge sits when collapsed.
const shift = ref(0)
let sheetAnim: Animation | null = null
// Must match the snap-back transition in useSwipeGesture's `style`.
const SETTLE_MS = 220

// `sheetWrap` is the transform carrier (never painted itself), `sheetBody`
// the visible box.
const sheetWrap = ref<HTMLElement | null>(null)
const sheetBody = ref<HTMLElement | null>(null)

watch(
  () => props.open,
  (open) => {
    if (open) return
    sheetAnim?.cancel()
    sheetAnim = null
    stretched.value = false
    expanded.value = false
  },
)

function viewportHeight(): number {
  return sheetWrap.value?.clientHeight || window.innerHeight
}

// Height of the sheet in its bottom-sheet layout (content-driven, capped at
// 85dvh). While stretched the class says `h-full`, so the collapsed layout is
// measured inline — the whole thing happens before the next paint.
function collapsedHeight(): number {
  const el = sheetBody.value
  if (!el) return 0
  const height = el.style.height
  const maxHeight = el.style.maxHeight
  const viewport = viewportHeight()
  el.style.height = 'auto'
  el.style.maxHeight = `${viewport * 0.85}px`
  const collapsed = Math.min(el.offsetHeight, viewport)
  el.style.height = height
  el.style.maxHeight = maxHeight
  return collapsed
}

/** How far a stretched sheet has to be pushed down to look collapsed. */
function collapsedShift(): number {
  const collapsed = collapsedHeight()
  return collapsed > 0 ? Math.max(0, viewportHeight() - collapsed) : 0
}

const active = computed(() => props.open && isMobile.value)

// Swipe down on the header without an expanded sheet → close.
const closeGesture = useSwipeGesture({
  direction: 'down',
  follow: true,
  active,
  canStart: () => !expanded.value && !stretched.value,
  commitDelay: 200,
  onCommit: () => emit('update:open', false),
})

// Swipe up on the header → stretch the sheet with the finger; releasing past
// the threshold commits to fullscreen, otherwise it settles back.
const dragLimit = ref(0)
const expandGesture = useSwipeGesture({
  direction: 'up',
  follow: true,
  active,
  canStart: () => !expanded.value,
  base: shift,
  limit: () => shift.value,
  commitDelay: SETTLE_MS,
  onStart: () => {
    shift.value = collapsedShift()
    stretched.value = true
  },
  onCommit: () => {
    shift.value = 0
    expanded.value = true
    expandGesture.reset()
  },
  onCancel: () => {
    shift.value = 0
    stretched.value = false
  },
})

// Swipe down while expanded → collapse back to a bottom sheet.
const collapseGesture = useSwipeGesture({
  direction: 'down',
  follow: true,
  active,
  canStart: () => expanded.value,
  limit: () => dragLimit.value,
  commitDelay: SETTLE_MS,
  onStart: () => {
    dragLimit.value = collapsedShift()
  },
  onCommit: () => {
    expanded.value = false
    stretched.value = false
    collapseGesture.reset()
  },
})

// Only one of the two sheet gestures is live at a time, so whichever is
// driving the sheet owns its transform.
const sheetStyle = computed(() => expandGesture.style.value ?? collapseGesture.style.value)

const { target: sheetRef, style: swipeStyle } = closeGesture

// All three gestures listen on the same header; merge their handlers into
// single functions per event (each gesture self-filters by direction).
const headerHandlers = computed(() => {
  const out: Record<string, (e: Event) => void> = {}
  for (const g of [closeGesture, expandGesture, collapseGesture]) {
    for (const [key, fn] of Object.entries(g.handlers)) {
      const prev = out[key]
      const handler = fn as (e: Event) => void
      out[key] = prev
        ? (e) => {
            prev(e)
            handler(e)
          }
        : handler
    }
  }
  return out
})

const contentClass = computed(() =>
  isMobile.value
    ? 'flex flex-col justify-end data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out'
    : 'items-center justify-center p-4 data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
)

// Stacking: a modal opened on top of another one takes the screen, so the one
// underneath slides down out of the way (its backdrop stays, so the dimming
// does not multiply). An expanded sheet is already fullscreen — nothing to
// hide behind — and only the bottom-most modal paints the dim backdrop.
const { isRoot, isTop } = useModalStack(() => props.open)

const pushedDown = computed(() => props.open && !isTop.value && !(isMobile.value && expanded.value))

const overlayClass = computed(() =>
  isRoot.value
    ? 'bg-black/60 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out'
    : 'bg-transparent',
)

// Collapse from the back button: slide the stretched sheet down to the
// bottom-sheet position, then drop the stretched layout in the same frame.
function collapse() {
  const el = sheetWrap.value
  const distance = collapsedShift()
  if (!el || distance < 1 || typeof el.animate !== 'function') {
    expanded.value = false
    stretched.value = false
    return
  }
  sheetAnim?.cancel()
  const anim = el.animate(
    [{ transform: 'translateY(0px)' }, { transform: `translateY(${distance}px)` }],
    { duration: 300, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' },
  )
  sheetAnim = anim
  anim.onfinish = () => {
    anim.onfinish = null
    anim.oncancel = null
    if (sheetAnim !== anim) return
    sheetAnim = null
    expanded.value = false
    stretched.value = false
    anim.cancel()
  }
  anim.oncancel = () => {
    if (sheetAnim === anim) sheetAnim = null
  }
}
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
        <!-- Mobile: the carrier is never painted — it only moves the sheet, so
             the stretched box can slide without animating its height. -->
        <div
          v-if="isMobile"
          ref="sheetWrap"
          :style="sheetStyle"
          class="pointer-events-none flex h-full w-full flex-col justify-end"
        >
          <div
            ref="sheetBody"
            :inert="pushedDown || undefined"
            class="flex w-full flex-col overflow-hidden bg-app-bg2 transition-[transform,opacity,border-radius,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            :class="[
              pushedDown
                ? 'pointer-events-none translate-y-full opacity-0'
                : 'pointer-events-auto translate-y-0 opacity-100',
              stretched
                ? 'h-full rounded-none border-t border-transparent'
                : 'max-h-[85dvh] rounded-t-2xl border-t border-app-border',
            ]"
          >
            <div
              class="shrink-0 touch-none px-5 select-none"
              :class="
                expanded
                  ? 'pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-5'
                  : 'py-5'
              "
              v-on="headerHandlers"
            >
              <!-- Same row height in both states: swapping the chrome must not
                   resize the header, or the content jumps mid-gesture. The two
                   are cross-faded in place for the same reason. -->
              <div class="relative h-9 w-full">
                <Transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="scale-90 opacity-0"
                  leave-active-class="transition duration-150 ease-in"
                  leave-to-class="scale-90 opacity-0"
                >
                  <div v-if="!expanded" class="absolute inset-0 flex items-center justify-center">
                    <div class="h-1 w-10 rounded-full bg-app-border" />
                  </div>
                </Transition>
                <Transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="translate-y-1 opacity-0"
                  leave-active-class="transition duration-150 ease-in"
                  leave-to-class="translate-y-1 opacity-0"
                >
                  <div v-if="expanded" class="absolute inset-0 flex items-center justify-end">
                    <button
                      type="button"
                      class="flex h-9 items-center gap-1.5 rounded-full border border-app-border bg-app-card px-3 text-sm text-app-text-muted"
                      @click="collapse"
                    >
                      <Icon name="chevron-left" :size="16" />Назад
                    </button>
                  </div>
                </Transition>
              </div>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-safe sm:pb-5">
              <DialogTitle v-if="title" class="mb-4 text-lg font-semibold">{{ title }}</DialogTitle>
              <slot />
            </div>
          </div>
        </div>

        <!-- Desktop: centered dialog box -->
        <div
          v-else
          :inert="pushedDown || undefined"
          class="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-app-border bg-app-bg2 p-5 transition-[transform,opacity] duration-200 ease-out"
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
