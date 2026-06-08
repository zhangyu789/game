<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🃏 斗地主</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="startGame">🔄 新游戏</button>
      <span class="self-center text-sm">{{ msg }}</span>
    </div>
    <!-- AI hands -->
    <div v-for="(ai,idx) in [1,2]" :key="idx" class="mb-2">
      <span class="text-sm text-gray-500">🤖 AI{{ idx+1 }}: {{ hands[idx]?.length||0 }}张{{ landlord===idx?' [地主]':'' }}</span>
      <div class="flex flex-wrap gap-0.5 mt-1">
        <div v-for="(_,i) in (hands[idx]||[])" :key="i" class="w-7 h-10 bg-blue-900 rounded text-white flex items-center justify-center text-xs">🂠</div>
      </div>
    </div>
    <!-- Last play -->
    <div v-if="lastPlay.length" class="my-3 p-2 bg-gray-100 dark:bg-slate-700 rounded">
      <span class="text-xs text-gray-400">上家出牌: </span>
      <div class="flex gap-1 mt-1">
        <div v-for="(c,i) in lastPlay" :key="i" :class="['w-8 h-11 rounded border flex items-center justify-center text-sm font-bold', c.suit==='♥'||c.suit==='♦'?'text-red-500':'text-gray-900 dark:text-gray-100']">{{ c.rank }}{{ c.suit }}</div>
      </div>
    </div>
    <!-- Player hand -->
    <div class="mt-4">
      <span class="text-sm text-gray-500">👤 你: {{ hands[3]?.length||0 }}张{{ landlord===3?' [地主]':'' }}</span>
      <div class="flex flex-wrap gap-0.5 mt-1 min-h-[60px]">
        <div v-for="(c,i) in (hands[3]||[])" :key="i"
          :class="['w-9 h-12 rounded border cursor-pointer flex flex-col items-center justify-center text-sm font-bold transition-transform select-none',
            c.suit==='♥'||c.suit==='♦'?'text-red-500':'text-gray-900 dark:text-gray-100',
            selected.has(i)?'!-translate-y-2 !border-primary-500':'border-gray-300']"
          @click="toggleCard(i)">
          <span>{{ c.rank }}</span><span class="text-xs">{{ c.suit }}</span>
        </div>
      </div>
    </div>
    <div class="flex gap-2 mt-3">
      <button class="btn-sm btn-primary" @click="playCards" :disabled="gameOver">出牌</button>
      <button class="btn-sm btn-secondary" @click="pass" :disabled="gameOver||!lastPlay.length">不出</button>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const RANKS=['3','4','5','6','7','8','9','10','J','Q','K','A','2']
const SUITS=['♠','♥','♣','♦']
const RANK_VAL=Object.fromEntries(RANKS.map((r,i)=>[r,i+3]))
RANK_VAL['小王']=16;RANK_VAL['大王']=17
let hands_,landlord,turnIdx,gameOver_,lastPlay_
const hands=ref([[],[],[],[]])
const msg=ref(''),lastPlay=ref([])
const selected=ref(new Set())
const landlord_=ref(-1),gameOver=ref(false)
landlord=landlord_

