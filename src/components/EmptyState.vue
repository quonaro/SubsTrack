<script setup lang="ts">
import Icon from './Icon.vue'

defineProps<{ icon: string }>()
</script>

<template>
  <div
    class="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-app-border bg-app-card p-8 text-center text-sm text-app-text-muted"
  >
    <Icon :name="icon" :size="32" class="opacity-50" />
    <div><slot /></div>
  </div>
</template>
