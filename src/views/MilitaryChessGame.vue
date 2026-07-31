<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🎖️ 暗棋</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span class="text-red-500">🔴 红方(你)</span> vs <span class="text-blue-500">🔵 蓝方(AI)</span>
      <span>{{ gameOver }}</span>
    </div>
    <div class="inline-grid gap-1 p-2 bg-green-900 rounded-lg" style="gridTemplateColumns:repeat(4,1fr)">
      <div v-for="(cell,i) in board" :key="i"
        class="w-14 h-14 rounded cursor-pointer flex items-center justify-center text-xs font-bold transition-all select-none"
        :class="[
          cell.revealed ? (cell.team===1?'bg-red-100 text-red-800':'bg-blue-100 text-blue-800') : 'bg-amber-700 hover:bg-amber-600',
          selected===i ? 'ring-2 ring-yellow-400' : '',
          cell.dead ? 'opacity-20' : ''
        ]"
        @click="clickCell(i)">
        <template v-if="cell.revealed && !cell.dead">{{ cell.name }}<br><span class="text-[10px]">{{ cell.rank }}</span></template>
        <template v-else-if="!cell.dead">?</template>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">翻开棋子，大吃小（司令>军长>...>工兵>地雷>炸弹）</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const PIECES = [
  {name:'司令',rank:9},{name:'军长',rank:8},{name:'师长',rank:7},{name:'旅长',rank:6},
  {name:'团长',rank:5},{name:'营长',rank:4},{name:'连长',rank:3},{name:'排长',rank:2},
  {name:'工兵',rank:1},{name:'地雷',rank:0},{name:'炸弹',rank:10},{name:'军旗',rank:-1},
]
const board = ref([]), selected = ref(-1), gameOver = ref('')
function newGame() {
  const pieces = []
  for (let t = 1; t <= 2; t++) {
    PIECES.forEach(p => pieces.push({...p, team: t, revealed: false, dead: false}))
  }
  for (let i = pieces.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [pieces[i],pieces[j]] = [pieces[j],pieces[i]] }
  board.value = pieces.slice(0, 32)
  selected.value = -1; gameOver.value = ''
}
function clickCell(i) {
  if (gameOver.value) return
  const cell = board.value[i]
  if (cell.dead) return
  if (!cell.revealed) { cell.revealed = true; selected.value = -1; checkEnd(); return }
  if (selected.value === -1) { if (cell.team === 1) selected.value = i; return }
  if (selected.value === i) { selected.value = -1; return }
  // Attack or select
  const from = board.value[selected.value], to = cell
  if (to.revealed && to.team !== from.team) {
    // Battle
    if (from.rank === 10) { from.dead = true; to.dead = true } // Bomb kills both
    else if (to.rank === 0 && from.rank !== 1) { from.dead = true } // Mine kills non-engineer
    else if (to.rank === 0 && from.rank === 1) { to.dead = true } // Engineer clears mine
    else if (from.rank === -1) { from.dead = true } // Flag always dies
    else if (to.rank === -1) { to.dead = true } // Capture flag
    else if (from.rank >= to.rank) { to.dead = true } // Higher rank wins
    else { from.dead = true }
    selected.value = -1; checkEnd(); return
  }
  if (cell.team === 1) selected.value = i
}
function checkEnd() {
  const redAlive = board.value.filter(c => c.team===1 && !c.dead && c.revealed)
  const blueAlive = board.value.filter(c => c.team===2 && !c.dead && c.revealed)
  if (redAlive.length === 0 && board.value.every(c => c.revealed || c.dead)) gameOver.value = '😢 AI胜!'
  if (blueAlive.length === 0 && board.value.every(c => c.revealed || c.dead)) gameOver.value = '🎉 你胜!'
}
onMounted(() => newGame())
</script>
