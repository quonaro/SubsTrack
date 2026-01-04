<template>
  <header class="sticky top-0 z-40 border-b border-app-border bg-app-bg/80 px-4 py-3 backdrop-blur-xl">
    <div class="flex items-center justify-between">
      <!-- Left: Logo and Name -->
      <div class="flex items-center gap-2.5">
        <div class="relative group">
          <div class="absolute inset-0 bg-primary-500/20 blur-lg rounded-full group-hover:bg-primary-500/30 transition-all duration-500"></div>
          <img src="/logo.png" alt="Logo" class="relative h-8 w-8 object-contain rounded-xl shadow-sm transition-transform group-hover:scale-110 duration-500" />
        </div>
        <h1 class="text-lg font-black tracking-tight bg-gradient-to-r from-app-text to-app-text-muted bg-clip-text text-transparent">SubsTrack</h1>
      </div>

      <!-- Center: Slot for navigation/controls -->
      <div class="flex-1 flex justify-center px-4">
        <slot name="center"></slot>
      </div>

      <!-- Right: User Info -->
      <div class="flex items-center gap-3">
        <div v-if="user" class="flex flex-col items-end">
          <div class="flex items-center gap-1">
            <span class="text-[10px] font-bold uppercase tracking-widest text-app-text">{{ user.first_name || user.username }}</span>
            <svg v-if="user.is_premium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 text-amber-400">
              <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clip-rule="evenodd" />
            </svg>
          </div>
          <span v-if="user.is_premium" class="text-[8px] font-black uppercase tracking-[0.2em] text-amber-400">
            Premium
          </span>
        </div>
        <div class="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400 shadow-inner overflow-hidden">
          <img v-if="user?.photo_url" :src="user.photo_url" alt="Avatar" class="h-full w-full object-cover" />
          <span v-else>{{ userInitial }}</span>
        </div>
      </div>
    </div>
    
    <!-- Extension for custom elements (like tabs or large titles) -->
    <div v-if="$slots.extension" class="mt-4 animate-fade-in-down">
      <slot name="extension"></slot>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { getCurrentUser } from '../services/auth'

const user = getCurrentUser()

const userInitial = computed(() => {
  if (!user) return '?'
  return (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()
})
</script>

<style scoped>
.animate-fade-in-down {
  animation: fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
