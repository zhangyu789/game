import { ref, watch } from 'vue'
import { usePreferredDark, useStorage } from '@vueuse/core'

export function useDarkMode() {
  const prefersDark = usePreferredDark()
  const stored = useStorage('devpocket-dark', null)

  const isDark = ref(stored.value !== null ? stored.value === 'true' : prefersDark.value)

  watch(isDark, (val) => {
    stored.value = String(val)
    document.documentElement.classList.toggle('dark', val)
  }, { immediate: true })

  function toggle() {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
}
