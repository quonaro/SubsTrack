<script setup lang="ts">
import { computed } from 'vue'
import { isImageIcon } from '../domain/imageIcon'
import { ICON_PATHS } from '../icons/paths'

const props = withDefaults(defineProps<{ name: string; size?: number; cover?: boolean }>(), {
  size: 20,
  cover: false,
})

// Custom icons are photo data URLs; `cover` lets them fill the whole tile
// (the parent clips the corners) instead of sitting inside it like a line icon.
const custom = computed(() => isImageIcon(props.name))

// Icons picked before the line-icon pack shipped are emoji — render them as
// text so existing subscriptions keep working.
const legacyEmoji = computed(
  () => !!props.name && !ICON_PATHS[props.name] && !custom.value && !/^[\w-]+$/.test(props.name),
)

const markup = computed(() => ICON_PATHS[props.name] ?? ICON_PATHS.package)
</script>

<template>
  <img
    v-if="custom"
    :src="props.name"
    :width="props.cover ? undefined : props.size"
    :height="props.cover ? undefined : props.size"
    class="object-cover"
    :class="props.cover ? 'h-full w-full' : 'rounded-[inherit]'"
    alt=""
  />
  <span
    v-else-if="legacyEmoji"
    class="leading-none"
    :style="{ fontSize: `${Math.round(size * 0.9)}px` }"
  >
    {{ name }}
  </span>
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    :width="size"
    :height="size"
    aria-hidden="true"
    v-html="markup"
  />
</template>
