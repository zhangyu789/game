<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">✏️ 物理画线</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 释放小球</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 清除</button>
      <span class="btn-sm btn-secondary">关卡 {{ level }}</span>
    </div>
    <div class="flex gap-4 mb-3 text-sm"><span>{{ result }}</span></div>
    <canvas ref="canvas" width="500" height="400" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 block max-w-full cursor-crosshair" style="width:min(500px,100%)" @mousedown="onDown" @mousemove="onMove" @mouseup="onUp" @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onUp"></canvas>
    <p class="text-xs text-gray-400 mt-2">画线引导小球到达绿色目标区域</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref(null), CW = 500, CH = 400
const running = ref(false), level = ref(1), result = ref('')
let lines = [], ball = null, target = null, drawing = false, currentLine = [], animFrame
const LEVELS = [
  {ball:{x:50,y:50},target:{x:400,y:350,w:60,h:40}},
  {ball:{x:250,y:50},target:{x:50,y:350,w:60,h:40}},
  {ball:{x:50,y:200},target:{x:450,y:200,w:40,h:60}},
]
function reset() {
  running.value=false;cancelAnimationFrame(animFrame);lines=[];currentLine=[];result.value='';drawing=false
  const lvl = LEVELS[(level.value-1)%LEVELS.length]
  ball={x:lvl.ball.x,y:lvl.ball.y,vx:0,vy:0,r:10}
  target={...lvl.target}
  draw()
}
function start(){if(!running.value){running.value=true;animFrame=requestAnimationFrame(gameLoop)}}
function onDown(e){const rect=canvas.value.getBoundingClientRect();const mx=(e.clientX-rect.left)*(CW/rect.width),my=(e.clientY-rect.top)*(CH/rect.height);drawing=true;currentLine=[{x:mx,y:my}]}
function onMove(e){if(!drawing)return;const rect=canvas.value.getBoundingClientRect();currentLine.push({x:(e.clientX-rect.left)*(CW/rect.width),y:(e.clientY-rect.top)*(CH/rect.height)});draw()}
function onUp(){if(drawing&&currentLine.length>1)lines.push([...currentLine]);currentLine=[];drawing=false}
function onTouchStart(e){const t=e.touches[0];onDown({clientX:t.clientX,clientY:t.clientY})}
function onTouchMove(e){const t=e.touches[0];onMove({clientX:t.clientX,clientY:t.clientY})}
function update() {
  ball.vy += 0.3; ball.vx *= 0.99; ball.x += ball.vx; ball.y += ball.vy
  // Line collision
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i+1]
      const d = distToSeg(ball.x, ball.y, a.x, a.y, b.x, b.y)
      if (d < ball.r + 2) {
        const nx = -(b.y-a.y), ny = b.x-a.x
        const len = Math.hypot(nx, ny)
        if (len === 0) continue
        const nnx = nx/len, nny = ny/len
        // Push ball out
        ball.x += nnx * (ball.r + 2 - d)
        ball.y += nny * (ball.r + 2 - d)
        // Reflect velocity
        const dot = ball.vx * nnx + ball.vy * nny
        if (dot < 0) {
          ball.vx -= 1.5 * dot * nnx; ball.vy -= 1.5 * dot * nny
          ball.vx *= 0.8; ball.vy *= 0.8
        }
      }
    }
  }
  // Walls
  if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -0.5 }
  if (ball.x > CW - ball.r) { ball.x = CW - ball.r; ball.vx *= -0.5 }
  if (ball.y > CH + 50) { result.value = '💥 小球掉出了!'; running.value = false }
  // Target
  if (ball.x > target.x && ball.x < target.x + target.w && ball.y > target.y && ball.y < target.y + target.h) {
    result.value = '🎉 成功!'; running.value = false; level.value++
  }
}
function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2-x1, dy = y2-y1, len2 = dx*dx+dy*dy
  let t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px-x1)*dx+(py-y1)*dy)/len2))
  return Math.hypot(px-(x1+t*dx), py-(y1+t*dy))
}
function draw() {
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  const isDark=document.documentElement.classList.contains('dark')
  ctx.fillStyle=isDark?'#0f172a':'#f9fafb';ctx.fillRect(0,0,CW,CH)
  // Target
  ctx.fillStyle='#22c55e40';ctx.fillRect(target.x,target.y,target.w,target.h)
  ctx.strokeStyle='#22c55e';ctx.lineWidth=2;ctx.strokeRect(target.x,target.y,target.w,target.h)
  ctx.fillStyle='#22c55e';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('目标',target.x+target.w/2,target.y+target.h/2+4)
  // Lines
  ctx.strokeStyle=isDark?'#e2e8f0':'#374151';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round'
  lines.forEach(line=>{ctx.beginPath();ctx.moveTo(line[0].x,line[0].y);for(let i=1;i<line.length;i++)ctx.lineTo(line[i].x,line[i].y);ctx.stroke()})
  if(currentLine.length>1){ctx.beginPath();ctx.moveTo(currentLine[0].x,currentLine[0].y);for(let i=1;i<currentLine.length;i++)ctx.lineTo(currentLine[i].x,currentLine[i].y);ctx.stroke()}
  // Ball
  ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.beginPath();ctx.arc(ball.x-3,ball.y-3,ball.r/2,0,Math.PI*2);ctx.fill()
}
let lastTime=0
function gameLoop(time){if(!running.value)return;animFrame=requestAnimationFrame(gameLoop);if(time-lastTime<16)return;lastTime=time;update();draw()}
onMounted(()=>{reset()});onUnmounted(()=>{cancelAnimationFrame(animFrame)})
</script>
