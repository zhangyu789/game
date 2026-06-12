<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🔗 连线Flow</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <button class="btn-sm btn-secondary" @click="undo">↩️ 清除当前</button>
      <span class="btn-sm btn-secondary">关卡 {{ level }}</span>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🎯 连接: {{ connectedCount }}/{{ colors.length }}</span>
      <span>{{ completed ? '✅ 完成!' : '' }}</span>
    </div>
    <canvas ref="canvas" width="400" height="400" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 block max-w-full cursor-pointer" style="width:min(400px,100%)" @mousedown="onDown" @mousemove="onMove" @mouseup="onUp" @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onUp"></canvas>
    <p class="text-xs text-gray-400 mt-2">拖拽连接同色端点，路径不能交叉</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const canvas = ref(null)
const level = ref(1), connectedCount = ref(0), completed = ref(false)
let GRID = 5, CELL = 80, colors = [], paths = {}, currentColor = -1, isDrawing = false
const PAIRS = [
  {grid:5, pairs:[{c:'#ef4444',a:[0,0],b:[4,4]},{c:'#3b82f6',a:[0,4],b:[4,0]},{c:'#22c55e',a:[1,1],b:[3,3]},{c:'#eab308',a:[2,0],b:[2,4]}]},
  {grid:5, pairs:[{c:'#ef4444',a:[0,0],b:[3,4]},{c:'#3b82f6',a:[0,3],b:[4,1]},{c:'#22c55e',a:[1,0],b:[4,3]},{c:'#eab308',a:[2,2],b:[0,4]},{c:'#a855f7',a:[4,0],b:[1,4]}]},
  {grid:6, pairs:[{c:'#ef4444',a:[0,0],b:[5,5]},{c:'#3b82f6',a:[0,5],b:[5,0]},{c:'#22c55e',a:[1,2],b:[4,3]},{c:'#eab308',a:[2,0],b:[3,5]},{c:'#a855f7',a:[0,3],b:[5,2]},{c:'#f97316',a:[3,1],b:[1,4]}]},
]
function newGame() {
  const p = PAIRS[(level.value - 1) % PAIRS.length]
  GRID = p.grid; CELL = 400 / GRID; colors = p.pairs
  paths = {}; currentColor = -1; isDrawing = false; completed.value = false
  colors.forEach((pair, i) => { paths[i] = [] })
  connectedCount.value = 0; draw()
}
function cellFromPos(mx, my) {
  const c = Math.floor(mx / CELL), r = Math.floor(my / CELL)
  if (c < 0 || c >= GRID || r < 0 || r >= GRID) return null
  return {r, c}
}
function isEndpoint(r, c) {
  for (let i = 0; i < colors.length; i++) {
    const p = colors[i]
    if ((p.a[0]===r && p.a[1]===c) || (p.b[0]===r && p.b[1]===c)) return i
  }
  return -1
}
function getCellOwner(r, c) {
  for (let i = 0; i < colors.length; i++) {
    if (paths[i].some(p => p.r === r && p.c === c)) return i
  }
  return -1
}
function onDown(e) {
  if (completed.value) return
  const rect = canvas.value.getBoundingClientRect()
  const mx = (e.clientX - rect.left) * (400 / rect.width), my = (e.clientY - rect.top) * (400 / rect.height)
  const cell = cellFromPos(mx, my); if (!cell) return
  const ep = isEndpoint(cell.r, cell.c)
  if (ep >= 0) { currentColor = ep; paths[ep] = [cell]; isDrawing = true }
  else {
    const owner = getCellOwner(cell.r, cell.c)
    if (owner >= 0) { currentColor = owner; paths[owner] = paths[owner].slice(0, paths[owner].findIndex(p=>p.r===cell.r&&p.c===cell.c)+1); isDrawing = true }
  }
  draw()
}
function onMove(e) {
  if (!isDrawing || currentColor < 0) return
  const rect = canvas.value.getBoundingClientRect()
  const mx = (e.clientX - rect.left) * (400 / rect.width), my = (e.clientY - rect.top) * (400 / rect.height)
  const cell = cellFromPos(mx, my); if (!cell) return
  const path = paths[currentColor], last = path[path.length - 1]
  if (last && Math.abs(last.r-cell.r)+Math.abs(last.c-cell.c) === 1 && !path.some(p=>p.r===cell.r&&p.c===cell.c)) {
    // Don't cross other paths (except endpoints of same color)
    const owner = getCellOwner(cell.r, cell.c)
    if (owner >= 0 && owner !== currentColor) return
    path.push(cell)
  }
  checkCompletion(); draw()
}
function onUp() { isDrawing = false; currentColor = -1; checkCompletion() }
function onTouchStart(e) { const t = e.touches[0]; onDown({clientX:t.clientX,clientY:t.clientY}) }
function onTouchMove(e) { const t = e.touches[0]; onMove({clientX:t.clientX,clientY:t.clientY}) }
function undo() { if (currentColor >= 0) paths[currentColor] = []; draw() }
function checkCompletion() {
  let count = 0
  colors.forEach((pair, i) => {
    const path = paths[i]
    if (path.length < 2) return
    const starts = path[0], ends = path[path.length-1]
    const a = pair.a, b = pair.b
    if (((starts.r===a[0]&&starts.c===a[1])&&(ends.r===b[0]&&ends.c===b[1])) ||
        ((starts.r===b[0]&&starts.c===b[1])&&(ends.r===a[0]&&ends.c===a[1]))) count++
  })
  connectedCount.value = count
  if (count === colors.length) { completed.value = true; level.value++ }
}
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  const isDark = document.documentElement.classList.contains('dark')
  ctx.fillStyle = isDark ? '#0f172a' : '#f9fafb'; ctx.fillRect(0, 0, 400, 400)
  // Grid
  ctx.strokeStyle = isDark ? '#1e293b' : '#e5e7eb'; ctx.lineWidth = 1
  for (let i = 0; i <= GRID; i++) { ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,400); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,i*CELL); ctx.lineTo(400,i*CELL); ctx.stroke() }
  // Paths
  colors.forEach((pair, i) => {
    const path = paths[i]; if (path.length < 2) return
    ctx.strokeStyle = pair.c; ctx.lineWidth = CELL * 0.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath(); ctx.moveTo(path[0].c*CELL+CELL/2, path[0].r*CELL+CELL/2)
    for (let j = 1; j < path.length; j++) ctx.lineTo(path[j].c*CELL+CELL/2, path[j].r*CELL+CELL/2)
    ctx.stroke()
  })
  // Endpoints
  colors.forEach(pair => {
    ctx.fillStyle = pair.c
    ctx.beginPath(); ctx.arc(pair.a[1]*CELL+CELL/2, pair.a[0]*CELL+CELL/2, CELL*0.3, 0, Math.PI*2); ctx.fill()
    ctx.beginPath(); ctx.arc(pair.b[1]*CELL+CELL/2, pair.b[0]*CELL+CELL/2, CELL*0.3, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = `${CELL*0.25}px sans-serif`; ctx.textAlign = 'center'
    ctx.fillText('●', pair.a[1]*CELL+CELL/2, pair.a[0]*CELL+CELL/2+4)
    ctx.fillText('●', pair.b[1]*CELL+CELL/2, pair.b[0]*CELL+CELL/2+4)
  })
}
onMounted(() => newGame())
</script>
