<template>
  <div class="tool-card max-w-3xl mx-auto">
    <h2 class="tool-header flex items-center gap-2">
      🧬 生命游戏
      <span class="text-xs font-normal text-gray-400 dark:text-gray-500">Conway's Game of Life</span>
      <span v-if="running" class="running-badge">● LIVE</span>
    </h2>

    <!-- 控制栏 -->
    <div class="flex flex-wrap gap-2 mb-3">
      <button class="btn-sm" :class="running ? 'btn-stop' : 'btn-primary'" @click="toggleRun">
        {{ running ? '⏸ 暂停' : '▶ 运行' }}
      </button>
      <button class="btn-sm btn-secondary" @click="step" :disabled="running">⏭ 单步</button>
      <button class="btn-sm btn-secondary" @click="clear">🗑️ 清空</button>
      <button class="btn-sm btn-secondary" @click="random">🎲 随机</button>
      <div class="flex items-center gap-1 ml-auto">
        <kbd class="kbd-hint">Space</kbd>
        <span class="text-[10px] text-gray-400 dark:text-gray-500">运行</span>
        <kbd class="kbd-hint ml-1">N</kbd>
        <span class="text-[10px] text-gray-400 dark:text-gray-500">单步</span>
      </div>
    </div>

    <!-- 预设图案 & 速度 -->
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500 dark:text-gray-400">图案:</span>
        <select v-model="selectedPattern" @change="placePreset" class="preset-select">
          <option value="">选择预设...</option>
          <option v-for="p in presets" :key="p.name" :value="p.name">{{ p.icon }} {{ p.name }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1.5 ml-auto">
        <span class="text-xs text-gray-500 dark:text-gray-400">速度:</span>
        <input type="range" min="20" max="300" v-model.number="speedVal" @input="onSpeedChange" class="speed-slider" />
        <span class="text-xs text-gray-400 w-12 text-right tabular-nums">{{ speedVal }}ms</span>
      </div>
    </div>

    <!-- 配色 & 工具栏 -->
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <span class="text-xs text-gray-500 dark:text-gray-400">配色:</span>
      <button v-for="t in themes" :key="t.id" @click="colorTheme=t.id"
        class="theme-dot" :class="{ 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-slate-800': colorTheme===t.id }"
        :style="{ background: t.preview }" :title="t.label"></button>
      <div class="flex items-center gap-1.5 ml-auto">
        <button class="tool-btn" :class="{ active: showGrid }" @click="showGrid=!showGrid" title="网格">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="1" width="12" height="12" rx="1"/><line x1="5" y1="1" x2="5" y2="13"/><line x1="9" y1="1" x2="9" y2="13"/><line x1="1" y1="5" x2="13" y2="5"/><line x1="1" y1="9" x2="13" y2="9"/>
          </svg>
        </button>
        <button class="tool-btn" :class="{ active: showGlow }" @click="showGlow=!showGlow" title="发光">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="3"/><line x1="7" y1="1" x2="7" y2="3"/><line x1="7" y1="11" x2="7" y2="13"/><line x1="1" y1="7" x2="3" y2="7"/><line x1="11" y1="7" x2="13" y2="7"/>
          </svg>
        </button>
        <div class="w-px h-4 bg-gray-200 dark:bg-slate-600 mx-0.5"></div>
        <span class="text-xs text-gray-500 dark:text-gray-400">格子:</span>
        <select v-model.number="gridSize" @change="onGridSizeChange" class="preset-select w-16">
          <option :value="40">40</option>
          <option :value="50">50</option>
          <option :value="60">60</option>
          <option :value="80">80</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <!-- 画布 -->
    <div class="canvas-wrapper">
      <canvas ref="canvas" :width="canvasSize" :height="canvasSize"
        class="life-canvas"
        @mousedown="onMouseDown" @mousemove="onDrag" @mouseup="drawing=false"
        @mouseleave="onMouseLeave"
        @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="drawing=false">
      </canvas>
      <!-- 悬浮提示 -->
      <div v-if="hoverCell" class="hover-tooltip">
        ({{ hoverCell.r }}, {{ hoverCell.c }})
        <template v-if="grid[hoverCell.r]?.[hoverCell.c]">
          · 年龄 {{ ageGrid[hoverCell.r][hoverCell.c] }}
        </template>
      </div>
    </div>

    <!-- 统计信息 + 人口曲线 -->
    <div class="stats-section">
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-icon">🧬</span>
          <span class="stat-label">代数</span>
          <span class="stat-value">{{ gen }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🟢</span>
          <span class="stat-label">存活</span>
          <span class="stat-value text-green-500">{{ alive }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📈</span>
          <span class="stat-label">峰值</span>
          <span class="stat-value text-amber-500">{{ peak }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">💀</span>
          <span class="stat-label">死亡</span>
          <span class="stat-value text-red-400">{{ totalDeaths }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⚡</span>
          <span class="stat-label">密度</span>
          <span class="stat-value text-blue-500">{{ density }}%</span>
        </div>
      </div>
      <!-- 人口曲线 -->
      <div class="chart-wrapper">
        <canvas ref="chartCanvas" width="260" height="60" class="pop-chart"></canvas>
        <span class="chart-label">人口趋势</span>
      </div>
    </div>

    <p class="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
      点击/拖拽绘制 · 颜色随年龄渐变 · 边界环绕 ·
      <kbd class="kbd-hint">Space</kbd> 运行 · <kbd class="kbd-hint">N</kbd> 单步 · <kbd class="kbd-hint">C</kbd> 清空 · <kbd class="kbd-hint">R</kbd> 随机
    </p>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

const canvasSize = 540
let CELL, SIZE
const canvas = ref(null)
const chartCanvas = ref(null)
let grid, ageGrid, next, nextAge, interval, fadeGrid
const running = ref(false)
const gen = ref(0)
const speedVal = ref(100)
const colorTheme = ref('emerald')
const selectedPattern = ref('')
const alive = ref(0)
const peak = ref(0)
const totalDeaths = ref(0)
const showGrid = ref(true)
const showGlow = ref(true)
const gridSize = ref(60)
const hoverCell = ref(null)
let drawing = false, drawVal = 1

// 人口历史
const popHistory = ref([])
const MAX_HISTORY = 200

const density = computed(() => {
  const total = SIZE * SIZE
  return total > 0 ? ((alive.value / total) * 100).toFixed(1) : '0.0'
})

const themes = [
  { id: 'emerald', label: '翡翠', preview: 'linear-gradient(135deg, #34d399, #059669)' },
  { id: 'cyan', label: '青蓝', preview: 'linear-gradient(135deg, #22d3ee, #0891b2)' },
  { id: 'violet', label: '紫罗兰', preview: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
  { id: 'rose', label: '玫瑰', preview: 'linear-gradient(135deg, #fb7185, #e11d48)' },
  { id: 'amber', label: '琥珀', preview: 'linear-gradient(135deg, #fbbf24, #d97706)' },
  { id: 'plasma', label: '等离子', preview: 'linear-gradient(135deg, #c084fc, #06b6d4)' },
]

/* 颜色映射 - HSL 过渡更平滑 */
function hsl(h, s, l) { return `hsl(${h},${s}%,${l}%)` }

const colorMaps = {
  emerald: (age) => {
    const t = Math.min(age / 40, 1)
    return hsl(155 - t * 20, 72 - t * 15, 55 - t * 18)
  },
  cyan: (age) => {
    const t = Math.min(age / 40, 1)
    return hsl(185 - t * 10, 78 - t * 12, 52 - t * 16)
  },
  violet: (age) => {
    const t = Math.min(age / 40, 1)
    return hsl(265 - t * 15, 75 - t * 10, 65 - t * 20)
  },
  rose: (age) => {
    const t = Math.min(age / 40, 1)
    return hsl(350 + t * 10, 82 - t * 10, 60 - t * 18)
  },
  amber: (age) => {
    const t = Math.min(age / 40, 1)
    return hsl(38 + t * 5, 90 - t * 10, 55 - t * 18)
  },
  plasma: (age) => {
    const t = Math.min(age / 40, 1)
    return hsl(280 - t * 80, 78 - t * 5, 62 - t * 18)
  },
}

/* 预设图案 */
const presets = [
  { name: '滑翔机', icon: '✈️', cells: [[0,1],[1,2],[2,0],[2,1],[2,2]] },
  { name: '轻量飞船', icon: '🚀', cells: [[0,1],[0,4],[1,0],[2,0],[2,4],[3,0],[3,1],[3,2],[3,3]] },
  { name: '脉冲星', icon: '💫', cells: (function(){
    const c=[]; const q=[[2,0],[3,0],[4,0],[0,2],[0,3],[0,4],[5,2],[5,3],[5,4],[2,5],[3,5],[4,5]];
    for(const [r,cc] of q){c.push([r,cc]);c.push([r,12-cc]);c.push([12-r,cc]);c.push([12-r,12-cc])}
    return [...new Set(c.map(x=>x.join(',')))].map(s=>s.split(',').map(Number))
  })() },
  { name: '高斯帕枪', icon: '🔫', cells: [
    [0,24],[1,22],[1,24],[2,12],[2,13],[2,20],[2,21],[2,34],[2,35],
    [3,11],[3,15],[3,20],[3,21],[3,34],[3,35],[4,0],[4,1],[4,10],
    [4,16],[4,20],[4,21],[5,0],[5,1],[5,10],[5,14],[5,16],[5,17],
    [5,22],[5,24],[6,10],[6,16],[6,24],[7,11],[7,15],[8,12],[8,13]
  ] },
  { name: '五角星', icon: '⭐', cells: [[0,2],[0,4],[1,1],[1,3],[1,5],[2,0],[2,2],[2,4],[2,6],[3,1],[3,3],[3,5],[4,2],[4,4]] },
  { name: 'R-pentomino', icon: '🧩', cells: [[0,1],[0,2],[1,0],[1,1],[2,1]] },
  { name: '阿卡枪', icon: '🏹', cells: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,4],[2,0],[2,2],[2,4],[3,0],[3,4],[4,0],[4,1],[4,2],[4,3],[4,4]] },
  { name: '十字', icon: '✚', cells: [[0,2],[1,2],[2,0],[2,1],[2,2],[2,3],[2,4],[3,2],[4,2]] },
  { name: '蜂巢', icon: '🐝', cells: [[0,1],[0,2],[1,0],[1,3],[2,0],[2,3],[3,1],[3,2]] },
]

function recalcCell() {
  SIZE = gridSize.value
  CELL = canvasSize / SIZE
}

function placePreset() {
  const p = presets.find(x => x.name === selectedPattern.value)
  if (!p) return
  clear()
  const maxR = Math.max(...p.cells.map(c => c[0]))
  const maxC = Math.max(...p.cells.map(c => c[1]))
  const offR = Math.floor(SIZE / 2) - Math.floor(maxR / 2)
  const offC = Math.floor(SIZE / 2) - Math.floor(maxC / 2)
  for (const [r, c] of p.cells) {
    const nr = (offR + r + SIZE) % SIZE
    const nc = (offC + c + SIZE) % SIZE
    grid[nr][nc] = 1
    ageGrid[nr][nc] = 1
  }
  selectedPattern.value = ''
  countAlive()
  draw()
}

function createGrid() {
  return Array.from({ length: SIZE }, () => new Float32Array(SIZE))
}

function init() {
  recalcCell()
  grid = createGrid(); ageGrid = createGrid(); fadeGrid = createGrid()
  gen.value = 0; alive.value = 0; peak.value = 0; totalDeaths.value = 0
  popHistory.value = []
  draw(); drawChart()
}

function clear() {
  running.value = false; clearInterval(interval)
  grid = createGrid(); ageGrid = createGrid(); fadeGrid = createGrid()
  gen.value = 0; alive.value = 0; peak.value = 0; totalDeaths.value = 0
  popHistory.value = []
  draw(); drawChart()
}

function random() {
  grid = Array.from({ length: SIZE }, () =>
    Float32Array.from({ length: SIZE }, () => Math.random() < 0.28 ? 1 : 0)
  )
  ageGrid = Array.from({ length: SIZE }, (_, r) =>
    Float32Array.from({ length: SIZE }, (_, c) => grid[r][c] ? 1 : 0)
  )
  fadeGrid = createGrid()
  gen.value = 0; peak.value = 0; totalDeaths.value = 0
  popHistory.value = []
  countAlive()
  draw()
}

function onGridSizeChange() {
  recalcCell()
  clear()
}

function countAlive() {
  let a = 0
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c]) a++
  alive.value = a
  if (a > peak.value) peak.value = a
}

function step() {
  next = createGrid(); nextAge = createGrid()
  let deaths = 0
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    let n = 0
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      n += grid[(r + dr + SIZE) % SIZE][(c + dc + SIZE) % SIZE]
    }
    if (grid[r][c]) {
      next[r][c] = (n === 2 || n === 3) ? 1 : 0
      if (!next[r][c]) { deaths++; fadeGrid[r][c] = 0.6 }
      nextAge[r][c] = next[r][c] ? ageGrid[r][c] + 1 : 0
    } else {
      next[r][c] = n === 3 ? 1 : 0
      nextAge[r][c] = next[r][c] ? 1 : 0
    }
  }
  // 衰减上一帧的 fade
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (!next[r][c] && fadeGrid[r][c] > 0) {
      fadeGrid[r][c] = Math.max(0, fadeGrid[r][c] - 0.15)
    }
  }
  grid = next; ageGrid = nextAge
  gen.value++
  totalDeaths.value += deaths
  countAlive()
  // 记录历史
  popHistory.value.push(alive.value)
  if (popHistory.value.length > MAX_HISTORY) popHistory.value.shift()
  draw()
  drawChart()
}

