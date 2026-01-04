<template>
  <div class="min-h-screen bg-app-bg text-app-text selection:bg-primary-500/30">
    <!-- Notch Shield (Black Bar for Extra Offset Mode) -->
    <div 
      v-if="!isHeaderPresent"
      class="fixed top-0 left-0 right-0 z-[60] transition-all duration-500 overflow-hidden backdrop-blur-xl border-b border-app-border"
      :class="isFullscreenExtra ? 'opacity-100' : 'opacity-0'"
      :style="{ 
        height: isFullscreenExtra ? 'var(--safe-offset, 0px)' : '0px',
        backgroundColor: 'color-mix(in srgb, var(--tg-theme-header-bg-color, var(--bg-color)), transparent 20%)'
      }"
    ></div>

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
    <BottomNavigation v-if="isAuthenticated" />
    <TimezoneModal v-if="needsTimezone || showTimezoneModal" @saved="handleTimezoneSaved" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import BottomNavigation from './components/BottomNavigation.vue'
import AppHeader from './components/AppHeader.vue'
import TimezoneModal from './components/TimezoneModal.vue'
import { useAuth } from './composables/useAuth'
import { useTheme } from './composables/useTheme'
import { useLayout } from './composables/useLayout'
import { getCurrentUser } from './services/auth'

const { isAuthenticated, isAuthenticating, isTelegram, initAuth } = useAuth()
const { accentColor } = useTheme()
const { isHeaderPresent } = useLayout()

const showTimezoneModal = ref(false)
const currentUser = ref(null)

const needsTimezone = computed(() => {
  return isAuthenticated.value && currentUser.value && !currentUser.value.timezone
})

function checkTimezone() {
  const user = getCurrentUser()
  currentUser.value = user
  if (user && !user.timezone) {
    showTimezoneModal.value = true
  } else {
    showTimezoneModal.value = false
  }
}

function handleTimezoneSaved(tz) {
  showTimezoneModal.value = false
  if (currentUser.value) {
    currentUser.value.timezone = tz
  }
}

const isFullscreenExtra = ref(true)

onMounted(async () => {
  // Initialize fullscreen mode for CSS
  const mode = localStorage.getItem('fullscreen_mode') || 'extra'
  const extraHeight = localStorage.getItem('fullscreen_extra_height') || '54'
  
  document.body.setAttribute('data-fullscreen-mode', mode)
  document.body.style.setProperty('--header-extra-offset', extraHeight + 'px')
  
  isFullscreenExtra.value = mode === 'extra'

  // Watch for changes to the attribute (e.g. from Settings.vue)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        if (mutation.attributeName === 'data-fullscreen-mode') {
          const newMode = document.body.getAttribute('data-fullscreen-mode')
          isFullscreenExtra.value = newMode === 'extra'
        }
      }
    })
  })
  
  observer.observe(document.body, { attributes: true })

  await initAuth()
  checkTimezone()
})
</script>

