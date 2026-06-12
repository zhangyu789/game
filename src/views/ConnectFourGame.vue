<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🔴 四子棋</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <button class="btn-sm btn-secondary" @click="undo">↩️ 悔棋</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span :class="turn===1 ? 'font-bold text-red-500' : ''">🔴 玩家1</span>
      <span>vs</span>
      <span :class="turn===2 ? 'font-bold text-yellow-500' : ''">🟡 玩家2{{ vsAI ? '(AI)' : '' }}</span>
      <span>{{ winner ? (winner===1?'🔴 红方胜!' : winner===2?'🟡 黄方胜!' : '平局!') : '' }}</span>
    </div>
    <div class="inline-block bg-blue-600 p-2 rounded-lg">
      <div class="flex gap-1 mb-1">
        <div v-for="c in COLS" :key="c" class="w-11 text-center cursor-pointer" @click="drop(c-1)">
          <span class="text-white text-lg hover:text-yellow-300">▼</span>
        </div>
      </div>
      <div v-for="r in ROWS" :key="r" class="flex gap-1">
        <div v-for="c in COLS" :key="c"
          class="w-11 h-11 rounded-full border-2 border-blue-500 flex items-center justify-center cursor-pointer"
          :class="[board[r-1][c-1]===1 ? 'bg-red-500' : board[r-1][c-1]===2 ? 'bg-yellow-400' : 'bg-blue-700']"
          @click="drop(c-1)">
        </div>
      </div>
    </div>
    <div class="mt-3">
      <label class="text-sm text-gray-500"><input type="checkbox" v-model="vsAI" class="mr-1" @change="newGame"> 对战AI</label>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const COLS = 7, ROWS = 6
const board = ref([]), turn = ref(1), winner = ref(0)
const vsAI = ref(true), history = ref([])
function newGame() {
  board.value = Array.from({length:ROWS}, () => Array(COLS).fill(0))
  turn.value = 1; winner.value = 0; history.value = []
}
function drop(col) {
  if (winner.value) return
  if (vsAI.value && turn.value === 2) return
  if (!doDrop(col)) return
  if (vsAI.value && !winner.value) setTimeout(aiMove, 300)
}
function doDrop(col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board.value[r][col] === 0) {
      board.value[r][col] = turn.value
      history.value.push({r, c: col, player: turn.value})
      checkWin(r, col)
      if (!winner.value) turn.value = turn.value === 1 ? 2 : 1
      return true
    }
  }
  return false
}
function checkWin(r, c) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]]
  for (const [dr,dc] of dirs) {
    let count = 1
    for (let d = 1; d < 4; d++) { const nr=r+dr*d,nc=c+dc*d; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&board.value[nr][nc]===turn.value) count++; else break }
    for (let d = 1; d < 4; d++) { const nr=r-dr*d,nc=c-dc*d; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&board.value[nr][nc]===turn.value) count++; else break }
    if (count >= 4) { winner.value = turn.value; return }
  }
  if (board.value[0].every(c => c !== 0)) winner.value = -1
}
function undo() {
  if (history.value.length === 0 || winner.value) return
  const count = vsAI.value ? 2 : 1
  for (let i = 0; i < count && history.value.length > 0; i++) {
    const last = history.value.pop()
    board.value[last.r][last.c] = 0
    turn.value = last.player
  }
  winner.value = 0
}
function aiMove() {
  // Simple AI: try to win, block, or pick best column
  let bestCol = -1, bestScore = -Infinity
  for (let c = 0; c < COLS; c++) {
    let r = -1
    for (let row = ROWS-1; row >= 0; row--) { if (board.value[row][c] === 0) { r = row; break } }
    if (r === -1) continue
    // Try move
    board.value[r][c] = 2
    let score = evaluate(2) - evaluate(1) * 1.1
    board.value[r][c] = 0
    if (score > bestScore) { bestScore = score; bestCol = c }
  }
  if (bestCol >= 0) doDrop(bestCol)
}
function evaluate(player) {
  let score = 0
  const dirs = [[0,1],[1,0],[1,1],[1,-1]]
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board.value[r][c] !== player) continue
      for (const [dr,dc] of dirs) {
        let count = 1, open = 0
        for (let d = 1; d < 4; d++) { const nr=r+dr*d,nc=c+dc*d; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS) { if(board.value[nr][nc]===player) count++; else { if(board.value[nr][nc]===0) open++; break } } else break }
        if (count >= 4) score += 1000
        else if (count === 3 && open > 0) score += 50
        else if (count === 2 && open > 0) score += 10
      }
    }
  }
  return score
}
onMounted(() => newGame())
</script>
