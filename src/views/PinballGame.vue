<template>
  <div class="tool-card max-w-2xl mx-auto">
    <!-- 标题区域 -->
    <div class="header-wrapper">
      <h2 class="tool-header flex items-center gap-3 relative">
        <span class="game-icon">🎱</span>
        <div class="title-text">
          <span class="title-main">弹珠台</span>
          <span class="title-sub">挑战高分！</span>
        </div>
        <div class="header-glow"></div>
      </h2>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">
        <span>▶</span> 开始
      </button>
      <button class="btn-sm btn-secondary" @click="launch" v-if="!ballInPlay" :disabled="running && !ballReady">
        <span>🚀</span> 发射
      </button>
      <button class="btn-sm btn-secondary" @click="reset">
        <span>🔄</span> 重新开始
      </button>
      <button class="btn-sm btn-secondary" @click="toggleSound" :class="{ '!bg-amber-500': soundEnabled }">
        <span>{{ soundEnabled ? '🔊' : '🔇' }}</span> 音效
      </button>
    </div>

    <!-- 分数面板 -->
    <div class="stats-panel mb-3">
      <div class="stat-item stat-score">
        <span class="stat-icon">🏆</span>
        <span class="stat-label">得分</span>
        <span class="stat-value">{{ score.toLocaleString() }}</span>
      </div>
      <div class="stat-item stat-balls">
        <span class="stat-icon">🎱</span>
        <span class="stat-label">剩余</span>
        <span class="stat-value balls-value">
          <span v-for="i in 3" :key="i" class="ball-indicator" :class="{ 'ball-active': i <= balls }">●</span>
        </span>
      </div>
      <div class="stat-item stat-high">
        <span class="stat-icon">🥇</span>
        <span class="stat-label">最高</span>
        <span class="stat-value">{{ highScore.toLocaleString() }}</span>
      </div>
      <div class="stat-item stat-combo" v-if="combo > 1">
        <span class="stat-icon">🔥</span>
        <span class="stat-label">连击</span>
        <span class="stat-value combo-text">x{{ combo }}</span>
      </div>
    </div>

    <!-- 游戏画布 -->
    <div class="canvas-wrapper">
      <canvas ref="canvas" width="360" height="540" class="game-canvas"></canvas>
      <!-- 开始覆盖层 -->
      <Transition name="fade">
        <div v-if="!running && balls > 0" class="start-overlay">
          <div class="start-content">
            <span class="start-icon">🎱</span>
            <div class="start-title">弹珠台</div>
            <div class="start-subtitle">点击「开始」按钮开始游戏</div>
          </div>
        </div>
      </Transition>
      <!-- 游戏结束覆盖层 -->
      <Transition name="fade">
        <div v-if="balls <= 0" class="gameover-overlay">
          <div class="gameover-content">
            <span class="gameover-icon">🎯</span>
            <div class="gameover-title">游戏结束</div>
            <div class="gameover-score">最终得分: {{ score.toLocaleString() }}</div>
            <div v-if="isNewHighScore" class="gameover-highlight">🎉 新纪录！</div>
            <button class="btn-sm btn-primary mt-4" @click="reset">🔄 再来一局</button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 操作提示 -->
    <div class="controls-hint">
      <div class="hint-item">
        <span class="hint-key">←</span>
        <span class="hint-key">→</span>
        <span class="hint-text">或 A/D 控制挡板</span>
      </div>
      <div class="hint-item">
        <span class="hint-key">空格</span>
        <span class="hint-text">发射弹珠</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
const CW = 360, CH = 540
const running = ref(false), score = ref(0), balls = ref(3), combo = ref(1)
const highScore = ref(parseInt(localStorage.getItem('pinball_hs') || '0'))
const soundEnabled = ref(true)
let animFrame, ball, flipperL = 0, flipperR = 0, keys = {}
const GRAVITY = 0.18, FLIPPER_LEN = 52, FLIPPER_SPEED = 0.18
let bumpers = [], walls = [], targets = [], bonusZones = [], particles = []
let lastHitTime = 0, isNewHighScore = ref(false)

// 音频上下文
let audioContext = null
function playSound(freq, duration, type = 'sine') {
  if (!soundEnabled.value) return
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
    oscillator.type = type
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  } catch (e) {}
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
}

const ballInPlay = computed(() => ball?.inPlay)
const ballReady = computed(() => !ball?.inPlay && running.value)

