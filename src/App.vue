<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { slideDirection } from './router'
import { store } from './store'
import BottomNav from './components/BottomNav.vue'
import PageSkeleton from './components/PageSkeleton.vue'

const route = useRoute()
const mainEl = ref<HTMLElement | null>(null)
const slideDir = ref<'fwd' | 'back'>('fwd')
const android = Capacitor.getPlatform() === 'android'
// Only older-fit devices (< Android 15) keep the status bar opaque and report
// a zero safe-area inset — no scrim needed there.
const edgeToEdge = ref(false)
let prevPath = route.path

onMounted(() => {
  if (!android) return
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;top:0;left:0;height:0;padding-top:env(safe-area-inset-top);visibility:hidden;pointer-events:none'
  document.body.appendChild(probe)
  edgeToEdge.value = Number.parseFloat(getComputedStyle(probe).paddingTop) > 0
  probe.remove()
})

// The direction comes from the display order in ROUTE_ORDER; the scroller is
// reset so the incoming page always starts at the top.
watch(
  () => route.path,
  () => {
    slideDir.value = slideDirection(route.path, prevPath)
    prevPath = route.path
    if (mainEl.value) mainEl.value.scrollTop = 0
  },
)
</script>

<template>
  <div class="px-safe flex h-full flex-col bg-app-bg text-app-text md:flex-row">
    <main
      ref="mainEl"
      class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pt-safe"
    >
      <router-view v-if="store.ready" v-slot="{ Component }">
        <Transition :name="slideDir === 'back' ? 'slide-back' : 'slide-fwd'">
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
      <PageSkeleton :active="!store.ready" />
    </main>
    <!-- Android runs edge-to-edge: scrolled content slides under the status
         bar, so this scrim fades it into the app background from below. -->
    <div v-if="android && edgeToEdge" class="status-scrim" aria-hidden="true" />
    <BottomNav v-if="store.ready" />
  </div>
</template>
