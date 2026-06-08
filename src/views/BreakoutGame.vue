<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🧱 打砖块</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="init">🔄 重新开始</button>
      <span class="self-center text-sm ml-auto">得分: {{ score }} | 生命: {{ lives }}</span>
    </div>
    <canvas ref="canvas" width="480" height="400" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-900 cursor-none block mx-auto" style="max-width:480px;width:100%" @mousemove="onMouse" @touchmove.prevent="onTouch"></canvas>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas=ref(null)
const W=480,H=400
let ball,paddle,bricks,running_,score_,lives_,animId
const running=ref(false),score=ref(0),lives=ref(3)
const COLORS=['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6']

function init(){
  ball={x:W/2,y:H-50,dx:4*(Math.random()>0.5?1:-1),dy:-4,r:6}
  paddle={x:W/2-40,y:H-20,w:80,h:10}
  bricks=[]
  for(let r=0;r<5;r++)for(let c=0;c<8;c++)bricks.push({x:c*58+10,y:r*25+30,w:52,h:20,alive:true,color:COLORS[r]})
  score_=0;lives_=3;score.value=0;lives.value=3;running.value=false;running_=false
  draw()
}
function start(){
  running.value=true;running_=true;loop()
}
function loop(){
  if(!running_)return
  update();draw();animId=requestAnimationFrame(loop)
}
function update(){
  ball.x+=ball.dx;ball.y+=ball.dy
  if(ball.x-ball.r<0||ball.x+ball.r>W)ball.dx=-ball.dx
  if(ball.y-ball.r<0)ball.dy=-ball.dy
  if(ball.y+ball.r>H){
    lives_--;lives.value=lives_
    if(lives_<=0){running_=false;running.value=false;return}
    ball={x:W/2,y:H-50,dx:4*(Math.random()>0.5?1:-1),dy:-4,r:6}
  }
  // Paddle collision
  if(ball.y+ball.r>=paddle.y&&ball.y+ball.r<=paddle.y+paddle.h&&ball.x>=paddle.x&&ball.x<=paddle.x+paddle.w){
    ball.dy=-Math.abs(ball.dy)
    const hit=(ball.x-(paddle.x+paddle.w/2))/(paddle.w/2)
    ball.dx=hit*5
  }
  // Brick collision
  for(const b of bricks){
    if(!b.alive)continue
    if(ball.x+ball.r>b.x&&ball.x-ball.r<b.x+b.w&&ball.y+ball.r>b.y&&ball.y-ball.r<b.y+b.h){
      b.alive=false;score_+=10;score.value=score_;ball.dy=-ball.dy;break
    }
  }
  if(bricks.every(b=>!b.alive)){running_=false;running.value=false}
}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  ctx.fillStyle='#111827';ctx.fillRect(0,0,W,H)
  // Bricks
  for(const b of bricks){if(!b.alive)continue;ctx.fillStyle=b.color;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle='#111827';ctx.strokeRect(b.x,b.y,b.w,b.h)}
  // Paddle
  ctx.fillStyle='#3b82f6';ctx.fillRect(paddle.x,paddle.y,paddle.w,paddle.h)
  // Ball
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill()
}
function onMouse(e){
  const rect=canvas.value.getBoundingClientRect()
  const scale=W/rect.width
  paddle.x=(e.clientX-rect.left)*scale-paddle.w/2
  paddle.x=Math.max(0,Math.min(W-paddle.w,paddle.x))
}
function onTouch(e){
  const rect=canvas.value.getBoundingClientRect()
  const scale=W/rect.width
  paddle.x=(e.touches[0].clientX-rect.left)*scale-paddle.w/2
  paddle.x=Math.max(0,Math.min(W-paddle.w,paddle.x))
}
onMounted(()=>init())
onUnmounted(()=>{cancelAnimationFrame(animId);running_=false})
</script>
