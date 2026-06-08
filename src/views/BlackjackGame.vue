<template>
  <div class="tool-card max-w-lg mx-auto">
    <h2 class="tool-header">🎴 21点 Blackjack</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="newRound">🔄 新一局</button>
      <span class="self-center text-sm ml-auto">💰 筹码: ${{ chips }}</span>
    </div>
    <div class="space-y-6">
      <!-- Dealer -->
      <div class="p-4 bg-green-800/20 dark:bg-green-900/30 rounded-xl">
        <p class="text-sm text-gray-500 mb-2">🤖 庄家 {{ dealerScore }}</p>
        <div class="flex gap-2 flex-wrap min-h-[80px]">
          <div v-for="(c,i) in dealer" :key="i"
            :class="['w-14 h-20 rounded-lg border-2 flex flex-col items-center justify-center text-sm font-bold shadow',
              c.hidden?'bg-blue-900 border-blue-800':c.suit==='♥'||c.suit==='♦'?'bg-white text-red-500 border-gray-300':'bg-white text-gray-900 border-gray-300']">
            <span v-if="!c.hidden">{{ c.rank }}</span><span v-if="!c.hidden" class="text-xs">{{ c.suit }}</span>
            <span v-else class="text-white text-lg">🂠</span>
          </div>
        </div>
      </div>
      <!-- Result -->
      <p v-if="result" class="text-center font-bold text-lg" :class="result==='win'?'text-green-500':result==='lose'?'text-red-500':'text-yellow-500'">
        {{ result==='win'?'🎉 你赢了！+$'+bet:result==='lose'?'💀 你输了！-$'+bet:'🤝 平局' }}
      </p>
      <!-- Player -->
      <div class="p-4 bg-blue-800/20 dark:bg-blue-900/30 rounded-xl">
        <p class="text-sm text-gray-500 mb-2">👤 你 {{ playerScore }}</p>
        <div class="flex gap-2 flex-wrap min-h-[80px]">
          <div v-for="(c,i) in player" :key="i"
            :class="['w-14 h-20 rounded-lg border-2 flex flex-col items-center justify-center text-sm font-bold shadow',
              c.suit==='♥'||c.suit==='♦'?'bg-white text-red-500 border-gray-300':'bg-white text-gray-900 border-gray-300']">
            <span>{{ c.rank }}</span><span class="text-xs">{{ c.suit }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex gap-2 mt-4">
      <button class="btn-sm btn-primary" @click="hit" :disabled="result">要牌</button>
      <button class="btn-sm btn-secondary" @click="stand" :disabled="result">停牌</button>
      <div class="ml-auto flex gap-1 items-center">
        <span class="text-sm text-gray-400">下注:</span>
        <button class="btn-sm btn-secondary" @click="bet=Math.max(10,bet-10)" :disabled="result">-10</button>
        <span class="text-sm w-10 text-center">${{ bet }}</span>
        <button class="btn-sm btn-secondary" @click="bet=Math.min(chips,bet+10)" :disabled="result">+10</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const SUITS=['♠','♥','♣','♦']
let deck_
const dealer=ref([]),player=ref([]),result=ref(''),chips=ref(1000),bet=ref(50)

function makeDeck(){const d=[];for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,val:r==='A'?11:parseInt(r)||10});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
function calcScore(cards){
  let score=0,aces=0
  for(const c of cards){if(c.hidden)continue;score+=c.val;if(c.rank==='A')aces++}
  while(score>21&&aces>0){score-=10;aces--}
  return score
}
const dealerScore=computed(()=>calcScore(dealer.value))
const playerScore=computed(()=>calcScore(player.value))

function newRound(){
  deck_=makeDeck();result.value=''
  dealer.value=[deck_.pop(),{...deck_.pop(),hidden:true}]
  player.value=[deck_.pop(),deck_.pop()]
  if(playerScore.value===21){reveal();result.value='win';chips.value+=Math.floor(bet.value*1.5)}
}
function hit(){
  if(result.value)return
  player.value.push(deck_.pop())
  if(playerScore.value>21){reveal();result.value='lose';chips.value-=bet.value}
  else if(playerScore.value===21)stand()
}
function stand(){
  if(result.value)return
  reveal()
  while(calcScore(dealer.value)<17)dealer.value.push({...deck_.pop()})
  dealer.value=dealer.value.map(c=>({...c}))
  const ds=calcScore(dealer.value),ps=playerScore.value
  if(ds>21||ps>ds){result.value='win';chips.value+=bet.value}
  else if(ps<ds){result.value='lose';chips.value-=bet.value}
  else result.value='push'
}
function reveal(){dealer.value=dealer.value.map(c=>({...c,hidden:false}))}
newRound()
</script>
