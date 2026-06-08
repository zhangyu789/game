import { ref } from 'vue'

export function useCopy() {
  const copied = ref(false)

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      setTimeout(() => { copied.value = false }, 1500)
      return true
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      copied.value = true
      setTimeout(() => { copied.value = false }, 1500)
      return true
    }
  }

  return { copied, copy }
}
