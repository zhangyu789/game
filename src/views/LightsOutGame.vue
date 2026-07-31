<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">💡 点灯游戏</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <span class="btn-sm btn-secondary">步数: {{ moves }}</span>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🎯 关掉所有灯</span>
      <span>{{ solved ? '✅ 完成!' : '' }}</span>
    </div>
    <div class="inline-grid gap-2 p-3 bg-gray-100 dark:bg-slate-800 rounded-lg" :style="{gridTemplateColumns:`repeat(${SIZE},1fr)`}">
      <div v-for="(cell, i) in grid" :key="i"
        class="w-14 h-14 rounded-lg cursor-pointer flex items-center justify-center text-2xl transition-all duration-200 select-none"
        :class="[cell ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-gray-300 dark:bg-slate-600']"
        @click="toggle(i)">
        {{ cell ? '💡' : '⬛' }}
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">点击一个灯会切换它和相邻灯的状态，关掉所有灯即获胜</p>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
const SIZE = 5
const grid = ref([]), moves = ref(0)
const solved = computed(() => grid.value.every(c => !c))
function newGame() {
  moves.value = 0
  // Start with all lights off, then simulate random clicks to ensure solvability
  const g = Array(SIZE * SIZE).fill(false)
  const clicks = 5 + Math.floor(Math.random() * 5)
  for (let i = 0; i < clicks; i++) {
    const idx = Math.floor(Math.random() * SIZE * SIZE)
    applyToggle(g, idx)
  }
  grid.value = g
}
function applyToggle(g, i) {
  const r = Math.floor(i / SIZE), c = i % SIZE
  g[i] = !g[i]
  if (r > 0) g[i - SIZE] = !g[i - SIZE]
  if (r < SIZE-1) g[i + SIZE] = !g[i + SIZE]
  if (c > 0) g[i - 1] = !g[i - 1]
  if (c < SIZE-1) g[i + 1] = !g[i + 1]
}
function toggle(i) {
  if (solved.value) return
  applyToggle(grid.value, i)
  grid.value = [...grid.value]
  moves.value++
}
onMounted(() => newGame())
</script>
