<template>
  <div class="min-h-screen bg-app-bg pb-24 text-app-text transition-colors duration-500">
    <!-- Header -->
    <AppHeader />

    <main class="space-y-10 p-6 animate-fade-in">
      <!-- Profile Settings -->
      <section class="space-y-6">
        <div class="flex items-center gap-2 px-1">
          <div class="h-4 w-1 rounded-full bg-primary-500"></div>
          <h2 class="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted">Профиль 👤</h2>
        </div>

        <div class="rounded-[2.5rem] bg-surface-50 p-8 border border-app-border shadow-premium space-y-8">
           <!-- User Profile Card -->
           <div class="flex items-center gap-5">
            <div class="group relative">
              <div class="absolute inset-0 bg-primary-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div class="relative h-20 w-20 rounded-[2rem] bg-gradient-to-br from-surface-100 to-surface-200 border border-app-border flex items-center justify-center text-2xl font-black text-primary-400 shadow-inner overflow-hidden">
                <img v-if="user?.photo_url" :src="user.photo_url" alt="Avatar" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span v-else>{{ userInitial }}</span>
              </div>
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-black tracking-tight text-app-text truncate">{{ user?.first_name || user?.username || 'Пользователь' }}</h3>
                <svg v-if="user?.is_premium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-amber-400 animate-pulse-slow">
                  <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clip-rule="evenodd" />
                </svg>
              </div>
              <p v-if="user?.username" class="text-xs font-bold text-app-text-muted mt-0.5 tracking-tight opacity-60">@{{ user.username }}</p>
              
              <div v-if="user?.is_premium" class="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20 w-fit">
                <div class="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                <span class="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">Premium Subscriber</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- Theme Selection -->
      <section class="space-y-6">
        <div class="flex items-center gap-2 px-1">
          <div class="h-4 w-1 rounded-full bg-primary-500"></div>
          <h2 class="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted">Тема оформления ✨</h2>
        </div>
        
        <div class="grid grid-cols-1 gap-8">
          <!-- Dark Themes Group -->
          <div class="space-y-4">
            <h3 class="text-[10px] font-medium text-app-text-muted/40 px-2 uppercase tracking-widest">ТЁМНЫЕ</h3>
            <div class="grid grid-cols-3 gap-4">
              <button 
                v-for="t in darkThemes" 
                :key="t.id"
                class="group relative flex flex-col gap-3 transition-transform duration-300 active:scale-95"
                @click="setTheme(t.id)"
              >
                <!-- Theme Preview Card -->
                <div 
                  class="aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] border-2 transition-all duration-300 shadow-lg"
                  :class="theme === t.id ? 'border-primary-500 ring-4 ring-primary-500/10' : 'border-app-border bg-surface-50 group-hover:border-app-text-muted/30'"
                  :style="{ backgroundColor: t.preview }"
                >
                  <!-- Abstract UI Elements in Preview -->
                  <div class="flex h-full flex-col gap-1.5 p-2">
                    <div class="h-3 w-2/3 rounded-full bg-primary-500/40"></div>
                    <div class="mt-auto h-8 w-full rounded-xl" :style="{ backgroundColor: t.surface }"></div>
                    <div class="h-8 w-full rounded-xl" :style="{ backgroundColor: t.surface }"></div>
                  </div>
                  
                  <!-- Checkmark Overlay -->
                  <div 
                    v-if="theme === t.id" 
                    class="absolute inset-0 flex items-center justify-center bg-primary-500/10 rounded-[1.4rem]"
                  >
                    <div class="rounded-full bg-primary-500 p-1.5 text-white shadow-accent animate-scale-in">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                        <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.124l-3.5-3.5a.75.75 0 011.06-1.06l2.873 2.873 7.42-9.74a.75.75 0 011.051-.15z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <span class="text-xs font-bold text-center uppercase tracking-wider transition-colors" :class="theme === t.id ? 'text-primary-500' : 'text-app-text-muted'">{{ t.name }}</span>
              </button>
            </div>
          </div>

          <!-- Light Themes Group -->
          <div class="space-y-4">
            <h3 class="text-[10px] font-medium text-app-text-muted/40 px-2 uppercase tracking-widest">СВЕТЛЫЕ</h3>
            <div class="grid grid-cols-3 gap-4">
              <button 
                v-for="t in lightThemes" 
                :key="t.id"
                class="group relative flex flex-col gap-3 transition-transform duration-300 active:scale-95"
                @click="setTheme(t.id)"
              >
                <!-- Theme Preview Card -->
                <div 
                  class="aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] border-2 transition-all duration-300 shadow-md"
                  :class="theme === t.id ? 'border-primary-500 ring-4 ring-primary-500/10' : 'border-app-border bg-surface-50 group-hover:border-app-text-muted/20'"
                  :style="{ backgroundColor: t.preview }"
                >
                   <!-- Abstract UI Elements in Preview -->
                   <div class="flex h-full flex-col gap-1.5 p-2">
                    <div class="h-3 w-2/3 rounded-full bg-primary-500/40"></div>
                    <div class="mt-auto h-8 w-full rounded-xl border border-black/5 shadow-sm" :style="{ backgroundColor: t.surface }"></div>
                    <div class="h-8 w-full rounded-xl border border-black/5 shadow-sm" :style="{ backgroundColor: t.surface }"></div>
                  </div>

                  <div 
                    v-if="theme === t.id" 
                    class="absolute inset-0 flex items-center justify-center bg-primary-500/10 rounded-[1.4rem]"
                  >
                    <div class="rounded-full bg-primary-500 p-1.5 text-white shadow-accent animate-scale-in">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                        <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.124l-3.5-3.5a.75.75 0 011.06-1.06l2.873 2.873 7.42-9.74a.75.75 0 011.051-.15z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <span class="text-xs font-bold text-center uppercase tracking-wider transition-colors" :class="theme === t.id ? 'text-primary-500' : 'text-app-text-muted'">{{ t.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Accent Color Selection -->
      <section class="space-y-6">
        <div class="flex items-center gap-2 px-1">
          <div class="h-4 w-1 rounded-full bg-primary-500"></div>
          <h2 class="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted">Цветовой акцент 🎨</h2>
        </div>
        
        <div class="rounded-[2.5rem] bg-surface-50 p-8 border border-app-border shadow-premium relative overflow-hidden group">
          <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-500/5 blur-3xl transition-all group-hover:scale-150 duration-1000"></div>
          
          <div class="relative z-10 grid grid-cols-5 gap-5">
            <button 
              v-for="color in accentColors" 
              :key="color.value"
              class="group relative flex h-12 w-full items-center justify-center rounded-2xl transition-all active:scale-75"
              :style="{ backgroundColor: color.value }"
              @click="setAccentColor(color.value)"
            >
              <div 
                class="absolute inset-0 rounded-2xl shadow-[inset_0_0_15px_rgba(255,255,255,0.15)] group-hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] transition-all"
              ></div>
              
              <transition name="scale">
                <div v-if="accentColor === color.value" class="rounded-full bg-white/20 p-1 backdrop-blur-md shadow-lg ring-2 ring-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-app-text">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.124l-3.5-3.5a.75.75 0 011.06-1.06l2.873 2.873 7.42-9.74a.75.75 0 011.051-.15z" clip-rule="evenodd" />
                  </svg>
                </div>
              </transition>
            </button>
          </div>
        </div>
      </section>

      <!-- System Section -->
      <section class="space-y-6">
        <div class="flex items-center gap-2 px-1">
          <div class="h-4 w-1 rounded-full bg-primary-500"></div>
          <h2 class="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted">Система ⚙️</h2>
        </div>
        
        <div class="space-y-3">
          <!-- Test Notification -->
          <button 
            class="flex w-full items-center justify-between rounded-3xl bg-surface-50 p-6 border border-app-border transition-all active:scale-[0.98] hover:bg-surface-100 group shadow-premium"
            @click="testNotification"
          >
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-xl shadow-inner group-hover:scale-110 duration-500">🔔</div>
              <div class="text-left">
                <p class="text-xs font-black uppercase tracking-widest">Проверить уведомления</p>
                <p class="text-[10px] font-medium text-app-text-muted mt-0.5">Отправить тестовое сообщение в Telegram</p>
              </div>
            </div>
            <div class="h-10 w-10 flex items-center justify-center rounded-full bg-white/0 text-zinc-600 transition-all group-hover:bg-primary-500/10 group-hover:text-primary-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>

          <!-- Export CSV -->
          <button 
            class="flex w-full items-center justify-between rounded-3xl bg-surface-50 p-6 border border-app-border transition-all active:scale-[0.98] hover:bg-surface-100 group shadow-premium"
            @click="exportCSV"
          >
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-xl shadow-inner group-hover:scale-110 duration-500">📊</div>
              <div class="text-left">
                <p class="text-xs font-black uppercase tracking-widest">Экспорт данных</p>
                <p class="text-[10px] font-medium text-app-text-muted mt-0.5">Получить все подписки в Telegram (CSV)</p>
              </div>
            </div>
            <div class="h-10 w-10 flex items-center justify-center rounded-full bg-white/0 text-zinc-600 transition-all group-hover:bg-primary-500/10 group-hover:text-primary-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12l4.5 4.5m0 0l4.5-4.5M12 3v13.5" />
              </svg>
            </div>
          </button>

          <!-- Timezone -->
          <div class="rounded-3xl bg-surface-50 p-6 border border-app-border shadow-premium space-y-4">
            <div class="flex items-center gap-4 px-1">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-xl shadow-inner">🌍</div>
              <div class="text-left">
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted">Регион</p>
                <p class="text-xs font-black uppercase tracking-widest mt-0.5">Часовой пояс</p>
              </div>
            </div>
            <div class="relative">
              <TimezoneSelect 
                v-model="selectedTimezone" 
                @update:modelValue="handleTimezoneChange"
              />
            </div>
          </div>

          <!-- Clear Cache -->
          <button 
            class="flex w-full items-center justify-between rounded-3xl bg-surface-50 p-6 border border-app-border transition-all active:scale-[0.98] hover:bg-surface-100 group shadow-premium"
            @click="clearCache"
          >
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-xl shadow-inner group-hover:scale-110 duration-500">🧹</div>
              <div class="text-left">
                <p class="text-xs font-black uppercase tracking-widest text-red-500">Очистить кэш</p>
                <p class="text-[10px] font-medium text-app-text-muted mt-0.5">Сбросить настройки и кэш</p>
              </div>
            </div>
            <div class="h-10 w-10 flex items-center justify-center rounded-full bg-white/0 text-zinc-600 transition-all group-hover:bg-red-500/10 group-hover:text-red-500">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.34 9m-4.72 0-.34-9m9.27-2.31a.75.75 0 0 0-.71-.51L14.5 6H9.5l-1.07.18a.75.75 0 0 0-.71.51l-.31 1.31h13.18l-.31-1.31ZM4.5 9h15l-1 12a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2L4.5 9Z" />
              </svg>
            </div>
          </button>

          <!-- Fullscreen Mode Selection (Visual Cards) -->
          <div class="space-y-4 rounded-[2.5rem] bg-surface-50 p-6 border border-app-border group shadow-premium relative overflow-hidden">
            <div class="flex items-center gap-4 px-1">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-xl shadow-inner group-hover:rotate-12 duration-500">📱</div>
              <div class="text-left">
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted">Интерфейс</p>
                <p class="text-xs font-black uppercase tracking-widest mt-0.5">Полноэкранный режим</p>
              </div>
            </div>
            
            <!-- Auto Mode Toggle -->
            <div class="rounded-3xl border border-app-border bg-surface-100/30 p-5 transition-all hover:bg-surface-100/60 mb-3">
              <div class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-sm font-black text-app-text">Авто-режим</span>
                  <span class="text-[10px] font-medium text-app-text-muted mt-1 leading-relaxed max-w-[200px]">Автоматически включать рамку в полном экране</span>
                </div>
                
                <button 
                  class="relative h-7 w-12 rounded-full transition-colors duration-300 focus:outline-none"
                  :class="isAutoBlackBar ? 'bg-primary-500' : 'bg-surface-300'"
                  @click="toggleAutoBlackBar"
                >
                  <span 
                    class="absolute left-0.5 top-0.5 h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300"
                    :class="isAutoBlackBar ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </div>
            </div>

            <div 
              class="rounded-3xl border border-app-border bg-surface-100/30 p-5 transition-all"
              :class="isAutoBlackBar ? 'opacity-50 pointer-events-none grayscale' : 'hover:bg-surface-100/60'"
            >
              <div class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-sm font-black text-app-text">Ручной режим</span>
                  <span class="text-[10px] font-medium text-app-text-muted mt-1 leading-relaxed max-w-[200px]">Принудительно включить черную рамку</span>
                </div>
                
                <button 
                  class="relative h-7 w-12 rounded-full transition-colors duration-300 focus:outline-none"
                  :class="isFullscreenExtra ? 'bg-primary-500' : 'bg-surface-300'"
                  @click="toggleFullscreenMode"
                >
                  <span 
                    class="absolute left-0.5 top-0.5 h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300"
                    :class="isFullscreenExtra ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Height Slider (Only for Black Bar mode) -->
            <transition 
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="opacity-0 -translate-y-2 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-2 scale-95"
            >
              <div v-if="isFullscreenExtra" class="mt-4 pt-4 border-t border-app-border/50 space-y-3">
                <div class="flex justify-between items-center px-1">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">Высота рамки</span>
                  <span class="text-xs font-black text-primary-500">{{ fullscreenExtraHeight }}px</span>
                </div>
                <input 
                  type="range" 
                  v-model="fullscreenExtraHeight"
                  min="0" 
                  max="120" 
                  step="2"
                  @input="updateExtraHeight"
                  class="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
              </div>
            </transition>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section class="space-y-6">
        <div class="flex items-center gap-2 px-1">
          <div class="h-4 w-1 rounded-full bg-primary-500"></div>
          <h2 class="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted">О приложении ℹ️</h2>
        </div>
        
        <div class="rounded-[2.5rem] bg-surface-50 p-8 border border-app-border shadow-premium space-y-4">
          <p class="text-sm font-medium leading-relaxed text-app-text">
            SubsTrack — это удобный инструмент для управления вашими подписками. Следите за расходами, получайте уведомления и анализируйте свои траты.
          </p>
          

          <div class="pt-4 border-t border-app-border">
            <p class="text-[10px] font-bold text-app-text-muted text-center uppercase tracking-widest opacity-60">Версия {{ version }}</p>
          </div>
        </div>
      </section>
    </main>

    <BottomNavigation />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import BottomNavigation from '../components/BottomNavigation.vue'
import AppHeader from '../components/AppHeader.vue'
import { useTheme } from '../composables/useTheme'
import api from '../services/api'
import { getCurrentUser, updateUser } from '../services/auth'
import TimezoneSelect from '../components/TimezoneSelect.vue'
import packageInfo from '../../package.json'

const version = packageInfo.version

const router = useRouter()
const { accentColor, setAccentColor, theme, setTheme } = useTheme()

const selectedTimezone = ref('')
const isFullscreenExtra = ref(true)
const isAutoBlackBar = ref(false)
const fullscreenExtraHeight = ref(54)

const user = ref(null)
const userInitial = computed(() => {
  if (!user.value) return '?'
  return (user.value.first_name?.[0] || user.value.username?.[0] || '?').toUpperCase()
})

onMounted(() => {
  // Load user data
  user.value = getCurrentUser()
  
  // Load fullscreen mode
  const mode = localStorage.getItem('fullscreen_mode') || 'extra'
  isFullscreenExtra.value = mode === 'extra'
  
  // Load auto mode
  isAutoBlackBar.value = localStorage.getItem('fullscreen_auto') === 'true'
  
  fullscreenExtraHeight.value = parseInt(localStorage.getItem('fullscreen_extra_height') || '54')

  try {
    if (user.value && user.value.timezone) {
      selectedTimezone.value = user.value.timezone
    } else {
      selectedTimezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  } catch (e) {
    console.error('Timezone API not supported', e)
  }
})

async function handleTimezoneChange() {
  if (!selectedTimezone.value) return
  try {
    await updateUser({ timezone: selectedTimezone.value })
  } catch (e) {
    console.error('Failed to update timezone', e)
    alert('Ошибка обновления часового пояса')
  }
}

async function testNotification() {
  try {
    await api.get('/subscriptions/test-notification')
    alert('Уведомление отправлено! Проверьте свой Telegram.')
  } catch (e) {
    let errorMessage = e.message
    if (e.response?.data?.detail) {
      const detail = e.response.data.detail
      errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail)
    }
    alert('Ошибка при отправке: ' + errorMessage)
  }
}

async function exportCSV() {
  try {
    await api.get('/subscriptions/export')
    alert('Файл экспорта отправлен вам в Telegram! 📊')
  } catch (e) {
    let errorMessage = e.message
    if (e.response?.data?.detail) {
      const detail = e.response.data.detail
      errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail)
    }
    alert('Ошибка при экспорте: ' + errorMessage)
  }
}

function clearCache() {
  if (confirm('Вы уверены? Это удалит настройки темы и авторизацию.')) {
     // ... (clear storage logic)
    localStorage.clear()
    sessionStorage.clear()
    
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name)
        })
      })
    }
    
    // Attempt full reload bypassing cache
    window.location.reload(true)
  }
}

