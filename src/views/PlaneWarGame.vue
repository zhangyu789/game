<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">✈️ 飞机大战</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="init">🔄 重新开始</button>
      <span class="self-center text-sm ml-auto">得分: {{ score }} | 生命: {{ lives }}</span>
    </div>
    <canvas ref="canvas" width="400" height="600" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-900 cursor-none block mx-auto" style="max-width:400px;width:100%;aspect-ratio:2/3" @mousemove="onInput" @touchmove.prevent="onInput"></canvas>
    <p class="text-xs text-gray-400 mt-2">鼠标/触摸控制飞机，自动射击</p>
    
    <!-- 游戏结束遮罩 -->
    <div v-if="!running && score > 0" class="absolute inset-0 flex items-center justify-center bg-black/70 rounded z-10" style="max-width:400px;margin:0 auto;">
      <div class="text-center">
        <h3 class="text-2xl font-bold text-red-500 mb-2">游戏结束</h3>
        <p class="text-lg text-white mb-4">最终得分: {{ score }}</p>
        <button class="btn btn-primary" @click="init">再来一局</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 游戏常量定义
const GAME_CONFIG = {
  WIDTH: 400,
  HEIGHT: 600,
  PLAYER_SIZE: { w: 30, h: 30 },
  PLAYER_SPEED: 5,
  BULLET_SIZE: { w: 4, h: 10 },
  BULLET_SPEED: -8,
  BULLET_INTERVAL: 10,
  ENEMY_SPAWN_INTERVAL: 30,
  ENEMY_TYPES: {
    big: { w: 50, h: 40, speed: 1.5, hp: 3, score: 50, color: '#dc2626' },
    small: { w: 25, h: 20, speed: 3, hp: 1, score: 10, color: '#f97316' }
  },
  BIG_ENEMY_CHANCE: 0.2,
  PARTICLE_COUNT: 5,
  PARTICLE_SPEED: 4,
  PARTICLE_LIFETIME: 20,
  INITIAL_LIVES: 5,
  STAR_COUNT: 50
}

const canvas = ref(null)
const running = ref(false)
const score = ref(0)
const lives = ref(GAME_CONFIG.INITIAL_LIVES)

let starField = null
let gameState = null
let animationId = null

// 初始化星空背景（预渲染）
function initStarField() {
  const stars = []
  for (let i = 0; i < GAME_CONFIG.STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * GAME_CONFIG.WIDTH,
      y: Math.random() * GAME_CONFIG.HEIGHT,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.1
    })
  }
  return stars
}

