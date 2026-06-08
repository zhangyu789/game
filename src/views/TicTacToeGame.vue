<template>
  <div class="tool-card max-w-lg mx-auto">
    <h2 class="tool-header">❌⭕ 井字棋</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="init">🔄 新游戏</button>
      <button class="btn-sm btn-secondary" @click="mode=mode==='ai'?'pvp':'ai'">{{ mode==='ai'?'🤖 人机':'👥 双人' }}</button>
      <span class="self-center text-sm ml-auto">{{ winner ? (winner==='draw'?'平局！':winner+' 获胜！') : (turn==='X'?'❌':'⭕')+' 走棋' }}</span>
    </div>
    <div class="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
      <div v-for="(cell,i) in board" :key="i"
        :class="['aspect-square rounded-lg border-2 flex items-center justify-center text-4xl font-bold cursor-pointer transition-colors',
          cell==='X'?'text-blue-500 border-blue-300 bg-blue-50 dark:bg-blue-900/20':'',
          cell==='O'?'text-red-500 border-red-300 bg-red-50 dark:bg-red-900/20':'',
          !cell?'border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700':'']"
        @click="play(i)">
        {{ cell }}
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const board=ref(Array(9).fill(null))
const turn=ref('X'),winner=ref(''),mode=ref('ai')

function init(){board.value=Array(9).fill(null);turn.value='X';winner.value=''}
function play(i){
  if(board.value[i]||winner.value)return
  board.value[i]=turn.value
  const w=checkWin(board.value)
  if(w){winner.value=w;return}
  if(!board.value.includes(null)){winner.value='draw';return}
  turn.value=turn.value==='X'?'O':'X'
  if(mode.value==='ai'&&turn.value==='O'&&!winner.value)setTimeout(aiMove,200)
}
function aiMove(){
  // Minimax - unbeatable AI
  let bestScore=-Infinity,bestMove=-1
  for(let i=0;i<9;i++){
    if(!board.value[i]){
      board.value[i]='O'
      const score=minimax(board.value,false)
      board.value[i]=null
      if(score>bestScore){bestScore=score;bestMove=i}
    }
  }
  if(bestMove>=0)play(bestMove)
}
function minimax(b,isMax){
  const w=checkWin(b)
  if(w==='O')return 10;if(w==='X')return -10;if(!b.includes(null))return 0
  if(isMax){let best=-Infinity;for(let i=0;i<9;i++){if(!b[i]){b[i]='O';best=Math.max(best,minimax(b,false));b[i]=null}}return best}
  else{let best=Infinity;for(let i=0;i<9;i++){if(!b[i]){b[i]='X';best=Math.min(best,minimax(b,true));b[i]=null}}return best}
}
function checkWin(b){
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for(const[a,c,d]of lines)if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a]
  return null
}
init()
</script>
