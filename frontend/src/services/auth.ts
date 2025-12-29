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
  photo_url: string | null
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
    return null
  }

  const initData = getTelegramInitData()
  if (!initData) {
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
    throw error
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
 * Authenticate user via dev endpoint (development only)
 */
export async function authenticateDev(): Promise<AuthResponse | null> {
  try {
    const response = await api.post<AuthResponse>('/auth/dev/login', {
      user_id: 123456789
    })

    // Store token
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.access_token) // Assuming 'token' refers to access_token
    }

    // Store user data
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  } catch (error: any) {
    // Assuming the intent was to handle Axios errors if axios was imported,
    // but since it's not, and the instruction removed console logs,
    // we'll just return null as per the original function's behavior
    // in case of error, without logging.
    return null
  }
}

/**
 * Logout user
 */
export function logout(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}








