<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🎹 钢琴块</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🏆 得分: {{ score }}</span><span>🥇 最高: {{ highScore }}</span><span>{{ gameOver }}</span>
    </div>
    <canvas ref="canvas" width="320" height="480" class="border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 block max-w-full cursor-pointer" style="width:min(320px,100%)" @click="onClick"></canvas>
    <p class="text-xs text-gray-400 mt-2">点击黑色方块，不要点击白色区域！</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref(null)
const CW=320,CH=480,LANES=4,LW=CW/LANES,BH=120
const running=ref(false),score=ref(0),highScore=ref(parseInt(localStorage.getItem('piano_hs')||'0')),gameOver=ref('')
let blocks=[], animFrame, speed=2, lastTime=0
function reset(){running.value=false;cancelAnimationFrame(animFrame);score.value=0;gameOver.value='';speed=2;blocks=[];generateBlock();draw()}
function generateBlock(){
  const lane=Math.floor(Math.random()*LANES)
  blocks.push({lane,y:-BH,hit:false})
}
function start(){running.value=true;animFrame=requestAnimationFrame(gameLoop)}
function onClick(e){
  if(!running.value) return
  const rect=canvas.value.getBoundingClientRect()
  const mx=(e.clientX-rect.left)*(CW/rect.width),my=(e.clientY-rect.top)*(CH/rect.height)
  const lane=Math.floor(mx/LW)
  // Find lowest unhit block
  const target=blocks.filter(b=>!b.hit&&b.y+b.h>0).sort((a,b)=>b.y-a.y)[0]
  if(target&&target.lane===lane&&my>=target.y&&my<=target.y+BH){
    target.hit=true;score.value+=10;speed=2+score.value/200
  } else {
    running.value=false;gameOver.value='💀 点错了!'
    if(score.value>highScore.value){highScore.value=score.value;localStorage.setItem('piano_hs',highScore.value)}
  }
}
function update(){
  blocks.forEach(b=>b.y+=speed)
  // Remove hit blocks below screen
  blocks=blocks.filter(b=>{if(b.hit&&b.y>CH) return false;if(!b.hit&&b.y>CH){running.value=false;gameOver.value='💀 漏了方块!';if(score.value>highScore.value){highScore.value=score.value;localStorage.setItem('piano_hs',highScore.value)}return false}return true})
  // Generate new blocks
  const topBlock=blocks.sort((a,b)=>a.y-b.y)[0]
  if(!topBlock||topBlock.y>-BH+10) generateBlock()
}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  const isDark=document.documentElement.classList.contains('dark')
  ctx.fillStyle=isDark?'#0f172a':'#fff';ctx.fillRect(0,0,CW,CH)
  // Lane lines
  ctx.strokeStyle=isDark?'#334155':'#e5e7eb'
  for(let i=1;i<LANES;i++){ctx.beginPath();ctx.moveTo(i*LW,0);ctx.lineTo(i*LW,CH);ctx.stroke()}
  // Blocks
  blocks.forEach(b=>{
    ctx.fillStyle=b.hit?(isDark?'#1e293b':'#d1d5db'):(isDark?'#e2e8f0':'#111827')
    ctx.fillRect(b.lane*LW+1,b.y,LW-2,BH-2)
  })
}
function gameLoop(time){if(!running.value)return;animFrame=requestAnimationFrame(gameLoop);if(time-lastTime<16)return;lastTime=time;update();draw()}
onMounted(()=>{reset()});onUnmounted(()=>{cancelAnimationFrame(animFrame)})
</script>
