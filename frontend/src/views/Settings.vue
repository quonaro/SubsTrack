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

        <div class="rounded-[2.5rem] bg-surface-50 p-6 border border-app-border shadow-premium space-y-4">
           <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-app-text-muted px-1">Часовой пояс</label>
            <div class="relative">
              <TimezoneSelect 
                v-model="selectedTimezone" 
                @update:modelValue="handleTimezoneChange"
              />
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
import { ref, onMounted } from 'vue'
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

onMounted(() => {
  try {
    const user = getCurrentUser()
    if (user && user.timezone) {
      selectedTimezone.value = user.timezone
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
