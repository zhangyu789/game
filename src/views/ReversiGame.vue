<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🔘 黑白棋</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="init">🔄 新游戏</button>
      <span class="self-center text-sm ml-auto">⚫ {{ countB }} : {{ countW }} ⚪ {{ winner ? '游戏结束 '+(winner==='draw'?'平局':winner==='black'?'黑棋胜':'白棋胜') : '' }}</span>
    </div>
    <div class="inline-block border-2 border-green-800 rounded-lg bg-green-700 p-1 select-none">
      <div v-for="(row,r) in board" :key="r" class="flex">
        <div v-for="(cell,c) in row" :key="c"
          :class="['w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center border border-green-800 cursor-pointer',validMoves[r]?.[c]?'bg-green-600':'']"
          @click="place(r,c)">
          <div v-if="cell" :class="['w-7 h-7 sm:w-8 sm:h-8 rounded-full',cell===1?'bg-gray-900':'bg-white','border border-gray-600']"></div>
          <div v-else-if="validMoves[r]?.[c]" class="w-3 h-3 rounded-full bg-green-400 opacity-50"></div>
        </div>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">点击绿点位置落子，自动翻转对手棋子</p>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
const DIRS=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
let board_,cur,over
const board=ref(Array.from({length:8},()=>Array(8).fill(0)))
const validMoves=ref(Array.from({length:8},()=>Array(8).fill(false)))
const winner=ref('')
const countB=computed(()=>board.value.flat().filter(c=>c===1).length)
const countW=computed(()=>board.value.flat().filter(c=>c===2).length)

function init(){
  board_=Array.from({length:8},()=>Array(8).fill(0))
  board_[3][3]=2;board_[3][4]=1;board_[4][3]=1;board_[4][4]=2
  cur=1;over=false;winner.value=''
  sync();calcMoves()
}
function sync(){board.value=board_.map(r=>[...r])}
function calcMoves(){
  const vm=Array.from({length:8},()=>Array(8).fill(false))
  if(over){validMoves.value=vm;return}
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(!board_[r][c]&&getFlips(r,c,cur).length)vm[r][c]=true
  if(!vm.flat().some(Boolean)){
    // Check if opponent can move
    const opp=cur===1?2:1
    let oppCanMove=false
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(!board_[r][c]&&getFlips(r,c,opp).length)oppCanMove=true
    if(!oppCanMove){over=true;const b=countB.value,w=countW.value;winner.value=b>w?'black':w>b?'white':'draw'}
    else cur=opp
  }
  validMoves.value=vm
}
function getFlips(r,c,who){
  if(board_[r][c])return[]
  const opp=who===1?2:1,flips=[]
  for(const[dr,dc]of DIRS){
    const line=[]
    for(let i=1;i<8;i++){const nr=r+dr*i,nc=c+dc*i;if(nr<0||nr>=8||nc<0||nc>=8)break;if(!board_[nr][nc])break;if(board_[nr][nc]===opp)line.push([nr,nc]);else{if(line.length)flips.push(...line);break}}
  }
  return flips
}
function place(r,c){
  if(over||board_[r][c]||!validMoves.value[r][c])return
  const flips=getFlips(r,c,cur)
  if(!flips.length)return
  board_[r][c]=cur
  for(const[fr,fc]of flips)board_[fr][fc]=cur
  cur=cur===1?2:1
  sync();calcMoves()
}
init()
</script>
