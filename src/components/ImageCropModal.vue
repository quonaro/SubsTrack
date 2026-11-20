<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
import type { CropperResult } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { onUnmounted, ref, watch } from 'vue'
import { ICON_IMAGE_SIZE } from '../domain/imageIcon'
import Icon from './Icon.vue'
import Modal from './Modal.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    file: File | null
    title?: string
    description?: string
    aspectRatio?: number
    outputSize?: number
  }>(),
  {
    title: 'Своя иконка',
    description: 'Выберите квадрат, который станет иконкой',
    aspectRatio: 1,
    outputSize: ICON_IMAGE_SIZE,
  },
)

const emit = defineEmits<{
  'update:open': [boolean]
  confirm: [blob: Blob]
}>()

// The cropper's own types are loose, so only what the buttons call is typed.
const cropper = ref<{
  getResult?: () => CropperResult
  zoom?: (factor: number) => void
  rotate?: (angle: number) => void
  reset?: () => void
} | null>(null)

const imageUrl = ref('')

watch(
  () => props.file,
  (file) => {
    if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
    imageUrl.value =
      file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : ''
  },
  { immediate: true },
)

onUnmounted(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
})

const close = (): void => emit('update:open', false)

function confirm(): void {
  const canvas = cropper.value?.getResult?.().canvas
  if (!canvas) return
  // The crop is full-resolution; the icon only needs `outputSize` pixels.
  const out = document.createElement('canvas')
  out.width = props.outputSize
  out.height = props.outputSize
  const ctx = out.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, out.width, out.height)
  out.toBlob((blob) => {
    if (!blob) return
    emit('confirm', blob)
    close()
  }, 'image/png')
}
</script>

<template>
  <Modal :open="props.open" :title="props.title" @update:open="emit('update:open', $event)">
    <p class="-mt-2 mb-3 text-xs text-app-text-muted">{{ props.description }}</p>

    <div class="overflow-hidden rounded-xl border border-app-border bg-app-card">
      <Cropper
        v-if="imageUrl"
        ref="cropper"
        :src="imageUrl"
        :stencil-props="{ aspectRatio: props.aspectRatio }"
        class="h-[min(52vh,320px)] w-full"
      />
      <div v-else class="flex h-[240px] items-center justify-center text-sm text-app-text-muted">
        Фото не выбрано
      </div>
    </div>

    <div class="mt-3 flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Уменьшить"
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-app-border bg-app-bg text-app-text hover:bg-app-card"
        @click="cropper?.zoom?.(0.8)"
      >
        <Icon name="minus" :size="16" />
      </button>
      <button
        type="button"
        aria-label="Увеличить"
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-app-border bg-app-bg text-app-text hover:bg-app-card"
        @click="cropper?.zoom?.(1.25)"
      >
        <Icon name="plus" :size="16" />
      </button>
      <button
        type="button"
        aria-label="Повернуть"
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-app-border bg-app-bg text-app-text hover:bg-app-card"
        @click="cropper?.rotate?.(90)"
      >
        <Icon name="arrow-path" :size="16" />
      </button>
      <button
        type="button"
        aria-label="Сбросить"
        class="flex h-9 items-center justify-center rounded-xl border border-app-border bg-app-bg px-3 text-xs text-app-text-muted hover:bg-app-card"
        @click="cropper?.reset?.()"
      >
        Сброс
      </button>
    </div>

    <div class="mt-4 flex gap-2">
      <button
        type="button"
        class="h-9 flex-1 rounded-xl border border-app-border bg-app-bg text-sm text-app-text hover:bg-app-card"
        @click="close"
      >
        Отмена
      </button>
      <button
        type="button"
        class="h-9 flex-1 rounded-xl bg-accent text-sm font-medium text-accent-fg disabled:opacity-60"
        :disabled="!imageUrl"
        @click="confirm"
      >
        Сохранить
      </button>
    </div>
  </Modal>
</template>
