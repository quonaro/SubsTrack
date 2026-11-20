<script setup lang="ts">
import { update } from '../update'
import Icon from './Icon.vue'

const items = [
  { to: '/', icon: 'home', label: 'Главная' },
  { to: '/subscriptions', icon: 'list', label: 'Платежи' },
  { to: '/calendar', icon: 'calendar', label: 'Календарь' },
  { to: '/stats', icon: 'chart', label: 'Статистика' },
  { to: '/settings', icon: 'cog', label: 'Параметры' },
]

// A newer release only shows up inside Settings, so the rail carries a dot
// on the Settings entry (same as Vihko) to make it discoverable.
const updateAvailable = () => update.status === 'available'

const labelFor = (to: string, label: string): string =>
  to === '/settings' && updateAvailable() ? `${label} — доступно обновление` : label
</script>

<template>
  <!-- mobile: bottom bar · md+: left icon rail · lg+: rail with labels -->
  <nav
    class="border-t border-app-border bg-app-bg2/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:order-first md:w-16 md:border-r md:border-t-0 lg:w-56"
  >
    <div
      class="flex items-stretch justify-between px-2 md:h-full md:flex-col md:justify-start md:gap-1 md:overflow-y-auto md:px-2 md:py-4 lg:px-3"
    >
      <div class="mb-6 hidden items-center px-2 lg:flex">
        <span class="text-lg font-bold">SubsTrack</span>
      </div>
      <router-link
        v-for="(item, i) in items"
        :key="item.to"
        :to="item.to"
        :aria-label="labelFor(item.to, item.label)"
        class="group flex flex-1 flex-col items-center py-4 text-app-text-muted transition-colors md:flex-none md:rounded-xl md:py-3 lg:flex-row lg:gap-3 lg:px-3"
        :class="{ 'md:mt-auto': i === items.length - 1 }"
        active-class="!text-accent-hi md:bg-app-card"
      >
        <span class="relative flex shrink-0 items-center justify-center">
          <Icon :name="item.icon" :size="22" />
          <span
            v-if="item.to === '/settings' && updateAvailable()"
            data-testid="update-dot"
            class="absolute -right-1.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-app-bg2"
            aria-hidden="true"
          />
        </span>
        <span class="hidden text-sm font-medium lg:block">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