function makeDeck(){
  const d=[]
  for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,val:RANK_VAL[r]})
  d.push({rank:'小王',suit:'🃏',val:16},{rank:'大王',suit:'🃏',val:17})
  for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}
  return d
}
function startGame(){
  const deck=makeDeck()
  hands_=[deck.slice(0,17).sort((a,b)=>a.val-b.val),deck.slice(17,34).sort((a,b)=>a.val-b.val),deck.slice(34,51).sort((a,b)=>a.val-b.val)]
  const playerHand=[...deck.slice(0,17)]
  landlord=Math.floor(Math.random()*4)
  landlord_.value=landlord
  hands.value=[...deck.slice(0,17).sort((a,b)=>a.val-b.val),deck.slice(17,34).sort((a,b)=>a.val-b.val),deck.slice(34,51).sort((a,b)=>a.val-b.val),deck.slice(0,17).sort((a,b)=>a.val-b.val)]
  // Simplified: player is always index 3
  hands.value=[deck.slice(0,17).sort((a,b)=>a.val-b.val),deck.slice(17,34).sort((a,b)=>a.val-b.val),deck.slice(34,51).sort((a,b)=>a.val-b.val),deck.slice(0,17).sort((a,b)=>a.val-b.val)]
  lastPlay.value=[];lastPlay_=[];gameOver.value=false;msg.value='游戏开始！选择牌出牌'
  selected.value=new Set()
  turnIdx=0
}
function toggleCard(i){
  const s=new Set(selected.value)
  s.has(i)?s.delete(i):s.add(i);selected.value=s
}
function getType(cards){
  if(!cards.length)return null
  const vals=cards.map(c=>c.val).sort((a,b)=>a-b)
  const counts={};vals.forEach(v=>counts[v]=(counts[v]||0)+1)
  const unique=Object.keys(counts).length
  if(cards.length===1)return{type:'single',rank:vals[0]}
  if(cards.length===2&&vals[0]===vals[1])return{type:'pair',rank:vals[0]}
  if(cards.length===2&&vals[0]===16&&vals[1]===17)return{type:'rocket'}
  if(cards.length===4&&unique===1)return{type:'bomb',rank:vals[0]}
  if(cards.length===3&&unique===1)return{type:'triple',rank:vals[0]}
  if(cards.length>=5){const isSeq=vals.every((v,i)=>i===0||v===vals[i-1]+1)&&vals[vals.length-1]<=14;if(isSeq)return{type:'straight',rank:vals[vals.length-1],len:cards.length}}
  return{type:'unknown'}
}
function canBeat(play,last){
  if(!last||!last.length)return play.type!=='unknown'
  if(play.type==='rocket')return true
  if(play.type==='bomb'&&getType(last).type!=='bomb'&&getType(last).type!=='rocket')return true
  if(play.type==='bomb'&&getType(last).type==='bomb')return play.rank>getType(last).rank
  const lt=getType(last)
  if(play.type!==lt.type)return false
  if(play.type==='straight')return play.len===lt.len&&play.rank>lt.rank
  return play.rank>lt.rank
}
function playCards(){
  const cards=[...selected.value].map(i=>hands.value[3][i]).sort((a,b)=>a.val-b.val)
  if(!cards.length)return
  const pt=getType(cards)
  if(pt.type==='unknown'){msg.value='无效牌型';return}
  if(lastPlay_.length&&!canBeat(pt,lastPlay_)){msg.value='打不过上家';return}
  // Remove cards from player hand
  const selArr=[...selected.value].sort((a,b)=>b-a)
  for(const i of selArr)hands.value[3].splice(i,1)
  lastPlay_=cards;lastPlay.value=cards;selected.value=new Set()
  if(!hands.value[3].length){gameOver.value=true;msg.value='🎉 你赢了！';return}
  msg.value='AI思考中...'
  setTimeout(aiTurn,800)
}
function pass(){lastPlay_=[];lastPlay.value=[];msg.value='不出';setTimeout(aiTurn,800)}
function aiTurn(){
  // Simple AI: play lowest valid cards or pass
  for(let ai=0;ai<3;ai++){
    const hand=hands.value[ai]
    if(!hand.length)continue
    if(lastPlay_.length){
      // Try to beat
      let played=false
      for(let i=0;i<hand.length;i++){
        const pt=getType([hand[i]])
        if(canBeat(pt,lastPlay_)){
          lastPlay_=[hand[i]];lastPlay.value=[hand[i]]
          hand.splice(i,1)
          if(!hand.length){gameOver.value=true;msg.value=`🤖 AI${ai+1} 赢了`;return}
          played=true;break
        }
      }
      if(!played)msg.value=`AI${ai+1} 不出`
    }else{
      lastPlay_=[hand[0]];lastPlay.value=[hand[0]];hand.splice(0,1)
      if(!hand.length){gameOver.value=true;msg.value=`🤖 AI${ai+1} 赢了`;return}
    }
  }
}
</script>
