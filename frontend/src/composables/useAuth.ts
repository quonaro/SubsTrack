import { ref, computed } from 'vue'
import { authenticateWithTelegram, authenticateDev, getCurrentUser, isAuthenticated as checkAuth, logout as logoutUser } from '../services/auth'
import { isTelegramWebApp, initTelegramWebApp } from '../services/telegram'

const user = ref(getCurrentUser())
const isAuthenticating = ref(false)

export function useAuth() {
  /**
   * Initialize authentication - auto-login if Telegram MiniApp
   */
  async function initAuth(): Promise<void> {
    const isTelegram = isTelegramWebApp()
    const hasAuth = checkAuth()

    // Initialize Telegram WebApp if available
    if (isTelegram) {
      initTelegramWebApp()
    }

    // If already authenticated, load user from storage
    if (hasAuth && !user.value) {
      user.value = getCurrentUser()
      return
    }

    // If running as Telegram MiniApp and not authenticated, auto-login
    if (isTelegram && !hasAuth) {
      const loginSuccess = await login()
      if (!loginSuccess) {
        // Fallback to dev login if Telegram login fails
        isAuthenticating.value = true
        try {
          const devAuth = await authenticateDev()
          if (devAuth && devAuth.user) {
            user.value = devAuth.user
          } else {
            // no user data
          }
        } catch (error) {
          // dev login error
        } finally {
          isAuthenticating.value = false
        }
      }
      return
    }

    // If not in Telegram MiniApp and not authenticated, try dev login only in DEV mode
    // @ts-ignore - Vite env types
    if (!isTelegram && !hasAuth && import.meta.env.DEV) {
      isAuthenticating.value = true
      try {
        const devAuth = await authenticateDev()
        if (devAuth && devAuth.user) {
          user.value = devAuth.user
        }
      } catch (error) {
        // dev login error
      } finally {
        isAuthenticating.value = false
      }
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








