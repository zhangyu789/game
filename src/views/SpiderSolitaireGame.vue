<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🕷️ 蜘蛛纸牌</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="init">🔄 新游戏</button>
      <span class="self-center text-sm ml-auto">完成: {{ completed }}/8 组</span>
    </div>
    <div class="flex gap-1 overflow-x-auto pb-2 min-h-[300px]">
      <div v-for="(pile,pi) in piles" :key="pi" class="flex-shrink-0 w-16 sm:w-20">
        <div v-for="(card,ci) in pile" :key="ci"
          :class="['w-16 sm:w-20 h-10 rounded border text-xs font-bold flex items-center px-1 cursor-pointer relative select-none',
            card.faceUp?(card.suit==='♠'||card.suit==='♣'?'bg-white text-black border-gray-300':'bg-white text-red-500 border-gray-300'):'bg-blue-800 border-blue-900']"
          :style="{marginTop:ci===0?'0':faceUpOffset(pile,ci)+'px',zIndex:ci}"
          @click="onCardClick(pi,ci)">
          <span v-if="card.faceUp">{{ card.rank }}{{ card.suit }}</span>
        </div>
        <div v-if="!pile.length" class="w-16 sm:w-20 h-10 rounded border-2 border-dashed border-gray-300 dark:border-slate-600" @click="dealTo(pi)"></div>
      </div>
    </div>
    <div class="flex gap-2 mt-3">
      <button class="btn-sm btn-secondary" @click="deal" :disabled="!stock.length">发牌 ({{ stock.length }})</button>
    </div>
    <p v-if="completed===8" class="text-green-500 font-bold mt-2 text-lg">🎉 恭喜通关！</p>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const SUITS=['♠','♣']
let piles_,stock_,selected,completed_
const piles=ref([]),stock=ref([]),completed=ref(0)

function makeDeck(){
  const d=[];for(const s of SUITS)for(const r of RANKS){d.push({rank:r,suit:s,val:RANKS.indexOf(r)+1,faceUp:false});d.push({rank:r,suit:s,val:RANKS.indexOf(r)+1,faceUp:false})}
  for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}
  return d
}
function init(){
  const deck=makeDeck()
  piles_=Array.from({length:10},()=>[])
  let idx=0
  for(let p=0;p<10;p++){const count=p<4?6:5;for(let i=0;i<count;i++){const card=deck[idx++];card.faceUp=i===count-1;piles_[p].push(card)}}
  stock_=deck.slice(idx)
  selected=null;completed_=0
  sync();checkComplete()
}
function sync(){piles.value=piles_.map(p=>p.map(c=>({...c})));stock.value=[...stock_];completed.value=completed_}
function faceUpOffset(pile,ci){
  let off=-30;for(let i=0;i<ci;i++)off+=pile[i].faceUp?15:5
  return off
}
function onCardClick(pi,ci){
  const pile=piles_[pi]
  if(!pile[ci].faceUp){pile[ci].faceUp=true;sync();checkComplete();return}
  if(selected){
    const{pi:fromPi,ci:fromCi}=selected
    const from=piles_[fromPi]
    const cards=from.slice(fromCi)
    if(canPlace(cards,pile)){
      piles_[fromPi]=from.slice(0,fromCi)
      if(piles_[fromPi].length)piles_[fromPi][piles_[fromPi].length-1].faceUp=true
      pile.push(...cards);selected=null;sync();checkComplete()
    }else{selected={pi,ci};sync()}
  }else{selected={pi,ci};sync()}
}
function canPlace(cards,target){
  if(!target.length)return true
  const top=target[target.length-1]
  return top.val===cards[0].val+1
}
function deal(){
  if(!stock_.length)return
  for(let i=0;i<10&&stock_.length;i++){const card=stock_.pop();card.faceUp=true;piles_[i].push(card)}
  selected=null;sync();checkComplete()
}
function checkComplete(){
  for(let pi=0;pi<piles_.length;pi++){
    const pile=piles_[pi]
    if(pile.length<13)continue
    const bottom=pile.slice(-13)
    if(bottom.every(c=>c.faceUp)&&bottom.every((c,i)=>i===0||c.val===bottom[i-1].val-1)&&bottom[0].suit===bottom[12].suit){
      piles_[pi]=pile.slice(0,-13);completed_++;sync()
    }
  }
}
init()
</script>
