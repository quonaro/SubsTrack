import { ref, computed } from 'vue'

const accentColor = ref(localStorage.getItem('accentColor') || '#8b5cf6')
const theme = ref(localStorage.getItem('theme') || 'midnight')

export function useTheme() {
  function setAccentColor(color: string) {
    accentColor.value = color
    localStorage.setItem('accentColor', color)
    updateAccentVars(color)
  }

  function setTheme(newTheme: string) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    updateThemeAttr(newTheme)
  }

  function updateAccentVars(color: string) {
    document.documentElement.style.setProperty('--accent-color', color)
    const shadowColor = color + '66'
    document.documentElement.style.setProperty('--accent-color-shadow', shadowColor)
  }

  function updateThemeAttr(newTheme: string) {
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // Initialize
  if (typeof document !== 'undefined') {
    updateAccentVars(accentColor.value)
    updateThemeAttr(theme.value)
  }

  return {
    accentColor: computed(() => accentColor.value),
    theme: computed(() => theme.value),
    setAccentColor,
    setTheme
  }
}
