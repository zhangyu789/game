<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">⚫ 跳棋</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <button class="btn-sm btn-secondary" @click="undo">↩️ 悔棋</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span :class="turn===1?'font-bold text-red-500':''">🔴 你</span> vs <span :class="turn===2?'font-bold text-blue-500':''">🔵 AI</span>
      <span>{{ winner }}</span>
    </div>
    <canvas ref="canvas" width="400" height="400" class="border border-gray-300 dark:border-slate-600 rounded bg-amber-800 block max-w-full cursor-pointer" style="width:min(400px,100%)" @click="onClick"></canvas>
    <p class="text-xs text-gray-400 mt-2">点击棋子然后点目标位置，可以跳吃对方棋子</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const canvas = ref(null)
const SIZE = 8, CELL = 50
const board = ref([]), turn = ref(1), selected = ref(null), winner = ref('')
let history = []
function newGame() {
  board.value = Array.from({length:SIZE}, () => Array(SIZE).fill(0))
  for (let r = 0; r < 3; r++) for (let c = 0; c < SIZE; c++) if ((r+c)%2===1) board.value[r][c] = 2
  for (let r = 5; r < 8; r++) for (let c = 0; c < SIZE; c++) if ((r+c)%2===1) board.value[r][c] = 1
  turn.value = 1; selected.value = null; winner.value = ''; history = []
  draw()
}
function onClick(e) {
  if (winner.value || turn.value !== 1) return
  const rect = canvas.value.getBoundingClientRect()
  const c = Math.floor((e.clientX-rect.left)*(400/rect.width)/CELL)
  const r = Math.floor((e.clientY-rect.top)*(400/rect.height)/CELL)
  if (selected.value) {
    if (tryMove(selected.value.r, selected.value.c, r, c)) {
      selected.value = null; turn.value = 2; draw()
      if (checkWin()) return
      setTimeout(aiTurn, 400)
    } else if (board.value[r]?.[c] === 1) { selected.value = {r,c} }
    else selected.value = null
  } else if (board.value[r]?.[c] === 1) selected.value = {r,c}
  draw()
}
function tryMove(fr, fc, tr, tc) {
  if (tr<0||tr>=SIZE||tc<0||tc>=SIZE||board.value[tr][tc]!==0) return false
  const dr = tr-fr, dc = tc-fc
  if (Math.abs(dr)===1 && Math.abs(dc)===1 && (turn.value===1 ? dr<0 : dr>0)) {
    history.push(board.value.map(r=>[...r]))
    board.value[tr][tc] = board.value[fr][fc]; board.value[fr][fc] = 0
    if (tr===0||tr===SIZE-1) board.value[tr][tc] = turn.value===1?3:4 // King
    return true
  }
  if (Math.abs(dr)===2 && Math.abs(dc)===2) {
    const mr = fr+dr/2, mc = fc+dc/2
    if (board.value[mr][mc] > 0 && board.value[mr][mc] !== turn.value && board.value[mr][mc] !== (turn.value+2)) {
      history.push(board.value.map(r=>[...r]))
      board.value[tr][tc] = board.value[fr][fc]; board.value[fr][fc] = 0; board.value[mr][mc] = 0
      if (tr===0||tr===SIZE-1) board.value[tr][tc] = turn.value===1?3:4
      return true
    }
  }
  return false
}
function aiTurn() {
  const moves = []
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (board.value[r][c]!==2&&board.value[r][c]!==4) continue
    for (let dr = -2; dr <= 2; dr += 2 || 1) for (let dc = -2; dc <= 2; dc += 2 || 1) {
      if (dr===0&&dc===0) continue
      const tr = r+dr, tc = c+dc
      if (tr>=0&&tr<SIZE&&tc>=0&&tc<SIZE) {
        const saved = board.value.map(r=>[...r])
        const oldTurn = turn.value; turn.value = 2
        if (tryMove(r,c,tr,tc)) { moves.push({saved,fr:r,fc:c,tr,tc}); board.value = saved }
        turn.value = oldTurn
      }
    }
  }
  if (moves.length > 0) {
    const m = moves[Math.floor(Math.random()*moves.length)]
    tryMove(m.fr, m.fc, m.tr, m.tc)
  }
  turn.value = 1; checkWin(); draw()
}
function checkWin() {
  const p1 = board.value.flat().filter(c=>c===1||c===3).length
  const p2 = board.value.flat().filter(c=>c===2||c===4).length
  if (p1===0) { winner.value='🔵 AI胜!'; return true }
  if (p2===0) { winner.value='🔴 你胜!'; return true }
  return false
}
function undo() { if(history.length>0){board.value=history.pop();turn.value=1;selected.value=null;winner.value='';draw()} }
function draw() {
  const ctx = canvas.value?.getContext('2d'); if(!ctx) return
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    ctx.fillStyle = (r+c)%2===0 ? '#f0d9b5' : '#b58863'
    ctx.fillRect(c*CELL, r*CELL, CELL, CELL)
    const v = board.value[r][c]
    if (v > 0) {
      ctx.fillStyle = v===1||v===3 ? '#ef4444' : '#3b82f6'
      ctx.beginPath(); ctx.arc(c*CELL+CELL/2, r*CELL+CELL/2, CELL*0.35, 0, Math.PI*2); ctx.fill()
      if (v>=3) { ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(c*CELL+CELL/2, r*CELL+CELL/2, CELL*0.2, 0, Math.PI*2); ctx.fill() }
    }
    if (selected.value?.r===r && selected.value?.c===c) {
      ctx.strokeStyle='#fbbf24'; ctx.lineWidth=3; ctx.strokeRect(c*CELL+2, r*CELL+2, CELL-4, CELL-4)
    }
  }
}
onMounted(() => newGame())
</script>
