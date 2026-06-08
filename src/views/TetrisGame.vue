<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🧱 俄罗斯方块</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="togglePause" v-else>{{ paused ? '▶ 继续' : '⏸ 暂停' }}</button>
      <button class="btn-sm btn-secondary" @click="init">🔄 重新开始</button>
      <span class="ml-auto text-sm self-center">得分: {{ score }} | 行: {{ lines }}</span>
    </div>
    <div class="flex gap-4">
      <canvas ref="canvas" width="300" height="600" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-900 block" style="max-height:70vh;width:auto"></canvas>
      <div>
        <p class="text-sm text-gray-500 mb-2">下一个:</p>
        <canvas ref="nextCanvas" width="120" height="120" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-900"></canvas>
        <div class="mt-4 text-xs text-gray-400">
          <p>← → 移动</p><p>↑ 旋转</p><p>↓ 加速</p><p>空格 硬降</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const COLS=10,ROWS=20,BLOCK=30
const COLORS=['','#00f0f0','#0000f0','#f0a000','#f0f000','#00f000','#a000f0','#f00000']
const SHAPES=[null,[[1,1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1],[1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,1,1],[0,1,0]]]
const canvas=ref(null),nextCanvas=ref(null)
let board,current,next,interval,pos,scoreR=ref(0),linesR=ref(0)
const running=ref(false),paused=ref(false)
let score=0,lines=0

function init(){
  board=Array.from({length:ROWS},()=>Array(COLS).fill(0))
  score=0;lines=0;scoreR.value=0;linesR.value=0
  running.value=false;paused.value=false
  clearInterval(interval)
  next=randPiece();spawnPiece();draw()
}
function randPiece(){const t=Math.floor(Math.random()*7)+1;return{type:t,shape:SHAPES[t].map(r=>[...r])}}
function spawnPiece(){
  current=next||randPiece();next=randPiece()
  pos={x:Math.floor((COLS-current.shape[0].length)/2),y:0}
  if(collides(pos.x,pos.y,current.shape)){running.value=false;clearInterval(interval)}
}
function collides(x,y,shape){
  for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++){
    if(!shape[r][c])continue
    const nx=x+c,ny=y+r
    if(nx<0||nx>=COLS||ny>=ROWS)return true
    if(ny>=0&&board[ny][nx])return true
  }return false
}
function merge(){
  for(let r=0;r<current.shape.length;r++)for(let c=0;c<current.shape[r].length;c++){
    if(current.shape[r][c]&&pos.y+r>=0)board[pos.y+r][pos.x+c]=current.type
  }
}
function clearLines(){
  let cleared=0
  for(let r=ROWS-1;r>=0;r--){if(board[r].every(c=>c)){board.splice(r,1);board.unshift(Array(COLS).fill(0));cleared++;r++}}
  if(cleared){lines+=cleared;score+=[0,100,300,500,800][cleared];scoreR.value=score;linesR.value=lines}
}
function rotate(shape){
  const R=shape.length,C=shape[0].length,res=Array.from({length:C},()=>Array(R).fill(0))
  for(let r=0;r<R;r++)for(let c=0;c<C;c++)res[c][R-1-r]=shape[r][c];return res
}
function drop(){
  if(!collides(pos.x,pos.y+1,current.shape))pos.y++
  else{merge();clearLines();spawnPiece()}
  draw()
}
function hardDrop(){while(!collides(pos.x,pos.y+1,current.shape)){pos.y++;score+=2}merge();clearLines();spawnPiece();draw();scoreR.value=score}
function moveLeft(){if(!collides(pos.x-1,pos.y,current.shape))pos.x--;draw()}
function moveRight(){if(!collides(pos.x+1,pos.y,current.shape))pos.x++;draw()}
function rotatePiece(){const r=rotate(current.shape);if(!collides(pos.x,pos.y,r))current.shape=r;draw()}
function start(){running.value=true;clearInterval(interval);interval=setInterval(()=>{if(!paused.value)drop()},500)}
function togglePause(){paused.value=!paused.value}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  ctx.fillStyle='#111827';ctx.fillRect(0,0,300,600)
  // Grid
  ctx.strokeStyle='#1f2937'
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){ctx.strokeRect(c*BLOCK,r*BLOCK,BLOCK,BLOCK)}
  // Board
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(board[r][c]){ctx.fillStyle=COLORS[board[r][c]];ctx.fillRect(c*BLOCK+1,r*BLOCK+1,BLOCK-2,BLOCK-2)}
  // Current
  if(current)for(let r=0;r<current.shape.length;r++)for(let c=0;c<current.shape[r].length;c++){
    if(current.shape[r][c]){ctx.fillStyle=COLORS[current.type];ctx.fillRect((pos.x+c)*BLOCK+1,(pos.y+r)*BLOCK+1,BLOCK-2,BLOCK-2)}
  }
  // Next
  const nctx=nextCanvas.value?.getContext('2d');if(nctx){
    nctx.fillStyle='#111827';nctx.fillRect(0,0,120,120)
    if(next)for(let r=0;r<next.shape.length;r++)for(let c=0;c<next.shape[r].length;c++){
      if(next.shape[r][c]){nctx.fillStyle=COLORS[next.type];nctx.fillRect(c*25+10,r*25+10,23,23)}
    }
  }
}
function onKey(e){
  if(!running.value||paused.value&&e.key!==' ')return
  const map={ArrowLeft:moveLeft,ArrowRight:moveRight,ArrowDown:drop,ArrowUp:rotatePiece,' ':hardDrop}
  if(map[e.key]){e.preventDefault();map[e.key]()}
}
onMounted(()=>{init();window.addEventListener('keydown',onKey)})
onUnmounted(()=>{clearInterval(interval);window.removeEventListener('keydown',onKey)})
</script>
