<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { store } from './store'
import BottomNav from './components/BottomNav.vue'
import PageSkeleton from './components/PageSkeleton.vue'

const route = useRoute()
const switching = ref(false)

// Routes have no async data of their own — everything is already in the
// store. The flag flips for a single tick purely so PageSkeleton runs its
// min-visible window on every navigation.
watch(
  () => route.fullPath,
  async () => {
    switching.value = true
    await nextTick()
    switching.value = false
  },
)
</script>

<template>
  <div class="flex h-full flex-col bg-app-bg text-app-text">
    <main class="relative flex min-h-0 flex-1 flex-col overflow-y-auto pt-safe">
      <router-view v-if="store.ready" />
      <PageSkeleton :active="!store.ready || switching" />
    </main>
    <BottomNav v-if="store.ready" />
  </div>
</template>
