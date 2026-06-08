<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">⌨️ 打字游戏</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="init">🔄 重新开始</button>
      <select v-model="difficulty" class="btn-sm btn-secondary">
        <option value="easy">简单</option><option value="normal">普通</option><option value="hard">困难</option>
      </select>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>⏱️ {{ timeLeft }}s</span>
      <span>✅ 正确: {{ correct }}</span>
      <span>⚡ WPM: {{ wpm }}</span>
    </div>
    <div class="relative h-64 border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 overflow-hidden mb-4">
      <div v-for="(w,i) in words" :key="i"
        :class="['absolute px-2 py-1 rounded text-sm font-bold transition-all',
          w.matched?'text-green-500':'text-gray-900 dark:text-gray-100']"
        :style="{left:w.x+'px',top:w.y+'px'}">
        {{ w.text }}
      </div>
    </div>
    <input ref="input" v-model="typed" @input="check" class="input-field" placeholder="输入下落的单词..." :disabled="!running" autofocus>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const WORDS_EASY=['cat','dog','sun','run','fun','big','red','box','fly','hat']
const WORDS_NORMAL=['hello','world','python','coding','travel','planet','music','happy','dream','cloud']
const WORDS_HARD=['algorithm','javascript','function','variable','component','developer','performance','interface']
const canvas = ref(null)
const input=ref(null)
const words=ref([]),typed=ref(''),running=ref(false),timeLeft=ref(60),correct=ref(0),wpm=ref(0)
const difficulty=ref('normal')
let interval,fallInterval,wordId=0

function init(){
  words.value=[];typed.value='';correct.value=0;wpm.value=0;timeLeft.value=60;running.value=false
  clearInterval(interval);clearInterval(fallInterval)
}
function start(){
  init();running.value=true;interval=setInterval(tick,1000)
  const speed=difficulty.value==='easy'?1500:difficulty.value==='hard'?800:1200
  fallInterval=setInterval(spawnWord,speed)
  spawnWord()
}
function getWords(){return difficulty.value==='easy'?WORDS_EASY:difficulty.value==='hard'?WORDS_HARD:WORDS_NORMAL}
function spawnWord(){
  if(!running.value)return
  const ws=getWords()
  const text=ws[Math.floor(Math.random()*ws.length)]
  const x=Math.random()*350+20
  words.value.push({id:wordId++,text,x,y:0,matched:false,vy:difficulty.value==='easy'?0.3:difficulty.value==='hard'?0.8:0.5})
  fallWords()
}
function fallWords(){
  for(const w of words.value){if(!w.matched)w.y+=w.vy*50}
  words.value=words.value.filter(w=>w.y<260)
}
function tick(){
  timeLeft.value--
  fallWords()
  if(timeLeft.value<=0){
    running.value=false;clearInterval(interval);clearInterval(fallInterval)
    const elapsed=60-timeLeft.value
    wpm.value=elapsed>0?Math.round(correct.value/(elapsed/60)):0
  }
}
function check(){
  const t=typed.value.trim().toLowerCase()
  if(!t)return
  for(const w of words.value){
    if(!w.matched&&w.text.toLowerCase()===t){
      w.matched=true;correct.value++;typed.value='';break
    }
  }
}
onUnmounted(()=>{clearInterval(interval);clearInterval(fallInterval)})
</script>
