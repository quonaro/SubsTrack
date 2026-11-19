<script setup lang="ts">
import { store } from './store'
import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <div class="flex h-full flex-col bg-app-bg text-app-text">
    <div v-if="!store.ready" class="flex flex-1 items-center justify-center">
      <div class="text-app-text-muted">Загрузка…</div>
    </div>
    <main v-else class="flex min-h-0 flex-1 flex-col overflow-y-auto pt-safe">
      <router-view />
    </main>
    <BottomNav v-if="store.ready" />
  </div>
</template>
