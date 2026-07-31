<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">💣 Hex扫雷</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <span class="btn-sm btn-secondary">💣 {{ mineCount }}</span>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🚩 已标记: {{ flagged }}</span>
      <span>{{ gameOver === 'win' ? '✅ 胜利!' : gameOver === 'lose' ? '💥 失败!' : '' }}</span>
    </div>
    <canvas ref="canvas" width="440" height="400" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 block max-w-full cursor-pointer" style="width:min(440px,100%)" @click="onClick" @contextmenu.prevent="onRightClick"></canvas>
    <p class="text-xs text-gray-400 mt-2">左键揭开，右键标记地雷（六边形网格）</p>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
const canvas = ref(null)
const COLS = 10, ROWS = 8, HEX = 22
const cells = ref([]), gameOver = ref('')
const mineCount = computed(() => cells.value.filter(c => c.mine).length)
const flagged = computed(() => cells.value.filter(c => c.flagged).length)
function hexPos(r, c) {
  const x = c * HEX * 1.75 + (r % 2) * HEX * 0.875 + 30
  const y = r * HEX * 1.52 + 30
  return {x, y}
}
function neighbors(r, c) {
  const dirs = r % 2 === 0
    ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]
    : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]
  return dirs.map(([dr,dc]) => [r+dr, c+dc]).filter(([nr,nc]) => nr>=0 && nr<ROWS && nc>=0 && nc<COLS)
}
function newGame() {
  gameOver.value = ''
  const g = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      g.push({r, c, mine: false, revealed: false, flagged: false, count: 0})
    }
  }
  // Place mines
  let mines = 12
  while (mines > 0) {
    const i = Math.floor(Math.random() * g.length)
    if (!g[i].mine) { g[i].mine = true; mines-- }
  }
  // Count neighbors
  g.forEach(cell => {
    if (cell.mine) return
    cell.count = neighbors(cell.r, cell.c).filter(([nr,nc]) => g[nr*COLS+nc]?.mine).length
  })
  cells.value = g; draw()
}
function reveal(cell) {
  if (cell.revealed || cell.flagged || gameOver.value) return
  cell.revealed = true
  if (cell.mine) { gameOver.value = 'lose'; cells.value.forEach(c => c.revealed = true); draw(); return }
  if (cell.count === 0) {
    neighbors(cell.r, cell.c).forEach(([nr,nc]) => reveal(cells.value[nr*COLS+nc]))
  }
  // Check win
  if (cells.value.filter(c => !c.mine).every(c => c.revealed)) gameOver.value = 'win'
}
function onClick(e) {
  const rect = canvas.value.getBoundingClientRect()
  const mx = (e.clientX - rect.left) * (440/rect.width), my = (e.clientY - rect.top) * (400/rect.height)
  const cell = findCell(mx, my); if (cell) reveal(cell); draw()
}
function onRightClick(e) {
  const rect = canvas.value.getBoundingClientRect()
  const mx = (e.clientX - rect.left) * (440/rect.width), my = (e.clientY - rect.top) * (400/rect.height)
  const cell = findCell(mx, my)
  if (cell && !cell.revealed && !gameOver.value) { cell.flagged = !cell.flagged; draw() }
}
function findCell(mx, my) {
  for (const cell of cells.value) {
    const {x, y} = hexPos(cell.r, cell.c)
    if (Math.hypot(mx-x, my-y) < HEX) return cell
  }
  return null
}
function drawHex(ctx, x, y, r) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI/3 * i - Math.PI/6
    const px = x + r * Math.cos(angle), py = y + r * Math.sin(angle)
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
}
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  const isDark = document.documentElement.classList.contains('dark')
  ctx.fillStyle = isDark ? '#0f172a' : '#f9fafb'; ctx.fillRect(0, 0, 440, 400)
  const NUM_COLORS = ['','#3b82f6','#22c55e','#ef4444','#7c3aed','#f97316','#06b6d4']
  cells.value.forEach(cell => {
    const {x, y} = hexPos(cell.r, cell.c)
    drawHex(ctx, x, y, HEX - 1)
    if (cell.revealed) {
      ctx.fillStyle = cell.mine ? '#ef4444' : (isDark ? '#1e293b' : '#e5e7eb')
      ctx.fill()
      if (cell.mine) { ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💣', x, y+5) }
      else if (cell.count > 0) { ctx.fillStyle = NUM_COLORS[cell.count]; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(cell.count, x, y+5) }
    } else {
      ctx.fillStyle = cell.flagged ? '#fbbf24' : (isDark ? '#475569' : '#9ca3af')
      ctx.fill()
      if (cell.flagged) { ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🚩', x, y+4) }
    }
    ctx.strokeStyle = isDark ? '#334155' : '#d1d5db'; ctx.lineWidth = 1; drawHex(ctx, x, y, HEX-1); ctx.stroke()
  })
}
onMounted(() => newGame())
</script>
