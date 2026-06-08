<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">♟️ 国际象棋</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="init">🔄 新游戏</button>
      <span class="self-center text-sm ml-auto">{{ turn==='w'?'⬜ 白方':'⬛ 黑方' }}走棋{{ msg }}</span>
    </div>
    <div class="inline-block border-2 border-gray-600 rounded overflow-hidden select-none">
      <div v-for="(row,r) in display" :key="r" class="flex">
        <div v-for="(cell,c) in row" :key="c"
          :class="['w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl cursor-pointer',
            (r+c)%2===0?'bg-amber-100':'bg-amber-800',
            selR===r&&selC===c?'!bg-yellow-400':'',
            validMoves[r]?.[c]?'ring-2 ring-inset ring-green-400':'']"
          @click="onClick(r,c)">
          {{ cell }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
const SYMBOLS={w_king:'♔',w_queen:'♕',w_rook:'♖',w_bishop:'♗',w_knight:'♘',w_pawn:'♙',b_king:'♚',b_queen:'♛',b_rook:'♜',b_bishop:'♝',b_knight:'♞',b_pawn:'♟'}
let board,turn_,selP,validMoves_
const turn=ref('w'),selR=ref(-1),selC=ref(-1),msg=ref('')
const validMoves=ref(Array.from({length:8},()=>Array(8).fill(false)))
const display=computed(()=>board.map(r=>r.map(c=>c?SYMBOLS[c.side+'_'+c.type]:'')))

function init(){
  board=Array.from({length:8},()=>Array(8).fill(null))
  const back=['rook','knight','bishop','queen','king','bishop','knight','rook']
  for(let c=0;c<8;c++){board[0][c]={type:back[c],side:'b'};board[1][c]={type:'pawn',side:'b'};board[6][c]={type:'pawn',side:'w'};board[7][c]={type:back[c],side:'w'}}
  turn_='w';turn.value='w';selP=null;selR.value=-1;selC.value=-1;msg.value='';validMoves_=Array.from({length:8},()=>Array(8).fill(false));validMoves.value=validMoves_
}
function getAt(r,c){return r>=0&&r<8&&c>=0&&c<8?board[r][c]:undefined}
function calcMoves(r,c){
  const p=board[r][c];if(!p)return[]
  const moves=[],side=p.side
  const canPlace=(nr,nc)=>nr>=0&&nr<8&&nc>=0&&nc<8&&(!board[nr][nc]||board[nr][nc].side!==side)
  switch(p.type){
    case'pawn':{
      const dir=side==='w'?-1:1,start=side==='w'?6:1
      if(!getAt(r+dir,c)){moves.push([r+dir,c]);if(r===start&&!getAt(r+2*dir,c))moves.push([r+2*dir,c])}
      for(const dc of[-1,1]){const t=getAt(r+dir,c+dc);if(t&&t.side!==side)moves.push([r+dir,c+dc])}
      break}
    case'knight':for(const[dr,dc]of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])if(canPlace(r+dr,c+dc))moves.push([r+dr,c+dc]);break
    case'bishop':for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]]){for(let i=1;i<8;i++){const nr=r+dr*i,nc=c+dc*i;if(nr<0||nr>=8||nc<0||nc>=8)break;if(board[nr][nc]){if(board[nr][nc].side!==side)moves.push([nr,nc]);break}moves.push([nr,nc])}}break
    case'rook':for(const[dr,dc]of[[0,1],[0,-1],[1,0],[-1,0]]){for(let i=1;i<8;i++){const nr=r+dr*i,nc=c+dc*i;if(nr<0||nr>=8||nc<0||nc>=8)break;if(board[nr][nc]){if(board[nr][nc].side!==side)moves.push([nr,nc]);break}moves.push([nr,nc])}}break
    case'queen':for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){for(let i=1;i<8;i++){const nr=r+dr*i,nc=c+dc*i;if(nr<0||nr>=8||nc<0||nc>=8)break;if(board[nr][nc]){if(board[nr][nc].side!==side)moves.push([nr,nc]);break}moves.push([nr,nc])}}break
    case'king':for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])if(canPlace(r+dr,c+dc))moves.push([r+dr,c+dc]);break
  }
  return moves
}
function onClick(r,c){
  if(selP){
    if(validMoves_[r][c]){
      const captured=board[r][c]
      board[r][c]=board[selP.r][selP.c]
      board[selP.r][selP.c]=null
      if(board[r][c].type==='pawn'&&(r===0||r===7))board[r][c]={...board[r][c],type:'queen'}
      if(captured?.type==='king'){msg.value=captured.side==='w'?' ⬛黑方胜！':' ⬜白方胜！';selP=null;validMoves_=Array.from({length:8},()=>Array(8).fill(false));validMoves.value=validMoves_;return}
      turn_=turn_==='w'?'b':'w';turn.value=turn_
      selP=null;validMoves_=Array.from({length:8},()=>Array(8).fill(false));validMoves.value=validMoves_;selR.value=-1;selC.value=-1
      board=board.map(r=>[...r]);return
    }
    if(board[r][c]?.side===turn_){selectPiece(r,c);return}
    selP=null;validMoves_=Array.from({length:8},()=>Array(8).fill(false));validMoves.value=validMoves_;selR.value=-1;selC.value=-1;return
  }
  if(board[r][c]?.side===turn_)selectPiece(r,c)
}
function selectPiece(r,c){
  selP={r,c};selR.value=r;selC.value=c
  const moves=calcMoves(r,c)
  validMoves_=Array.from({length:8},()=>Array(8).fill(false))
  for(const[mr,mc]of moves)validMoves_[mr][mc]=true
  validMoves.value=validMoves_
}
init()
</script>
