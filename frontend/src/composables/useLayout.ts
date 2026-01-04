import { ref } from 'vue'

const isHeaderPresent = ref(false)

export function useLayout() {
    return {
        isHeaderPresent
    }
}
