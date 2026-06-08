<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🧬 生命游戏</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="toggleRun" >{{ running ? '⏸ 暂停' : '▶ 运行' }}</button>
      <button class="btn-sm btn-secondary" @click="step">⏭ 单步</button>
      <button class="btn-sm btn-secondary" @click="clear">🗑️ 清空</button>
      <button class="btn-sm btn-secondary" @click="random">🎲 随机</button>
      <span class="self-center text-sm ml-auto">代数: {{ gen }}</span>
    </div>
    <canvas ref="canvas" width="500" height="500" class="border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 cursor-crosshair block mx-auto" style="max-width:500px;width:100%;aspect-ratio:1" @click="onClick" @mousemove="onDrag"></canvas>
    <p class="text-xs text-gray-400 mt-2">点击/拖拽绘制细胞，观察生命演化</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const SIZE=50,CELL=10
const canvas=ref(null)
let grid,next,interval
const running=ref(false),gen=ref(0)
let drawing=false,drawVal=1

function init(){grid=Array.from({length:SIZE},()=>Array(SIZE).fill(0));gen.value=0;draw()}
function clear(){running.value=false;clearInterval(interval);grid=Array.from({length:SIZE},()=>Array(SIZE).fill(0));gen.value=0;draw()}
function random(){grid=Array.from({length:SIZE},()=>Array.from({length:SIZE},()=>Math.random()<0.3?1:0));gen.value=0;draw()}
function step(){
  next=Array.from({length:SIZE},()=>Array(SIZE).fill(0))
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    let n=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(dr===0&&dc===0)continue;const nr=(r+dr+SIZE)%SIZE,nc=(c+dc+SIZE)%SIZE;n+=grid[nr][nc]}
    if(grid[r][c]){next[r][c]=n===2||n===3?1:0}else{next[r][c]=n===3?1:0}
  }
  grid=next;gen.value++;draw()
}
function toggleRun(){
  running.value=!running.value
  if(running.value)interval=setInterval(step,100)
  else clearInterval(interval)
}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  ctx.fillStyle='#fff';ctx.fillRect(0,0,500,500)
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    if(grid[r][c]){ctx.fillStyle='#22c55e';ctx.fillRect(c*CELL,r*CELL,CELL,CELL)}
  }
  ctx.strokeStyle='#e5e7eb';ctx.lineWidth=0.5
  for(let i=0;i<=SIZE;i++){ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,500);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*CELL);ctx.lineTo(500,i*CELL);ctx.stroke()}
}
function cellAt(e){
  const rect=canvas.value.getBoundingClientRect()
  const scale=500/rect.width
  return{c:Math.floor((e.clientX-rect.left)*scale/CELL),r:Math.floor((e.clientY-rect.top)*scale/CELL)}
}
function onClick(e){const{r,c}=cellAt(e);if(r>=0&&r<SIZE&&c>=0&&c<SIZE){grid[r][c]=grid[r][c]?0:1;drawVal=grid[r][c];draw()}}
function onDrag(e){if(e.buttons!==1)return;const{r,c}=cellAt(e);if(r>=0&&r<SIZE&&c>=0&&c<SIZE){grid[r][c]=drawVal;draw()}}
onMounted(()=>init())
onUnmounted(()=>clearInterval(interval))
</script>
