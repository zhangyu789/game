<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🦕 恐龙快跑</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🏆 得分: {{ Math.floor(score) }}</span>
      <span>🥇 最高: {{ highScore }}</span>
    </div>
    <canvas ref="canvas" width="600" height="200" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 block max-w-full" style="width:min(600px,100%)"></canvas>
    <p class="text-xs text-gray-400 mt-2">空格/↑ 跳跃，↓ 蹲伏</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref(null)
const CW = 600, CH = 200, GROUND = 160
const running = ref(false), score = ref(0)
const highScore = ref(parseInt(localStorage.getItem('dino_hs')||'0'))
let animFrame, dino, obstacles, clouds, speed, frameCount
function reset() {
  running.value = false; cancelAnimationFrame(animFrame)
  score.value = 0; speed = 5; frameCount = 0
  dino = { x: 60, y: GROUND, vy: 0, w: 30, h: 40, ducking: false, grounded: true }
  obstacles = []; clouds = []
  for (let i = 0; i < 5; i++) clouds.push({ x: Math.random()*CW, y: 20+Math.random()*60, w: 40+Math.random()*30 })
  draw()
}
function start() { running.value = true; animFrame = requestAnimationFrame(gameLoop) }
function jump() {
  if (dino.grounded) { dino.vy = -12; dino.grounded = false }
}
function duck(v) { dino.ducking = v }
function spawnObstacle() {
  const type = Math.random()
  if (type < 0.5) {
    // Cactus
    const h = 25 + Math.random() * 25
    obstacles.push({ x: CW + 20, y: GROUND + 40 - h, w: 15 + Math.random()*15, h, type: 'cactus' })
  } else if (type < 0.8) {
    // Bird (at different heights)
    const heights = [GROUND - 10, GROUND - 40, GROUND + 10]
    obstacles.push({ x: CW + 20, y: heights[Math.floor(Math.random()*3)], w: 25, h: 20, type: 'bird' })
  } else {
    // Double cactus
    obstacles.push({ x: CW + 20, y: GROUND, w: 30, h: 40, type: 'cactus' })
  }
}
function update() {
  frameCount++
  speed = 5 + score.value / 200
  score.value += 0.1
  // Dino physics
  dino.vy += 0.6
  dino.y += dino.vy
  if (dino.y >= GROUND) { dino.y = GROUND; dino.vy = 0; dino.grounded = true }
  const dh = dino.ducking ? 25 : 40
  dino.h = dh
  // Obstacles
  if (frameCount % Math.max(30, 80 - Math.floor(speed*3)) === 0) spawnObstacle()
  obstacles.forEach(o => o.x -= speed)
  obstacles = obstacles.filter(o => o.x > -50)
  // Clouds
  clouds.forEach(c => { c.x -= speed * 0.3; if (c.x < -50) { c.x = CW + 50; c.y = 20 + Math.random()*60 } })
  // Collision
  const dx = dino.x, dy = dino.y + 40 - dh, dw = dino.w, dht = dh
  for (const o of obstacles) {
    if (dx < o.x + o.w && dx + dw > o.x && dy < o.y + o.h && dy + dht > o.y) {
      running.value = false
      if (Math.floor(score.value) > highScore.value) { highScore.value = Math.floor(score.value); localStorage.setItem('dino_hs', highScore.value) }
      return
    }
  }
}
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  const isDark = document.documentElement.classList.contains('dark')
  ctx.fillStyle = isDark ? '#0f172a' : '#f9fafb'; ctx.fillRect(0, 0, CW, CH)
  const fg = isDark ? '#e2e8f0' : '#374151'
  // Ground
  ctx.strokeStyle = fg; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, GROUND+40); ctx.lineTo(CW, GROUND+40); ctx.stroke()
  // Clouds
  ctx.fillStyle = isDark ? '#334155' : '#d1d5db'
  clouds.forEach(c => { ctx.beginPath(); ctx.arc(c.x, c.y, 12, 0, Math.PI*2); ctx.arc(c.x+15, c.y-5, 15, 0, Math.PI*2); ctx.arc(c.x+30, c.y, 12, 0, Math.PI*2); ctx.fill() })
  // Dino
  ctx.fillStyle = fg
  const dy = dino.y + 40 - dino.h
  ctx.fillRect(dino.x, dy, dino.w, dino.h)
  // Eye
  ctx.fillStyle = isDark ? '#0f172a' : '#fff'
  ctx.fillRect(dino.x + dino.w - 8, dy + 4, 5, 5)
  // Legs (animated)
  if (dino.grounded && running.value) {
    const legOff = Math.floor(frameCount / 5) % 2
    ctx.fillStyle = fg
    ctx.fillRect(dino.x + 5 + legOff*8, dino.y + 40, 5, 8)
    ctx.fillRect(dino.x + 15 - legOff*8, dino.y + 40, 5, 8)
  }
  // Obstacles
  obstacles.forEach(o => {
    if (o.type === 'cactus') {
      ctx.fillStyle = '#22c55e'; ctx.fillRect(o.x, o.y, o.w, o.h)
      ctx.fillRect(o.x - 5, o.y + o.h * 0.3, 5, o.h * 0.3)
      ctx.fillRect(o.x + o.w, o.y + o.h * 0.2, 5, o.h * 0.3)
    } else {
      ctx.fillStyle = '#6366f1'; ctx.fillRect(o.x, o.y, o.w, o.h)
      // Wing animation
      const wingUp = Math.floor(frameCount / 8) % 2
      ctx.fillRect(o.x + 5, o.y - (wingUp ? 10 : 0), 15, 5)
    }
  })
}
let lastTime = 0
function gameLoop(time) {
  if (!running.value) return
  animFrame = requestAnimationFrame(gameLoop)
  if (time - lastTime < 33) return
  lastTime = time; update(); draw()
}
function onKey(e) {
  if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump() }
  if (e.key === 'ArrowDown') { e.preventDefault(); duck(true) }
}
function onKeyUp(e) { if (e.key === 'ArrowDown') duck(false) }
onMounted(() => { reset(); window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp) })
onUnmounted(() => { cancelAnimationFrame(animFrame); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp) })
</script>
