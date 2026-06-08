import { ref, provide, inject } from 'vue'

const toastSymbol = Symbol('toast')

export function createToast() {
  const toasts = ref([])
  let id = 0

  function show(message, type = 'success', duration = 2000) {
    const toastId = ++id
    toasts.value.push({ id: toastId, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== toastId)
    }, duration)
  }

  const plugin = {
    install(app) {
      app.provide(toastSymbol, { toasts, show })
    }
  }

  return plugin
}

export function useToast() {
  const ctx = inject(toastSymbol)
  if (!ctx) throw new Error('useToast must be used after createToast')
  return ctx
}
