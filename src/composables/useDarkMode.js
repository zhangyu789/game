import { ref, watch } from 'vue'

export function useDarkMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
  const stored = localStorage.getItem('gamebox-dark')

  const isDark = ref(stored !== null ? stored === 'true' : prefersDark.matches)

  watch(isDark, (val) => {
    localStorage.setItem('gamebox-dark', String(val))
    document.documentElement.classList.toggle('dark', val)
  }, { immediate: true })

  function toggle() {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
}
