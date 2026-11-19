import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  const mql = window.matchMedia(query)
  const update = () => {
    matches.value = mql.matches
  }
  update()
  onMounted(() => mql.addEventListener('change', update))
  onBeforeUnmount(() => mql.removeEventListener('change', update))
  return matches
}
