<template>
  <div class="tool-card max-w-lg mx-auto">
    <h2 class="tool-header">🎮 2048</h2>
    <div class="flex gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="init">🔄 新游戏</button>
      <span class="ml-auto text-sm self-center">🏆 {{ score }} | 最高: {{ best }}</span>
    </div>
    <div class="grid grid-cols-4 gap-2 p-3 bg-gray-200 dark:bg-slate-700 rounded-xl select-none" @touchstart="onTS" @touchend="onTE">
      <div v-for="(cell,i) in flat" :key="i"
        :class="['aspect-square flex items-center justify-center rounded-lg font-bold text-lg transition-all', tileBg(cell)]">
        {{ cell || '' }}
      </div>
    </div>
    <p v-if="over" class="text-center mt-3 text-red-500 font-bold">{{ won ? '🎉 你赢了！' : '💀 游戏结束' }}</p>
    <p class="text-xs text-gray-400 mt-2">方向键或WASD或滑动操作</p>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
const SIZE = 4
let grid, moved
const score = ref(0), over = ref(false), won = ref(false)
const best = ref(parseInt(localStorage.getItem('2048_best') || '0'))
const flat = computed(() => grid?.flat() || [])

function init() {
  grid = Array.from({length:SIZE}, ()=>Array(SIZE).fill(0))
  score.value = 0; over.value = false; won.value = false
  addRandom(); addRandom(); trigger()
}
function addRandom() {
  const empty = []
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (!grid[r][c]) empty.push([r,c])
  if (!empty.length) return
  const [r,c] = empty[Math.floor(Math.random()*empty.length)]
  grid[r][c] = Math.random() < 0.9 ? 2 : 4
}
function trigger() { /* force reactivity */ grid = grid.map(r=>[...r]) }
function slide(row) {
  let arr = row.filter(v=>v)
  for (let i=0;i<arr.length-1;i++) if(arr[i]===arr[i+1]){arr[i]*=2;score.value+=arr[i];arr[i+1]=0;moved=true}
  arr = arr.filter(v=>v)
  while(arr.length<SIZE) arr.push(0)
  return arr
}
function move(dir) {
  if (over.value) return
  moved = false
  if (dir==='left') for(let r=0;r<SIZE;r++) grid[r]=slide(grid[r])
  else if (dir==='right') for(let r=0;r<SIZE;r++) grid[r]=slide([...grid[r]].reverse()).reverse()
  else if (dir==='up') { for(let c=0;c<SIZE;c++){let col=grid.map(r=>r[c]);col=slide(col);for(let r=0;r<SIZE;r++)grid[r][c]=col[r]} }
  else if (dir==='down') { for(let c=0;c<SIZE;c++){let col=grid.map(r=>r[c]).reverse();col=slide(col).reverse();for(let r=0;r<SIZE;r++)grid[r][c]=col[r]} }
  if (moved) { addRandom(); trigger(); checkState(); if(score.value>best.value){best.value=score.value;localStorage.setItem('2048_best',best.value)} }
}
function checkState() {
  if (grid.flat().includes(2048)) won.value = true
  for (let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) {
    if (!grid[r][c]) return
    if (r<SIZE-1 && grid[r][c]===grid[r+1][c]) return
    if (c<SIZE-1 && grid[r][c]===grid[r][c+1]) return
  }
  over.value = true
}
function tileBg(v) {
  if (!v) return 'bg-gray-300/50 dark:bg-slate-600/50'
  const m = {2:'bg-yellow-100 text-gray-800',4:'bg-yellow-200 text-gray-800',8:'bg-orange-300 text-white',16:'bg-orange-400 text-white',32:'bg-orange-500 text-white',64:'bg-red-500 text-white',128:'bg-yellow-400 text-white',256:'bg-yellow-500 text-white',512:'bg-yellow-600 text-white',1024:'bg-yellow-700 text-white',2048:'bg-green-500 text-white'}
  return m[v] || 'bg-purple-600 text-white'
}
let ts=null
function onTS(e){ts={x:e.touches[0].clientX,y:e.touches[0].clientY}}
function onTE(e){if(!ts)return;const dx=e.changedTouches[0].clientX-ts.x,dy=e.changedTouches[0].clientY-ts.y;if(Math.abs(dx)>Math.abs(dy))move(dx>0?'right':'left');else move(dy>0?'down':'up');ts=null}
function onKey(e){const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};if(m[e.key]){e.preventDefault();move(m[e.key])}}
onMounted(()=>window.addEventListener('keydown',onKey))
onUnmounted(()=>window.removeEventListener('keydown',onKey))
init()
</script>
