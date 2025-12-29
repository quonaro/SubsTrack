import api from './api'
import { Subscription } from './subscriptions'

export interface Statistics {
    total_monthly: number
    total_yearly: number
    active_count: number
    inactive_count: number
    top_subscriptions: Subscription[]
    currency: string
}

/**
 * Get statistics for current user
 */
export async function getStatistics(): Promise<Statistics> {
    const response = await api.get<Statistics>('/statistics')
    return response.data
}
