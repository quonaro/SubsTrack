<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type Hsv, hexToHsv, hsvToHex, normalizeHex } from '../domain/colors'
import Modal from './Modal.vue'

const props = defineProps<{ open: boolean; modelValue: string | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; 'update:modelValue': [string] }>()

const hsv = ref<Hsv>(hexToHsv(props.modelValue))
const hex = computed(() => hsvToHex(hsv.value))

// Reopening starts from the color currently on the tile, not the last drag.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      hsv.value = hexToHsv(props.modelValue)
      text.value = hex.value
    }
  },
)

watch(hex, (value) => {
  text.value = value
  emit('update:modelValue', value)
})

const text = ref(hex.value)

// Free typing is allowed; only a complete hex is pushed back into the picker.
watch(text, (value) => {
  const normalized = normalizeHex(value)
  if (!normalized || normalized === hex.value) return
  hsv.value = hexToHsv(normalized)
})

function commit(next: Hsv): void {
  hsv.value = next
}

// The area and the hue strip are plain divs, so dragging is tracked with
// pointer capture: once the pointer is captured the same node keeps receiving
// moves even when the finger leaves the small target.
function dragArea(event: PointerEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = clamp((event.clientX - rect.left) / (rect.width || 1))
  const y = clamp((event.clientY - rect.top) / (rect.height || 1))
  commit({ ...hsv.value, s: x, v: 1 - y })
}

function dragHue(event: PointerEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = clamp((event.clientX - rect.left) / (rect.width || 1))
  commit({ ...hsv.value, h: x * 360 })
}

function clamp(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function startDrag(event: PointerEvent, move: (e: PointerEvent) => void): void {
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture?.(event.pointerId)
  move(event)
}
</script>

<template>
  <Modal :open="props.open" title="Свой цвет" @update:open="emit('update:open', $event)">
    <div class="flex flex-col gap-4">
      <div
        role="slider"
        aria-label="Насыщенность и яркость"
        :aria-valuetext="hex"
        class="relative h-40 w-full touch-none rounded-xl border border-app-border"
        :style="{
          backgroundColor: `hsl(${hsv.h} 100% 50%)`,
          backgroundImage:
            'linear-gradient(to top, #000, rgb(0 0 0 / 0)), linear-gradient(to right, #fff, rgb(255 255 255 / 0))',
        }"
        @pointerdown="startDrag($event, dragArea)"
        @pointermove="$event.buttons && dragArea($event)"
      >
        <span
          class="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          :style="{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            backgroundColor: hex,
          }"
        />
      </div>

      <div
        role="slider"
        aria-label="Оттенок"
        :aria-valuenow="Math.round(hsv.h)"
        aria-valuemin="0"
        aria-valuemax="360"
        class="relative h-4 touch-none rounded-full border border-app-border"
        style="background-image: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
        @pointerdown="startDrag($event, dragHue)"
        @pointermove="$event.buttons && dragHue($event)"
      >
        <span
          class="pointer-events-none absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          :style="{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: `hsl(${hsv.h} 100% 50%)` }"
        />
      </div>

      <div class="flex items-center gap-3">
        <span
          class="h-9 w-9 shrink-0 rounded-full border border-app-border"
          :style="{ backgroundColor: hex }"
        />
        <input
          v-model="text"
          type="text"
          inputmode="text"
          aria-label="HEX"
          spellcheck="false"
          class="h-9 w-full rounded-xl border border-app-border bg-app-bg px-4 font-mono text-sm uppercase focus:border-accent"
        />
      </div>

      <button
        type="button"
        class="h-9 w-full rounded-xl bg-accent font-medium text-accent-fg"
        @click="emit('update:open', false)"
      >
        Готово
      </button>
    </div>
  </Modal>
</template>