function toggleFullscreenMode() {
  if (isAutoBlackBar.value) return
  
  isFullscreenExtra.value = !isFullscreenExtra.value
  const mode = isFullscreenExtra.value ? 'extra' : 'native'
  
  localStorage.setItem('fullscreen_mode', mode)
  
  updateBodyAttributes(mode)
  
  // Always try to expand
  window.Telegram?.WebApp?.expand()
}

function toggleAutoBlackBar() {
  isAutoBlackBar.value = !isAutoBlackBar.value
  localStorage.setItem('fullscreen_auto', isAutoBlackBar.value.toString())
  
  if (isAutoBlackBar.value) {
    // If turning ON, immediately apply auto logic
    const webApp = window.Telegram?.WebApp
    if (webApp) {
      const isExpanded = webApp.isExpanded
      // If expanded -> extra, else -> native
      const newMode = isExpanded ? 'extra' : 'native'
      isFullscreenExtra.value = newMode === 'extra'
      localStorage.setItem('fullscreen_mode', newMode)
      updateBodyAttributes(newMode)
    }
  } else {
    // If turning OFF, leave state as is (user can then manually toggle)
  }
  
  // Update App.vue listener via storage event or just relying on App.vue's own check?
  // Since we are in the same window, storage event doesn't fire.
  // We should dispatch a custom event for App.vue to pick up immediately.
  window.dispatchEvent(new CustomEvent('fullscreen-auto-change', { detail: { isAuto: isAutoBlackBar.value } }))
}

