<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">✈️ 飞机大战</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="init">🔄 重新开始</button>
      <span class="self-center text-sm ml-auto">得分: {{ score }} | 生命: {{ lives }}</span>
    </div>
    <canvas ref="canvas" width="400" height="600" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-900 cursor-none block mx-auto" style="max-width:400px;width:100%;aspect-ratio:2/3" @mousemove="onMouse" @touchmove.prevent="onTouch"></canvas>
    <p class="text-xs text-gray-400 mt-2">鼠标/触摸控制飞机，自动射击</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas=ref(null)
const W=400,H=600
let player,bullets,enemies,particles,running_,score_,lives_,animId,frame,shootTimer
const running=ref(false),score=ref(0),lives=ref(5)

function init(){
  player={x:W/2,y:H-80,w:30,h:30}
  bullets=[];enemies=[];particles=[];frame=0;shootTimer=0;score_=0;lives_=5
  score.value=0;lives.value=5;running.value=false;running_=false;draw()
}
function start(){running.value=true;running_=true;loop()}
function loop(){if(!running_)return;update();draw();animId=requestAnimationFrame(loop)}
function update(){
  frame++;shootTimer++
  if(shootTimer%10===0)bullets.push({x:player.x,y:player.y-15,dy:-8})
  bullets.forEach(b=>b.y+=b.dy)
  bullets=bullets.filter(b=>b.y>-10)
  // Spawn enemies
  if(frame%30===0){
    const type=Math.random()<0.2?'big':'small'
    const w=type==='big'?50:25,h=type==='big'?40:20
    enemies.push({x:Math.random()*(W-w),y:-h,w,h,dy:type==='big'?1.5:3,type,hp:type==='big'?3:1})
  }
  for(const e of enemies)e.y+=e.dy
  enemies=enemies.filter(e=>{if(e.y>H){lives_--;lives.value=lives_;if(lives_<=0){running_=false;running.value=false}return false}return true})
  // Collision
  for(let i=bullets.length-1;i>=0;i--){
    for(let j=enemies.length-1;j>=0;j--){
      const b=bullets[i],e=enemies[j]
      if(b&&b.x>e.x&&b.x<e.x+e.w&&b.y>e.y&&b.y<e.y+e.h){
        e.hp--;bullets.splice(i,1)
        if(e.hp<=0){score_+=e.type==='big'?50:10;score.value=score_;
          for(let k=0;k<5;k++)particles.push({x:e.x+e.w/2,y:e.y+e.h/2,dx:(Math.random()-0.5)*4,dy:(Math.random()-0.5)*4,life:20,color:e.type==='big'?'#f97316':'#ef4444'})
          enemies.splice(j,1)}break
      }
    }
  }
  // Player-enemy collision
  for(let j=enemies.length-1;j>=0;j--){
    const e=enemies[j]
    if(player.x+player.w/2>e.x&&player.x-player.w/2<e.x+e.w&&player.y+player.h/2>e.y&&player.y-player.h/2<e.y+e.h){
      lives_--;lives.value=lives_;enemies.splice(j,1)
      if(lives_<=0){running_=false;running.value=false}
    }
  }
  // Particles
  particles.forEach(p=>{p.x+=p.dx;p.y+=p.dy;p.life--})
  particles=particles.filter(p=>p.life>0)
}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  // Starfield
  ctx.fillStyle='#111827';ctx.fillRect(0,0,W,H)
  for(let i=0;i<30;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.5})`;ctx.fillRect(Math.random()*W,Math.random()*H,1,1)}
  // Player
  ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.moveTo(player.x,player.y-player.h/2);ctx.lineTo(player.x-player.w/2,player.y+player.h/2);ctx.lineTo(player.x+player.w/2,player.y+player.h/2);ctx.closePath();ctx.fill()
  ctx.fillStyle='#60a5fa';ctx.fillRect(player.x-3,player.y-5,6,15)
  // Bullets
  ctx.fillStyle='#facc15';for(const b of bullets)ctx.fillRect(b.x-2,b.y,4,10)
  // Enemies
  for(const e of enemies){ctx.fillStyle=e.type==='big'?'#dc2626':'#f97316';ctx.fillRect(e.x,e.y,e.w,e.h);ctx.fillStyle='#fca5a5';ctx.fillRect(e.x+5,e.y+5,e.w-10,e.h/2)}
  // Particles
  for(const p of particles){ctx.fillStyle=p.color;ctx.globalAlpha=p.life/20;ctx.fillRect(p.x-2,p.y-2,4,4);ctx.globalAlpha=1}
}
function onMouse(e){
  if(!running_)return
  const rect=canvas.value.getBoundingClientRect()
  const sx=W/rect.width,sy=H/rect.height
  player.x=(e.clientX-rect.left)*sx;player.y=(e.clientY-rect.top)*sy
  player.x=Math.max(player.w/2,Math.min(W-player.w/2,player.x))
  player.y=Math.max(player.h/2,Math.min(H-player.h/2,player.y))
}
function onTouch(e){
  if(!running_)return
  const rect=canvas.value.getBoundingClientRect()
  const sx=W/rect.width,sy=H/rect.height
  player.x=(e.touches[0].clientX-rect.left)*sx;player.y=(e.touches[0].clientY-rect.top)*sy
}
onMounted(()=>init())
onUnmounted(()=>{cancelAnimationFrame(animId);running_=false})
</script>
