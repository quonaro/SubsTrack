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
  <nav class="border-t border-app-border bg-app-bg2/90 pb-safe backdrop-blur-xl">
    <div class="flex items-stretch justify-between px-2 pt-1">
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="group flex flex-1 flex-col items-center gap-0.5 py-2 text-app-text-muted transition-colors"
        active-class="!text-violet-400"
      >
        <Icon :name="item.icon" :size="22" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
