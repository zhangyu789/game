<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🧵 数织</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <span class="btn-sm btn-secondary">关卡 {{ level }}</span>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>{{ completed ? '✅ 完成!' : '🎯 根据数字提示填充格子' }}</span>
    </div>
    <div class="inline-block">
      <!-- Column hints -->
      <div class="flex ml-10">
        <div v-for="c in SIZE" :key="'ch'+c" class="w-8 text-center text-xs text-gray-500">
          <div v-for="n in colHints[c-1]" :key="n">{{ n }}</div>
        </div>
      </div>
      <!-- Grid with row hints -->
      <div v-for="r in SIZE" :key="'r'+r" class="flex items-center">
        <div class="w-10 text-right pr-1 text-xs text-gray-500">{{ rowHints[r-1].join(' ') }}</div>
        <div v-for="c in SIZE" :key="'c'+c"
          class="w-8 h-8 border border-gray-300 dark:border-slate-600 cursor-pointer flex items-center justify-center text-sm select-none"
          :class="[grid[r-1][c-1]===1 ? 'bg-blue-500' : grid[r-1][c-1]===2 ? 'bg-gray-300 dark:bg-slate-600' : 'bg-white dark:bg-slate-800']"
          @click="toggle(r-1,c-1)" @contextmenu.prevent="mark(r-1,c-1)">
          <span v-if="grid[r-1][c-1]===2" class="text-gray-400">✕</span>
        </div>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">左键填充/取消，右键标记空白</p>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
const SIZE = 5, level = ref(1), completed = ref(false)
const grid = ref([])
const solution = ref([])
const PUZZLES = [
  [[0,1,1,1,0],[1,1,0,1,1],[1,0,0,0,1],[1,1,0,1,1],[0,1,1,1,0]],
  [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]],
  [[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1]],
  [[0,1,0,1,0],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0],[0,0,1,0,0]],
]
function getHints(row) {
  const hints = []; let count = 0
  for (const cell of row) { if (cell) count++; else { if (count) hints.push(count); count = 0 } }
  if (count) hints.push(count)
  return hints.length ? hints : [0]
}
const rowHints = computed(() => solution.value.map(r => getHints(r)))
const colHints = computed(() => {
  const hints = []
  for (let c = 0; c < SIZE; c++) {
    const col = solution.value.map(r => r[c])
    hints.push(getHints(col))
  }
  return hints
})
function newGame() {
  const puz = PUZZLES[(level.value - 1) % PUZZLES.length]
  solution.value = puz.map(r => [...r])
  grid.value = Array.from({length:SIZE}, () => Array(SIZE).fill(0))
  completed.value = false
}
function toggle(r, c) {
  if (completed.value) return
  grid.value[r][c] = grid.value[r][c] === 1 ? 0 : 1
  checkComplete()
}
function mark(r, c) {
  if (completed.value) return
  grid.value[r][c] = grid.value[r][c] === 2 ? 0 : 2
}
function checkComplete() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((grid.value[r][c] === 1) !== (solution.value[r][c] === 1)) return
    }
  }
  completed.value = true; level.value++
}
onMounted(() => newGame())
</script>
