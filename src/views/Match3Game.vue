<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">💎 消消乐</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🏆 得分: {{ score }}</span>
      <span>🎯 步数: {{ moves }}</span>
      <span>🔥 连击: {{ combo }}</span>
      <span>🥇 最高: {{ highScore }}</span>
    </div>
    <div class="inline-grid gap-1 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg" :style="{gridTemplateColumns:`repeat(${COLS},1fr)`}">
      <div v-for="(cell,i) in grid" :key="i"
        class="w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center text-xl transition-all duration-200 select-none"
        :class="[cell.matched ? 'scale-0 opacity-0' : 'hover:scale-110', selected===i ? 'ring-2 ring-white' : '']"
        :style="{background: cell.color}"
        @click="click(i)">
        {{ cell.icon }}
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">点击相邻同色方块消除3个以上</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const COLS = 8, ROWS = 8
const TYPES = [
  {color:'#ef4444',icon:'❤️'},{color:'#3b82f6',icon:'💎'},{color:'#22c55e',icon:'🍀'},
  {color:'#eab308',icon:'⭐'},{color:'#a855f7',icon:'🔮'},{color:'#f97316',icon:'🔥'}
]
const grid = ref([]), selected = ref(-1)
const running = ref(false), score = ref(0), moves = ref(30), combo = ref(0)
const highScore = ref(parseInt(localStorage.getItem('match3_hs')||'0'))
function initGrid() {
  grid.value = []
  for (let i = 0; i < ROWS * COLS; i++) {
    const t = TYPES[Math.floor(Math.random()*TYPES.length)]
    grid.value.push({...t, matched: false})
  }
  // Ensure no initial matches
  while (findMatches().length > 0) {
    findMatches().forEach(i => {
      const t = TYPES[Math.floor(Math.random()*TYPES.length)]
      grid.value[i] = {...t, matched: false}
    })
  }
}
function reset() { running.value = false; score.value = 0; moves.value = 30; combo.value = 0; selected.value = -1; initGrid() }
function start() { running.value = true }
function findMatches() {
  const matched = new Set()
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      const i = r * COLS + c
      if (grid.value[i].color === grid.value[i+1].color && grid.value[i].color === grid.value[i+2].color) {
        matched.add(i); matched.add(i+1); matched.add(i+2)
      }
    }
  }
  // Vertical
  for (let r = 0; r < ROWS - 2; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c
      if (grid.value[i].color === grid.value[i+COLS].color && grid.value[i].color === grid.value[i+2*COLS].color) {
        matched.add(i); matched.add(i+COLS); matched.add(i+2*COLS)
      }
    }
  }
  return [...matched]
}
async function click(i) {
  if (!running.value || moves.value <= 0) return
  if (selected.value === -1) { selected.value = i; return }
  const sr = Math.floor(selected.value/COLS), sc = selected.value%COLS
  const cr = Math.floor(i/COLS), cc = i%COLS
  if (Math.abs(sr-cr)+Math.abs(sc-cc) !== 1) { selected.value = i; return }
  // Swap
  const temp = {...grid.value[selected.value]}
  grid.value[selected.value] = {...grid.value[i]}
  grid.value[i] = temp
  const matches = findMatches()
  if (matches.length === 0) {
    // Swap back
    const t2 = {...grid.value[selected.value]}
    grid.value[selected.value] = {...grid.value[i]}
    grid.value[i] = t2
    selected.value = -1; return
  }
  selected.value = -1; moves.value--; combo.value = 0
  await resolveCascades()
  if (moves.value <= 0) {
    running.value = false
    if (score.value > highScore.value) { highScore.value = score.value; localStorage.setItem('match3_hs', highScore.value) }
  }
}
async function resolveCascades() {
  let matches = findMatches()
  while (matches.length > 0) {
    combo.value++
    score.value += matches.length * 10 * combo.value
    matches.forEach(i => grid.value[i].matched = true)
    await sleep(200)
    // Gravity
    for (let c = 0; c < COLS; c++) {
      let writePos = ROWS - 1
      for (let r = ROWS - 1; r >= 0; r--) {
        const i = r * COLS + c
        if (!grid.value[i].matched) {
          grid.value[writePos * COLS + c] = {...grid.value[i]}
          if (writePos !== r) grid.value[i].matched = true
          writePos--
        }
      }
      for (let r = writePos; r >= 0; r--) {
        const t = TYPES[Math.floor(Math.random()*TYPES.length)]
        grid.value[r * COLS + c] = {...t, matched: false}
      }
    }
    await sleep(150)
    grid.value.forEach(c => c.matched = false)
    matches = findMatches()
  }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
onMounted(() => { reset() })
</script>