function updateBodyAttributes(mode) {
  document.body.setAttribute('data-fullscreen-mode', mode)
}

function updateExtraHeight() {
  localStorage.setItem('fullscreen_extra_height', fullscreenExtraHeight.value.toString())
  document.body.style.setProperty('--header-extra-offset', fullscreenExtraHeight.value + 'px')
}



const darkThemes = [
  { id: 'midnight', name: 'Midnight', preview: '#0f0f13', surface: 'rgba(255,255,255,0.05)' },
  { id: 'abyss', name: 'Abyss', preview: '#000000', surface: 'rgba(255,255,255,0.04)' },
  { id: 'deep-sea', name: 'Deep Sea', preview: '#0b1121', surface: 'rgba(59,130,246,0.1)' }
]

const lightThemes = [
  { id: 'clean', name: 'Clean', preview: '#ffffff', surface: 'rgba(0,0,0,0.04)' },
  { id: 'soft-clay', name: 'Soft Clay', preview: '#f4f4f5', surface: '#ffffff' },
  { id: 'ivory', name: 'Ivory', preview: '#fafaf9', surface: '#ffffff' }
]

const accentColors = [
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky', value: '#0ea5e9' }
]


</script>

<style scoped>
.scale-enter-active, .scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from, .scale-leave-to {
  transform: scale(0);
  opacity: 0;
}

@keyframes scale-in {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-in {
  animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
</style>