function initTable() {
  // 弹射器
  bumpers = [
    { x: 100, y: 150, r: 20, score: 100, color: '#6366f1', hitColor: '#fbbf24' },
    { x: 260, y: 150, r: 20, score: 100, color: '#6366f1', hitColor: '#fbbf24' },
    { x: 180, y: 100, r: 25, score: 150, color: '#ec4899', hitColor: '#fbbf24' },
    { x: 130, y: 250, r: 18, score: 75, color: '#22c55e', hitColor: '#fbbf24' },
    { x: 230, y: 250, r: 18, score: 75, color: '#22c55e', hitColor: '#fbbf24' },
    { x: 180, y: 200, r: 22, score: 120, color: '#f59e0b', hitColor: '#fbbf24' },
    // 新增弹射器
    { x: 60, y: 320, r: 16, score: 50, color: '#06b6d4', hitColor: '#fbbf24' },
    { x: 300, y: 320, r: 16, score: 50, color: '#06b6d4', hitColor: '#fbbf24' },
  ]
  
  // 墙壁
  walls = [
    { x1: 30, y1: 400, x2: 30, y2: 100 },
    { x1: 330, y1: 400, x2: 330, y2: 100 },
    { x1: 30, y1: 100, x2: 180, y2: 30 },
    { x1: 330, y1: 100, x2: 180, y2: 30 },
    // 底部斜坡
    { x1: 60, y1: 400, x2: 100, y2: 460 },
    { x1: 300, y1: 400, x2: 260, y2: 460 },
  ]
  
  // 目标方块
  targets = [
    { x: 85, y: 180, w: 12, h: 18, score: 200, active: true, color: '#ef4444' },
    { x: 263, y: 180, w: 12, h: 18, score: 200, active: true, color: '#ef4444' },
    { x: 174, y: 150, w: 18, h: 12, score: 300, active: true, color: '#a855f7' },
  ]
  
  // 奖励区域
  bonusZones = [
    { x: 165, y: 50, w: 30, h: 15, score: 500, color: '#fbbf24' },
  ]
}

function resetBall() {
  ball = {
    x: 320, y: 480, vx: 0, vy: 0, r: 8, inPlay: false,
    trail: [], maxTrail: 15
  }
}

function reset() {
  running.value = false
  cancelAnimationFrame(animFrame)
  score.value = 0
  balls.value = 3
  combo.value = 1
  isNewHighScore.value = false
  particles = []
  resetBall()
  initTable()
  draw()
}

function start() {
  running.value = true
  animFrame = requestAnimationFrame(gameLoop)
}

function launch() {
  if (ball.inPlay || !running.value) return
  playSound(880, 0.1, 'square')
  ball.inPlay = true
  ball.vy = -14 - Math.random() * 4
  ball.vx = -3 + Math.random() * 6
}

