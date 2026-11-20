<script setup lang="ts">
import { computed } from 'vue'
import { ICON_PATHS } from '../icons/paths'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })

// Icons picked before the line-icon pack shipped are emoji — render them as
// text so existing subscriptions keep working.
const legacyEmoji = computed(
  () => !!props.name && !ICON_PATHS[props.name] && !/^[\w-]+$/.test(props.name),
)

const markup = computed(() => ICON_PATHS[props.name] ?? ICON_PATHS.package)
</script>

<template>
  <span
    v-if="legacyEmoji"
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
