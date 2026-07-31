<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">👾 太空侵略者</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="pause" v-else>⏸ 暂停</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🏆 得分: {{ score }}</span>
      <span>❤️ 生命: {{ lives }}</span>
      <span>🌊 波次: {{ wave }}</span>
      <span>🥇 最高: {{ highScore }}</span>
    </div>
    <canvas ref="canvas" width="480" height="500" class="border border-gray-300 dark:border-slate-600 rounded bg-black block max-w-full" style="image-rendering:pixelated;width:min(480px,100%)"></canvas>
    <p class="text-xs text-gray-400 mt-2">← → 移动，空格射击</p>
    <div class="flex gap-2 mt-3 lg:hidden">
      <button class="btn-sm btn-secondary flex-1" @click="keys.left=true" @touchstart="keys.left=true" @touchend="keys.left=false">◀</button>
      <button class="btn-sm btn-primary flex-1" @click="shoot">🔫</button>
      <button class="btn-sm btn-secondary flex-1" @click="keys.right=true" @touchstart="keys.right=true" @touchend="keys.right=false">▶</button>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
const canvas = ref(null)
const CW = 480, CH = 500
const running = ref(false), score = ref(0), lives = ref(3), wave = ref(1)
const highScore = ref(parseInt(localStorage.getItem('invaders_hs') || '0'))
const keys = reactive({ left: false, right: false })
let animFrame, player, bullets, enemies, enemyBullets, enemyDir, enemySpeed, enemyMoveTimer
function initWave() {
  enemies = []; enemyDir = 1; enemySpeed = 0.3 + wave.value * 0.1; enemyMoveTimer = 0
  const rows = Math.min(5 + Math.floor(wave.value / 3), 8)
  const cols = Math.min(8 + Math.floor(wave.value / 5), 11)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({ x: 30 + c * 40, y: 30 + r * 35, w: 28, h: 20, alive: true, type: r < 1 ? 2 : r < 3 ? 1 : 0 })
    }
  }
}
function reset() {
  running.value = false; cancelAnimationFrame(animFrame)
  score.value = 0; lives.value = 3; wave.value = 1
  player = { x: CW / 2 - 18, y: CH - 40, w: 36, h: 20 }
  bullets = []; enemyBullets = []
  initWave(); draw()
}
function start() { running.value = true; animFrame = requestAnimationFrame(gameLoop) }
function pause() { running.value = false; cancelAnimationFrame(animFrame) }
let lastTime = 0, shootCooldown = 0
function shoot() { if (shootCooldown <= 0) { bullets.push({ x: player.x + player.w/2 - 2, y: player.y - 5, w: 4, h: 10 }); shootCooldown = 15 } }
function update() {
  shootCooldown--; if (shootCooldown < 0) shootCooldown = 0
  if (keys.left) player.x = Math.max(0, player.x - 4)
  if (keys.right) player.x = Math.min(CW - player.w, player.x + 4)
  // Player bullets
  bullets.forEach(b => b.y -= 7)
  bullets = bullets.filter(b => b.y > -10)
  // Enemy movement
  enemyMoveTimer += enemySpeed
  if (enemyMoveTimer >= 1) {
    enemyMoveTimer = 0
    let hitEdge = false
    enemies.forEach(e => { if (!e.alive) return; e.x += enemyDir * 15; if (e.x <= 0 || e.x + e.w >= CW) hitEdge = true })
    if (hitEdge) { enemyDir *= -1; enemies.forEach(e => { if (e.alive) e.y += 15 }) }
  }
  // Enemy shooting
  const aliveEnemies = enemies.filter(e => e.alive)
  if (aliveEnemies.length > 0 && Math.random() < 0.02 + wave.value * 0.005) {
    const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
    enemyBullets.push({ x: shooter.x + shooter.w/2 - 2, y: shooter.y + shooter.h, w: 4, h: 10 })
  }
  enemyBullets.forEach(b => b.y += 4 + wave.value * 0.3)
  enemyBullets = enemyBullets.filter(b => b.y < CH + 10)
  // Collision: bullets vs enemies
  bullets.forEach(b => {
    enemies.forEach(e => {
      if (e.alive && b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
        e.alive = false; b.y = -100; score.value += (e.type + 1) * 10
      }
    })
  })
  // Collision: enemy bullets vs player
  enemyBullets.forEach(b => {
    if (b.x < player.x + player.w && b.x + b.w > player.x && b.y < player.y + player.h && b.y + b.h > player.y) {
      b.y = CH + 100; lives.value--
      if (lives.value <= 0) {
        running.value = false
        if (score.value > highScore.value) { highScore.value = score.value; localStorage.setItem('invaders_hs', highScore.value) }
      }
    }
  })
  // Enemy reached bottom
  if (aliveEnemies.some(e => e.y + e.h >= player.y)) {
    running.value = false
    if (score.value > highScore.value) { highScore.value = score.value; localStorage.setItem('invaders_hs', highScore.value) }
  }
  // Next wave
  if (aliveEnemies.length === 0) { wave.value++; initWave() }
}
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CW, CH)
  // Player
  ctx.fillStyle = '#0f0'
  ctx.fillRect(player.x, player.y, player.w, player.h)
  ctx.fillRect(player.x + player.w/2 - 4, player.y - 8, 8, 8)
  // Bullets
  ctx.fillStyle = '#ff0'; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h))
  ctx.fillStyle = '#f44'; enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h))
  // Enemies
  const eColors = ['#0f0', '#0ff', '#f0f']
  enemies.forEach(e => {
    if (!e.alive) return
    ctx.fillStyle = eColors[e.type]
    ctx.fillRect(e.x, e.y, e.w, e.h)
    // Simple alien face
    ctx.fillStyle = '#000'
    ctx.fillRect(e.x + 6, e.y + 5, 4, 4)
    ctx.fillRect(e.x + e.w - 10, e.y + 5, 4, 4)
    ctx.fillRect(e.x + 4, e.y + e.h - 5, 4, 5)
    ctx.fillRect(e.x + e.w - 8, e.y + e.h - 5, 4, 5)
  })
  // Stars
  ctx.fillStyle = '#333'
  for (let i = 0; i < 30; i++) ctx.fillRect((i*73)%CW, (i*137)%CH, 1, 1)
}
function gameLoop(time) {
  if (!running.value) return
  animFrame = requestAnimationFrame(gameLoop)
  if (time - lastTime < 33) return
  lastTime = time; update(); draw()
}
function onKey(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); keys.left = true }
  if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); keys.right = true }
  if (e.key === ' ') { e.preventDefault(); shoot() }
}
function onKeyUp(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false
}
onMounted(() => { reset(); window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp) })
onUnmounted(() => { cancelAnimationFrame(animFrame); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp) })
</script>