// 绘制星空背景
function drawStarField(ctx) {
  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)
  for (const star of starField) {
    ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`
    ctx.fillRect(star.x, star.y, star.size, star.size)
  }
}

// 初始化游戏状态
function init() {
  starField = starField || initStarField()
  
  gameState = {
    player: {
      x: GAME_CONFIG.WIDTH / 2,
      y: GAME_CONFIG.HEIGHT - 80,
      w: GAME_CONFIG.PLAYER_SIZE.w,
      h: GAME_CONFIG.PLAYER_SIZE.h
    },
    bullets: [],
    enemies: [],
    particles: [],
    frame: 0,
    shootTimer: 0,
    score: 0,
    lives: GAME_CONFIG.INITIAL_LIVES
  }
  
  score.value = 0
  lives.value = GAME_CONFIG.INITIAL_LIVES
  running.value = false
  draw()
}

// 开始游戏
function start() {
  running.value = true
  loop()
}

// 游戏主循环
function loop() {
  if (!running.value) return
  update()
  draw()
  animationId = requestAnimationFrame(loop)
}

// 更新游戏状态
function update() {
  gameState.frame++
  gameState.shootTimer++
  
  // 自动射击
  if (gameState.shootTimer % GAME_CONFIG.BULLET_INTERVAL === 0) {
    gameState.bullets.push({
      x: gameState.player.x,
      y: gameState.player.y - 15,
      dy: GAME_CONFIG.BULLET_SPEED,
      w: GAME_CONFIG.BULLET_SIZE.w,
      h: GAME_CONFIG.BULLET_SIZE.h
    })
  }
  
  // 更新子弹位置
  gameState.bullets.forEach(b => b.y += b.dy)
  gameState.bullets = gameState.bullets.filter(b => b.y > -GAME_CONFIG.BULLET_SIZE.h)
  
  // 生成敌人
  if (gameState.frame % GAME_CONFIG.ENEMY_SPAWN_INTERVAL === 0) {
    spawnEnemy()
  }
  
  // 更新敌人位置
  gameState.enemies.forEach(e => e.y += e.dy)
  
  // 检查敌人是否超出屏幕
  gameState.enemies = gameState.enemies.filter(e => {
    if (e.y > GAME_CONFIG.HEIGHT) {
      loseLife()
      return false
    }
    return true
  })
  
  // 子弹与敌人碰撞检测
  checkBulletEnemyCollision()
  
  // 玩家与敌人碰撞检测
  checkPlayerEnemyCollision()
  
  // 更新粒子
  gameState.particles.forEach(p => {
    p.x += p.dx
    p.y += p.dy
    p.life--
  })
  gameState.particles = gameState.particles.filter(p => p.life > 0)
}

// 生成敌人
function spawnEnemy() {
  const isBig = Math.random() < GAME_CONFIG.BIG_ENEMY_CHANCE
  const type = isBig ? 'big' : 'small'
  const config = GAME_CONFIG.ENEMY_TYPES[type]
  
  gameState.enemies.push({
    x: Math.random() * (GAME_CONFIG.WIDTH - config.w),
    y: -config.h,
    w: config.w,
    h: config.h,
    dy: config.speed,
    type,
    hp: config.hp,
    score: config.score,
    color: config.color
  })
}

// 碰撞检测：子弹与敌人
function checkBulletEnemyCollision() {
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i]
    
    for (let j = gameState.enemies.length - 1; j >= 0; j--) {
      const enemy = gameState.enemies[j]
      
      if (isColliding(bullet, enemy)) {
        enemy.hp--
        gameState.bullets.splice(i, 1)
        
        if (enemy.hp <= 0) {
          addScore(enemy.score)
          createParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.type)
          gameState.enemies.splice(j, 1)
        }
        break
      }
    }
  }
}

// 碰撞检测：玩家与敌人
function checkPlayerEnemyCollision() {
  for (let j = gameState.enemies.length - 1; j >= 0; j--) {
    const enemy = gameState.enemies[j]
    
    // 使用更精确的碰撞检测（玩家中心区域）
    const playerCenterX = gameState.player.x
    const playerCenterY = gameState.player.y
    const playerRadius = Math.min(gameState.player.w, gameState.player.h) / 3
    
    const enemyCenterX = enemy.x + enemy.w / 2
    const enemyCenterY = enemy.y + enemy.h / 2
    const enemyRadius = Math.min(enemy.w, enemy.h) / 2
    
    const dx = playerCenterX - enemyCenterX
    const dy = playerCenterY - enemyCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < playerRadius + enemyRadius) {
      loseLife()
      createParticles(enemyCenterX, enemyCenterY, enemy.type)
      gameState.enemies.splice(j, 1)
    }
  }
}

// 矩形碰撞检测
function isColliding(a, b) {
  return a.x < b.x + b.w &&
         a.x + (a.w || 4) > b.x &&
         a.y < b.y + b.h &&
         a.y + (a.h || 10) > b.y
}

// 添加分数
function addScore(points) {
  gameState.score += points
  score.value = gameState.score
}

// 减少生命值
function loseLife() {
  gameState.lives--
  lives.value = gameState.lives
  
  if (gameState.lives <= 0) {
    running.value = false
  }
}

// 创建爆炸粒子效果
function createParticles(x, y, type) {
  const color = type === 'big' ? '#f97316' : '#ef4444'
  
  for (let k = 0; k < GAME_CONFIG.PARTICLE_COUNT; k++) {
    const angle = (Math.PI * 2 / GAME_CONFIG.PARTICLE_COUNT) * k
    gameState.particles.push({
      x,
      y,
      dx: Math.cos(angle) * GAME_CONFIG.PARTICLE_SPEED,
      dy: Math.sin(angle) * GAME_CONFIG.PARTICLE_SPEED,
      life: GAME_CONFIG.PARTICLE_LIFETIME,
      color
    })
  }
}

// 绘制游戏画面
function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  
  // 绘制星空背景
  drawStarField(ctx)
  
  // 绘制玩家飞机
  drawPlayer(ctx)
  
  // 绘制子弹
  drawBullets(ctx)
  
  // 绘制敌人
  drawEnemies(ctx)
  
  // 绘制粒子
  drawParticles(ctx)
}

// 绘制玩家飞机
function drawPlayer(ctx) {
  const p = gameState.player
  
  // 飞机主体（三角形）
  ctx.fillStyle = '#3b82f6'
  ctx.beginPath()
  ctx.moveTo(p.x, p.y - p.h / 2)
  ctx.lineTo(p.x - p.w / 2, p.y + p.h / 2)
  ctx.lineTo(p.x + p.w / 2, p.y + p.h / 2)
  ctx.closePath()
  ctx.fill()
  
  // 飞机发光效果
  ctx.fillStyle = '#60a5fa'
  ctx.fillRect(p.x - 3, p.y - 5, 6, 15)
  
  // 引擎火焰
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.moveTo(p.x - 4, p.y + p.h / 2)
  ctx.lineTo(p.x, p.y + p.h / 2 + 8 + Math.random() * 4)
  ctx.lineTo(p.x + 4, p.y + p.h / 2)
  ctx.closePath()
  ctx.fill()
}

// 绘制子弹
function drawBullets(ctx) {
  ctx.fillStyle = '#facc15'
  ctx.shadowColor = '#facc15'
  ctx.shadowBlur = 5
  
  for (const b of gameState.bullets) {
    ctx.fillRect(b.x - 2, b.y, 4, 10)
  }
  
  ctx.shadowBlur = 0
}

// 绘制敌人
function drawEnemies(ctx) {
  for (const e of gameState.enemies) {
    // 敌人主体
    ctx.fillStyle = e.color
    ctx.fillRect(e.x, e.y, e.w, e.h)
    
    // 敌人细节
    ctx.fillStyle = '#fca5a5'
    ctx.fillRect(e.x + 5, e.y + 5, e.w - 10, e.h / 2)
    
    // 敌人眼睛
    ctx.fillStyle = '#fff'
    ctx.fillRect(e.x + 8, e.y + 8, 4, 4)
    ctx.fillRect(e.x + e.w - 12, e.y + 8, 4, 4)
  }
}

// 绘制粒子
function drawParticles(ctx) {
  for (const p of gameState.particles) {
    ctx.fillStyle = p.color
    ctx.globalAlpha = p.life / GAME_CONFIG.PARTICLE_LIFETIME
    ctx.shadowColor = p.color
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }
}

// 统一的输入处理函数（鼠标和触摸）
function onInput(e) {
  if (!running.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  const sx = GAME_CONFIG.WIDTH / rect.width
  const sy = GAME_CONFIG.HEIGHT / rect.height
  
  let clientX, clientY
  
  if (e.touches) {
    // 触摸事件
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    // 鼠标事件
    clientX = e.clientX
    clientY = e.clientY
  }
  
  // 更新玩家位置
  gameState.player.x = (clientX - rect.left) * sx
  gameState.player.y = (clientY - rect.top) * sy
  
  // 边界检查
  gameState.player.x = Math.max(
    gameState.player.w / 2,
    Math.min(GAME_CONFIG.WIDTH - gameState.player.w / 2, gameState.player.x)
  )
  gameState.player.y = Math.max(
    gameState.player.h / 2,
    Math.min(GAME_CONFIG.HEIGHT - gameState.player.h / 2, gameState.player.y)
  )
}

onMounted(() => init())

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  running.value = false
})
</script>