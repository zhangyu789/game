<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🐍 贪吃蛇大作战</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm"><span>🏆 长度: {{ score }}</span><span>🤖 敌人: {{ aiCount }}</span><span>{{ gameOver }}</span></div>
    <canvas ref="canvas" width="500" height="500" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-900 block max-w-full" style="width:min(500px,100%)" @mousemove="onMouse" @touchmove.prevent="onTouch"></canvas>
    <p class="text-xs text-gray-400 mt-2">鼠标/触摸控制方向，吃食物长大，避免撞到别人</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref(null), CW = 500, CH = 500
const running = ref(false), score = ref(5), gameOver = ref('')
const aiCount = ref(3)
let animFrame, player, ais = [], foods = [], targetAngle = 0
function reset() {
  running.value=false; cancelAnimationFrame(animFrame); score.value=5; gameOver.value=''
  player = {x:CW/2,y:CH/2,angle:0,body:[],speed:2,color:'#22c55e',alive:true}
  for(let i=0;i<5;i++) player.body.push({x:player.x-i*3,y:player.y})
  ais=[]; for(let i=0;i<3;i++) {
    const a={x:Math.random()*CW,y:Math.random()*CH,angle:Math.random()*Math.PI*2,body:[],speed:1.5+Math.random(),color:`hsl(${Math.random()*360},70%,50%)`,alive:true,turnTimer:0}
    for(let j=0;j<5;j++) a.body.push({x:a.x-j*3,y:a.y}); ais.push(a)
  }
  foods=[]; for(let i=0;i<50;i++) foods.push({x:Math.random()*CW,y:Math.random()*CH,size:2+Math.random()*3,color:`hsl(${Math.random()*360},80%,60%)`})
  draw()
}
function start(){running.value=true;animFrame=requestAnimationFrame(gameLoop)}
function onMouse(e){const rect=canvas.value.getBoundingClientRect();const mx=(e.clientX-rect.left)*(CW/rect.width),my=(e.clientY-rect.top)*(CH/rect.height);targetAngle=Math.atan2(my-player.y,mx-player.x)}
function onTouch(e){const t=e.touches[0];const rect=canvas.value.getBoundingClientRect();const mx=(t.clientX-rect.left)*(CW/rect.width),my=(t.clientY-rect.top)*(CH/rect.height);targetAngle=Math.atan2(my-player.y,mx-player.x)}
function update() {
  // Player movement
  if(player.alive){
    player.angle=targetAngle; player.x+=Math.cos(player.angle)*player.speed; player.y+=Math.sin(player.angle)*player.speed
    player.body.unshift({x:player.x,y:player.y}); if(player.body.length>score.value*3) player.body.pop()
    // Boundary
    if(player.x<0||player.x>CW||player.y<0||player.y>CH){player.alive=false;gameOver.value='💀 撞墙了!';running.value=false;return}
  }
  // AI movement
  ais.forEach(a=>{if(!a.alive) return
    a.turnTimer--;if(a.turnTimer<=0){a.angle+=(Math.random()-0.5)*1;a.turnTimer=20+Math.random()*40}
    a.x+=Math.cos(a.angle)*a.speed;a.y+=Math.sin(a.angle)*a.speed
    if(a.x<0)a.angle=0;if(a.x>CW)a.angle=Math.PI;if(a.y<0)a.angle=Math.PI/2;if(a.y>CH)a.angle=-Math.PI/2
    a.body.unshift({x:a.x,y:a.y});if(a.body.length>15)a.body.pop()
  })
  // Food collision
  foods=foods.filter(f=>{
    if(player.alive&&Math.hypot(f.x-player.x,f.y-player.y)<10){score.value++;return false}
    ais.forEach(a=>{if(a.alive&&Math.hypot(f.x-a.x,f.y-a.y)<10)a.body.push({x:a.x,y:a.y})})
    return true
  })
  while(foods.length<50) foods.push({x:Math.random()*CW,y:Math.random()*CH,size:2+Math.random()*3,color:`hsl(${Math.random()*360},80%,60%)`})
  // Snake collision
  if(player.alive) {
    for(const a of ais){if(!a.alive)continue;for(const s of a.body){if(Math.hypot(s.x-player.x,s.y-player.y)<8){player.alive=false;gameOver.value='💀 撞到敌人了!';running.value=false;return}}}
  }
  ais.forEach(a=>{if(!a.alive)return;for(const s of player.body){if(Math.hypot(s.x-a.x,s.y-a.y)<8){a.alive=false;score.value+=10;aiCount.value--}}}
  )
}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  ctx.fillStyle='#111827';ctx.fillRect(0,0,CW,CH)
  // Foods
  foods.forEach(f=>{ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,f.size,0,Math.PI*2);ctx.fill()})
  // AI snakes
  ais.forEach(a=>{if(!a.alive)return;a.body.forEach((s,i)=>{ctx.fillStyle=a.color;ctx.globalAlpha=1-i*0.03;ctx.beginPath();ctx.arc(s.x,s.y,5,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1})
  // Player
  if(player.alive){player.body.forEach((s,i)=>{ctx.fillStyle=i===0?'#4ade80':'#22c55e';ctx.beginPath();ctx.arc(s.x,s.y,i===0?7:5,0,Math.PI*2);ctx.fill()})}
}
let lastTime=0
function gameLoop(time){if(!running.value)return;animFrame=requestAnimationFrame(gameLoop);if(time-lastTime<25)return;lastTime=time;update();draw()}
onMounted(()=>{reset()});onUnmounted(()=>{cancelAnimationFrame(animFrame)})
</script>