function toggleRun() {
  running.value = !running.value
  if (running.value) {
    interval = setInterval(step, speedVal.value)
  } else {
    clearInterval(interval)
  }
}

function onSpeedChange() {
  if (running.value) {
    clearInterval(interval)
    interval = setInterval(step, speedVal.value)
  }
}

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  const isDark = document.documentElement.classList.contains('dark')

  // 背景
  ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc'
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // 网格线
  if (showGrid.value) {
    ctx.strokeStyle = isDark ? 'rgba(51,65,85,0.35)' : 'rgba(226,232,240,0.7)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvasSize); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvasSize, i * CELL); ctx.stroke()
    }
  }

  // 细胞
  const getColor = colorMaps[colorTheme.value] || colorMaps.emerald
  const pad = CELL > 6 ? 1 : 0
  const radius = CELL > 6 ? 2 : 1
  ctx.shadowBlur = 0

  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    const x = c * CELL + pad
    const y = r * CELL + pad
    const w = CELL - pad * 2
    const h = CELL - pad * 2
    if (w <= 0 || h <= 0) continue

    if (grid[r][c]) {
      const age = ageGrid[r][c]
      const color = getColor(age)

      if (showGlow.value && CELL > 4) {
        ctx.shadowColor = color
        ctx.shadowBlur = age > 8 ? 8 : age > 3 ? 5 : 3
      }

      ctx.fillStyle = color
      if (radius > 0 && CELL > 5) {
        roundRect(ctx, x, y, w, h, radius)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, w, h)
      }
      ctx.shadowBlur = 0

      // 新生细胞脉冲效果 (age < 3)
      if (age <= 2 && CELL > 6 && showGlow.value) {
        ctx.fillStyle = `rgba(255,255,255,${0.25 - age * 0.08})`
        if (radius > 0) {
          roundRect(ctx, x, y, w, h, radius)
          ctx.fill()
        } else {
          ctx.fillRect(x, y, w, h)
        }
      }
    } else if (fadeGrid[r][c] > 0 && CELL > 4) {
      // 死亡淡出效果
      const alpha = fadeGrid[r][c]
      const color = getColor(1)
      ctx.fillStyle = color
      ctx.globalAlpha = alpha * 0.3
      if (radius > 0) {
        roundRect(ctx, x, y, w, h, radius)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, w, h)
      }
      ctx.globalAlpha = 1
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/* 人口曲线 */
function drawChart() {
  const cvs = chartCanvas.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')
  const W = cvs.width, H = cvs.height
  const isDark = document.documentElement.classList.contains('dark')

  ctx.clearRect(0, 0, W, H)

  const data = popHistory.value
  if (data.length < 2) return

  const max = Math.max(...data, 1)
  const step = W / (MAX_HISTORY - 1)

  // 渐变填充
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  const themeColor = getThemeBaseColor(colorTheme.value)
  grad.addColorStop(0, themeColor + '40')
  grad.addColorStop(1, themeColor + '05')

  ctx.beginPath()
  ctx.moveTo(0, H)
  for (let i = 0; i < data.length; i++) {
    const x = i * step
    const y = H - (data[i] / max) * (H - 4)
    if (i === 0) ctx.lineTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.lineTo((data.length - 1) * step, H)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // 线条
  ctx.beginPath()
  for (let i = 0; i < data.length; i++) {
    const x = i * step
    const y = H - (data[i] / max) * (H - 4)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = themeColor
  ctx.lineWidth = 1.5
  ctx.stroke()

  // 当前值标签
  if (data.length > 0) {
    const last = data[data.length - 1]
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b'
    ctx.font = '9px system-ui'
    ctx.textAlign = 'right'
    ctx.fillText(`${last}`, W - 2, 10)
    ctx.fillText(`max:${max}`, W - 2, 20)
  }
}

function getThemeBaseColor(id) {
  const map = { emerald: '#10b981', cyan: '#06b6d4', violet: '#8b5cf6', rose: '#f43f5e', amber: '#f59e0b', plasma: '#a855f7' }
  return map[id] || map.emerald
}

function cellAt(e) {
  const rect = canvas.value.getBoundingClientRect()
  const scale = canvasSize / rect.width
  return {
    c: Math.floor((e.clientX - rect.left) * scale / CELL),
    r: Math.floor((e.clientY - rect.top) * scale / CELL)
  }
}

function onMouseDown(e) {
  const { r, c } = cellAt(e)
  if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
    grid[r][c] = grid[r][c] ? 0 : 1
    ageGrid[r][c] = grid[r][c] ? 1 : 0
    drawVal = grid[r][c]
    drawing = true
    countAlive()
    draw()
  }
}

function onDrag(e) {
  if (!drawing) return
  const { r, c } = cellAt(e)
  if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
    grid[r][c] = drawVal
    ageGrid[r][c] = drawVal ? 1 : 0
    countAlive()
    draw()
  }
}

