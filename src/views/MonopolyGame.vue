<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🏘️ 大富翁</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="rollDice" v-if="!rolling" :disabled="gameOver">🎲 掷骰子</button>
      <button class="btn-sm btn-secondary" @click="newGame">🔄 新游戏</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm flex-wrap">
      <span v-for="(p,i) in players" :key="i" :class="current===i?'font-bold':''" :style="{color:p.color}">
        {{ p.name }}: 💰{{ p.money }} | 📍{{ p.pos }}
        <span v-if="p.bankrupt">💀</span>
      </span>
    </div>
    <canvas ref="canvas" width="480" height="480" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 block max-w-full" style="width:min(480px,100%)"></canvas>
    <div class="mt-3 text-sm" v-if="message">{{ message }}</div>
    <p class="text-xs text-gray-400 mt-2">掷骰子前进，购买地产，收取过路费</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const canvas = ref(null)
const BOARD = [
  {name:'起点',type:'start'},{name:'北京',price:200,type:'property'},{name:'宝箱',type:'chest'},{name:'上海',price:180,type:'property'},
  {name:'税务',type:'tax'},{name:'广州',price:160,type:'property'},{name:'机会',type:'chance'},{name:'深圳',price:220,type:'property'},
  {name:'监狱',type:'jail'},{name:'成都',price:140,type:'property'},{name:'宝箱',type:'chest'},{name:'杭州',price:150,type:'property'},
  {name:'水电',type:'utility'},{name:'武汉',price:130,type:'property'},{name:'机会',type:'chance'},{name:'南京',price:170,type:'property'},
  {name:'停车',type:'park'},{name:'天津',price:190,type:'property'},{name:'宝箱',type:'chest'},{name:'重庆',price:160,type:'property'},
  {name:'机会',type:'chance'},{name:'西安',price:140,type:'property'},{name:'税务',type:'tax'},{name:'苏州',price:200,type:'property'},
]
const players = ref([]), current = ref(0), dice = ref(0), message = ref(''), rolling = ref(false), gameOver = ref(false)
let properties = {} // index -> owner
function newGame() {
  players.value = [
    {name:'你', money:1500, pos:0, color:'#ef4444', bankrupt:false},
    {name:'AI', money:1500, pos:0, color:'#3b82f6', bankrupt:false},
  ]
  properties = {}; current.value = 0; dice.value = 0; message.value = ''; gameOver.value = false
  draw()
}
async function rollDice() {
  if (rolling.value || gameOver.value) return
  rolling.value = true; message.value = ''
  for (let i = 0; i < 8; i++) { dice.value = 1+Math.floor(Math.random()*6); draw(); await sleep(80) }
  dice.value = 1+Math.floor(Math.random()*6)
  rolling.value = false
  const p = players.value[current.value]
  p.pos = (p.pos + dice.value) % BOARD.length
  if (p.pos === 0 && dice.value > 0) { p.money += 200; message.value = `${p.name}经过起点获得$200` }
  const cell = BOARD[p.pos]
  await handleCell(cell, p)
  // Check bankruptcy
  if (p.money < 0) { p.bankrupt = true; message.value = `${p.name}破产了!` }
  if (players.value.filter(p => !p.bankrupt).length <= 1) { gameOver.value = true; message.value = players.value.find(p=>!p.bankrupt).name + '获胜!' }
  draw()
  // Next turn
  if (!gameOver.value) {
    current.value = (current.value + 1) % players.value.length
    while (players.value[current.value].bankrupt) current.value = (current.value + 1) % players.value.length
    if (current.value === 1) setTimeout(aiTurn, 800)
  }
}
async function handleCell(cell, p) {
  if (cell.type === 'property') {
    const idx = BOARD.indexOf(cell)
    if (properties[idx] === undefined) {
      if (current.value === 0 && p.money >= cell.price) {
        p.money -= cell.price; properties[idx] = 0; message.value = `${p.name}购买了${cell.name} $${cell.price}`
      } else if (current.value === 1 && p.money >= cell.price) {
        p.money -= cell.price; properties[idx] = 1; message.value = `AI购买了${cell.name}`
      }
    } else if (properties[idx] !== current.value) {
      const rent = Math.floor(cell.price * 0.3)
      p.money -= rent; players.value[properties[idx]].money += rent
      message.value = `${p.name}向${players.value[properties[idx]].name}支付过路费$${rent}`
    }
  } else if (cell.type === 'tax') { p.money -= 100; message.value = `${p.name}缴税$100` }
  else if (cell.type === 'chest') { const amt = 50+Math.floor(Math.random()*100); p.money += amt; message.value = `${p.name}获得宝箱$${amt}` }
  else if (cell.type === 'chance') { const amt = Math.floor(Math.random()*200)-50; p.money += amt; message.value = `${p.name}机会卡: ${amt>=0?'+':''}$${amt}` }
}
async function aiTurn() { await rollDice() }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  const isDark = document.documentElement.classList.contains('dark')
  ctx.fillStyle = isDark ? '#0f172a' : '#f9fafb'; ctx.fillRect(0, 0, 480, 480)
  const SIDE = 7, CW = 480/SIDE
  const COLORS = {property:'#22c55e',chest:'#eab308',chance:'#a855f7',tax:'#ef4444',jail:'#6b7280',park:'#06b6d4',start:'#f97316',utility:'#3b82f6'}
  // Draw board cells in a loop
  BOARD.forEach((cell, i) => {
    let x, y
    if (i < 7) { x = i * CW; y = 0 }
    else if (i < 13) { x = 6 * CW; y = (i - 6) * CW }
    else if (i < 19) { x = (18 - i) * CW; y = 6 * CW }
    else { x = 0; y = (24 - i) * CW }
    ctx.fillStyle = (COLORS[cell.type] || '#6b7280') + '40'
    ctx.fillRect(x+1, y+1, CW-2, CW-2)
    ctx.strokeStyle = isDark ? '#334155' : '#d1d5db'; ctx.lineWidth = 1; ctx.strokeRect(x+1, y+1, CW-2, CW-2)
    ctx.fillStyle = isDark ? '#94a3b8' : '#374151'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(cell.name, x+CW/2, y+CW/2-2)
    if (cell.price) ctx.fillText('$'+cell.price, x+CW/2, y+CW/2+10)
    // Owner indicator
    const owner = properties[BOARD.indexOf(cell)]
    if (owner !== undefined) {
      ctx.fillStyle = players.value[owner].color
      ctx.fillRect(x+2, y+CW-8, CW-4, 6)
    }
  })
  // Players
  players.value.forEach((p, pi) => {
    if (p.bankrupt) return
    let x, y
    const i = p.pos
    if (i < 7) { x = i * CW + CW/2; y = CW/2 }
    else if (i < 13) { x = 6 * CW + CW/2; y = (i-6) * CW + CW/2 }
    else if (i < 19) { x = (18-i) * CW + CW/2; y = 6 * CW + CW/2 }
    else { x = CW/2; y = (24-i) * CW + CW/2 }
    ctx.fillStyle = p.color
    ctx.beginPath(); ctx.arc(x + (pi-0.5)*12, y, 8, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(pi === 0 ? 'P' : 'AI', x + (pi-0.5)*12, y+3)
  })
  // Center info
  ctx.fillStyle = isDark ? '#94a3b8' : '#374151'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'
  if (dice.value) ctx.fillText('🎲 ' + dice.value, 240, 240)
}
onMounted(() => newGame())
</script>
