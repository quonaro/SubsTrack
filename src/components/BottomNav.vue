<script setup lang="ts">
import Icon from './Icon.vue'

const items = [
  { to: '/', icon: 'home', label: 'Главная' },
  { to: '/subscriptions', icon: 'list', label: 'Подписки' },
  { to: '/calendar', icon: 'calendar', label: 'Календарь' },
  { to: '/stats', icon: 'chart', label: 'Статистика' },
  { to: '/settings', icon: 'cog', label: 'Ещё' },
]
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
        :aria-label="item.label"
        class="group flex flex-1 flex-col items-center py-4 text-app-text-muted transition-colors md:flex-none md:rounded-xl md:py-3 lg:flex-row lg:gap-3 lg:px-3"
        :class="{ 'md:mt-auto': i === items.length - 1 }"
        active-class="!text-accent-hi md:bg-app-card"
      >
        <Icon :name="item.icon" :size="22" class="shrink-0" />
        <span class="hidden text-sm font-medium lg:block">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