function onMouseLeave(e) {
  drawing = false
  hoverCell.value = null
}

function onTouchStart(e) {
  const touch = e.touches[0]
  onMouseDown({ clientX: touch.clientX, clientY: touch.clientY })
}

function onTouchMove(e) {
  const touch = e.touches[0]
  onDrag({ clientX: touch.clientX, clientY: touch.clientY })
}

/* 鼠标悬浮 */
function onCanvasMouseMove(e) {
  const { r, c } = cellAt(e)
  if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
    hoverCell.value = { r, c }
  } else {
    hoverCell.value = null
  }
}

/* 键盘快捷键 */
function handleKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return
  if (e.code === 'Space') { e.preventDefault(); toggleRun() }
  if (e.key === 'n' || e.key === 'N') { if (!running.value) step() }
  if (e.key === 'c' || e.key === 'C') { clear() }
  if (e.key === 'r' || e.key === 'R') { random() }
  if (e.key === 'g' || e.key === 'G') { showGrid.value = !showGrid.value; draw() }
}

watch(colorTheme, () => { draw(); drawChart() })
watch(showGrid, () => draw())
watch(showGlow, () => draw())

let keyHandler
onMounted(() => {
  init()
  keyHandler = handleKeydown
  window.addEventListener('keydown', keyHandler)
  // 悬浮事件
  canvas.value?.addEventListener('mousemove', onCanvasMouseMove)
})
onUnmounted(() => {
  clearInterval(interval)
  window.removeEventListener('keydown', keyHandler)
})
</script>

