import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// Base URL configuration
const getBaseURL = (): string => {
    // In development, use proxy (empty string means relative URLs)
    // In production, use full backend URL
    // @ts-ignore - Vite env types
    if (import.meta.env.DEV) {
        return '/api'
    }
    // @ts-ignore - Vite env types
    return import.meta.env.VITE_BACKEND_URL || '/api'
}

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: getBaseURL(),
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Ensure headers object exists
        if (!config.headers) {
            config.headers = {} as any
        }

        // Get token from localStorage and always add it if exists
        const token = localStorage.getItem('access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Log request in development
        // @ts-ignore - Vite env types


        return config
    },
    (error: AxiosError) => {
        // Handle request error

        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log response in development
        // @ts-ignore        

        return response
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Handle response error
        if (error.response) {
            const { status, data } = error.response

            // Log error in development
            // @ts-ignore            

            // Handle 401 Unauthorized - token expired or invalid
            if (status === 401 && !originalRequest._retry) {
                originalRequest._retry = true

                // Try to refresh token if refresh token exists
                const refreshToken = localStorage.getItem('refresh_token')

                if (refreshToken) {
                    try {
                        // Attempt to refresh token
                        const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
                            refresh_token: refreshToken,
                        })

                        const { access_token } = response.data

                        // Update token in storage
                        localStorage.setItem('access_token', access_token)

                        // Retry original request with new token
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${access_token}`
                        }

                        return api(originalRequest)
                    } catch (refreshError) {
                        // Refresh failed, clear tokens and redirect to login
                        localStorage.removeItem('access_token')
                        localStorage.removeItem('refresh_token')

                        // Redirect to login page if not already there
                        if (window.location.pathname !== '/login') {
                            window.location.href = '/login'
                        }

                        return Promise.reject(refreshError)
                    }
                } else {
                    // No refresh token, clear storage and redirect to login
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('refresh_token')

                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }
                }
            }

            // Handle 403 Forbidden
            if (status === 403) {

                // You can add custom handling here
            }

            // Handle 404 Not Found
            if (status === 404) {

            }

            // Handle 500 Internal Server Error
            if (status >= 500) {

            }
        } else if (error.request) {
            // Request was made but no response received

        } else {
            // Something happened in setting up the request
        }

        return Promise.reject(error)
    }
)

export default api

