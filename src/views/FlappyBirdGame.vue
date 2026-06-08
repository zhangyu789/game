<template>
  <div class="tool-card max-w-lg mx-auto">
    <h2 class="tool-header">🐦 Flappy Bird</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running&&!started">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="init">🔄 重新开始</button>
      <span class="self-center text-sm ml-auto">得分: {{ score }} | 最高: {{ best }}</span>
    </div>
    <canvas ref="canvas" width="320" height="480" class="border border-gray-300 dark:border-slate-600 rounded bg-sky-200 dark:bg-sky-900 cursor-pointer block mx-auto" style="max-width:320px;width:100%" @click="flap" @touchstart.prevent="flap"></canvas>
    <p v-if="over" class="text-center text-red-500 font-bold mt-2">💀 游戏结束！点击重新开始</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas=ref(null)
let bird,pipes,frame,score_,interval
const running=ref(false),over=ref(false),started=ref(false)
const score=ref(0),best=ref(parseInt(localStorage.getItem('flappy_best')||'0'))
const W=320,H=480,GAP=130,PIPE_W=50,GRAVITY=0.5,FLAP=-8

function init(){
  bird={x:80,y:H/2,vy:0,r:15}
  pipes=[];frame=0;score_=0;score.value=0
  over.value=false;running.value=false;started.value=false
  draw()
}
function start(){running.value=true;started.value=true;loop()}
function flap(){
  if(over.value){init();start();return}
  if(!started.value)start()
  bird.vy=FLAP
}
function loop(){
  if(!running.value)return
  frame++;bird.vy+=GRAVITY;bird.y+=bird.vy
  if(frame%90===0)pipes.push({x:W,top:Math.random()*(H-GAP-100)+50})
  for(const p of pipes)p.x-=3
  pipes=pipes.filter(p=>p.x>-PIPE_W)
  // Collision
  if(bird.y+bird.r>H||bird.y-bird.r<0){die();return}
  for(const p of pipes){
    if(bird.x+bird.r>p.x&&bird.x-bird.r<p.x+PIPE_W){
      if(bird.y-bird.r<p.top||bird.y+bird.r>p.top+GAP){die();return}
    }
    if(!p.scored&&p.x+PIPE_W<bird.x){p.scored=true;score_++;score.value=score_}
  }
  draw();requestAnimationFrame(loop)
}
function die(){
  running.value=false;over.value=true
  if(score_>best.value){best.value=score_;localStorage.setItem('flappy_best',best.value)}
  draw()
}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  // Sky
  const grad=ctx.createLinearGradient(0,0,0,H)
  grad.addColorStop(0,'#7dd3fc');grad.addColorStop(1,'#bae6fd')
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H)
  // Ground
  ctx.fillStyle='#65a30d';ctx.fillRect(0,H-20,W,20)
  // Pipes
  ctx.fillStyle='#16a34a'
  for(const p of pipes){
    ctx.fillRect(p.x,0,PIPE_W,p.top)
    ctx.fillRect(p.x,p.top+GAP,PIPE_W,H-p.top-GAP-20)
    ctx.fillRect(p.x-3,p.top-15,PIPE_W+6,15)
    ctx.fillRect(p.x-3,p.top+GAP,PIPE_W+6,15)
  }
  // Bird
  ctx.fillStyle='#facc15';ctx.beginPath();ctx.arc(bird.x,bird.y,bird.r,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bird.x+5,bird.y-4,5,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(bird.x+7,bird.y-4,2.5,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#f97316';ctx.beginPath();ctx.moveTo(bird.x+bird.r,bird.y);ctx.lineTo(bird.x+bird.r+10,bird.y+3);ctx.lineTo(bird.x+bird.r,bird.y+6);ctx.fill()
  // Score
  ctx.fillStyle='#fff';ctx.font='bold 24px sans-serif';ctx.textAlign='center'
  ctx.fillText(score_,W/2,40)
  if(!started.value){ctx.font='16px sans-serif';ctx.fillText('点击开始',W/2,H/2+50)}
}
onMounted(()=>init())
onUnmounted(()=>{running.value=false})
</script>