<style scoped>
.life-canvas {
  display: block;
  max-width: 540px;
  width: 100%;
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 12px;
  cursor: crosshair;
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.3), 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s;
}
:deep(.dark) .life-canvas {
  box-shadow: 0 0 0 1px rgba(71, 85, 105, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3);
}
.canvas-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}
.hover-tooltip {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  @apply text-[10px] px-2 py-0.5 rounded-full;
  background: rgba(0,0,0,0.6);
  color: #fff;
  pointer-events: none;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}
.running-badge {
  @apply text-xs font-bold ml-1;
  color: #ef4444;
  animation: pulse-badge 1.5s ease-in-out infinite;
}
@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.preset-select {
  @apply text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600
    bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
    focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer;
}
.speed-slider {
  @apply w-20 h-1.5 rounded-full appearance-none cursor-pointer;
  background: linear-gradient(to right, #22c55e, #eab308, #ef4444);
}
.speed-slider::-webkit-slider-thumb {
  @apply appearance-none w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-primary-500 cursor-pointer;
}
.speed-slider::-moz-range-thumb {
  @apply w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-primary-500 cursor-pointer border-0;
}
.theme-dot {
  @apply w-5 h-5 rounded-full cursor-pointer transition-all hover:scale-110;
  border: 2px solid rgba(255,255,255,0.6);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.tool-btn {
  @apply p-1.5 rounded-lg transition-colors;
  color: #94a3b8;
}
.tool-btn:hover {
  @apply bg-gray-100 dark:bg-slate-700;
  color: #64748b;
}
.tool-btn.active {
  @apply bg-primary-50 dark:bg-primary-900/30;
  color: #3b82f6;
}
.btn-stop {
  @apply px-2.5 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200;
}
.kbd-hint {
  @apply inline-block px-1 py-0.5 text-[10px] font-mono rounded;
  background: rgba(148,163,184,0.15);
  color: #94a3b8;
  border: 1px solid rgba(148,163,184,0.25);
  line-height: 1;
}
.stats-section {
  @apply flex flex-col sm:flex-row gap-2 mt-3;
}
.stats-bar {
  @apply flex-1 flex justify-around py-2.5 px-2 rounded-xl;
  background: linear-gradient(135deg, rgba(241,245,249,0.8), rgba(248,250,252,0.6));
  border: 1px solid rgba(226,232,240,0.6);
}
:deep(.dark) .stats-bar {
  background: linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.6));
  border-color: rgba(51,65,85,0.6);
}
.stat-item {
  @apply flex flex-col items-center gap-0.5;
}
.stat-icon { @apply text-xs; }
.stat-label { @apply text-[10px] text-gray-400 dark:text-gray-500; }
.stat-value { @apply text-xs font-bold text-gray-700 dark:text-gray-200 tabular-nums; }
.chart-wrapper {
  @apply flex-1 relative rounded-xl overflow-hidden px-2 py-1.5;
  background: linear-gradient(135deg, rgba(241,245,249,0.8), rgba(248,250,252,0.6));
  border: 1px solid rgba(226,232,240,0.6);
  min-height: 60px;
}
:deep(.dark) .chart-wrapper {
  background: linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.6));
  border-color: rgba(51,65,85,0.6);
}
.pop-chart {
  display: block;
  width: 100%;
  height: 100%;
}
.chart-label {
  position: absolute;
  top: 3px;
  left: 6px;
  @apply text-[9px] text-gray-400 dark:text-gray-500;
  pointer-events: none;
}
</style>
