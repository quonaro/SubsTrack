import { ref, computed } from 'vue'
import { authenticateWithTelegram, getCurrentUser, isAuthenticated as checkAuth, logout as logoutUser, type User } from '../services/auth'
import { isTelegramWebApp, initTelegramWebApp } from '../services/telegram'

const user = ref<User | null>(getCurrentUser())
const isAuthenticating = ref(false)

export function useAuth() {
  /**
   * Initialize authentication - auto-login if Telegram MiniApp
   */
  async function initAuth(): Promise<void> {
    // Initialize Telegram WebApp if available
    if (isTelegramWebApp()) {
      initTelegramWebApp()
    }

    // If already authenticated, load user from storage
    if (checkAuth() && !user.value) {
      user.value = getCurrentUser()
      return
    }

    // If running as Telegram MiniApp and not authenticated, auto-login
    if (isTelegramWebApp() && !checkAuth()) {
      await login()
    }
  }

  /**
   * Login via Telegram
   */
  async function login(): Promise<boolean> {
    if (isAuthenticating.value) {
      return false
    }

    isAuthenticating.value = true
    try {
      const authResponse = await authenticateWithTelegram()
      if (authResponse && authResponse.user) {
        user.value = authResponse.user
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      isAuthenticating.value = false
    }
  }

  /**
   * Logout user
   */
  function logout(): void {
    logoutUser()
    user.value = null
  }

  const isAuthenticated = computed(() => checkAuth() && user.value !== null)
  const isTelegram = computed(() => isTelegramWebApp())

  return {
    user: computed(() => user.value),
    isAuthenticated,
    isAuthenticating: computed(() => isAuthenticating.value),
    isTelegram,
    initAuth,
    login,
    logout,
  }
}


