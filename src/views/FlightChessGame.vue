<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">✈️ 飞行棋</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="rollDice" v-if="!rolling" :disabled="gameOver">🎲 掷骰子</button>
      <button class="btn-sm btn-secondary" @click="newGame">🔄 新游戏</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span :class="currentPlayer===0 ? 'font-bold text-red-500' : ''">🔴 你</span>
      <span>vs</span>
      <span :class="currentPlayer===1 ? 'font-bold text-blue-500' : ''">🔵 AI</span>
      <span v-if="dice">🎲 {{ dice }}</span>
      <span>{{ gameOver }}</span>
    </div>
    <canvas ref="canvas" width="400" height="400" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 block max-w-full cursor-pointer" style="width:min(400px,100%)" @click="onClick"></canvas>
    <p class="text-xs text-gray-400 mt-2">掷6才能起飞，点击棋子移动，先到终点者胜</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const canvas = ref(null)
const TRACK_SIZE = 28
const dice = ref(0), rolling = ref(false), currentPlayer = ref(0), gameOver = ref('')
let pieces = [] // [{player, pos(-1=base, 0-27=track, 28-31=home, 32=finished), selectable}]
function newGame() {
  dice.value = 0; gameOver.value = ''; currentPlayer.value = 0
  pieces = []
  for (let p = 0; p < 2; p++) {
    for (let i = 0; i < 4; i++) pieces.push({player: p, pos: -1})
  }
  draw()
}
function getPlayerPieces(p) { return pieces.filter(pc => pc.player === p) }
function getTrackPos(pos, player) {
  // Simplified circular track positions
  const angle = (pos / TRACK_SIZE) * Math.PI * 2 - Math.PI / 2 + (player * Math.PI)
  const cx = 200, cy = 200, r = 150
  return {x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r}
}
function getBasePos(player, i) {
  const bases = [{x:60,y:60},{x:340,y:60}]
  const offsets = [{x:-20,y:-20},{x:20,y:-20},{x:-20,y:20},{x:20,y:20}]
  return {x: bases[player].x + offsets[i].x, y: bases[player].y + offsets[i].y}
}
function getHomePos(player, step) {
  const angle = (step / 4) * Math.PI * 2 - Math.PI / 2 + (player * Math.PI)
  const cx = 200, cy = 200, r = 60 + step * 15
  return {x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r}
}
async function rollDice() {
  if (rolling.value || gameOver.value) return
  rolling.value = true
  // Animate dice
  for (let i = 0; i < 10; i++) { dice.value = 1 + Math.floor(Math.random()*6); draw(); await sleep(80) }
  dice.value = 1 + Math.floor(Math.random()*6)
  rolling.value = false
  if (currentPlayer.value === 0) {
    // Player turn - find selectable pieces
    const selectable = getSelectablePieces(0, dice.value)
    if (selectable.length === 0) { nextTurn(); return }
    if (selectable.length === 1) { movePiece(selectable[0], dice.value); nextTurn(); return }
    // Mark selectable and wait for click
    selectable.forEach(p => p.selectable = true); draw()
  } else {
    // AI turn
    await sleep(500)
    const selectable = getSelectablePieces(1, dice.value)
    if (selectable.length > 0) {
      const target = selectable[Math.floor(Math.random()*selectable.length)]
      movePiece(target, dice.value)
    }
    nextTurn()
  }
}
function getSelectablePieces(player, d) {
  const pp = getPlayerPieces(player)
  const result = []
  if (d === 6) {
    const inBase = pp.filter(p => p.pos === -1)
    if (inBase.length > 0) result.push(inBase[0])
  }
  pp.filter(p => p.pos >= 0 && p.pos + d <= 32).forEach(p => result.push(p))
  return result
}
function movePiece(piece, d) {
  piece.selectable = false
  if (piece.pos === -1 && d === 6) { piece.pos = 0 }
  else if (piece.pos >= 0) { piece.pos += d; if (piece.pos > 32) piece.pos = 32 }
  // Check capture
  pieces.filter(p => p.player !== piece.player && p.pos === piece.pos && p.pos >= 0 && p.pos < 28).forEach(p => p.pos = -1)
  // Check win
  if (getPlayerPieces(piece.player).every(p => p.pos >= 32)) {
    gameOver.value = piece.player === 0 ? '🎉 你赢了!' : '😢 AI赢了!'
  }
  draw()
}
function nextTurn() {
  if (gameOver.value) return
  if (dice.value === 6) return // Roll again on 6
  currentPlayer.value = currentPlayer.value === 0 ? 1 : 0
  if (currentPlayer.value === 1) setTimeout(rollDice, 800)
}
function onClick(e) {
  if (currentPlayer.value !== 0 || gameOver.value) return
  const rect = canvas.value.getBoundingClientRect()
  const mx = (e.clientX-rect.left)*(400/rect.width), my = (e.clientY-rect.top)*(400/rect.height)
  const selectable = pieces.filter(p => p.selectable)
  for (const p of selectable) {
    const pos = p.pos === -1 ? getBasePos(p.player, getPlayerPieces(p.player).indexOf(p)) : p.pos >= 28 ? getHomePos(p.player, p.pos-28) : getTrackPos(p.pos + p.player * 14, p.player)
    if (Math.hypot(mx-pos.x, my-pos.y) < 20) {
      selectable.forEach(s => s.selectable = false)
      movePiece(p, dice.value); nextTurn(); return
    }
  }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  const isDark = document.documentElement.classList.contains('dark')
  ctx.fillStyle = isDark ? '#0f172a' : '#f9fafb'; ctx.fillRect(0, 0, 400, 400)
  // Track
  ctx.strokeStyle = isDark ? '#334155' : '#d1d5db'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(200, 200, 150, 0, Math.PI*2); ctx.stroke()
  // Bases
  ctx.fillStyle = '#ef444430'; ctx.fillRect(20,20,80,80)
  ctx.fillStyle = '#3b82f630'; ctx.fillRect(300,20,80,80)
  // Center
  ctx.fillStyle = isDark ? '#1e293b' : '#e5e7eb'
  ctx.beginPath(); ctx.arc(200, 200, 40, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = isDark ? '#94a3b8' : '#6b7280'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('终点', 200, 204)
  // Pieces
  pieces.forEach((p, idx) => {
    let pos
    if (p.pos === -1) pos = getBasePos(p.player, getPlayerPieces(p.player).indexOf(p))
    else if (p.pos >= 28) pos = getHomePos(p.player, p.pos - 28)
    else pos = getTrackPos(p.pos + p.player * 14, p.player)
    ctx.fillStyle = p.player === 0 ? '#ef4444' : '#3b82f6'
    if (p.selectable) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pos.x, pos.y, 14, 0, Math.PI*2); ctx.stroke() }
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 10, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(p.pos >= 32 ? '✓' : (idx%4+1).toString(), pos.x, pos.y+4)
  })
  // Dice display
  if (dice.value) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2
    ctx.fillRect(180, 370, 40, 25); ctx.strokeRect(180, 370, 40, 25)
    ctx.fillStyle = '#000'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('🎲'+dice.value, 200, 389)
  }
}
onMounted(() => newGame())
</script>
