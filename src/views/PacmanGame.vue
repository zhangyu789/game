<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🟡 吃豆人</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="pause" v-else>⏸ 暂停</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🏆 得分: {{ score }}</span>
      <span>❤️ 生命: {{ lives }}</span>
      <span>🥇 最高: {{ highScore }}</span>
    </div>
    <canvas ref="canvas" :width="W" :height="H" class="border border-gray-300 dark:border-slate-600 rounded bg-black block max-w-full" style="image-rendering:pixelated;width:min(448px,100%)"></canvas>
    <p class="text-xs text-gray-400 mt-2">方向键或WASD控制移动</p>
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
const CELL = 16, COLS = 28, ROWS = 31
const W = COLS * CELL, H = ROWS * CELL
const running = ref(false), score = ref(0), lives = ref(3)
const highScore = ref(parseInt(localStorage.getItem('pacman_hs') || '0'))
let animFrame, lastTime = 0
// Map: 0=empty, 1=wall, 2=dot, 3=power pellet, 4=ghost house
const MAP_TEMPLATE = [
  "1111111111111111111111111111",
  "1222222222222112222222222221",
  "1211112111112112111121111121",
  "1311112111112112111121111131",
  "1211112111112112111121111121",
  "1222222222222222222222222221",
  "1211112112111111112112111121",
  "1211112112111111112112111121",
  "1222222112222112222112222221",
  "1111112111110110111121111121",
  "0000012111110110111121000000",
  "0000012110000000001121000000",
  "0000012110111411101121000000",
  "1111112110100000101121111111",
  "0000002000100000100020000000",
  "1111112110100000101121111111",
  "0000012110111111101121000000",
  "0000012110000000001121000000",
  "0000012110111111101121000000",
  "1111112110111111101121111111",
  "1222222222222112222222222221",
  "1211112111112112111121111121",
  "1311112111112112111121111131",
  "1222112222222002222222112221",
  "1112112112111111112112112111",
  "1112112112111111112112112111",
  "1222222112222112222112222221",
  "1211111111112112111111111121",
  "1211111111112112111111111121",
  "1222222222222222222222222221",
  "1111111111111111111111111111"
]
let map = [], pac = {}, ghosts = [], dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}]
let nextDir = {x:0,y:0}, curDir = {x:0,y:0}, frightened = 0, dotCount = 0
const COLORS = ['#ff0000','#ffb8ff','#00ffff','#ffb852']
function initMap() {
  map = []; dotCount = 0
  for (let r = 0; r < ROWS; r++) {
    map[r] = []
    for (let c = 0; c < COLS; c++) {
      const ch = MAP_TEMPLATE[r]?.[c] || '0'
      const v = parseInt(ch)
      map[r][c] = v
      if (v === 2 || v === 3) dotCount++
    }
  }
}
function initEntities() {
  pac = { x: 14, y: 23, px: 14, py: 23, moving: false }
  ghosts = [
    { x: 14, y: 11, color: COLORS[0], mode: 'chase', home: {x:14,y:11} },
    { x: 13, y: 14, color: COLORS[1], mode: 'chase', home: {x:1,y:1} },
    { x: 14, y: 14, color: COLORS[2], mode: 'chase', home: {x:26,y:1} },
    { x: 15, y: 14, color: COLORS[3], mode: 'chase', home: {x:26,y:29} }
  ]
  frightened = 0; curDir = {x:0,y:0}; nextDir = {x:0,y:0}
}
function canMove(x, y) {
  const col = ((x % COLS) + COLS) % COLS
  if (y < 0 || y >= ROWS) return false
  return map[y][col] !== 1
}
function setDir(dx, dy) { nextDir = {x: dx, y: dy} }
function movePac() {
  // Try next direction first
  let nx = pac.x + nextDir.x, ny = pac.y + nextDir.y
  if (canMove(nx, ny)) { curDir = {...nextDir} }
  nx = pac.x + curDir.x; ny = pac.y + curDir.y
  if (canMove(nx, ny)) {
    pac.x = ((nx % COLS) + COLS) % COLS; pac.y = ny
    if (map[pac.y][pac.x] === 2) { map[pac.y][pac.x] = 0; score.value += 10; dotCount-- }
    if (map[pac.y][pac.x] === 3) { map[pac.y][pac.x] = 0; score.value += 50; dotCount--; frightened = 300 }
  }
}
function ghostAI(g) {
  const options = dirs.filter(d => {
    const nx = g.x + d.x, ny = g.y + d.y
    return canMove(nx, ny) && !(d.x === -curDir.x && d.y === -curDir.y)
  })
  if (options.length === 0) return
  let target
  if (frightened > 0 && g.mode === 'frightened') {
    // Random movement when frightened
    const d = options[Math.floor(Math.random() * options.length)]
    g.x = ((g.x + d.x) % COLS + COLS) % COLS; g.y += d.y; return
  }
  // Simple chase: move toward pac or scatter
  target = g.mode === 'chase' ? {x: pac.x, y: pac.y} : g.home
  let best = options[0], bestDist = Infinity
  for (const d of options) {
    const nx = ((g.x + d.x) % COLS + COLS) % COLS, ny = g.y + d.y
    const dist = (nx - target.x) ** 2 + (ny - target.y) ** 2
    if (dist < bestDist) { bestDist = dist; best = d }
  }
  g.x = ((g.x + best.x) % COLS + COLS) % COLS; g.y += best.y
}
function checkCollision() {
  for (const g of ghosts) {
    if (g.x === pac.x && g.y === pac.y) {
      if (frightened > 0 && g.mode === 'frightened') {
        g.x = 14; g.y = 14; g.mode = 'chase'; score.value += 200
      } else {
        lives.value--
        if (lives.value <= 0) {
          running.value = false
          if (score.value > highScore.value) { highScore.value = score.value; localStorage.setItem('pacman_hs', highScore.value) }
        } else { pac.x = 14; pac.y = 23; curDir = {x:0,y:0}; nextDir = {x:0,y:0} }
      }
    }
  }
}
let moveTimer = 0, ghostTimer = 0
function update() {
  moveTimer++
  if (moveTimer >= 4) { moveTimer = 0; movePac() }
  ghostTimer++
  if (ghostTimer >= 6) { ghostTimer = 0; ghosts.forEach(ghostAI) }
  if (frightened > 0) { frightened--; if (frightened === 0) ghosts.forEach(g => g.mode = 'chase') }
  // Toggle scatter/chase periodically
  checkCollision()
  if (dotCount <= 0) { running.value = false }
}
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
  // Draw map
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = map[r][c], x = c * CELL, y = r * CELL
      if (v === 1) {
        ctx.fillStyle = '#1a1aff'; ctx.fillRect(x, y, CELL, CELL)
        ctx.fillStyle = '#0000cc'; ctx.fillRect(x+1, y+1, CELL-2, CELL-2)
      } else if (v === 2) {
        ctx.fillStyle = '#ffb8ae'; ctx.beginPath(); ctx.arc(x+CELL/2, y+CELL/2, 2, 0, Math.PI*2); ctx.fill()
      } else if (v === 3) {
        ctx.fillStyle = '#ffb8ae'; ctx.beginPath(); ctx.arc(x+CELL/2, y+CELL/2, 5, 0, Math.PI*2); ctx.fill()
      }
    }
  }
  // Draw Pac-Man
  const px = pac.x * CELL + CELL/2, py = pac.y * CELL + CELL/2
  ctx.fillStyle = '#ffff00'; ctx.beginPath()
  const angle = curDir.x === 1 ? 0 : curDir.x === -1 ? Math.PI : curDir.y === -1 ? -Math.PI/2 : Math.PI/2
  ctx.arc(px, py, CELL/2-1, angle + 0.3, angle + Math.PI*2 - 0.3); ctx.lineTo(px, py); ctx.fill()
  // Draw ghosts
  ghosts.forEach(g => {
    const gx = g.x * CELL + CELL/2, gy = g.y * CELL + CELL/2
    ctx.fillStyle = frightened > 0 && g.mode === 'frightened' ? (frightened < 100 && frightened % 20 < 10 ? '#fff' : '#2121de') : g.color
    ctx.beginPath(); ctx.arc(gx, gy-2, CELL/2-1, Math.PI, 0)
    ctx.lineTo(gx + CELL/2-1, gy + CELL/2-2)
    for (let i = 0; i < 3; i++) {
      const wx = gx + CELL/2-1 - i*(CELL-2)/3
      ctx.lineTo(wx - (CELL-2)/6, gy + CELL/4-2)
      ctx.lineTo(wx - (CELL-2)/3, gy + CELL/2-2)
    }
    ctx.fill()
    // Eyes
    if (frightened <= 0 || g.mode !== 'frightened') {
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(gx-3, gy-3, 3, 0, Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(gx+3, gy-3, 3, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle = '#00f'
      ctx.beginPath(); ctx.arc(gx-3+curDir.x, gy-3+curDir.y, 1.5, 0, Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(gx+3+curDir.x, gy-3+curDir.y, 1.5, 0, Math.PI*2); ctx.fill()
    }
  })
}
function gameLoop(time) {
  if (!running.value) return
  animFrame = requestAnimationFrame(gameLoop)
  if (time - lastTime < 50) return
  lastTime = time
  update(); draw()
}
function start() { running.value = true; lastTime = 0; animFrame = requestAnimationFrame(gameLoop) }
function pause() { running.value = false; cancelAnimationFrame(animFrame) }
function reset() {
  pause(); score.value = 0; lives.value = 3; frightened = 0
  initMap(); initEntities(); draw()
}
function onKey(e) {
  const m = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key]
  if (m) { e.preventDefault(); setDir(m[0], m[1]) }
}
onMounted(() => { reset(); window.addEventListener('keydown', onKey) })
onUnmounted(() => { cancelAnimationFrame(animFrame); window.removeEventListener('keydown', onKey) })
</script>
