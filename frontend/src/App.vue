<template>
  <div class="min-h-screen bg-app-bg text-app-text selection:bg-primary-500/30">
    <div v-if="isAuthenticating" class="flex min-h-screen items-center justify-center">
      <div class="animate-pulse flex flex-col items-center gap-4">
        <div class="h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
        <p class="text-primary-400 font-medium">Авторизация...</p>
      </div>
    </div>
    <router-view v-else v-slot="{ Component }">
      <transition 
        enter-active-class="transition ease-out duration-300" 
        enter-from-class="opacity-0 translate-y-4" 
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-200" 
        leave-from-class="opacity-100" 
        leave-to-class="opacity-0"
        mode="out-in"
      >
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { useTheme } from './composables/useTheme'

const { isAuthenticated, isAuthenticating, isTelegram, initAuth } = useAuth()
const { accentColor } = useTheme()

onMounted(async () => {
  await initAuth()
})
</script>

