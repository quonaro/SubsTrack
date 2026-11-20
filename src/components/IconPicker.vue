<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { iconTileBackground } from '../domain/colors'
import { searchIcons } from '../domain/icons'
import AppIcon from './AppIcon.vue'
import Icon from './Icon.vue'
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

// Reopening starts from the full pack instead of the last search.
watch(open, (isOpen) => {
  if (isOpen) query.value = ''
})

const groups = computed(() => searchIcons(query.value))
const found = computed(() => groups.value.reduce((n, g) => n + g.icons.length, 0))

function pick(name: string): void {
  emit('update:modelValue', name)
  open.value = false
}
</script>

<template>
  <div>
    <button
      type="button"
      aria-label="Выбрать иконку"
      class="flex shrink-0 items-center justify-center rounded-xl border border-app-border text-app-text"
      :style="{
        width: `${props.size}px`,
        height: `${props.size}px`,
        backgroundColor: iconTileBackground(props.color, props.categoryColor),
      }"
      @click="open = true"
    >
      <AppIcon :name="props.modelValue || 'package'" :size="Math.round(props.size * 0.55)" />
    </button>

    <Modal :open="open" title="Иконка" @update:open="open = $event">
      <label class="sticky top-0 z-10 -mx-5 mb-3 block bg-app-bg2 px-5 pb-2">
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
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors"
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
  </div>
</template>
