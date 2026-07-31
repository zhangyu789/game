<template>
  <div class="roguelike-game">
    <!-- 背景粒子 -->
    <canvas ref="bgCanvas" class="bg-particles"></canvas>
    
    <!-- 游戏头部 -->
    <div class="game-header">
      <div class="header-glow"></div>
      <div class="title-wrap">
        <span class="title-icon">🏰</span>
        <h2 class="game-title">Roguelike地牢</h2>
        <span class="title-sub">DUNGEON CRAWLER</span>
      </div>
    </div>
    
    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="status-row">
        <div class="stat-item hp-stat">
          <div class="stat-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(239,68,68,0.2)" stroke-width="3"/>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round"
                :stroke-dasharray="`${(hp/maxHp)*97.4} 97.4`" stroke-dashoffset="24.35" class="ring-progress"/>
            </svg>
            <span class="ring-icon">❤️</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ hp }}/{{ maxHp }}</span>
            <span class="stat-label">生命</span>
          </div>
        </div>
        <div class="stat-item atk-stat">
          <span class="stat-icon">⚔️</span>
          <div class="stat-info">
            <span class="stat-value">{{ atk }}</span>
            <span class="stat-label">攻击</span>
          </div>
        </div>
        <div class="stat-item def-stat">
          <span class="stat-icon">🛡️</span>
          <div class="stat-info">
            <span class="stat-value">{{ def }}</span>
            <span class="stat-label">防御</span>
          </div>
        </div>
        <div class="stat-item gold-stat">
          <span class="stat-icon">💰</span>
          <div class="stat-info">
            <span class="stat-value">{{ gold }}</span>
            <span class="stat-label">金币</span>
          </div>
        </div>
        <div class="stat-item gems-stat">
          <span class="stat-icon">💎</span>
          <div class="stat-info">
            <span class="stat-value">{{ gems }}</span>
            <span class="stat-label">宝石</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 控制栏 -->
    <div class="control-bar">
      <button class="ctrl-btn new-btn" @click="newGame">
        <span class="btn-icon">🔄</span>
        <span class="btn-text">新游戏</span>
      </button>
      <div class="floor-badge">
        <span class="floor-theme">{{ themeName }}</span>
        <span class="floor-num">层 {{ floor }}</span>
      </div>
      <div v-if="inSecretRoom" class="secret-badge">
        <span class="secret-icon">🔮</span>
        <span class="secret-text">隐藏关卡</span>
      </div>
      <div class="message-box" v-if="message">
        <span class="msg-text">{{ message }}</span>
      </div>
    </div>
    
    <!-- 游戏画布 -->
    <div class="canvas-wrapper">
      <canvas ref="canvas" width="480" height="360" class="game-canvas" @click="onClick"></canvas>
      <div class="canvas-glow"></div>
    </div>
    
    <!-- 提示文字 -->
    <p class="hint-text">点击移动 · @是你 · 找楼梯🪜下到更深层 · 找传送门🌀进入隐藏关卡</p>
    
    <!-- 移动控制 -->
    <div class="move-controls">
      <div class="move-grid">
        <div></div><button class="move-btn" @click="move(0,-1)">▲</button><div></div>
        <button class="move-btn" @click="move(-1,0)">◀</button>
        <button class="move-btn center" @click="move(0,1)">▼</button>
        <button class="move-btn" @click="move(1,0)">▶</button>
      </div>
    </div>
    
    <!-- 音效开关 -->
    <button class="sound-btn" @click="toggleSound">
      <span v-if="soundEnabled">🔊</span>
      <span v-else>🔇</span>
    </button>
    
    <!-- 商店界面 -->
    <transition name="modal-fade">
      <div v-if="showShop" class="modal-overlay" @click.self="showShop = false">
        <div class="modal-box shop-modal">
          <div class="modal-glow shop-glow"></div>
          <div class="modal-header">
            <span class="modal-icon">🏪</span>
            <h3 class="modal-title">商店</h3>
          </div>
          <div class="shop-items">
            <div v-for="item in shopItems" :key="item.name" class="shop-item">
              <div class="item-info">
                <span class="item-emoji">{{ item.emoji }}</span>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <button class="buy-btn" :class="{disabled: gold < item.price}" :disabled="gold < item.price" @click="buyItem(item)">
                <span class="price-icon">💰</span>
                <span class="price-num">{{ item.price }}</span>
              </button>
            </div>
          </div>
          <button class="close-btn" @click="showShop = false">离开商店</button>
        </div>
      </div>
    </transition>
    
    <!-- 事件界面 -->
    <transition name="modal-fade">
      <div v-if="currentEvent" class="modal-overlay">
        <div class="modal-box event-modal">
          <div class="modal-glow event-glow"></div>
          <div class="modal-header">
            <span class="modal-icon">❓</span>
            <h3 class="modal-title">{{ currentEvent.title }}</h3>
          </div>
          <p class="event-desc">{{ currentEvent.description }}</p>
          <div class="event-options">
            <button v-for="(option, index) in currentEvent.options" :key="index" 
                    class="option-btn" @click="handleEventChoice(index)">
              {{ option.text }}
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 游戏结束界面 -->
    <transition name="modal-fade">
      <div v-if="gameOver" class="modal-overlay">
        <div class="modal-box gameover-modal">
          <div class="modal-glow death-glow"></div>
          <div class="modal-header">
            <span class="modal-icon death-icon">💀</span>
            <h3 class="modal-title death-title">你死了!</h3>
          </div>
          <div class="result-stats">
            <div class="result-item">
              <span class="result-icon">📊</span>
              <span class="result-label">到达层数</span>
              <span class="result-value">{{ floor }}</span>
            </div>
            <div class="result-item">
              <span class="result-icon">💰</span>
              <span class="result-label">获得金币</span>
              <span class="result-value">{{ gold }}</span>
            </div>
            <div class="result-item">
              <span class="result-icon">🔮</span>
              <span class="result-label">发现隐藏关卡</span>
              <span class="result-value">{{ secretRoomsFound }}</span>
            </div>
          </div>
          <button class="retry-btn" @click="newGame">再来一局</button>
        </div>
      </div>
    </transition>
    
    <!-- 胜利界面 -->
    <transition name="modal-fade">
      <div v-if="gameWon" class="modal-overlay">
        <div class="modal-box victory-modal">
          <div class="modal-glow victory-glow"></div>
          <div class="victory-particles">
            <span v-for="n in 8" :key="n" class="particle">✨</span>
          </div>
          <div class="modal-header">
            <span class="modal-icon victory-icon">🏆</span>
            <h3 class="modal-title victory-title">恭喜通关!</h3>
          </div>
          <p class="victory-desc">你成功征服了地狱!</p>
          <div class="result-stats">
            <div class="result-item">
              <span class="result-icon">📊</span>
              <span class="result-label">最终层数</span>
              <span class="result-value">{{ floor }}</span>
            </div>
            <div class="result-item">
              <span class="result-icon">💰</span>
              <span class="result-label">获得金币</span>
              <span class="result-value">{{ gold }}</span>
            </div>
          </div>
          <button class="retry-btn victory-btn" @click="newGame">再来一局</button>
        </div>
      </div>
    </transition>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// 游戏常量配置
