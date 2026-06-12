<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">✊ 石头剪刀布</h2>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🏆 你: {{ playerScore }}</span><span>🤖 AI: {{ aiScore }}</span><span>🤝 平局: {{ draws }}</span>
    </div>
    <div class="flex gap-4 mb-6">
      <button v-for="choice in ['✊','✋','✌️']" :key="choice"
        class="w-20 h-20 rounded-full border-4 text-3xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
        :class="playerChoice===choice ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-slate-600'"
        @click="play(choice)">{{ choice }}</button>
    </div>
    <div v-if="result" class="text-center">
      <div class="text-4xl mb-2">{{ playerChoice }} vs {{ aiChoice }}</div>
      <div class="text-lg font-bold" :class="result==='你赢了!'?'text-green-500':result==='AI赢了!'?'text-red-500':'text-yellow-500'">{{ result }}</div>
    </div>
    <div class="mt-4 text-xs text-gray-400">连续赢得越多，分数越高！</div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const playerChoice = ref(''), aiChoice = ref(''), result = ref('')
const playerScore = ref(0), aiScore = ref(0), draws = ref(0), streak = ref(0)
const choices = ['✊','✋','✌️']
const beats = {'✊':'✌️','✋':'✊','✌️':'✋'}
function play(choice) {
  playerChoice.value = choice
  aiChoice.value = choices[Math.floor(Math.random()*3)]
  if (choice === aiChoice.value) { result.value = '平局!'; draws.value++; streak.value = 0 }
  else if (beats[choice] === aiChoice.value) { streak.value++; result.value = '你赢了!'; playerScore.value += 10 + streak.value * 5 }
  else { result.value = 'AI赢了!'; aiScore.value += 10; streak.value = 0 }
}
</script>
