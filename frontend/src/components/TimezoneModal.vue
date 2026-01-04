<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
    <div class="w-full max-w-sm relative group">
      <!-- Glow Effect -->
      <div class="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
      
      <div class="relative w-full bg-app-bg rounded-[2.5rem] border border-app-border shadow-2xl overflow-hidden p-8 transition-colors duration-300">
        <!-- Decor -->
        <div class="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div class="relative space-y-8">
          <div class="text-center space-y-3">
            <div class="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-surface-100 to-surface-50 border border-app-border flex items-center justify-center text-4xl shadow-inner mb-6 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
              <div class="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              🌍
            </div>
            <h2 class="text-2xl font-black text-app-text tracking-tight">Ваш часовой пояс</h2>
            <p class="text-sm text-app-text-muted leading-relaxed max-w-[280px] mx-auto">
              Мы используем ваше время для своевременной отправки уведомлений.
            </p>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text-muted px-1 ml-1">Регион</label>
              
              <TimezoneSelect 
                v-model="selectedTimezone" 
              />
            </div>
            
            <button 
              class="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
              :disabled="!selectedTimezone || loading"
              @click="handleSubmit"
            >
              <span class="relative z-10 flex items-center justify-center gap-2">
                {{ loading ? 'Сохранение...' : 'Подтвердить' }}
                <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 opacity-70 group-hover/btn:translate-x-1 transition-transform">
                  <path fill-rule="evenodd" d="M10.21 14.77a.75.75 0 01.02-1.06L14.168 10 10.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" exact />
                  <path fill-rule="evenodd" d="M4.25 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
                </svg>
              </span>
              <div class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { updateUser } from '../services/auth'
import TimezoneSelect from './TimezoneSelect.vue'

const emit = defineEmits(['saved'])

const selectedTimezone = ref('')
const loading = ref(false)

onMounted(() => {
  try {
     // Default guess
    const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (guessed) {
        selectedTimezone.value = guessed
    }
  } catch (e) {
    console.error('Timezone API not supported', e)
  }
})

async function handleSubmit() {
  if (!selectedTimezone.value) return
  
  loading.value = true
  try {
    await updateUser({ timezone: selectedTimezone.value })
    emit('saved', selectedTimezone.value)
  } catch (e) {
    console.error('Failed to save timezone', e)
    alert('Не удалось сохранить часовой пояс.')
  } finally {
    loading.value = false
  }
}
</script>
