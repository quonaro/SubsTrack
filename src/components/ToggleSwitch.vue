<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

defineProps<{ checked: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:checked': [boolean] }>()
</script>

<template>
  <SwitchRoot
    :model-value="checked"
    :disabled="disabled"
    class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-app-border bg-app-card transition-colors data-[state=checked]:border-violet-500 data-[state=checked]:bg-violet-600 disabled:opacity-50"
    @update:model-value="emit('update:checked', $event)"
  >
    <SwitchThumb
      class="block h-5 w-5 translate-x-1 rounded-full bg-app-text-muted transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-white"
    />
  </SwitchRoot>
</template>
