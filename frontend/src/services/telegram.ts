/**
 * Telegram WebApp API service
 * Handles interaction with Telegram MiniApp
 */

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      language_code?: string
      is_bot?: boolean
      is_premium?: boolean
    }
    auth_date?: number
    hash?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, any>
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  isClosingConfirmationEnabled: boolean
  BackButton: {
    isVisible: boolean
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void
    getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void
    getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void
    removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void
    removeItems: (keys: string[], callback?: (error: Error | null, success: boolean) => void) => void
    getKeys: (callback: (error: Error | null, keys: string[]) => void) => void
  }
  ready: () => void
  expand: () => void
  close: () => void
  onEvent: (eventType: string, callback: () => void) => void
  offEvent: (eventType: string, callback: () => void) => void
  requestFullscreen: () => void
  exitFullscreen: () => void
  isFullscreen: boolean
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

/**
 * Check if app is running as Telegram MiniApp
 */
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' &&
    window.Telegram !== undefined &&
    window.Telegram.WebApp !== undefined
}

/**
 * Get Telegram WebApp instance
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (isTelegramWebApp()) {
    return window.Telegram!.WebApp
  }
  return null
}

/**
 * Get Telegram initData for authentication
 */
export function getTelegramInitData(): string | null {
  const webApp = getTelegramWebApp()
  if (webApp && webApp.initData) {
    return webApp.initData
  }
  return null
}

/**
 * Get Telegram user data (unsafe, for display only)
 */
export function getTelegramUser() {
  const webApp = getTelegramWebApp()
  if (webApp && webApp.initDataUnsafe?.user) {
    return webApp.initDataUnsafe.user
  }
  return null
}

/**
 * Initialize Telegram WebApp
 */
export function initTelegramWebApp(): void {
  const webApp = getTelegramWebApp()
  if (webApp) {
    webApp.ready()

    // Check fullscreen mode from localStorage (default to 'extra')
    const mode = localStorage.getItem('fullscreen_mode') || 'extra'
    const isAuto = localStorage.getItem('fullscreen_auto') === 'true'

    // Force expand immediately if not in native mode, or just always expand to be safe
    // The user wants fullscreen experience. 
    // Even if 'native', we likely want 'expand()' so it fills the screen, just without the black bar.
    // The only time we might NOT want expand is if the user specifically requested Compact (which is no longer an option).

    const shouldExpand = true

    if (shouldExpand) {
      // Try new Fullscreen API first, fallback to expand
      try {
        if (webApp.requestFullscreen) {
          webApp.requestFullscreen()
        } else {
          webApp.expand()
        }
      } catch (e) {
        webApp.expand()
      }

      // Aggressive expansion: retry every 100ms for 2 seconds to ensure it sticks
      // This helps if the app is launched via Menu Button and the initial expand is ignored
      let attempts = 0
      const expandInterval = setInterval(() => {
        try {
          if (webApp.requestFullscreen) {
            webApp.requestFullscreen()
          } else {
            webApp.expand()
          }
        } catch (e) {
          webApp.expand()
        }

        attempts++
        // Check both isExpanded and isFullscreen (if available)
        const isFullscreen = webApp.isFullscreen !== undefined ? webApp.isFullscreen : webApp.isExpanded

        if (attempts > 20 || (isFullscreen && !isAuto)) {
          // Stop if expanded (unless auto mode is weird) or after 2s
          clearInterval(expandInterval)
        }
      }, 100)
    }

    // Set attribute for CSS styling
    document.body.setAttribute('data-fullscreen-mode', mode)
  }
}
