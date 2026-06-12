<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🧩 拼图游戏</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <select v-model="gridSize" class="btn-sm btn-secondary" @change="newGame">
        <option :value="3">3×3 (简单)</option>
        <option :value="4">4×4 (中等)</option>
        <option :value="5">5×5 (困难)</option>
      </select>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🎯 步数: {{ moves }}</span>
      <span>✅ 完成: {{ solved ? '是' : '否' }}</span>
    </div>
    <div class="inline-grid gap-1 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg" :style="{gridTemplateColumns:`repeat(${gridSize},1fr)`}">
      <div v-for="(piece, i) in pieces" :key="i"
        class="w-14 h-14 rounded cursor-pointer flex items-center justify-center font-bold text-lg transition-all duration-200 select-none"
        :class="[piece.correct ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white', selected === piece.id ? 'ring-3 ring-yellow-400 scale-105' : '']"
        @click="clickPiece(piece)">
        {{ piece.value }}
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">点击两个拼图块交换位置，按数字顺序排列</p>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
const gridSize = ref(3)
const pieces = ref([])
const selected = ref(-1)
const moves = ref(0)
const solved = computed(() => pieces.value.every((p, i) => p.id === i))
function newGame() {
  const n = gridSize.value * gridSize.value
  const arr = Array.from({length: n}, (_, i) => ({id: i, value: i === n-1 ? '✓' : i+1, correct: false}))
  // Shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  arr.forEach((p, i) => p.correct = p.id === i)
  pieces.value = arr; selected.value = -1; moves.value = 0
}
function clickPiece(piece) {
  if (solved.value) return
  const idx = pieces.value.indexOf(piece)
  if (selected.value === -1) { selected.value = piece.id; return }
  const selIdx = pieces.value.findIndex(p => p.id === selected.value)
  if (selIdx === idx) { selected.value = -1; return }
  // Swap
  const temp = pieces.value[selIdx]
  pieces.value[selIdx] = pieces.value[idx]
  pieces.value[idx] = temp
  pieces.value.forEach((p, i) => p.correct = p.id === i)
  selected.value = -1; moves.value++
}
onMounted(() => newGame())
</script>
