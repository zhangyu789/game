<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">💣 扫雷</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button v-for="d in difficulties" :key="d.label" @click="init(d)" :class="['btn-sm', curDiff?.label===d.label?'btn-primary':'btn-secondary']">{{ d.label }}</button>
      <button class="btn-sm btn-secondary ml-auto" @click="init(curDiff||difficulties[0])">🔄 重新开始</button>
    </div>
    <div class="flex gap-4 mb-4 text-sm">
      <span>💣 剩余: {{ flagCount }}</span>
      <span>⏱️ {{ timer }}s</span>
      <span>{{ gameOver ? (won ? '🎉 胜利！' : '💥 失败！') : '进行中' }}</span>
    </div>
    <div class="inline-block border border-gray-300 dark:border-slate-600 rounded overflow-hidden select-none" @contextmenu.prevent>
      <div v-for="(row,r) in board" :key="r" class="flex">
        <div v-for="(cell,c) in row" :key="c"
          :class="['w-7 h-7 flex items-center justify-center text-xs font-bold cursor-pointer border border-gray-200 dark:border-slate-700 transition-colors',
            cell.revealed ? (cell.mine ? 'bg-red-400 text-white' : cell.adj ? numColors[cell.adj] : 'bg-gray-100 dark:bg-slate-700') : 'bg-gray-300 dark:bg-slate-500 hover:bg-gray-200 dark:hover:bg-slate-600']"
          @click="reveal(r,c)" @contextmenu.prevent="flag(r,c)">
          <span v-if="cell.revealed && cell.mine">💣</span>
          <span v-else-if="cell.revealed && cell.adj" :class="numClass[cell.adj]">{{ cell.adj }}</span>
          <span v-else-if="cell.flagged">🚩</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
const difficulties = [
  { label: '初级 9×9', rows: 9, cols: 9, mines: 10 },
  { label: '中级 16×16', rows: 16, cols: 16, mines: 40 },
  { label: '高级 16×30', rows: 16, cols: 30, mines: 99 },
]
const curDiff = ref(difficulties[0])
const board = ref([])
const gameOver = ref(false)
const won = ref(false)
const timer = ref(0)
let timerInterval = null
const numColors = ['', 'bg-gray-100 dark:bg-slate-700', 'bg-gray-100 dark:bg-slate-700', 'bg-gray-100 dark:bg-slate-700', 'bg-gray-100 dark:bg-slate-700', 'bg-gray-100 dark:bg-slate-700', 'bg-gray-100 dark:bg-slate-700', 'bg-gray-100 dark:bg-slate-700', 'bg-gray-100 dark:bg-slate-700']
const numClass = ['', 'text-blue-600', 'text-green-600', 'text-red-600', 'text-purple-600', 'text-yellow-600', 'text-pink-600', 'text-teal-600', 'text-gray-600']
const flagCount = computed(() => board.value.flat().filter(c => c.flagged && !c.revealed).length)

function init(d) {
  curDiff.value = d
  gameOver.value = false
  won.value = false
  timer.value = 0
  clearInterval(timerInterval)
  timerInterval = setInterval(() => { if (!gameOver.value) timer.value++ }, 1000)
  const b = Array.from({ length: d.rows }, () => Array.from({ length: d.cols }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 })))
  let placed = 0
  while (placed < d.mines) {
    const r = Math.floor(Math.random() * d.rows), c = Math.floor(Math.random() * d.cols)
    if (!b[r][c].mine) { b[r][c].mine = true; placed++ }
  }
  for (let r = 0; r < d.rows; r++) for (let c = 0; c < d.cols; c++) {
    if (b[r][c].mine) continue
    let cnt = 0
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r+dr, nc = c+dc
      if (nr>=0 && nr<d.rows && nc>=0 && nc<d.cols && b[nr][nc].mine) cnt++
    }
    b[r][c].adj = cnt
  }
  board.value = b
}
function reveal(r, c) {
  if (gameOver.value || board.value[r][c].revealed || board.value[r][c].flagged) return
  if (board.value[r][c].mine) {
    board.value[r][c].revealed = true
    gameOver.value = true
    clearInterval(timerInterval)
    board.value.flat().forEach(cell => { if (cell.mine) cell.revealed = true })
    return
  }
  const d = curDiff.value
  const stack = [[r, c]]
  while (stack.length) {
    const [cr, cc] = stack.pop()
    if (cr<0||cr>=d.rows||cc<0||cc>=d.cols) continue
    if (board.value[cr][cc].revealed || board.value[cr][cc].flagged || board.value[cr][cc].mine) continue
    board.value[cr][cc].revealed = true
    if (board.value[cr][cc].adj === 0) {
      for (let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) stack.push([cr+dr,cc+dc])
    }
  }
  checkWin()
}
function flag(r, c) {
  if (gameOver.value || board.value[r][c].revealed) return
  board.value[r][c].flagged = !board.value[r][c].flagged
}
function checkWin() {
  const d = curDiff.value
  const total = d.rows * d.cols
  const revealed = board.value.flat().filter(c => c.revealed).length
  if (revealed === total - d.mines) { won.value = true; gameOver.value = true; clearInterval(timerInterval) }
}
init(difficulties[0])
</script>
