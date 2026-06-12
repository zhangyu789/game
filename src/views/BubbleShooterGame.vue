<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🫧 泡泡龙</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🏆 得分: {{ score }}</span>
      <span>🎯 剩余: {{ bubbleCount }}</span>
      <span>🥇 最高: {{ highScore }}</span>
    </div>
    <canvas ref="canvas" width="400" height="500" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-900 block max-w-full cursor-crosshair" style="width:min(400px,100%)" @mousemove="onMouse" @click="shoot"></canvas>
    <p class="text-xs text-gray-400 mt-2">鼠标瞄准点击发射，消除3个以上同色泡泡</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref(null)
const CW = 400, CH = 500, R = 16, COLS = 12, ROWS_INIT = 8
const COLORS = ['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#f97316']
const running = ref(false), score = ref(0), highScore = ref(parseInt(localStorage.getItem('bubble_hs')||'0'))
const bubbleCount = ref(0)
let bubbles = [], shooter = {x:CW/2,y:CH-40,angle:-Math.PI/2}, bullet = null, animFrame
function initBubbles() {
  bubbles = []
  for (let r = 0; r < ROWS_INIT; r++) {
    const cols = r % 2 === 0 ? COLS : COLS - 1
    const ox = r % 2 === 0 ? R : R * 2
    for (let c = 0; c < cols; c++) {
      bubbles.push({ x: ox + c * R * 2, y: R + r * R * 1.73, color: COLORS[Math.floor(Math.random()*COLORS.length)], alive: true })
    }
  }
  bubbleCount.value = bubbles.filter(b=>b.alive).length
}
function reset() { running.value = false; cancelAnimationFrame(animFrame); score.value = 0; bullet = null; initBubbles(); draw() }
function start() { running.value = true; animFrame = requestAnimationFrame(gameLoop) }
function onMouse(e) {
  const rect = canvas.value.getBoundingClientRect()
  const sx = (e.clientX - rect.left) * (CW / rect.width)
  const sy = (e.clientY - rect.top) * (CH / rect.height)
  shooter.angle = Math.atan2(sy - shooter.y, sx - shooter.x)
  if (shooter.angle > -0.1) shooter.angle = -0.1
  if (shooter.angle < -Math.PI + 0.1) shooter.angle = -Math.PI + 0.1
}
function shoot() {
  if (!running.value || bullet) return
  bullet = { x: shooter.x, y: shooter.y, vx: Math.cos(shooter.angle)*8, vy: Math.sin(shooter.angle)*8, color: COLORS[Math.floor(Math.random()*COLORS.length)] }
}
function findNeighbors(b) {
  return bubbles.filter(o => o.alive && o !== b && Math.hypot(o.x-b.x, o.y-b.y) < R*2.5)
}
function findConnected(b, visited=new Set()) {
  visited.add(b)
  for (const n of findNeighbors(b)) {
    if (!visited.has(n) && n.color === b.color) findConnected(n, visited)
  }
  return visited
}
function findFloating() {
  const attached = new Set()
  bubbles.filter(b => b.alive && b.y <= R * 2).forEach(b => {
    const stack = [b]
    while (stack.length) {
      const cur = stack.pop()
      if (attached.has(cur)) continue
      attached.add(cur)
      findNeighbors(cur).forEach(n => { if (n.alive && !attached.has(n)) stack.push(n) })
    }
  })
  return bubbles.filter(b => b.alive && !attached.has(b))
}
function update() {
  if (!bullet) return
  bullet.x += bullet.vx; bullet.y += bullet.vy
  if (bullet.x <= R || bullet.x >= CW - R) bullet.vx *= -1
  if (bullet.y <= R) {
    // Snap to grid
    bullet.alive = true; bubbles.push(bullet); bullet = null
    resolveMatches(); return
  }
  // Check collision with existing bubbles
  for (const b of bubbles) {
    if (!b.alive) continue
    if (Math.hypot(bullet.x - b.x, bullet.y - b.y) < R * 2) {
      bullet.alive = true; bubbles.push(bullet); bullet = null
      resolveMatches(); return
    }
  }
}
function resolveMatches() {
  const last = bubbles[bubbles.length - 1]
  const connected = findConnected(last)
  if (connected.size >= 3) {
    connected.forEach(b => b.alive = false)
    score.value += connected.size * 10
    // Remove floating
    const floating = findFloating()
    floating.forEach(b => { b.alive = false; score.value += 5 })
    bubbles = bubbles.filter(b => b.alive)
  }
  bubbleCount.value = bubbles.filter(b=>b.alive).length
  if (bubbleCount.value === 0) {
    score.value += 100
    running.value = false
    if (score.value > highScore.value) { highScore.value = score.value; localStorage.setItem('bubble_hs', highScore.value) }
  }
  // Check game over - any bubble too low
  if (bubbles.some(b => b.alive && b.y > CH - 80)) {
    running.value = false
    if (score.value > highScore.value) { highScore.value = score.value; localStorage.setItem('bubble_hs', highScore.value) }
  }
}
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, CW, CH)
  // Bubbles
  bubbles.forEach(b => {
    if (!b.alive) return
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, R-1, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(b.x-4, b.y-4, R/3, 0, Math.PI*2); ctx.fill()
  })
  // Shooter
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(shooter.x, shooter.y, R-1, 0, Math.PI*2); ctx.fill()
  // Aim line
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([5,5])
  ctx.beginPath(); ctx.moveTo(shooter.x, shooter.y)
  ctx.lineTo(shooter.x + Math.cos(shooter.angle)*150, shooter.y + Math.sin(shooter.angle)*150)
  ctx.stroke(); ctx.setLineDash([])
  // Bullet
  if (bullet) {
    ctx.fillStyle = bullet.color; ctx.beginPath(); ctx.arc(bullet.x, bullet.y, R-1, 0, Math.PI*2); ctx.fill()
  }
  // Danger line
  ctx.strokeStyle = 'rgba(239,68,68,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([5,5])
  ctx.beginPath(); ctx.moveTo(0, CH-80); ctx.lineTo(CW, CH-80); ctx.stroke(); ctx.setLineDash([])
}
let lastTime = 0
function gameLoop(time) {
  if (!running.value) return
  animFrame = requestAnimationFrame(gameLoop)
  if (time - lastTime < 16) return
  lastTime = time; update(); draw()
}
onMounted(() => { reset() })
onUnmounted(() => { cancelAnimationFrame(animFrame) })
</script>
