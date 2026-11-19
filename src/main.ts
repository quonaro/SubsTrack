import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { migrate } from './db/schema'
import { seedCategoriesIfEmpty } from './domain/categories'
import { initStore, store } from './store'
import { checkForUpdate, requestStartupPermissions } from './update'
import { applyThemeToDom, effectiveTheme } from './theme'
import { logger } from './log'
import './style.css'

const log = logger('boot')

async function boot(): Promise<void> {
  const app = createApp(App)
  try {
    await migrate()
    await seedCategoriesIfEmpty()
    await initStore()
  } catch (e) {
    log.error('boot failed', e)
    // Mount anyway — a broken DB shouldn't leave the user on a white screen.
  }
  applyThemeToDom(effectiveTheme(store.settings), store.settings.accent, store.settings.preset)
  if (typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (store.settings.themeMode === 'system') {
        applyThemeToDom(
          effectiveTheme(store.settings),
          store.settings.accent,
          store.settings.preset,
        )
      }
    })
  }
  app.use(router)
  app.mount('#app')
  // Non-blocking follow-ups.
  void requestStartupPermissions()
  void checkForUpdate()
}

void boot()
