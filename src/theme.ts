export function applyThemeToDom(theme: 'dark' | 'light'): void {
  document.documentElement.classList.toggle('light', theme === 'light')
}
