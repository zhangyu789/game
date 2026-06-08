<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🃏 记忆翻牌</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="init(4)">4×4</button>
      <button class="btn-sm btn-secondary" @click="init(6)">6×6</button>
      <button class="btn-sm btn-secondary" @click="init">🔄 重新开始</button>
      <span class="self-center text-sm ml-auto">翻转: {{ flips }} | 配对: {{ matched }}/{{ total }}</span>
    </div>
    <div class="grid gap-2 mx-auto" :style="{gridTemplateColumns:`repeat(${size},1fr)`,maxWidth:size*70+'px'}">
      <div v-for="(card,i) in cards" :key="i"
        :class="['aspect-square rounded-lg cursor-pointer flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 select-none',
          card.flipped||card.matched?'bg-white dark:bg-slate-700 scale-100':'bg-primary-500 hover:bg-primary-600 scale-95']"
        @click="flip(i)">
        <span v-if="card.flipped||card.matched">{{ card.emoji }}</span>
        <span v-else class="text-white text-lg">?</span>
      </div>
    </div>
    <p v-if="won" class="text-center text-green-500 font-bold mt-3 text-lg">🎉 全部配对成功！</p>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const EMOJIS=['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅']
const cards=ref([]),flips=ref(0),matched=ref(0),total=ref(0),won=ref(false)
let size=4,first=-1,second=-1,lock=false

function init(s=4){
  size=s;const pairs=(s*s)/2
  const selected=EMOJIS.slice(0,pairs)
  const deck=[...selected,...selected].map(e=>({emoji:e,flipped:false,matched:false}))
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
  cards.value=deck;flips.value=0;matched.value=0;total.value=pairs;won.value=false;first=-1;second=-1;lock=false
}
function flip(i){
  if(lock||cards.value[i].flipped||cards.value[i].matched)return
  cards.value[i].flipped=true;flips.value++
  if(first===-1){first=i;return}
  second=i;lock=true
  if(cards.value[first].emoji===cards.value[second].emoji){
    cards.value[first].matched=true;cards.value[second].matched=true
    matched.value++;first=-1;second=-1;lock=false
    if(matched.value===total.value)won.value=true
  }else{
    setTimeout(()=>{cards.value[first].flipped=false;cards.value[second].flipped=false;first=-1;second=-1;lock=false},800)
  }
}
init()
</script>
