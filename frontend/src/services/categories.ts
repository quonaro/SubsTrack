import api from './api'

export interface Category {
    id: number
    name: string
    color: string
    icon: string
}

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get('/categories/')
    return response.data
}

export const createCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    const response = await api.post('/categories/', category)
    return response.data
}

export const deleteCategory = async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`)
}
