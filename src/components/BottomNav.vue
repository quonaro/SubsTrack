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
        :aria-label="item.label"
        class="group flex flex-1 flex-col items-center py-2.5 text-app-text-muted transition-colors"
        active-class="!text-violet-400"
      >
        <Icon :name="item.icon" :size="22" />
      </router-link>
    </div>
  </nav>
</template>
