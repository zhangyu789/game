<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🏯 中国象棋</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="init">🔄 新游戏</button>
      <span class="self-center text-sm ml-auto">{{ curTurn==='r'?'🔴 红方':'⚫ 黑方' }}走棋{{ checkmate?' 将/帅被将！':'' }}</span>
    </div>
    <canvas ref="canvas" width="540" height="600" class="border border-gray-300 dark:border-slate-600 rounded bg-amber-50 dark:bg-amber-900/20 cursor-pointer block max-w-full" style="width:min(540px,100%);aspect-ratio:54/60" @click="onClick"></canvas>
    <p class="text-xs text-gray-400 mt-2">点击棋子选中，再点击目标位置移动</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const canvas=ref(null)
const CW=60,PAD=30
let pieces,selected,curTurn,checkmate
const PIECE_CHARS={r_king:'帅',r_advisor:'仕',r_elephant:'相',r_horse:'馬',r_rook:'車',r_cannon:'炮',r_pawn:'兵',b_king:'将',b_advisor:'士',b_elephant:'象',b_horse:'馬',b_rook:'車',b_cannon:'砲',b_pawn:'卒'}

function init(){
  selected=null;curTurn='r';checkmate=false
  pieces=[
    {type:'rook',side:'b',r:0,c:0},{type:'horse',side:'b',r:0,c:1},{type:'elephant',side:'b',r:0,c:2},{type:'advisor',side:'b',r:0,c:3},{type:'king',side:'b',r:0,c:4},{type:'advisor',side:'b',r:0,c:5},{type:'elephant',side:'b',r:0,c:6},{type:'horse',side:'b',r:0,c:7},{type:'rook',side:'b',r:0,c:8},
    {type:'cannon',side:'b',r:2,c:1},{type:'cannon',side:'b',r:2,c:7},
    ...Array.from({length:5},(_,i)=>({type:'pawn',side:'b',r:3,c:i*2})),
    {type:'rook',side:'r',r:9,c:0},{type:'horse',side:'r',r:9,c:1},{type:'elephant',side:'r',r:9,c:2},{type:'advisor',side:'r',r:9,c:3},{type:'king',side:'r',r:9,c:4},{type:'advisor',side:'r',r:9,c:5},{type:'elephant',side:'r',r:9,c:6},{type:'horse',side:'r',r:9,c:7},{type:'rook',side:'r',r:9,c:8},
    {type:'cannon',side:'r',r:7,c:1},{type:'cannon',side:'r',r:7,c:7},
    ...Array.from({length:5},(_,i)=>({type:'pawn',side:'r',r:6,c:i*2})),
  ]
  draw()
}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  const w=canvas.value.width,h=canvas.value.height
  ctx.fillStyle='#fef3c7';ctx.fillRect(0,0,w,h)
  ctx.strokeStyle='#92400e';ctx.lineWidth=1
  for(let i=0;i<10;i++){ctx.beginPath();ctx.moveTo(PAD,PAD+i*CW);ctx.lineTo(PAD+8*CW,PAD+i*CW);ctx.stroke()}
  for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(PAD+i*CW,PAD);ctx.lineTo(PAD+i*CW,PAD+4*CW);ctx.stroke();ctx.beginPath();ctx.moveTo(PAD+i*CW,PAD+5*CW);ctx.lineTo(PAD+i*CW,PAD+9*CW);ctx.stroke()}
  ctx.beginPath();ctx.moveTo(PAD+3*CW,PAD);ctx.lineTo(PAD+5*CW,PAD+2*CW);ctx.stroke()
  ctx.beginPath();ctx.moveTo(PAD+5*CW,PAD);ctx.lineTo(PAD+3*CW,PAD+2*CW);ctx.stroke()
  ctx.beginPath();ctx.moveTo(PAD+3*CW,PAD+7*CW);ctx.lineTo(PAD+5*CW,PAD+9*CW);ctx.stroke()
  ctx.beginPath();ctx.moveTo(PAD+5*CW,PAD+7*CW);ctx.lineTo(PAD+3*CW,PAD+9*CW);ctx.stroke()
  ctx.fillStyle='#92400e';ctx.font='bold 20px serif';ctx.textAlign='center';ctx.textBaseline='middle'
  ctx.fillText('楚 河',PAD+2*CW,PAD+4.5*CW);ctx.fillText('汉 界',PAD+6*CW,PAD+4.5*CW)
  for(const p of pieces){
    const x=PAD+p.c*CW,y=PAD+p.r*CW
    ctx.beginPath();ctx.arc(x,y,CW/2-4,0,Math.PI*2);ctx.fillStyle=p.side==='r'?'#fee2e2':'#f3f4f6';ctx.fill();ctx.strokeStyle=p.side==='r'?'#dc2626':'#111827';ctx.lineWidth=2;ctx.stroke()
    ctx.fillStyle=p.side==='r'?'#dc2626':'#111827';ctx.font='bold 16px serif'
    ctx.fillText(PIECE_CHARS[p.side+'_'+p.type]||'?',x,y)
    if(selected&&selected===p){ctx.beginPath();ctx.arc(x,y,CW/2-2,0,Math.PI*2);ctx.strokeStyle='#f59e0b';ctx.lineWidth=3;ctx.stroke()}
  }
}
function getAt(r,c){return pieces.find(p=>p.r===r&&p.c===c)}
function getMoves(p){
  const moves=[],side=p.side
  const canPlace=(r,c)=>r>=0&&r<=9&&c>=0&&c<=8&&!(getAt(r,c)?.side===side)
  switch(p.type){
    case'king':
      for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){const nr=p.r+dr,nc=p.c+dc;const inPalace=side==='r'?(nr>=7&&nr<=9&&nc>=3&&nc<=5):(nr>=0&&nr<=2&&nc>=3&&nc<=5);if(inPalace&&canPlace(nr,nc))moves.push([nr,nc])}break
    case'advisor':
      for(const[dr,dc]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const nr=p.r+dr,nc=p.c+dc;const inPalace=side==='r'?(nr>=7&&nr<=9&&nc>=3&&nc<=5):(nr>=0&&nr<=2&&nc>=3&&nc<=5);if(inPalace&&canPlace(nr,nc))moves.push([nr,nc])}break
    case'elephant':
      for(const[dr,dc]of[[2,2],[2,-2],[-2,2],[-2,-2]]){const nr=p.r+dr,nc=p.c+dc,br=p.r+dr/2,bc=p.c+dc/2;if(nr>=0&&nr<=9&&nc>=0&&nc<=8&&!getAt(br,bc)&&canPlace(nr,nc))moves.push([nr,nc])}break
    case'horse':
      for(const[dr,dc,br,bc]of[[-2,-1,-1,0],[-2,1,-1,0],[-1,-2,0,-1],[-1,2,0,1],[1,-2,0,-1],[1,2,0,1],[2,-1,1,0],[2,1,1,0]]){const nr=p.r+dr,nc=p.c+dc;if(canPlace(nr,nc)&&!getAt(p.r+br,p.c+bc))moves.push([nr,nc])}break
    case'rook':
      for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){for(let i=1;i<10;i++){const nr=p.r+dr*i,nc=p.c+dc*i;if(nr<0||nr>9||nc<0||nc>8)break;const occ=getAt(nr,nc);if(occ){if(occ.side!==side)moves.push([nr,nc]);break}moves.push([nr,nc])}}break
    case'cannon':
      for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){let jumped=false;for(let i=1;i<10;i++){const nr=p.r+dr*i,nc=p.c+dc*i;if(nr<0||nr>9||nc<0||nc>8)break;const occ=getAt(nr,nc);if(!jumped){if(occ)jumped=true;else moves.push([nr,nc])}else{if(occ){if(occ.side!==side)moves.push([nr,nc]);break}}}}break
    case'pawn':
      if(side==='r'){if(p.r-1>=0&&canPlace(p.r-1,p.c))moves.push([p.r-1,p.c]);if(p.r<=4){if(canPlace(p.r,p.c-1))moves.push([p.r,p.c-1]);if(canPlace(p.r,p.c+1))moves.push([p.r,p.c+1])}}
      else{if(p.r+1<=9&&canPlace(p.r+1,p.c))moves.push([p.r+1,p.c]);if(p.r>=5){if(canPlace(p.r,p.c-1))moves.push([p.r,p.c-1]);if(canPlace(p.r,p.c+1))moves.push([p.r,p.c+1])}}break
  }
  return moves
}
function onClick(e){
  const rect=canvas.value.getBoundingClientRect()
  const scale=canvas.value.width/rect.width
  const mx=(e.clientX-rect.left)*scale,my=(e.clientY-rect.top)*scale
  const c=Math.round((mx-PAD)/CW),r=Math.round((my-PAD)/CW)
  if(r<0||r>9||c<0||c>8)return
  const clicked=getAt(r,c)
  if(selected){
    const moves=getMoves(selected)
    if(moves.some(([mr,mc])=>mr===r&&mc===c)){
      if(clicked&&clicked.type==='king')checkmate=true
      const target=getAt(r,c)
      if(target)pieces=pieces.filter(pp=>pp!==target)
      selected.r=r;selected.c=c
      selected=null;curTurn=curTurn==='r'?'b':'r';draw();return
    }
    if(clicked&&clicked.side===curTurn){selected=clicked;draw();return}
    selected=null;draw()
  }else if(clicked&&clicked.side===curTurn){selected=clicked;draw()}
}
onMounted(()=>init())
</script>