function update() {
  // 挡板控制
  if (keys['ArrowLeft'] || keys['a']) {
    flipperL = Math.min(flipperL + FLIPPER_SPEED, 0.6)
    if (flipperL > 0.3 && !ball.inPlay) playSound(220, 0.05)
  } else {
    flipperL = Math.max(flipperL - FLIPPER_SPEED * 2, 0)
  }
  if (keys['ArrowRight'] || keys['d']) {
    flipperR = Math.min(flipperR + FLIPPER_SPEED, 0.6)
    if (flipperR > 0.3 && !ball.inPlay) playSound(220, 0.05)
  } else {
    flipperR = Math.max(flipperR - FLIPPER_SPEED * 2, 0)
  }
  
  if (!ball.inPlay) return
  
  // 更新弹珠轨迹
  ball.trail.push({ x: ball.x, y: ball.y })
  if (ball.trail.length > ball.maxTrail) ball.trail.shift()
  
  // 物理更新
  ball.vy += GRAVITY
  ball.x += ball.vx
  ball.y += ball.vy
  
  // 墙壁碰撞
  if (ball.x - ball.r < 30) {
    ball.x = 30 + ball.r
    ball.vx = Math.abs(ball.vx) * 0.85
    playSound(440, 0.05)
  }
  if (ball.x + ball.r > 330) {
    ball.x = 330 - ball.r
    ball.vx = -Math.abs(ball.vx) * 0.85
    playSound(440, 0.05)
  }
  if (ball.y - ball.r < 30) {
    ball.y = 30 + ball.r
    ball.vy = Math.abs(ball.vy) * 0.85
    playSound(440, 0.05)
  }
  
  // 弹射器碰撞
  bumpers.forEach(b => {
    const dx = ball.x - b.x, dy = ball.y - b.y, dist = Math.hypot(dx, dy)
    if (dist < ball.r + b.r) {
      const nx = dx / dist, ny = dy / dist
      ball.x = b.x + nx * (ball.r + b.r)
      ball.y = b.y + ny * (ball.r + b.r)
      const speed = Math.hypot(ball.vx, ball.vy)
      ball.vx = nx * Math.max(speed * 1.1, 6)
      ball.vy = ny * Math.max(speed * 1.1, 6)
      
      // 连击系统
      const now = Date.now()
      if (now - lastHitTime < 1500) {
        combo.value = Math.min(combo.value + 1, 10)
      } else {
        combo.value = 1
      }
      lastHitTime = now
      
      const finalScore = b.score * combo.value
      score.value += finalScore
      b._hit = 15
      
      // 粒子效果
      createParticles(b.x, b.y, b.color)
      playSound(520 + Math.random() * 200, 0.1, 'square')
    }
  })
  
  // 目标方块碰撞
  targets.forEach(t => {
    if (!t.active) return
    if (ball.x + ball.r > t.x && ball.x - ball.r < t.x + t.w &&
        ball.y + ball.r > t.y && ball.y - ball.r < t.y + t.h) {
      t.active = false
      score.value += t.score
      createParticles(t.x + t.w/2, t.y + t.h/2, t.color)
      playSound(660, 0.15, 'triangle')
      
      // 检查是否所有目标都被击中
      if (targets.every(tt => !tt.active)) {
        // 重置目标并给奖励
        setTimeout(() => {
          targets.forEach(tt => tt.active = true)
          score.value += 1000
          playSound(880, 0.2, 'sine')
        }, 500)
      }
    }
  })
  
  // 奖励区域
  bonusZones.forEach(z => {
    if (ball.x > z.x && ball.x < z.x + z.w &&
        ball.y > z.y && ball.y < z.y + z.h) {
      score.value += z.score
      createParticles(z.x + z.w/2, z.y + z.h/2, z.color)
      playSound(1000, 0.2, 'sine')
      ball.vy = -10 // 反弹
    }
  })
  
  // 挡板碰撞
  const fLx = 80, fLy = 470, fRx = 280, fRy = 470
  const fLendX = fLx + Math.cos(-0.3 - flipperL) * FLIPPER_LEN
  const fLendY = fLy + Math.sin(-0.3 - flipperL) * FLIPPER_LEN
  const fRendX = fRx - Math.cos(-0.3 - flipperR) * FLIPPER_LEN
  const fRendY = fRy + Math.sin(-0.3 - flipperR) * FLIPPER_LEN
  
  // 左挡板
  const dL = distToSeg(ball.x, ball.y, fLx, fLy, fLendX, fLendY)
  if (dL < ball.r + 5) {
    ball.vy = -Math.abs(ball.vy) - 5 - flipperL * 15
    ball.vx += flipperL * 8
    score.value += 10
    if (flipperL > 0.3) playSound(330, 0.08)
  }
  
  // 右挡板
  const dR = distToSeg(ball.x, ball.y, fRx, fRy, fRendX, fRendY)
  if (dR < ball.r + 5) {
    ball.vy = -Math.abs(ball.vy) - 5 - flipperR * 15
    ball.vx -= flipperR * 8
    score.value += 10
    if (flipperR > 0.3) playSound(330, 0.08)
  }
  
  // 弹珠丢失
  if (ball.y > CH + 30) {
    balls.value--
    combo.value = 1
    ball.inPlay = false
    createParticles(ball.x, CH, '#ef4444')
    
    if (balls.value <= 0) {
      running.value = false
      if (score.value > highScore.value) {
        highScore.value = score.value
        isNewHighScore.value = true
        localStorage.setItem('pinball_hs', highScore.value)
      }
    } else {
      resetBall()
    }
  }
  
  // 速度限制
  ball.vx *= 0.998
  if (Math.abs(ball.vy) > 18) ball.vy = Math.sign(ball.vy) * 18
  if (Math.abs(ball.vx) > 12) ball.vx = Math.sign(ball.vx) * 12
  
  // 更新状态
  bumpers.forEach(b => { if (b._hit > 0) b._hit-- })
  particles = particles.filter(p => p.life > 0)
  particles.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.1
    p.life--
    p.alpha = p.life / p.maxLife
  })
}

function createParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i
    particles.push({
      x, y,
      vx: Math.cos(angle) * (2 + Math.random() * 3),
      vy: Math.sin(angle) * (2 + Math.random() * 3),
      color,
      life: 20,
      maxLife: 20,
      alpha: 1,
      size: 3 + Math.random() * 3
    })
  }
}

function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy
  let t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  
  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, CH)
  gradient.addColorStop(0, '#1e1b4b')
  gradient.addColorStop(0.5, '#312e81')
  gradient.addColorStop(1, '#1e1b4b')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CW, CH)
  
  // 网格背景
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let i = 0; i < CW; i += 30) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, CH)
    ctx.stroke()
  }
  for (let i = 0; i < CH; i += 30) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(CW, i)
    ctx.stroke()
  }
  
  // 墙壁
  ctx.strokeStyle = '#818cf8'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  walls.forEach(w => {
    ctx.beginPath()
    ctx.moveTo(w.x1, w.y1)
    ctx.lineTo(w.x2, w.y2)
    ctx.stroke()
    // 墙壁发光效果
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)'
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.strokeStyle = '#818cf8'
    ctx.lineWidth = 4
  })
  ctx.lineCap = 'butt'
  
  // 奖励区域
  bonusZones.forEach(z => {
    ctx.fillStyle = z.color
    ctx.globalAlpha = 0.3
    ctx.fillRect(z.x, z.y, z.w, z.h)
    ctx.globalAlpha = 1
    ctx.strokeStyle = z.color
    ctx.lineWidth = 2
    ctx.strokeRect(z.x, z.y, z.w, z.h)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(z.score, z.x + z.w/2, z.y + z.h/2 + 3)
  })
  
  // 目标方块
  targets.forEach(t => {
    if (!t.active) {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'
      ctx.fillRect(t.x, t.y, t.w, t.h)
      return
    }
    // 发光效果
    ctx.shadowColor = t.color
    ctx.shadowBlur = 10
    ctx.fillStyle = t.color
    ctx.fillRect(t.x, t.y, t.w, t.h)
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(t.x, t.y, t.w, t.h)
  })
  
  // 弹射器
  bumpers.forEach(b => {
    const isHit = b._hit > 0
    const color = isHit ? b.hitColor : b.color
    
    // 发光效果
    ctx.shadowColor = color
    ctx.shadowBlur = isHit ? 20 : 10
    
    // 外圈
    const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
    gradient.addColorStop(0, '#fff')
    gradient.addColorStop(0.3, color)
    gradient.addColorStop(1, color)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
    
    // 边框
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.shadowBlur = 0
    
    // 分数文字
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(b.score, b.x, b.y)
  })
  
  // 粒子效果
  particles.forEach(p => {
    ctx.globalAlpha = p.alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1
  
  // 挡板
  const fLx = 80, fLy = 470, fRx = 280, fRy = 470
  const fLendX = fLx + Math.cos(-0.3 - flipperL) * FLIPPER_LEN
  const fLendY = fLy + Math.sin(-0.3 - flipperL) * FLIPPER_LEN
  const fRendX = fRx - Math.cos(-0.3 - flipperR) * FLIPPER_LEN
  const fRendY = fRy + Math.sin(-0.3 - flipperR) * FLIPPER_LEN
  
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  
  // 左挡板发光
  ctx.shadowColor = '#4ade80'
  ctx.shadowBlur = flipperL > 0.3 ? 15 : 5
  ctx.beginPath()
  ctx.moveTo(fLx, fLy)
  ctx.lineTo(fLendX, fLendY)
  ctx.stroke()
  
  // 右挡板
  ctx.beginPath()
  ctx.moveTo(fRx, fRy)
  ctx.lineTo(fRendX, fRendY)
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.lineCap = 'butt'
  
  // 发射管
  ctx.fillStyle = '#374151'
  ctx.fillRect(310, 400, 20, 140)
  ctx.fillStyle = '#1f2937'
  ctx.fillRect(312, 402, 16, 136)
  // 发射弹簧
  if (!ball.inPlay) {
    ctx.fillStyle = '#6366f1'
    const springY = 480 + Math.sin(Date.now() / 100) * 3
    ctx.fillRect(314, springY, 12, 8)
  }
  
  // 弹珠轨迹
  if (ball.trail.length > 1) {
    ctx.lineWidth = 2
    for (let i = 1; i < ball.trail.length; i++) {
      const alpha = i / ball.trail.length * 0.5
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.beginPath()
      ctx.moveTo(ball.trail[i-1].x, ball.trail[i-1].y)
      ctx.lineTo(ball.trail[i].x, ball.trail[i].y)
      ctx.stroke()
    }
  }
  
  // 弹珠
  if (ball) {
    // 光晕
    const ballGlow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.r * 2)
    ballGlow.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
    ballGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = ballGlow
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.r * 2, 0, Math.PI * 2)
    ctx.fill()
    
    // 弹珠本体
    const ballGradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, ball.r)
    ballGradient.addColorStop(0, '#ffffff')
    ballGradient.addColorStop(0.5, '#e5e7eb')
    ballGradient.addColorStop(1, '#9ca3af')
    ctx.fillStyle = ballGradient
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
    ctx.fill()
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(ball.x - 2, ball.y - 2, ball.r / 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

let lastTime = 0
function gameLoop(time) {
  if (!running.value) return
  animFrame = requestAnimationFrame(gameLoop)
  if (time - lastTime < 16) return
  lastTime = time
  update()
  draw()
}

function onKey(e) {
  keys[e.key] = true
  if (e.key === ' ') {
    e.preventDefault()
    launch()
  }
  if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
    e.preventDefault()
  }
}