const GAME_CONFIG = {
  COLS: 30,
  ROWS: 20,
  CELL: 16,
  INITIAL_STATS: { hp: 20, maxHp: 20, atk: 5, def: 2 },
  ROOM_COUNT: 8,
  MONSTER_CHANCE: 0.6,
  CHEST_CHANCE: 0.4,
  SHOP_CHANCE: 0.3,
  SECRET_ROOM_CHANCE: 0.15,
  TRAP_CHANCE: 0.1,
  EVENT_CHANCE: 0.2,
  HEAL_ON_LEVEL: 5,
  MAX_FLOOR: 30
}

// 音效系统
let audioCtx = null
const soundEnabled = ref(true)
const bgCanvas = ref(null)

function playSound(type) {
  if (!soundEnabled.value) return
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    gain.gain.value = 0.08
    
    if (type === 'move') {
      osc.frequency.value = 220
      osc.type = 'sine'
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1)
    } else if (type === 'attack') {
      osc.frequency.value = 330
      osc.type = 'square'
      gain.gain.value = 0.06
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15)
    } else if (type === 'hit') {
      osc.frequency.value = 150
      osc.type = 'sawtooth'
      gain.gain.value = 0.05
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2)
    } else if (type === 'pickup') {
      osc.frequency.value = 523
      osc.type = 'sine'
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2)
    } else if (type === 'stairs') {
      osc.frequency.value = 440
      osc.type = 'triangle'
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)
    } else if (type === 'death') {
      osc.frequency.value = 100
      osc.type = 'sawtooth'
      gain.gain.value = 0.1
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
    } else if (type === 'victory') {
      osc.frequency.value = 523
      osc.type = 'triangle'
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8)
    } else if (type === 'shop') {
      osc.frequency.value = 392
      osc.type = 'sine'
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25)
    }
    
    osc.start()
    osc.stop(audioCtx.currentTime + 1)
  } catch (e) {}
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
}

// 背景粒子动画
let bgParticles = []
let bgAnimFrame = null

function initBgParticles() {
  const c = bgCanvas.value
  if (!c) return
  c.width = c.parentElement.clientWidth
  c.height = c.parentElement.clientHeight
  bgParticles = Array.from({ length: 50 }, () => ({
    x: Math.random() * c.width,
    y: Math.random() * c.height,
    r: 1 + Math.random() * 3,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    hue: Math.random() * 60 + 200,
    alpha: 0.1 + Math.random() * 0.3
  }))
}

