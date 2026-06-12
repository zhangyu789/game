<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🏃 跑酷游戏</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm"><span>🏆 距离: {{ Math.floor(distance) }}m</span><span>🥇 最高: {{ highScore }}m</span></div>
    <canvas ref="canvas" width="600" height="250" class="border border-gray-300 dark:border-slate-600 rounded bg-sky-100 dark:bg-slate-900 block max-w-full" style="width:min(600px,100%)" @click="jump" @touchstart="jump"></canvas>
    <p class="text-xs text-gray-400 mt-2">点击/空格跳跃躲避障碍物</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref(null), CW = 600, CH = 250, GROUND = 200
const running = ref(false), distance = ref(0), highScore = ref(parseInt(localStorage.getItem('parkour_hs')||'0'))
let animFrame, player, obstacles, speed, frame
function reset() { running.value=false; cancelAnimationFrame(animFrame); distance.value=0; speed=4; frame=0
  player={x:80,y:GROUND,vy:0,w:20,h:40,grounded:true,doubleJump:false}
  obstacles=[]; draw() }
function start() { running.value=true; animFrame=requestAnimationFrame(gameLoop) }
function jump() {
  if(!running.value) return
  if(player.grounded) { player.vy=-11; player.grounded=false; player.doubleJump=false }
  else if(!player.doubleJump) { player.vy=-9; player.doubleJump=true }
}
function update() {
  frame++; speed=4+distance.value/500; distance.value+=speed*0.02
  player.vy+=0.5; player.y+=player.vy
  if(player.y>=GROUND){player.y=GROUND;player.vy=0;player.grounded=false;player.grounded=true;player.doubleJump=false}
  // Spawn obstacles
  if(frame%Math.max(40,80-Math.floor(speed*3))===0) {
    const types=[{w:20,h:30},{w:30,h:20},{w:15,h:45}]
    const t=types[Math.floor(Math.random()*types.length)]
    obstacles.push({x:CW+20,y:GROUND+40-t.h,...t})
  }
  obstacles.forEach(o=>o.x-=speed)
  obstacles=obstacles.filter(o=>o.x>-50)
  // Collision
  for(const o of obstacles) {
    if(player.x<o.x+o.w&&player.x+player.w>o.x&&player.y+40-player.h>o.y) {
      running.value=false
      if(Math.floor(distance.value)>highScore.value){highScore.value=Math.floor(distance.value);localStorage.setItem('parkour_hs',highScore.value)}
      return
    }
  }
}
function draw() {
  const ctx=canvas.value?.getContext('2d'); if(!ctx) return
  const isDark=document.documentElement.classList.contains('dark')
  // Sky
  const grad=ctx.createLinearGradient(0,0,0,CH);grad.addColorStop(0,'#7dd3fc');grad.addColorStop(1,'#e0f2fe')
  ctx.fillStyle=isDark?'#0f172a':grad; ctx.fillRect(0,0,CW,CH)
  // Ground
  ctx.fillStyle=isDark?'#1e293b':'#86efac'; ctx.fillRect(0,GROUND+40,CW,CH-GROUND)
  ctx.fillStyle=isDark?'#334155':'#4ade80'; ctx.fillRect(0,GROUND+38,CW,4)
  // Player
  ctx.fillStyle='#3b82f6'
  ctx.fillRect(player.x,player.y-player.h+40,player.w,player.h)
  ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(player.x+player.w/2,player.y-player.h+34,8,0,Math.PI*2); ctx.fill()
  // Obstacles
  obstacles.forEach(o=>{ctx.fillStyle='#ef4444';ctx.fillRect(o.x,o.y,o.w,o.h)})
  // Clouds
  ctx.fillStyle=isDark?'#334155':'#fff'
  for(let i=0;i<3;i++){const cx=(i*200+frame*0.5)%CW;ctx.beginPath();ctx.arc(cx,40+i*20,15,0,Math.PI*2);ctx.arc(cx+15,35+i*20,18,0,Math.PI*2);ctx.arc(cx+30,40+i*20,15,0,Math.PI*2);ctx.fill()}
}
let lastTime=0
function gameLoop(time){if(!running.value)return;animFrame=requestAnimationFrame(gameLoop);if(time-lastTime<33)return;lastTime=time;update();draw()}
function onKey(e){if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();jump()}}
onMounted(()=>{reset();window.addEventListener('keydown',onKey)});onUnmounted(()=>{cancelAnimationFrame(animFrame);window.removeEventListener('keydown',onKey)})
</script>
