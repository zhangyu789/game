<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🔢 猜数字</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="newGame">🔄 新游戏</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🎯 猜测次数: {{ guesses }}</span><span>{{ result }}</span>
    </div>
    <div class="mb-4">
      <div class="flex gap-2 mb-3">
        <input v-model="guess" type="text" maxlength="4" placeholder="输入4位不重复数字" class="btn-sm btn-secondary flex-1" @keydown.enter="makeGuess">
        <button class="btn-sm btn-primary" @click="makeGuess">猜!</button>
      </div>
      <div class="text-xs text-gray-400 mb-2">系统生成4位不重复数字，每次猜测返回 xA yB (A=数字和位置都对，B=数字对但位置错)</div>
    </div>
    <div class="space-y-1 max-h-60 overflow-y-auto">
      <div v-for="(h,i) in history" :key="i" class="flex gap-2 text-sm py-1 border-b border-gray-100 dark:border-slate-700">
        <span class="w-6 text-gray-400">{{ i+1 }}</span>
        <span class="font-mono">{{ h.guess }}</span>
        <span class="text-green-500 font-bold">{{ h.bulls }}A</span>
        <span class="text-yellow-500 font-bold">{{ h.cows }}B</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const guess = ref(''), guesses = ref(0), result = ref(''), history = ref([])
let answer = ''
function newGame() {
  const digits = '0123456789'.split('')
  for (let i = digits.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [digits[i],digits[j]] = [digits[j],digits[i]] }
  answer = digits.slice(0,4).join('')
  guesses.value = 0; result.value = ''; history.value = []
}
function makeGuess() {
  const g = guess.value.trim()
  if (g.length !== 4 || new Set(g).size !== 4 || !/^\d{4}$/.test(g)) { result.value = '请输入4位不重复数字'; return }
  guesses.value++; let bulls = 0, cows = 0
  for (let i = 0; i < 4; i++) { if (g[i] === answer[i]) bulls++; else if (answer.includes(g[i])) cows++ }
  history.value.unshift({guess: g, bulls, cows})
  if (bulls === 4) result.value = '🎉 恭喜猜对了! 答案: ' + answer
  else result.value = `继续猜! (${bulls}A${cows}B)`
  guess.value = ''
}
onMounted(() => newGame())
</script>
