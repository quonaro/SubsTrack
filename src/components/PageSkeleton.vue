<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ active: boolean; header?: boolean }>(), {
  header: true,
})

const MIN_VISIBLE_MS = 500
const SHUFFLE_MS = 2200
const TILE_COUNT = 8
const COLS = 2
const ROWS = 6

const visible = ref(props.active)
let shownAt = props.active ? Date.now() : 0
let hideTimer: ReturnType<typeof setTimeout> | undefined
let shuffleTimer: ReturnType<typeof setInterval> | undefined

interface Rect {
  r: number
  c: number
  h: number
  w: number
}

interface Tile {
  id: number
  style: Record<string, string>
}

// Guillotine cut: every split divides a rect in two, so the resulting
// tiles always cover the whole grid with no gaps or overlaps.
function generateRects(): Rect[] {
  const rects: Rect[] = [{ r: 0, c: 0, h: ROWS, w: COLS }]
  while (rects.length < TILE_COUNT) {
    const splittable = rects.filter((r) => r.h > 1 || r.w > 1)
    if (!splittable.length) break
    const totalArea = splittable.reduce((sum, r) => sum + r.h * r.w, 0)
    let roll = Math.random() * totalArea
    let rect = splittable[splittable.length - 1]!
    for (const candidate of splittable) {
      roll -= candidate.h * candidate.w
      if (roll <= 0) {
        rect = candidate
        break
      }
    }
    const horizontal = rect.h > 1 && (rect.w === 1 || Math.random() < rect.h / (rect.h + rect.w))
    const cut = 1 + Math.floor(Math.random() * ((horizontal ? rect.h : rect.w) - 1))
    rects.splice(
      rects.indexOf(rect),
      1,
      horizontal
        ? { r: rect.r, c: rect.c, h: cut, w: rect.w }
        : { r: rect.r, c: rect.c, h: rect.h, w: cut },
      horizontal
        ? { r: rect.r + cut, c: rect.c, h: rect.h - cut, w: rect.w }
        : { r: rect.r, c: rect.c + cut, h: rect.h, w: rect.w - cut },
    )
  }
  return rects
}

// The grid is only a layout aid: tiles are positioned in percent and by
// construction cover 100% of the area at any container size.
function toTiles(rects: Rect[]): Tile[] {
  return rects.map((rect, i) => ({
    id: i,
    style: {
      left: `${(rect.c / COLS) * 100}%`,
      top: `${(rect.r / ROWS) * 100}%`,
      width: `${(rect.w / COLS) * 100}%`,
      height: `${(rect.h / ROWS) * 100}%`,
    },
  }))
}

const tiles = ref<Tile[]>(toTiles(generateRects()))

function startShuffle() {
  clearInterval(shuffleTimer)
  shuffleTimer = setInterval(() => {
    tiles.value = toTiles(generateRects())
  }, SHUFFLE_MS)
}

function stopShuffle() {
  clearInterval(shuffleTimer)
}

watch(visible, (v) => {
  if (v) startShuffle()
  else stopShuffle()
})

onMounted(() => {
  if (visible.value) startShuffle()
})

watch(
  () => props.active,
  (v) => {
    clearTimeout(hideTimer)
    if (v) {
      // shownAt is not reset on repeated activations: the minimum display
      // time counts from the first appearance, otherwise a series of quick
      // reloads keeps the skeleton up long after the content is ready.
      if (!visible.value) shownAt = Date.now()
      visible.value = true
      return
    }
    if (!visible.value) return
    const remaining = MIN_VISIBLE_MS - (Date.now() - shownAt)
    if (remaining <= 0) {
      visible.value = false
    } else {
      hideTimer = setTimeout(() => {
        visible.value = false
      }, remaining)
    }
  },
)

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  stopShuffle()
})
</script>

<template>
  <Transition name="page-skeleton">
    <div v-if="visible" class="absolute inset-0 z-20 bg-app-bg pt-safe" aria-hidden="true">
      <div class="mx-auto flex h-full w-full max-w-xl flex-col px-4 pb-6 pt-6">
        <div v-if="header" class="mb-6 flex shrink-0 items-center justify-between">
          <div class="flex flex-col gap-2">
            <div class="h-7 w-40 animate-pulse rounded-lg bg-app-text/10" />
            <div class="h-4 w-28 animate-pulse rounded bg-app-text/5" />
          </div>
          <div
            class="h-8 w-8 animate-pulse rounded-full border border-app-border bg-app-card"
          />
        </div>

        <!-- -m-1.5 cancels the tiles' p-1.5 so edge tiles sit flush with
             the content column while the gutter between tiles stays 12px,
             matching the gap-3 used by real cards. -->
        <div class="relative -m-1.5 min-h-0 flex-1">
          <div
            v-for="tile in tiles"
            :key="tile.id"
            data-tile
            class="absolute p-1.5 transition-all duration-700 ease-in-out"
            :style="tile.style"
          >
            <div
              class="h-full w-full animate-pulse rounded-2xl border border-app-border bg-app-card"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Instant enter (no fade-in): a translucent overlay would briefly show the
   content already rendered underneath. Leave fades out to reveal it. */
.page-skeleton-leave-active {
  transition: opacity 0.15s ease;
}
.page-skeleton-leave-to {
  opacity: 0;
}
</style>
