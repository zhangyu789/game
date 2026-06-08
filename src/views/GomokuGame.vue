<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">⚫ 五子棋</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="init">🔄 新游戏</button>
      <button class="btn-sm btn-secondary" @click="mode=mode==='pvp'?'pve':'pvp'">{{ mode==='pvp'?'🤖 人机对战':'👥 双人对战' }}</button>
      <span class="self-center text-sm ml-auto">{{ cur===1?'⚫ 黑棋':'⚪ 白棋' }} 落子 {{ winner ? (winner===1?'⚫ 黑棋胜！':'⚪ 白棋胜！') : '' }}</span>
    </div>
    <canvas ref="canvas" width="600" height="600" class="border border-gray-300 dark:border-slate-600 rounded bg-amber-50 dark:bg-amber-900/30 cursor-pointer block max-w-full" style="width:min(600px,100%);aspect-ratio:1" @click="onClick"></canvas>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
const SIZE=15,CELL=40,PAD=20
const canvas=ref(null)
let board,cur,winner
const mode=ref('pvp')
const curR=ref(1),winnerR=ref(0)

function init(){board=Array.from({length:SIZE},()=>Array(SIZE).fill(0));cur=1;winner=0;curR.value=1;winnerR.value=0;draw()}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  const w=canvas.value.width
  ctx.fillStyle=document.documentElement.classList.contains('dark')?'#78350f':'#fffbeb'
  ctx.fillRect(0,0,w,w)
  ctx.strokeStyle='#92400e'
  for(let i=0;i<SIZE;i++){ctx.beginPath();ctx.moveTo(PAD+i*CELL,PAD);ctx.lineTo(PAD+i*CELL,PAD+(SIZE-1)*CELL);ctx.stroke();ctx.beginPath();ctx.moveTo(PAD,PAD+i*CELL);ctx.lineTo(PAD+(SIZE-1)*CELL,PAD+i*CELL);ctx.stroke()}
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(board[r][c]){
    const x=PAD+c*CELL,y=PAD+r*CELL
    ctx.beginPath();ctx.arc(x,y,CELL/2-3,0,Math.PI*2)
    ctx.fillStyle=board[r][c]===1?'#000':'#fff';ctx.fill();ctx.strokeStyle='#333';ctx.stroke()
  }
}
function onClick(e){
  if(winner)return
  const rect=canvas.value.getBoundingClientRect()
  const scale=canvas.value.width/rect.width
  const mx=(e.clientX-rect.left)*scale,my=(e.clientY-rect.top)*scale
  const c=Math.round((mx-PAD)/CELL),r=Math.round((my-PAD)/CELL)
  if(r<0||r>=SIZE||c<0||c>=SIZE||board[r][c])return
  board[r][c]=cur
  if(checkWin(r,c)){winner=cur;winnerR.value=cur;draw();return}
  cur=cur===1?2:1;curR.value=cur;draw()
  if(mode.value==='pve'&&cur===2&&!winner)setTimeout(aiMove,200)
}
function aiMove(){
  let best=-1,br=-1,bc=-1
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(!board[r][c]){
    const s=evaluate(r,c,2)+evaluate(r,c,1)*0.9
    if(s>best){best=s;br=r;bc=c}
  }
  if(br>=0){board[br][bc]=2;if(checkWin(br,bc)){winner=2;winnerR.value=2}cur=1;curR.value=1}
  draw()
}
function evaluate(r,c,who){
  const dirs=[[0,1],[1,0],[1,1],[1,-1]];let score=0
  for(const[dr,dc]of dirs){
    let cnt=1,open=0
    for(let i=1;i<5;i++){const nr=r+dr*i,nc=c+dc*i;if(nr<0||nr>=SIZE||nc<0||nc>=SIZE)break;if(board[nr][nc]===who)cnt++;else{if(!board[nr][nc])open++;break}}
    for(let i=1;i<5;i++){const nr=r-dr*i,nc=c-dc*i;if(nr<0||nr>=SIZE||nc<0||nc>=SIZE)break;if(board[nr][nc]===who)cnt++;else{if(!board[nr][nc])open++;break}}
    if(cnt>=5)score+=100000
    else if(cnt===4&&open===2)score+=10000
    else if(cnt===4&&open===1)score+=1000
    else if(cnt===3&&open===2)score+=500
    else if(cnt===3&&open===1)score+=100
    else if(cnt===2&&open===2)score+=50
    else if(cnt===2&&open===1)score+=10
  }
  return score
}
function checkWin(r,c){
  const who=board[r][c],dirs=[[0,1],[1,0],[1,1],[1,-1]]
  for(const[dr,dc]of dirs){let cnt=1;for(let i=1;i<5;i++){const nr=r+dr*i,nc=c+dc*i;if(nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&board[nr][nc]===who)cnt++;else break}for(let i=1;i<5;i++){const nr=r-dr*i,nc=c-dc*i;if(nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&board[nr][nc]===who)cnt++;else break}if(cnt>=5)return true}
  return false
}
onMounted(()=>{init()})
</script>
