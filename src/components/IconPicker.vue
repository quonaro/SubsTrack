<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { iconTileBackground } from '../domain/colors'
import { blobToDataUrl, isImageIcon, makeIconImage } from '../domain/imageIcon'
import { searchIcons } from '../domain/icons'
import { logger } from '../log'
import AppIcon from './AppIcon.vue'
import Icon from './Icon.vue'
import ImageCropModal from './ImageCropModal.vue'
import Modal from './Modal.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    size?: number
    color?: string | null
    categoryColor?: string | null
  }>(),
  { size: 36, color: null, categoryColor: null },
)
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const open = ref(false)
const query = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const photo = ref<File | null>(null)
const cropOpen = ref(false)
const busy = ref(false)
const error = ref('')

const custom = computed(() => isImageIcon(props.modelValue))
const log = logger('icons')

// Reopening starts from the full pack instead of the last search.
watch(open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    error.value = ''
  }
})

const groups = computed(() => searchIcons(query.value))
const found = computed(() => groups.value.reduce((n, g) => n + g.icons.length, 0))

function pick(name: string): void {
  emit('update:modelValue', name)
  open.value = false
}

function choosePhoto(event: Event): void {
  const input = event.target as HTMLInputElement
  const picked = input.files?.[0] ?? null
  input.value = ''
  if (!picked) return
  error.value = ''
  photo.value = picked
  cropOpen.value = true
}

async function applyCrop(blob: Blob): Promise<void> {
  busy.value = true
  try {
    emit('update:modelValue', await blobToDataUrl(await makeIconImage(blob)))
    cropOpen.value = false
    open.value = false
  } catch (e) {
    log.error('не удалось обработать фото', e)
    error.value = 'Не удалось обработать фото — попробуйте другое'
  } finally {
    busy.value = false
    photo.value = null
  }
}
</script>

<template>
  <div>
    <button
      type="button"
      aria-label="Выбрать иконку"
      class="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-app-border text-app-text"
      :style="{
        width: `${props.size}px`,
        height: `${props.size}px`,
        backgroundColor: iconTileBackground(props.color, props.categoryColor),
      }"
      @click="open = true"
    >
      <AppIcon
        v-if="custom"
        :name="props.modelValue"
        :size="props.size"
        cover
      />
      <AppIcon v-else :name="props.modelValue || 'package'" :size="Math.round(props.size * 0.55)" />
    </button>

    <Modal :open="open" title="Иконка" @update:open="open = $event">
      <div class="sticky top-0 z-10 -mx-5 mb-3 bg-app-bg2 px-5 pb-2">
        <div class="mb-2 flex items-center gap-2">
          <button
            type="button"
            class="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-app-border bg-app-bg text-sm text-app-text hover:bg-app-card disabled:opacity-60"
            :disabled="busy"
            @click="fileInput?.click()"
          >
            <Icon name="image-plus" :size="16" />
            {{ busy ? 'Готовим иконку…' : 'Своя из фото' }}
          </button>
          <span
            v-if="custom"
            class="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-accent"
          >
            <AppIcon :name="props.modelValue" :size="36" cover />
          </span>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="sr-only"
            aria-label="Фото для иконки"
            @change="choosePhoto"
          />
        </div>
        <p v-if="error" class="mb-2 text-xs text-red-400">{{ error }}</p>
        <label class="block">
          <span class="sr-only">Поиск иконки</span>
          <span class="relative block">
            <Icon
              name="search"
              :size="16"
              class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-app-text-muted"
            />
            <input
              v-model="query"
              type="search"
              placeholder="Кино, кофе, спорт…"
              class="h-9 w-full rounded-xl border border-app-border bg-app-bg pr-3 pl-9 text-sm focus:border-accent"
            />
          </span>
        </label>
      </div>

      <div v-if="!found" class="py-10 text-center text-sm text-app-text-muted">
        Ничего не найдено
      </div>

      <div v-for="group in groups" :key="group.id" class="mb-4 last:mb-0">
        <div class="mb-1.5 text-xs font-medium text-app-text-muted">{{ group.label }}</div>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="icon in group.icons"
            :key="icon.name"
            type="button"
            :title="icon.keywords.slice(0, 3).join(' ')"
            :aria-label="icon.keywords[0]"
            class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-colors"
            :class="
              icon.name === props.modelValue
                ? 'border-accent bg-accent text-accent-fg'
                : 'border-app-border bg-app-bg text-app-text hover:bg-app-card'
            "
            @click="pick(icon.name)"
          >
            <AppIcon :name="icon.name" :size="18" />
          </button>
        </div>
      </div>
    </Modal>

    <ImageCropModal
      :open="cropOpen"
      :file="photo"
      @update:open="cropOpen = $event"
      @confirm="applyCrop"
    />
  </div>
</template>
