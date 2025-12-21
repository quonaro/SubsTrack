import api from './api'
import { getTelegramInitData, isTelegramWebApp } from './telegram'

export interface User {
  id: number
  telegram_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  language_code: string | null
  is_premium: boolean
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

/**
 * Authenticate user via Telegram WebApp
 */
export async function authenticateWithTelegram(): Promise<AuthResponse | null> {
  if (!isTelegramWebApp()) {
    console.warn('Not running as Telegram MiniApp')
    return null
  }

  const initData = getTelegramInitData()
  if (!initData) {
    console.error('No Telegram initData available')
    return null
  }

  try {
    const response = await api.post<AuthResponse>('/auth/telegram', {
      init_data: initData
    })

    // Store token
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
    }

    // Store user data
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  } catch (error) {
    console.error('Telegram authentication failed:', error)
    return null
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token')
}

/**
 * Logout user
 */
export function logout(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}


