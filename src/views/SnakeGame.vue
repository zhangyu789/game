<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🐍 贪吃蛇</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="pause" v-else>⏸ 暂停</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
      <select v-model="speed" class="btn-sm btn-secondary" @change="reset">
        <option :value="150">慢速</option>
        <option :value="100">普通</option>
        <option :value="60">快速</option>
      </select>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🏆 得分: {{ score }}</span>
      <span>🥇 最高: {{ highScore }}</span>
    </div>
    <canvas ref="canvas" width="400" height="400" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 block max-w-full" style="image-rendering:pixelated;width:min(400px,100%)"></canvas>
    <p class="text-xs text-gray-400 mt-2">方向键或WASD控制，支持手机滑动</p>
    <div class="grid grid-cols-3 gap-1 mt-3 max-w-[160px] lg:hidden">
      <div></div><button class="btn-sm btn-secondary" @click="setDir(0,-1)">▲</button><div></div>
      <button class="btn-sm btn-secondary" @click="setDir(-1,0)">◀</button>
      <button class="btn-sm btn-secondary" @click="setDir(0,1)">▼</button>
      <button class="btn-sm btn-secondary" @click="setDir(1,0)">▶</button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref(null)
const SIZE = 20, COLS = 20, ROWS = 20
let snake, food, dir, nextDir, score, interval
const running = ref(false)
const speed = ref(100)
const scoreR = ref(0)
const highScore = ref(parseInt(localStorage.getItem('snake_hs') || '0'))

function reset() {
  clearInterval(interval)
  running.value = false
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]
  dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 }
  scoreR.value = 0
  placeFood()
  draw()
}
function placeFood() {
  do { food = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) } }
  while (snake.some(s => s.x === food.x && s.y === food.y))
}
function start() {
  running.value = true
  clearInterval(interval)
  interval = setInterval(tick, speed.value)
}
function pause() { running.value = false; clearInterval(interval) }
function tick() {
  dir = { ...nextDir }
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) {
    pause()
    if (scoreR.value > highScore.value) { highScore.value = scoreR.value; localStorage.setItem('snake_hs', highScore.value) }
    return
  }
  snake.unshift(head)
  if (head.x === food.x && head.y === food.y) { scoreR.value += 10; placeFood() }
  else snake.pop()
  draw()
}
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  const cw = canvas.value.width / COLS
  ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#0f172a' : '#f9fafb'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  // Grid
  ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#1e293b' : '#e5e7eb'
  for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(i*cw,0); ctx.lineTo(i*cw,canvas.value.height); ctx.stroke() }
  for (let i = 0; i <= ROWS; i++) { ctx.beginPath(); ctx.moveTo(0,i*cw); ctx.lineTo(canvas.value.width,i*cw); ctx.stroke() }
  // Snake
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? '#22c55e' : '#4ade80'
    ctx.fillRect(s.x*cw+1, s.y*cw+1, cw-2, cw-2)
  })
  // Food
  ctx.fillStyle = '#ef4444'
  ctx.beginPath(); ctx.arc(food.x*cw+cw/2, food.y*cw+cw/2, cw/2-2, 0, Math.PI*2); ctx.fill()
}
function setDir(x, y) { if (dir.x !== -x || dir.y !== -y) nextDir = { x, y } }
function onKey(e) {
  const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0], w:[0,-1], s:[0,1], a:[-1,0], d:[1,0] }
  const m = map[e.key]; if (m) { e.preventDefault(); setDir(m[0], m[1]) }
}
let touchStart = null
function onTouch(e) { touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
function onTouchEnd(e) {
  if (!touchStart) return
  const dx = e.changedTouches[0].clientX - touchStart.x, dy = e.changedTouches[0].clientY - touchStart.y
  if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0); else setDir(0, dy > 0 ? 1 : -1)
  touchStart = null
}
onMounted(() => { reset(); window.addEventListener('keydown', onKey); canvas.value?.addEventListener('touchstart', onTouch); canvas.value?.addEventListener('touchend', onTouchEnd) })
onUnmounted(() => { clearInterval(interval); window.removeEventListener('keydown', onKey) })
</script>
