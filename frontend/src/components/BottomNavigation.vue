<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-app-border bg-app-bg/80 px-6 pb-6 pt-3 backdrop-blur-xl">
    <div class="flex items-center justify-between px-2">
      <router-link 
        to="/" 
        class="group flex flex-col items-center gap-1 text-app-text-muted transition-colors hover:text-primary-400" 
        active-class="!text-primary-500"
      >
        <div class="rounded-full p-1 transition-all group-active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-6 w-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">Подписки</span>
      </router-link>

      <router-link 
        to="/statistics" 
        class="group flex flex-col items-center gap-1 text-app-text-muted transition-colors hover:text-primary-400" 
        active-class="!text-primary-500"
      >
        <div class="rounded-full p-1 transition-all group-active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-6 w-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">Статистика</span>
      </router-link>

      <router-link 
        to="/calendar" 
        class="group flex flex-col items-center gap-1 text-app-text-muted transition-colors hover:text-primary-400" 
        active-class="!text-primary-500"
      >
        <div class="rounded-full p-1 transition-all group-active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-6 w-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">Календарь</span>
      </router-link>

      <router-link 
        to="/settings" 
        class="group flex flex-col items-center gap-1 text-app-text-muted transition-colors hover:text-primary-400" 
        active-class="!text-primary-500"
      >
        <div class="rounded-full p-1 transition-all group-active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-6 w-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 0a18.058 18.058 0 00-1.44-4.28c-.267-.577.442-.779.992-.462l.657.38c.524.301.71.96.463 1.511a18.758 18.758 0 00-.985 2.784m2.41 2.41a22.59 22.59 0 01-6.144-.002" />
          </svg>
        </div>
        <span class="text-[10px] font-medium">Настройки</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
// Component for bottom navigation
</script>