function onKeyUp(e) {
  keys[e.key] = false
}

onMounted(() => {
  reset()
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<style scoped>
/* 标题区域 */
.header-wrapper {
  position: relative;
  margin-bottom: 12px;
}
.tool-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  overflow: hidden;
}
.header-glow {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  animation: glow-pulse 3s ease-in-out infinite;
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}
.game-icon {
  font-size: 1.75rem;
  animation: float-icon 3s ease-in-out infinite;
}
@keyframes float-icon {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(5deg); }
}
.title-text {
  display: flex;
  flex-direction: column;
}
.title-main {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-900);
}
:global(.dark) .title-main {
  color: var(--white);
}
.title-sub {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-weight: 400;
}
:global(.dark) .title-sub {
  color: var(--gray-400);
}

/* 分数面板 */
.stats-panel {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  border-radius: 12px;
  min-width: 80px;
}
.stat-score {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
  border: 1px solid rgba(251, 191, 36, 0.3);
}
.stat-balls {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.stat-high {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 1px solid rgba(168, 85, 247, 0.3);
}
.stat-combo {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
  border: 1px solid rgba(239, 68, 68, 0.4);
  animation: combo-pulse 0.5s ease-in-out infinite;
}
@keyframes combo-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.stat-icon {
  font-size: 1.125rem;
}
.stat-label {
  font-size: 10px;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
:global(.dark) .stat-label {
  color: var(--gray-400);
}
.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--gray-900);
}
:global(.dark) .stat-value {
  color: var(--white);
}
.balls-value {
  display: flex;
  gap: 4px;
}
.ball-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9ca3af;
  transition: all 0.3s ease;
}
.ball-indicator.ball-active {
  background: #3b82f6;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}
.combo-text {
  color: #ef4444;
}

/* 画布包装器 */
.canvas-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.game-canvas {
  display: block;
  max-width: 100%;
  border-radius: 16px;
}

/* 覆盖层 */
.start-overlay, .gameover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}
.start-content, .gameover-content {
  text-align: center;
  padding: 32px;
  background: rgba(30, 41, 59, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(139, 92, 246, 0.3);
}
.start-icon, .gameover-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 12px;
  animation: bounce-in 1s ease-in-out infinite;
}
@keyframes bounce-in {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.start-title, .gameover-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}
.start-subtitle, .gameover-score {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}
.gameover-highlight {
  font-size: 1.125rem;
  color: #fbbf24;
  font-weight: 700;
  margin-top: 8px;
  animation: highlight-pulse 0.8s ease-in-out infinite;
}
@keyframes highlight-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 操作提示 */
.controls-hint {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.hint-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hint-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-600);
  border: 1px solid var(--gray-200);
}
:global(.dark) .hint-key {
  background: rgba(255, 255, 255, 0.05);
  color: var(--gray-300);
  border-color: var(--slate-600);
}
.hint-text {
  font-size: 12px;
  color: var(--gray-500);
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>