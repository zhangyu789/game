<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🃏 纸牌拖拽</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <button class="btn-sm btn-secondary" @click="drawFromDeck" v-if="deck.length">🃏 翻牌({{ deck.length }})</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🎯 将所有牌按花色A→K排列到基础牌堆</span>
      <span>{{ won ? '✅ 胜利!' : '' }}</span>
    </div>
    <!-- Foundations -->
    <div class="flex gap-1 mb-3">
      <div v-for="(f,i) in foundations" :key="'f'+i"
        class="w-14 h-20 border-2 border-gray-300 dark:border-slate-600 rounded flex items-center justify-center cursor-pointer text-xs"
        @click="clickFoundation(i)">
        <span v-if="f.length" :class="f[f.length-1].red?'text-red-500':'text-gray-900 dark:text-gray-100'">{{ f[f.length-1].display }}</span>
        <span v-else class="text-gray-300">{{ ['♠','♥','♦','♣'][i] }}</span>
      </div>
      <div class="flex-1"></div>
      <div class="w-14 h-20 border-2 border-gray-300 dark:border-slate-600 rounded flex items-center justify-center cursor-pointer"
        @click="drawFromDeck">
        <span v-if="waste" :class="waste.red?'text-red-500':'text-gray-900 dark:text-gray-100'">{{ waste.display }}</span>
        <span v-else class="text-gray-300">🃏</span>
      </div>
    </div>
    <!-- Tableau -->
    <div class="flex gap-1">
      <div v-for="(col,ci) in tableau" :key="'t'+ci" class="flex-1 min-w-0">
        <div v-for="(card,ri) in col" :key="ri"
          class="w-full border rounded mb-0.5 flex items-center px-1 cursor-pointer text-xs select-none"
          :class="[card.faceUp ? (card.red?'text-red-500 bg-red-50 dark:bg-red-900/20':'text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800') : 'bg-blue-600 text-blue-600',
            selected?.col===ci&&selected?.row===ri?'ring-2 ring-blue-500':'',
            ri===col.length-1?'h-14':'h-6']"
          @click="clickTableau(ci,ri)">
          {{ card.faceUp ? card.display : '' }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const SUITS=['♠','♥','♦','♣'], VALUES=['A','2','3','4','5','6','7','8','9','10','J','Q','K']
let deck=ref([]),waste=ref(null),foundations=ref([[],[],[],[]]),tableau=ref([[],[],[],[],[],[],[]])
let selected=ref(null),won=ref(false)
function createDeck(){const d=[];for(let s=0;s<4;s++)for(let v=0;v<13;v++)d.push({suit:SUITS[s],value:v+1,display:VALUES[v]+SUITS[s],red:s===1||s===2,faceUp:false});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
function newGame(){
  const d=createDeck();won.value=false;selected.value=null;waste.value=null
  foundations.value=[[],[],[],[]];tableau.value=[[],[],[],[],[],[],[]]
  for(let i=0;i<7;i++){for(let j=i;j<7;j++){const card=d.pop();card.faceUp=j===i;tableau.value[j].push(card)}}
  deck.value=d
}
function drawFromDeck(){
  if(deck.value.length===0){deck.value=waste.value?[waste.value]:[];waste.value=null;return}
  waste.value=deck.value.pop();waste.value.faceUp=true
}
function clickTableau(ci,ri){
  const col=tableau.value[ci],card=col[ri]
  if(!card.faceUp){if(ri===col.length-1)card.faceUp=true;return}
  if(selected.value){
    if(selected.value.col===ci){selected.value=null;return}
    const fromCol=selected.value.src==='tableau'?tableau.value[selected.value.col]:null
    const cards=fromCol?fromCol.slice(selected.value.row):[waste.value]
    const target=col[col.length-1]
    if(canStack(cards[0],target)||col.length===0){
      if(fromCol){fromCol.splice(selected.value.row);if(fromCol.length&&!fromCol[fromCol.length-1].faceUp)fromCol[fromCol.length-1].faceUp=true}
      else{waste.value=null}
      col.push(...cards);selected.value=null;checkWin();return
    }
    selected.value=null;return
  }
  if(card.faceUp)selected.value={col:ci,row:ri,src:'tableau'}
}
function clickFoundation(i){
  if(!selected.value)return
  const fromCol=selected.value.src==='tableau'?tableau.value[selected.value.col]:null
  const card=fromCol?fromCol[fromCol.length-1]:waste.value
  if(!card)return
  const f=foundations.value[i],top=f[f.length-1]
  if((!top&&card.value===1&&SUITS.indexOf(card.suit)===i)||(top&&top.suit===card.suit&&card.value===top.value+1)){
    if(fromCol){fromCol.pop();if(fromCol.length&&!fromCol[fromCol.length-1].faceUp)fromCol[fromCol.length-1].faceUp=true}
    else waste.value=null
    f.push(card);selected.value=null;checkWin()
  }
}
function canStack(card,target){if(!target)return true;return card.red!==target.red&&card.value===target.value-1}
function checkWin(){if(foundations.value.every(f=>f.length===13))won.value=true}
onMounted(()=>newGame())
</script>
