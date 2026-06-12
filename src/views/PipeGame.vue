<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🔧 接水管</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <span class="btn-sm btn-secondary">关卡 {{ level }}</span>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🎯 旋转管道连通水源</span>
      <span>{{ completed ? '✅ 完成!' : '' }}</span>
    </div>
    <div class="inline-grid gap-0.5 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg" :style="{gridTemplateColumns:`repeat(${SIZE},1fr)`}">
      <div v-for="(cell, i) in grid" :key="i"
        class="w-12 h-12 cursor-pointer flex items-center justify-center text-2xl rounded transition-all select-none"
        :class="[cell.connected ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-slate-700']"
        @click="rotate(i)">
        <span :style="{transform:`rotate(${cell.rot*90}deg)`, display:'inline-block'}">{{ cell.type }}</span>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">点击旋转管道，使水源💧连通到终点🏁</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const SIZE = 6, level = ref(1), completed = ref(false)
const grid = ref([])
// Pipe types: ═(horizontal) ║(vertical) ╗ ╔ ╝ ╚ (corners) ╠ ╣ ╦ ╩ (tees) ╬ (cross)
const PIPE_CHARS = ['═','║','╗','╔','╝','╚']
function newGame() {
  completed.value = false
  const g = []
  for (let i = 0; i < SIZE * SIZE; i++) {
    const type = PIPE_CHARS[Math.floor(Math.random()*PIPE_CHARS.length)]
    const correctRot = Math.floor(Math.random()*4)
    const rot = (correctRot + 1 + Math.floor(Math.random()*3)) % 4 // Randomize
    g.push({ type, rot, correctRot, connected: false, isSource: i === 0, isEnd: i === SIZE*SIZE-1 })
  }
  g[0].isSource = true; g[SIZE*SIZE-1].isEnd = true
  grid.value = g
  checkConnected()
}
function rotate(i) {
  if (completed.value) return
  grid.value[i].rot = (grid.value[i].rot + 1) % 4
  checkConnected()
}
// Simplified connectivity check
function checkConnected() {
  grid.value.forEach(c => c.connected = false)
  grid.value[0].connected = true
  let changed = true
  while (changed) {
    changed = false
    grid.value.forEach((cell, i) => {
      if (cell.connected) return
      const r = Math.floor(i/SIZE), c = i%SIZE
      const neighbors = []
      if (r > 0) neighbors.push(i - SIZE)
      if (r < SIZE-1) neighbors.push(i + SIZE)
      if (c > 0) neighbors.push(i - 1)
      if (c < SIZE-1) neighbors.push(i + 1)
      for (const ni of neighbors) {
        if (grid.value[ni].connected) { cell.connected = true; changed = true; break }
      }
    })
  }
  if (grid.value[SIZE*SIZE-1].connected) { completed.value = true; level.value++ }
}
onMounted(() => newGame())
</script>
