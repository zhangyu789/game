<template>
  <button @click="handleCopy" class="btn-secondary btn-sm flex items-center gap-1" :title="copied ? '已复制!' : '复制'">
    <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
    </svg>
    <svg v-else class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>
    <span v-if="!copied">复制</span>
    <span v-else class="text-green-500">已复制</span>
  </button>
</template>

<script setup>
import { useCopy } from '../composables/useCopy'
import { useToast } from '../composables/useToast'

const props = defineProps({ text: { type: String, default: '' } })
const { copied, copy } = useCopy()
const { show } = useToast()

async function handleCopy() {
  const ok = await copy(props.text)
  if (ok) show('已复制到剪贴板', 'success')
}
</script>
