import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initTelegramWebApp } from './services/telegram'
import './style.css'

// Initialize Telegram WebApp immediately to ensure fullscreen
initTelegramWebApp()

const app = createApp(App)
app.use(router)
app.mount('#app')