function drawBgParticles() {
  const c = bgCanvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height)
  
  bgParticles.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0) p.x = c.width
    if (p.x > c.width) p.x = 0
    if (p.y < 0) p.y = c.height
    if (p.y > c.height) p.y = 0
    
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha})`
    ctx.fill()
  })
  
  bgAnimFrame = requestAnimationFrame(drawBgParticles)
}

// 地牢主题配置
const THEMES = [
  { id: 'forest', name: '🌲 森林', wall: '#166534', floor: '#14532d', player: '#22c55e', dark: '#052e16' },
  { id: 'cave', name: '⛰️ 洞穴', wall: '#6b7280', floor: '#4b5563', player: '#22d3ee', dark: '#1f2937' },
  { id: 'volcano', name: '🌋 火山', wall: '#7c2d12', floor: '#9a3412', player: '#f87171', dark: '#451a03' },
  { id: 'ice', name: '🧊 冰原', wall: '#0ea5e9', floor: '#38bdf8', player: '#e0f2fe', dark: '#0c4a6e' },
  { id: 'dark', name: '🏰 黑暗城堡', wall: '#4c1d95', floor: '#581c87', player: '#c084fc', dark: '#1e1b4b' },
  { id: 'hell', name: '🔥 地狱', wall: '#991b1b', floor: '#b91c1c', player: '#fca5a5', dark: '#450a0a' }
]

// 怪物配置
const MONSTERS = {
  goblin: { emoji: '👹', name: '哥布林', hp: 5, atk: 3, def: 0, exp: 10, gold: 5 },
  skeleton: { emoji: '💀', name: '骷髅', hp: 8, atk: 4, def: 1, exp: 15, gold: 8 },
  orc: { emoji: '👺', name: '兽人', hp: 12, atk: 5, def: 2, exp: 25, gold: 12 },
  slime: { emoji: '🟢', name: '史莱姆', hp: 4, atk: 2, def: 0, exp: 8, gold: 3 },
  bat: { emoji: '🦇', name: '蝙蝠', hp: 3, atk: 3, def: 0, exp: 6, gold: 4 },
  spider: { emoji: '🕷️', name: '蜘蛛', hp: 6, atk: 4, def: 1, exp: 12, gold: 6 },
  demon: { emoji: '😈', name: '恶魔', hp: 20, atk: 8, def: 3, exp: 40, gold: 20 },
  dragon: { emoji: '🐉', name: '巨龙', hp: 50, atk: 12, def: 5, exp: 100, gold: 50 },
  ghost: { emoji: '👻', name: '幽灵', hp: 10, atk: 6, def: 0, exp: 20, gold: 10 },
  vampire: { emoji: '🧛', name: '吸血鬼', hp: 15, atk: 7, def: 2, exp: 30, gold: 15 }
}

// Boss配置
const BOSSES = {
  forest: { emoji: '🌲', name: '树精', hp: 30, atk: 7, def: 3, exp: 60, gold: 40 },
  cave: { emoji: '🪨', name: '石巨人', hp: 40, atk: 9, def: 4, exp: 80, gold: 50 },
  volcano: { emoji: '🔥', name: '炎魔', hp: 50, atk: 11, def: 5, exp: 100, gold: 60 },
  ice: { emoji: '❄️', name: '冰魔', hp: 45, atk: 10, def: 4, exp: 90, gold: 55 },
  dark: { emoji: '💀', name: '死灵法师', hp: 55, atk: 12, def: 3, exp: 120, gold: 70 },
  hell: { emoji: '👿', name: '地狱领主', hp: 80, atk: 15, def: 6, exp: 150, gold: 100 },
  final: { emoji: '👑', name: '最终Boss', hp: 120, atk: 18, def: 8, exp: 200, gold: 150 }
}

// 道具配置
const ITEMS = {
  health_potion: { emoji: '🧪', name: '生命药水', effect: 'heal', value: 10, price: 15 },
  big_health_potion: { emoji: '⚗️', name: '大生命药水', effect: 'heal', value: 25, price: 35 },
  attack_boost: { emoji: '⚔️', name: '力量药水', effect: 'atk', value: 2, price: 25 },
  defense_boost: { emoji: '🛡️', name: '护盾药水', effect: 'def', value: 2, price: 25 },
  max_hp_boost: { emoji: '❤️', name: '生命精华', effect: 'maxHp', value: 5, price: 40 },
  
  // 新增道具
  crit_potion: { emoji: '💥', name: '暴击药水', effect: 'crit', value: 20, price: 30 },
  dodge_potion: { emoji: '👻', name: '闪避药水', effect: 'dodge', value: 15, price: 30 },
  gold_potion: { emoji: '💰', name: '点金药水', effect: 'goldMulti', value: 2, price: 45 },
  regen_potion: { emoji: '🌿', name: '再生药水', effect: 'regen', value: 2, price: 40 },
  lucky_potion: { emoji: '🍀', name: '幸运药水', effect: 'luck', value: 10, price: 50 },
  
  // 稀有道具（隐藏关卡掉落）
  legendary_atk: { emoji: '🗡️', name: '传说之剑', effect: 'atk', value: 5, price: 100, rare: true },
  legendary_def: { emoji: '🛡️', name: '龙鳞铠甲', effect: 'def', value: 5, price: 100, rare: true },
  legendary_hp: { emoji: '💗', name: '生命之源', effect: 'maxHp', value: 15, price: 120, rare: true }
}

// 装备槽位
const EQUIPMENT_SLOTS = {
  weapon: null,
  armor: null,
  accessory: null
}

// 随机事件
const RANDOM_EVENTS = [
  {
    title: '📜 神秘碑文',
    description: '你发现了一块古老的石碑，上面刻着神秘的符文...',
    options: [
      { text: '触摸石碑', effect: () => ({ gold: Math.floor(Math.random() * 30), message: '获得了金币!' }) },
      { text: '小心离开', effect: () => ({ message: '你谨慎地离开了...' }) }
    ]
  },
  {
    title: '💀 受伤的冒险者',
    description: '你发现了一名受伤的冒险者，他请求你的帮助...',
    options: [
      { text: '给予治疗（-10生命）', effect: () => ({ gold: 50, message: '冒险者感激地给了你金币!' }) },
      { text: '视而不见', effect: () => ({ message: '你选择了离开...' }) }
    ]
  },
  {
    title: '✨ 魔法喷泉',
    description: '一座闪闪发光的魔法喷泉出现在你面前...',
    options: [
      { text: '饮用泉水', effect: () => ({ heal: 15, message: '泉水治愈了你的伤口!' }) },
      { text: '收集泉水', effect: () => ({ item: ITEMS.big_health_potion, message: '你收集了一瓶魔法泉水!' }) }
    ]
  },
  {
    title: '🗡️ 宝箱陷阱',
    description: '你发现了一个华丽的宝箱，但它看起来很可疑...',
    options: [
      { text: '直接打开', effect: () => Math.random() < 0.5 ? { gold: 40, message: '宝箱里装满了金币!' } : { damage: 10, message: '宝箱是陷阱!受到了伤害!' } },
      { text: '小心检查', effect: () => ({ gold: 20, message: '你发现了陷阱并安全拿到了金币!' }) }
    ]
  },
  {
    title: '🧙 神秘商人',
    description: '一位神秘的商人出现在你面前...',
    options: [
      { text: '购买神秘物品（-30金）', effect: () => ({ item: Object.values(ITEMS).filter(i => !i.rare)[Math.floor(Math.random() * 6)], message: '你获得了一件神秘物品!' }) },
      { text: '询问情报', effect: () => ({ message: '商人告诉你下一层有强大的敌人...' }) },
      { text: '离开', effect: () => ({ message: '商人消失在了迷雾中...' }) }
    ]
  }
]

// 商店物品（普通物品）
const SHOP_ITEMS = [
  { ...ITEMS.health_potion },
  { ...ITEMS.big_health_potion },
  { ...ITEMS.attack_boost },
  { ...ITEMS.defense_boost },
  { ...ITEMS.max_hp_boost },
  { ...ITEMS.crit_potion },
  { ...ITEMS.dodge_potion }
]

const canvas = ref(null)
const map = ref([])
const entities = ref([])
const hp = ref(GAME_CONFIG.INITIAL_STATS.hp)
const maxHp = ref(GAME_CONFIG.INITIAL_STATS.maxHp)
const atk = ref(GAME_CONFIG.INITIAL_STATS.atk)
const def = ref(GAME_CONFIG.INITIAL_STATS.def)
const gold = ref(0)
const gems = ref(0)
const floor = ref(1)
const message = ref('')
const showShop = ref(false)
const gameOver = ref(false)
const gameWon = ref(false)
const currentEvent = ref(null)
const inSecretRoom = ref(false)
const secretRoomsFound = ref(0)

// 玩家状态效果
const playerEffects = ref({
  crit: 0,      // 暴击率加成
  dodge: 0,     // 闪避率加成
  goldMulti: 1, // 金币加成倍数
  regen: 0,     // 每回合回复
  luck: 0       // 幸运值
})

let player = { x: 1, y: 1 }
let fov = new Set()
let currentTheme = ref(THEMES[0])

const themeName = computed(() => currentTheme.value.name)
const shopItems = ref(SHOP_ITEMS)

// 根据层数获取主题
function getThemeByFloor(f) {
  const themeIndex = Math.min(Math.floor((f - 1) / 5), THEMES.length - 1)
  return THEMES[themeIndex]
}

// 根据层数和主题获取怪物
function getMonsterForTheme(themeId, floorNum) {
  const themeMonsters = {
    forest: ['goblin', 'slime', 'bat'],
    cave: ['skeleton', 'spider', 'goblin', 'ghost'],
    volcano: ['orc', 'demon', 'bat', 'vampire'],
    ice: ['skeleton', 'slime', 'orc', 'ghost'],
    dark: ['demon', 'skeleton', 'spider', 'vampire'],
    hell: ['demon', 'dragon', 'orc', 'vampire']
  }
  
  const availableMonsters = themeMonsters[themeId] || themeMonsters.forest
  const monsterId = availableMonsters[Math.floor(Math.random() * availableMonsters.length)]
  const baseMonster = MONSTERS[monsterId]
  
  const multiplier = 1 + (floorNum - 1) * 0.15
  
  return {
    ...baseMonster,
    hp: Math.floor(baseMonster.hp * multiplier),
    atk: Math.floor(baseMonster.atk * multiplier),
    def: Math.floor(baseMonster.def * multiplier),
    gold: Math.floor(baseMonster.gold * multiplier * playerEffects.value.goldMulti)
  }
}

// 生成地牢
function generateDungeon() {
  inSecretRoom.value = false
  currentTheme.value = getThemeByFloor(floor.value)
  const m = Array.from({ length: GAME_CONFIG.ROWS }, () => Array(GAME_CONFIG.COLS).fill(1))
  const rooms = []
  
  // 生成房间
  for (let i = 0; i < GAME_CONFIG.ROOM_COUNT; i++) {
    const w = 3 + Math.floor(Math.random() * 5)
    const h = 3 + Math.floor(Math.random() * 4)
    const x = 1 + Math.floor(Math.random() * (GAME_CONFIG.COLS - w - 2))
    const y = 1 + Math.floor(Math.random() * (GAME_CONFIG.ROWS - h - 2))
    
    let overlap = false
    for (const r of rooms) {
      if (x < r.x + r.w + 1 && x + w > r.x - 1 && y < r.y + r.h + 1 && y + h > r.y - 1) {
        overlap = true
        break
      }
    }
    if (overlap) continue
    
    rooms.push({ x, y, w, h, isSecret: Math.random() < GAME_CONFIG.SECRET_ROOM_CHANCE })
    for (let ry = y; ry < y + h; ry++) {
      for (let rx = x; rx < x + w; rx++) {
        m[ry][rx] = 0
      }
    }
  }
  
  // 连接房间
  for (let i = 1; i < rooms.length; i++) {
    let cx = Math.floor(rooms[i - 1].x + rooms[i - 1].w / 2)
    let cy = Math.floor(rooms[i - 1].y + rooms[i - 1].h / 2)
    const tx = Math.floor(rooms[i].x + rooms[i].w / 2)
    const ty = Math.floor(rooms[i].y + rooms[i].h / 2)
    
    while (cx !== tx) {
      m[cy][cx] = 0
      cx += cx < tx ? 1 : -1
    }
    while (cy !== ty) {
      m[cy][cx] = 0
      cy += cy < ty ? 1 : -1
    }
    m[cy][cx] = 0
  }
  
  map.value = m
  
  // 放置玩家
  if (rooms.length) {
    player = { x: rooms[0].x + 1, y: rooms[0].y + 1 }
  }
  
  // 放置实体
  entities.value = []
  const secretRooms = rooms.filter(r => r.isSecret)
  
  for (let i = 1; i < rooms.length - 1; i++) {
    const r = rooms[i]
    
    // 秘密房间特殊处理
    if (r.isSecret) {
      generateSecretRoom(r)
      continue
    }
    
    // 放置怪物
    if (Math.random() < GAME_CONFIG.MONSTER_CHANCE) {
      const monster = getMonsterForTheme(currentTheme.value.id, floor.value)
      entities.value.push({
        type: 'monster',
        x: r.x + Math.floor(Math.random() * r.w),
        y: r.y + Math.floor(Math.random() * r.h),
        ...monster
      })
    }
    
    // 放置宝箱
    if (Math.random() < GAME_CONFIG.CHEST_CHANCE) {
      entities.value.push({
        type: 'chest',
        x: r.x + Math.floor(Math.random() * r.w),
        y: r.y + Math.floor(Math.random() * r.h),
        emoji: '📦',
        name: '宝箱',
        isTrap: Math.random() < GAME_CONFIG.TRAP_CHANCE
      })
    }
    
    // 放置道具
    if (Math.random() < 0.25) {
      const itemKeys = Object.keys(ITEMS).filter(k => !ITEMS[k].rare)
      const randomItem = ITEMS[itemKeys[Math.floor(Math.random() * itemKeys.length)]]
      entities.value.push({
        type: 'item',
        x: r.x + Math.floor(Math.random() * r.w),
        y: r.y + Math.floor(Math.random() * r.h),
        ...randomItem
      })
    }
    
    // 放置陷阱
    if (Math.random() < GAME_CONFIG.TRAP_CHANCE) {
      entities.value.push({
        type: 'trap',
        x: r.x + Math.floor(Math.random() * r.w),
        y: r.y + Math.floor(Math.random() * r.h),
        emoji: '⚠️',
        name: '陷阱',
        damage: 5 + floor.value
      })
    }
  }
  
  // 放置商店
  if (Math.random() < GAME_CONFIG.SHOP_CHANCE && rooms.length > 2) {
    const shopRoom = rooms[Math.floor(Math.random() * (rooms.length - 2)) + 1]
    entities.value.push({
      type: 'shop',
      x: shopRoom.x + Math.floor(shopRoom.w / 2),
      y: shopRoom.y + Math.floor(shopRoom.h / 2),
      emoji: '🏪',
      name: '商店'
    })
  }
  
  // 放置事件
  if (Math.random() < GAME_CONFIG.EVENT_CHANCE && rooms.length > 2) {
    const eventRoom = rooms[Math.floor(Math.random() * (rooms.length - 2)) + 1]
    entities.value.push({
      type: 'event',
      x: eventRoom.x + Math.floor(eventRoom.w / 2),
      y: eventRoom.y + Math.floor(eventRoom.h / 2),
      emoji: '❓',
      name: '事件'
    })
  }
  
  // 放置传送门（连接隐藏关卡）
  if (secretRooms.length > 0 && Math.random() < 0.5) {
    const portalRoom = rooms[Math.floor(Math.random() * (rooms.length - 2)) + 1]
    entities.value.push({
      type: 'portal',
      x: portalRoom.x + Math.floor(portalRoom.w / 2),
      y: portalRoom.y + Math.floor(portalRoom.h / 2),
      emoji: '🌀',
      name: '传送门'
    })
  }
  
  // 放置Boss（每5层）
  if (floor.value % 5 === 0 && rooms.length > 1) {
    const bossRoom = rooms[rooms.length - 2]
    const bossKey = floor.value >= GAME_CONFIG.MAX_FLOOR ? 'final' : currentTheme.value.id
    const boss = BOSSES[bossKey] || BOSSES.forest
    entities.value.push({
      type: 'boss',
      x: bossRoom.x + Math.floor(bossRoom.w / 2),
      y: bossRoom.y + Math.floor(bossRoom.h / 2),
      ...boss,
      isBoss: true
    })
  }
  
  // 放置楼梯
  const last = rooms[rooms.length - 1]
  entities.value.push({
    type: 'stairs',
    x: last.x + Math.floor(last.w / 2),
    y: last.y + Math.floor(last.h / 2),
    emoji: '🪜',
    name: '楼梯'
  })
  
  computeFov()
}

// 生成秘密房间内容
function generateSecretRoom(room) {
  const rand = Math.random()
  
  if (rand < 0.4) {
    // 宝藏房间
    entities.value.push({
      type: 'chest',
      x: room.x + Math.floor(room.w / 2),
      y: room.y + Math.floor(room.h / 2),
      emoji: '💎',
      name: '宝藏',
      isSecret: true,
      gold: 50 + floor.value * 10
    })
  } else if (rand < 0.7) {
    // 稀有道具房间
    const rareItems = Object.values(ITEMS).filter(i => i.rare)
    const randomItem = rareItems[Math.floor(Math.random() * rareItems.length)]
    entities.value.push({
      type: 'item',
      x: room.x + Math.floor(room.w / 2),
      y: room.y + Math.floor(room.h / 2),
      ...randomItem,
      isSecret: true
    })
  } else {
    // 强力怪物守卫的宝箱
    const monster = getMonsterForTheme(currentTheme.value.id, floor.value)
    monster.hp *= 1.5
    monster.atk *= 1.3
    entities.value.push({
      type: 'monster',
      x: room.x + Math.floor(Math.random() * room.w),
      y: room.y + Math.floor(Math.random() * room.h),
      ...monster,
      isGuardian: true
    })
    entities.value.push({
      type: 'chest',
      x: room.x + Math.floor(room.w / 2),
      y: room.y + Math.floor(room.h / 2),
      emoji: '👑',
      name: '国王宝箱',
      isSecret: true,
      gold: 100 + floor.value * 15
    })
  }
  
  // 添加传送门连接到秘密房间
  entities.value.push({
    type: 'portal',
    x: room.x + Math.floor(room.w / 2),
    y: room.y + Math.floor(room.h / 2),
    emoji: '🌀',
    name: '传送门',
    isSecretExit: true
  })
}

// 计算视野
function computeFov() {
  fov = new Set()
  const viewRange = 5 + Math.floor(playerEffects.value.luck / 20)
  
  for (let dy = -viewRange; dy <= viewRange; dy++) {
    for (let dx = -viewRange; dx <= viewRange; dx++) {
      if (dx * dx + dy * dy > viewRange * viewRange) continue
      const nx = player.x + dx
      const ny = player.y + dy
      if (nx >= 0 && nx < GAME_CONFIG.COLS && ny >= 0 && ny < GAME_CONFIG.ROWS) {
        fov.add(`${nx},${ny}`)
      }
    }
  }
}

// 移动玩家
function move(dx, dy) {
  const nx = player.x + dx
  const ny = player.y + dy
  
  if (nx < 0 || nx >= GAME_CONFIG.COLS || ny < 0 || ny >= GAME_CONFIG.ROWS || map.value[ny][nx] === 1) {
    return
  }
  
  playSound('move')
  
  // 检查实体碰撞
  const ei = entities.value.findIndex(e => e.x === nx && e.y === ny)
  if (ei >= 0) {
    const e = entities.value[ei]
    
    if (e.type === 'monster' || e.type === 'boss') {
      combat(e, ei)
    } else if (e.type === 'chest') {
      openChest(ei)
    } else if (e.type === 'item') {
      pickupItem(e, ei)
    } else if (e.type === 'shop') {
      showShop.value = true
      playSound('shop')
    } else if (e.type === 'event') {
      triggerEvent()
    } else if (e.type === 'trap') {
      triggerTrap(e)
    } else if (e.type === 'portal') {
      enterSecretRoom(e)
    } else if (e.type === 'stairs') {
      nextLevel()
      playSound('stairs')
      return
    }
  } else {
    player.x = nx
    player.y = ny
  }
  
  // 再生效果
  if (playerEffects.value.regen > 0 && hp.value < maxHp.value) {
    const regenAmount = Math.min(playerEffects.value.regen, maxHp.value - hp.value)
    hp.value += regenAmount
    if (regenAmount > 0) message.value = `🌿 恢复了${regenAmount}生命`
  }
  
  computeFov()
  draw()
}

// 战斗系统
function combat(enemy, index) {
  playSound('attack')
  
  // 检查闪避
  if (Math.random() * 100 < playerEffects.value.dodge) {
    message.value = '👻 你闪避了攻击!'
    return
  }
  
  // 计算暴击
  const isCrit = Math.random() * 100 < playerEffects.value.crit
  const critMultiplier = isCrit ? 2 : 1
  const playerDmg = Math.max(1, Math.floor((atk.value - Math.floor(Math.random() * (enemy.def + 1))) * critMultiplier))
  enemy.hp -= playerDmg
  
  let msg = isCrit ? `💥 暴击!攻击${enemy.emoji}${enemy.name}! 造成${playerDmg}伤害` : 
                     `攻击${enemy.emoji}${enemy.name}! 造成${playerDmg}伤害`
  
  if (enemy.hp <= 0) {
    const goldGain = Math.floor(enemy.gold * playerEffects.value.goldMulti)
    gold.value += goldGain
    msg += ` 击杀! +${goldGain}金`
    playSound('pickup')
    
    // 检查是否是守卫怪物
    if (enemy.isGuardian) {
      gems.value += 1
      msg += ' 💎+1'
    }
    
    entities.value.splice(index, 1)
  } else {
    const enemyDmg = Math.max(1, enemy.atk - def.value)
    hp.value -= enemyDmg
    msg += ` 受到${enemyDmg}伤害`
    playSound('hit')
    
    if (hp.value <= 0) {
      hp.value = 0
      message.value = '💀 你死了!'
      gameOver.value = true
      playSound('death')
      draw()
      return
    }
  }
  
  message.value = msg
}

// 打开宝箱
function openChest(index) {
  playSound('pickup')
  const chest = entities.value[index]
  
  // 检查陷阱宝箱
  if (chest.isTrap && !chest.isSecret) {
    const damage = 5 + floor.value
    hp.value -= damage
    message.value = `💥 宝箱是陷阱!受到${damage}点伤害!`
    entities.value.splice(index, 1)
    playSound('hit')
    
    if (hp.value <= 0) {
      hp.value = 0
      message.value = '💀 你死了!'
      gameOver.value = true
      playSound('death')
      draw()
    }
    return
  }
  
  // 秘密房间宝箱
  if (chest.isSecret) {
    gold.value += chest.gold || (10 + Math.floor(Math.random() * 20))
    message.value = `💎 发现隐藏宝箱!获得${chest.gold || (10 + Math.floor(Math.random() * 20))}金币!`
    entities.value.splice(index, 1)
    secretRoomsFound.value++
    return
  }
  
  const g = 10 + Math.floor(Math.random() * 20)
  gold.value += g
  message.value = `📦 获得${g}金币`
  
  // 宝箱有概率掉落道具
  if (Math.random() < 0.3) {
    atk.value++
    message.value += ' ⚔️攻击+1'
  } else if (Math.random() < 0.2) {
    def.value++
    message.value += ' 🛡️防御+1'
  }
  
  entities.value.splice(index, 1)
}

// 触发陷阱
function triggerTrap(trap) {
  hp.value -= trap.damage
  message.value = `⚠️ 触发陷阱!受到${trap.damage}点伤害!`
  
  if (hp.value <= 0) {
    hp.value = 0
    message.value = '💀 你死了!'
    gameOver.value = true
    draw()
  }
}

// 触发随机事件
function triggerEvent() {
  const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]
  currentEvent.value = { ...event }
}

// 处理事件选择
function handleEventChoice(optionIndex) {
  if (!currentEvent.value) return
  
  const option = currentEvent.value.options[optionIndex]
  const result = option.effect()
  
  if (result.gold) gold.value += result.gold
  if (result.damage) hp.value -= result.damage
  if (result.heal) {
    const healAmount = Math.min(result.heal, maxHp.value - hp.value)
    hp.value += healAmount
  }
  if (result.item) {
    pickupItem(result.item, -1)
  }
  
  message.value = result.message
  currentEvent.value = null
  
  if (hp.value <= 0) {
    hp.value = 0
    message.value = '💀 你死了!'
    gameOver.value = true
    draw()
  }
}

// 进入秘密房间
function enterSecretRoom(portal) {
  if (portal.isSecretExit) {
    // 从秘密房间返回
    inSecretRoom.value = false
    generateDungeon()
    message.value = '🌀 你回到了主层'
  } else {
    // 进入秘密房间
    inSecretRoom.value = true
    secretRoomsFound.value++
    
    // 创建秘密房间地图
    const m = Array.from({ length: GAME_CONFIG.ROWS }, () => Array(GAME_CONFIG.COLS).fill(1))
    
    // 创建一个小房间
    const roomW = 8
    const roomH = 6
    const roomX = (GAME_CONFIG.COLS - roomW) / 2
    const roomY = (GAME_CONFIG.ROWS - roomH) / 2
    
    for (let y = roomY; y < roomY + roomH; y++) {
      for (let x = roomX; x < roomX + roomW; x++) {
        m[y][x] = 0
      }
    }
    
    map.value = m
    player = { x: roomX + 1, y: roomY + 1 }
    
    // 生成秘密房间实体
    entities.value = []
    
    // 宝藏
    entities.value.push({
      type: 'chest',
      x: roomX + Math.floor(roomW / 2),
      y: roomY + Math.floor(roomH / 2),
      emoji: '💎',
      name: '宝藏',
      isSecret: true,
      gold: 100 + floor.value * 15
    })
    
    // 返回传送门
    entities.value.push({
      type: 'portal',
      x: roomX + 1,
      y: roomY + Math.floor(roomH / 2),
      emoji: '🌀',
      name: '传送门',
      isSecretExit: true
    })
    
    // 可能有守卫
    if (Math.random() < 0.5) {
      const monster = getMonsterForTheme(currentTheme.value.id, floor.value)
      monster.hp *= 2
      monster.atk *= 1.5
      entities.value.push({
        type: 'monster',
        x: roomX + Math.floor(Math.random() * (roomW - 2)) + 1,
        y: roomY + Math.floor(Math.random() * (roomH - 2)) + 1,
        ...monster,
        isGuardian: true
      })
    }
    
    computeFov()
    draw()
    message.value = '🔮 你进入了隐藏关卡!'
  }
}

// 拾取道具
function pickupItem(item, index) {
  playSound('pickup')
  if (item.effect === 'heal') {
    const healAmount = Math.min(item.value, maxHp.value - hp.value)
    hp.value += healAmount
    message.value = `${item.emoji}使用${item.name}，恢复${healAmount}生命`
  } else if (item.effect === 'atk') {
    atk.value += item.value
    message.value = `${item.emoji}使用${item.name}，攻击力+${item.value}`
  } else if (item.effect === 'def') {
    def.value += item.value
    message.value = `${item.emoji}使用${item.name}，防御力+${item.value}`
  } else if (item.effect === 'maxHp') {
    maxHp.value += item.value
    hp.value += item.value
    message.value = `${item.emoji}使用${item.name}，最大生命+${item.value}`
  } else if (item.effect === 'crit') {
    playerEffects.value.crit += item.value
    message.value = `${item.emoji}使用${item.name}，暴击率+${item.value}%`
  } else if (item.effect === 'dodge') {
    playerEffects.value.dodge += item.value
    message.value = `${item.emoji}使用${item.name}，闪避率+${item.value}%`
  } else if (item.effect === 'goldMulti') {
    playerEffects.value.goldMulti += item.value - 1
    message.value = `${item.emoji}使用${item.name}，金币获取翻倍!`
  } else if (item.effect === 'regen') {
    playerEffects.value.regen += item.value
    message.value = `${item.emoji}使用${item.name}，每回合恢复+${item.value}`
  } else if (item.effect === 'luck') {
    playerEffects.value.luck += item.value
    message.value = `${item.emoji}使用${item.name}，幸运值+${item.value}`
  }
  
  if (index >= 0) {
    entities.value.splice(index, 1)
  }
}

// 购买物品
function buyItem(item) {
  if (gold.value < item.price) {
    message.value = '💰 金币不足!'
    return
  }
  
  gold.value -= item.price
  pickupItem(item, -1)
  showShop.value = false
}

// 进入下一层
function nextLevel() {
  floor.value++
  
  // 检查通关
  if (floor.value > GAME_CONFIG.MAX_FLOOR) {
    gameWon.value = true
    playSound('victory')
    return
  }
  
  hp.value = Math.min(hp.value + GAME_CONFIG.HEAL_ON_LEVEL, maxHp.value)
  message.value = `🪜 下到第${floor.value}层，恢复${GAME_CONFIG.HEAL_ON_LEVEL}生命`
  generateDungeon()
  draw()
}

// 点击事件
function onClick(e) {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  
  const mx = Math.floor((e.clientX - rect.left) * (480 / rect.width) / GAME_CONFIG.CELL)
  const my = Math.floor((e.clientY - rect.top) * (360 / rect.height) / GAME_CONFIG.CELL)
  const dx = mx - player.x
  const dy = my - player.y
  
  if (Math.abs(dx) + Math.abs(dy) === 1) {
    move(dx, dy)
  } else if (Math.abs(dx) >= Math.abs(dy)) {
    move(Math.sign(dx), 0)
  } else {
    move(0, Math.sign(dy))
  }
}

// 新游戏
function newGame() {
  hp.value = GAME_CONFIG.INITIAL_STATS.hp
  maxHp.value = GAME_CONFIG.INITIAL_STATS.maxHp
  atk.value = GAME_CONFIG.INITIAL_STATS.atk
  def.value = GAME_CONFIG.INITIAL_STATS.def
  gold.value = 0
  gems.value = 0
  floor.value = 1
  message.value = ''
  gameOver.value = false
  gameWon.value = false
  showShop.value = false
  currentEvent.value = null
  inSecretRoom.value = false
  secretRoomsFound.value = 0
  
  // 重置效果
  playerEffects.value = {
    crit: 0,
    dodge: 0,
    goldMulti: 1,
    regen: 0,
    luck: 0
  }
  
  generateDungeon()
  draw()
}

// 绘制游戏
function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  
  const theme = currentTheme.value
  
  // 清空画布
  ctx.fillStyle = theme.dark
  ctx.fillRect(0, 0, GAME_CONFIG.COLS * GAME_CONFIG.CELL, GAME_CONFIG.ROWS * GAME_CONFIG.CELL)
  
  // 绘制地图
  for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
    for (let c = 0; c < GAME_CONFIG.COLS; c++) {
      if (!fov.has(`${c},${r}`)) continue
      ctx.fillStyle = map.value[r][c] === 1 ? theme.wall : theme.floor
      ctx.fillRect(c * GAME_CONFIG.CELL, r * GAME_CONFIG.CELL, GAME_CONFIG.CELL, GAME_CONFIG.CELL)
    }
  }
  
  // 绘制实体
  entities.value.forEach(e => {
    if (!fov.has(`${e.x},${e.y}`)) return
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    
    // 特殊实体发光效果
    if (e.isSecret || e.type === 'portal') {
      ctx.shadowColor = '#fbbf24'
      ctx.shadowBlur = 10
    }
    
    ctx.fillText(e.emoji || e.name, e.x * GAME_CONFIG.CELL + GAME_CONFIG.CELL / 2, e.y * GAME_CONFIG.CELL + GAME_CONFIG.CELL - 2)
    ctx.shadowBlur = 0
  })
  
  // 绘制玩家
  ctx.fillStyle = theme.player
  ctx.font = 'bold 14px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('@', player.x * GAME_CONFIG.CELL + GAME_CONFIG.CELL / 2, player.y * GAME_CONFIG.CELL + GAME_CONFIG.CELL - 2)
}

// 键盘事件
function onKey(e) {
  const m = {
    ArrowUp: [0, -1], ArrowDown: [0, 1],
    ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
  }[e.key]
  if (m) {
    e.preventDefault()
    move(m[0], m[1])
  }
}

onMounted(() => {
  newGame()
  window.addEventListener('keydown', onKey)
  initBgParticles()
  drawBgParticles()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (bgAnimFrame) cancelAnimationFrame(bgAnimFrame)
})
</script>

<style scoped>
.roguelike-game{position:relative;padding:20px 16px;overflow:hidden;border-radius:16px;background:linear-gradient(165deg,#0a0a1a,#1a1a2a 40%,#0f0f2a);min-height:500px;max-width:600px;margin:0 auto}

/* 背景粒子 */
.bg-particles{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.6}

/* 游戏头部 */
.game-header{position:relative;z-index:1;margin-bottom:16px;text-align:center}
.header-glow{position:absolute;inset:-10px;background:radial-gradient(circle at 50% 30%,rgba(124,58,237,0.1),transparent 60%);animation:header-pulse 4s ease-in-out infinite}
@keyframes header-pulse{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
.title-wrap{position:relative;z-index:1}
.title-icon{font-size:32px;display:block;margin-bottom:8px;animation:title-float 3s ease-in-out infinite;filter:drop-shadow(0 0 12px rgba(124,58,237,0.4))}
@keyframes title-float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-6px) rotate(5deg)}}
.game-title{font-size:24px;font-weight:900;color:#f1f5f9;letter-spacing:2px;margin-bottom:4px;text-shadow:0 0 20px rgba(124,58,237,0.3)}
.title-sub{font-size:10px;color:#64748b;letter-spacing:4px;font-weight:300}

/* 状态栏 */
.status-bar{position:relative;z-index:1;margin-bottom:12px}
.status-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}
.stat-item{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);transition:all 0.3s}
.stat-item:hover{background:rgba(255,255,255,0.06);transform:translateY(-1px)}
.stat-ring{width:36px;height:36px;position:relative;display:flex;align-items:center;justify-content:center}
.stat-ring svg{width:36px;height:36px;filter:drop-shadow(0 0 4px rgba(239,68,68,0.3))}
.ring-progress{transition:stroke-dasharray 0.5s ease}
.ring-icon{position:absolute;font-size:14px}
.stat-icon{font-size:18px;filter:drop-shadow(0 0 4px rgba(255,255,255,0.1))}
.stat-info{display:flex;flex-direction:column}
.stat-value{font-size:14px;font-weight:700;color:#f1f5f9;font-variant-numeric:tabular-nums}
.stat-label{font-size:8px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}
.hp-stat{border-color:rgba(239,68,68,0.15)}
.atk-stat{border-color:rgba(239,68,68,0.1)}
.def-stat{border-color:rgba(59,130,246,0.1)}
.gold-stat{border-color:rgba(251,191,36,0.15)}
.gems-stat{border-color:rgba(168,85,247,0.15)}

/* 控制栏 */
.control-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;position:relative;z-index:1}
.ctrl-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;font-size:12px;font-weight:600;color:#f1f5f9;transition:all 0.3s;background:rgba(255,255,255,0.04)}
.ctrl-btn:hover{background:rgba(255,255,255,0.08);transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.2)}
.new-btn{background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(139,92,246,0.2));border-color:rgba(124,58,237,0.2)}
.new-btn:hover{border-color:rgba(124,58,237,0.4);box-shadow:0 0 12px rgba(124,58,237,0.15)}
.btn-icon{font-size:16px}
.floor-badge{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;background:rgba(30,58,95,0.4);border:1px solid rgba(59,130,246,0.15)}
.floor-theme{font-size:12px;color:#93c5fd}
.floor-num{font-size:11px;font-weight:700;color:#f1f5f9}
.secret-badge{display:flex;align-items:center;gap:4px;padding:6px 10px;border-radius:10px;background:linear-gradient(135deg,rgba(168,85,247,0.2),rgba(139,92,246,0.2));border:1px solid rgba(168,85,247,0.2);animation:secret-glow 2s ease-in-out infinite}
@keyframes secret-glow{0%,100%{box-shadow:0 0 8px rgba(168,85,247,0.2)}50%{box-shadow:0 0 16px rgba(168,85,247,0.4)}}
.secret-icon{font-size:14px}
.secret-text{font-size:11px;font-weight:600;color:#c4b5fd}
.message-box{padding:6px 12px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.05);min-width:120px}
.msg-text{font-size:11px;color:#94a3b8}

/* 游戏画布 */
.canvas-wrapper{position:relative;z-index:1;margin-bottom:12px}
.game-canvas{display:block;width:100%;max-width:480px;margin:0 auto;border-radius:12px;border:2px solid rgba(124,58,237,0.2);background:#000;image-rendering:pixelated}
.canvas-glow{position:absolute;inset:-4px;border-radius:16px;background:radial-gradient(circle at 50% 50%,rgba(124,58,237,0.1),transparent 70%);pointer-events:none;z-index:-1;animation:canvas-pulse 3s ease-in-out infinite}
@keyframes canvas-pulse{0%,100%{opacity:0.5}50%{opacity:1}}

/* 提示文字 */
.hint-text{text-align:center;font-size:10px;color:#64748b;margin-bottom:12px;position:relative;z-index:1}

/* 移动控制 */
.move-controls{position:relative;z-index:1}
.move-grid{display:grid;grid-template-columns:repeat(3,40px);gap:4px;justify-content:center}
.move-btn{width:40px;height:40px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#f1f5f9;font-size:16px;cursor:pointer;transition:all 0.2s}
.move-btn:hover{background:rgba(255,255,255,0.08);transform:scale(1.05)}
.move-btn:active{transform:scale(0.95)}

/* 音效开关 */
.sound-btn{position:absolute;top:16px;right:16px;z-index:10;width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#f1f5f9;font-size:18px;cursor:pointer;transition:all 0.2s}
.sound-btn:hover{background:rgba(255,255,255,0.08);transform:scale(1.05)}

/* 弹窗基础样式 */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:50}
.modal-box{position:relative;padding:24px 28px;border-radius:16px;max-width:360px;width:90%;overflow:hidden}
.modal-glow{position:absolute;inset:-2px;border-radius:18px;z-index:-1}
.modal-header{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.modal-icon{font-size:28px;filter:drop-shadow(0 0 6px rgba(255,255,255,0.2))}
.modal-title{font-size:18px;font-weight:800;color:#f1f5f9}

/* 商店弹窗 */
.shop-modal{background:linear-gradient(160deg,#1a1a2a,#151025);border:1px solid rgba(251,191,36,0.2)}
.shop-glow{background:linear-gradient(135deg,rgba(251,191,36,0.2),rgba(124,58,237,0.2));animation:shop-glow 2s ease-in-out infinite}
@keyframes shop-glow{0%,100%{box-shadow:0 0 20px rgba(251,191,36,0.2)}50%{box-shadow:0 0 40px rgba(251,191,36,0.3)}}
.shop-items{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.shop-item{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);transition:all 0.2s}
.shop-item:hover{background:rgba(255,255,255,0.06);transform:translateX(4px)}
.item-info{display:flex;align-items:center;gap:8px}
.item-emoji{font-size:20px}
.item-name{font-size:13px;color:#f1f5f9}
.buy-btn{display:flex;align-items:center;gap:4px;padding:6px 12px;border-radius:8px;border:1px solid rgba(251,191,36,0.2);background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(180,83,9,0.15));color:#fbbf24;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s}
.buy-btn:hover:not(.disabled){background:linear-gradient(135deg,rgba(251,191,36,0.25),rgba(180,83,9,0.25));transform:scale(1.05)}
.buy-btn.disabled{opacity:0.4;cursor:not-allowed}
.price-icon{font-size:12px}
.price-num{font-size:11px}
.close-btn{width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s}
.close-btn:hover{background:rgba(255,255,255,0.08);color:#f1f5f9}

/* 事件弹窗 */
.event-modal{background:linear-gradient(160deg,#1a1025,#151030);border:1px solid rgba(168,85,247,0.2)}
.event-glow{background:linear-gradient(135deg,rgba(168,85,247,0.2),rgba(139,92,246,0.2));animation:event-glow 2s ease-in-out infinite}
@keyframes event-glow{0%,100%{box-shadow:0 0 20px rgba(168,85,247,0.2)}50%{box-shadow:0 0 40px rgba(168,85,247,0.3)}}
.event-desc{font-size:13px;color:#cbd5e1;margin-bottom:16px;line-height:1.5}
.event-options{display:flex;flex-direction:column;gap:8px}
.option-btn{width:100%;padding:12px;border-radius:10px;border:1px solid rgba(168,85,247,0.2);background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(139,92,246,0.15));color:#c4b5fd;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s}
.option-btn:hover{background:linear-gradient(135deg,rgba(168,85,247,0.25),rgba(139,92,246,0.25));transform:translateX(4px)}

/* 游戏结束弹窗 */
.gameover-modal{background:linear-gradient(160deg,#1a0a0a,#150a0a);border:1px solid rgba(239,68,68,0.2)}
.death-glow{background:linear-gradient(135deg,rgba(239,68,68,0.2),rgba(185,28,28,0.2));animation:death-glow 2s ease-in-out infinite}
@keyframes death-glow{0%,100%{box-shadow:0 0 20px rgba(239,68,68,0.2)}50%{box-shadow:0 0 40px rgba(239,68,68,0.3)}}
.death-icon{animation:death-shake 0.5s ease-in-out}
@keyframes death-shake{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}
.death-title{color:#ef4444;text-shadow:0 0 10px rgba(239,68,68,0.3)}
.result-stats{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
.result-item{display:flex;align-items:center;gap:12px;padding:10px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05)}
.result-icon{font-size:20px}
.result-label{font-size:12px;color:#94a3b8}
.result-value{font-size:14px;font-weight:700;color:#f1f5f9;margin-left:auto}
.retry-btn{width:100%;padding:12px;border-radius:10px;border:1px solid rgba(239,68,68,0.2);background:linear-gradient(135deg,rgba(239,68,68,0.15),rgba(185,28,28,0.15));color:#fca5a5;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s}
.retry-btn:hover{background:linear-gradient(135deg,rgba(239,68,68,0.25),rgba(185,28,28,0.25));transform:scale(1.02)}

/* 胜利弹窗 */
.victory-modal{background:linear-gradient(160deg,#1a1a0a,#15150a);border:1px solid rgba(251,191,36,0.2)}
.victory-glow{background:linear-gradient(135deg,rgba(251,191,36,0.2),rgba(245,158,11,0.2));animation:victory-glow 2s ease-in-out infinite}
@keyframes victory-glow{0%,100%{box-shadow:0 0 20px rgba(251,191,36,0.2)}50%{box-shadow:0 0 40px rgba(251,191,36,0.4)}}
.victory-particles{position:absolute;inset:0;pointer-events:none;z-index:-1}
.victory-particles .particle{position:absolute;font-size:16px;animation:particle-float 3s ease-in-out infinite}
.victory-particles .particle:nth-child(1){left:10%;top:20%;animation-delay:0s}
.victory-particles .particle:nth-child(2){left:30%;top:40%;animation-delay:0.5s}
.victory-particles .particle:nth-child(3){left:50%;top:10%;animation-delay:1s}
.victory-particles .particle:nth-child(4){left:70%;top:30%;animation-delay:1.5s}
.victory-particles .particle:nth-child(5){left:90%;top:50%;animation-delay:2s}
.victory-particles .particle:nth-child(6){left:20%;top:70%;animation-delay:0.3s}
.victory-particles .particle:nth-child(7){left:60%;top:80%;animation-delay:0.8s}
.victory-particles .particle:nth-child(8){left:80%;top:60%;animation-delay:1.3s}
@keyframes particle-float{0%,100%{transform:translateY(0) scale(1);opacity:0.6}50%{transform:translateY(-20px) scale(1.2);opacity:1}}
.victory-icon{animation:victory-bounce 1s ease-in-out infinite}
@keyframes victory-bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
.victory-title{color:#fbbf24;text-shadow:0 0 10px rgba(251,191,36,0.3)}
.victory-desc{font-size:14px;color:#fcd34d;margin-bottom:16px;text-align:center}
.victory-btn{border-color:rgba(251,191,36,0.2);background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.15));color:#fbbf24}
.victory-btn:hover{background:linear-gradient(135deg,rgba(251,191,36,0.25),rgba(245,158,11,0.25))}

/* 弹窗动画 */
.modal-fade-enter-active{transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1)}
.modal-fade-leave-active{transition:all 0.3s ease}
.modal-fade-enter-from,.modal-fade-leave-to{opacity:0}
.modal-fade-enter-from .modal-box{transform:scale(0.8) translateY(20px)}
.modal-fade-leave-to .modal-box{transform:scale(0.9) translateY(-10px)}
</style>