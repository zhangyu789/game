<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🗼 塔防游戏</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
      <select v-model="placingTower" class="btn-sm btn-secondary">
        <option :value="null">选择放置</option>
        <option value="arrow">🏹 箭塔($50)</option>
        <option value="cannon">💣 炮塔($100)</option>
        <option value="ice">❄️ 冰塔($75)</option>
      </select>
    </div>
    <div class="flex gap-4 mb-3 text-sm flex-wrap">
      <span>💰 {{ gold }}</span><span>❤️ {{ lives }}</span><span>🌊 波次: {{ wave }}</span><span>{{ gameOver }}</span>
    </div>
    <canvas ref="canvas" width="560" height="400" class="border border-gray-300 dark:border-slate-600 rounded bg-green-900 block max-w-full cursor-pointer" style="width:min(560px,100%)" @click="onClick"></canvas>
    <p class="text-xs text-gray-400 mt-2">选择塔类型，点击绿色区域放置，阻止敌人到达终点</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref(null)
const CW=560, CH=400, CELL=40
const PATH = [{x:0,y:5},{x:3,y:5},{x:3,y:2},{x:7,y:2},{x:7,y:7},{x:11,y:7},{x:11,y:3},{x:14,y:3}]
const running=ref(false), gold=ref(200), lives=ref(20), wave=ref(0), gameOver=ref('')
const placingTower=ref(null)
let towers=[], enemies=[], projectiles=[], animFrame, spawnTimer=0, waveEnemies=0
function reset(){running.value=false;cancelAnimationFrame(animFrame);gold.value=200;lives.value=20;wave.value=0;gameOver.value='';towers=[];enemies=[];projectiles=[];draw()}
function start(){running.value=true;wave.value++;spawnWave();animFrame=requestAnimationFrame(gameLoop)}
function spawnWave(){
  const count=5+wave.value*2; waveEnemies=count; spawnTimer=0
}
function isOnPath(cx,cy){
  for(let i=0;i<PATH.length-1;i++){
    const a=PATH[i],b=PATH[i+1]
    const minX=Math.min(a.x,b.x),maxX=Math.max(a.x,b.x)
    const minY=Math.min(a.y,b.y),maxY=Math.max(a.y,b.y)
    if(cx>=minX&&cx<=maxX&&cy>=minY&&cy<=maxY) return true
  }
  return false
}
function onClick(e){
  const rect=canvas.value.getBoundingClientRect()
  const mx=(e.clientX-rect.left)*(CW/rect.width), my=(e.clientY-rect.top)*(CH/rect.height)
  const cx=Math.floor(mx/CELL), cy=Math.floor(my/CELL)
  if(!placingTower.value) return
  if(isOnPath(cx,cy)||towers.some(t=>t.cx===cx&&t.cy===cy)) return
  const costs={arrow:50,cannon:100,ice:75}
  if(gold.value<costs[placingTower.value]) return
  gold.value-=costs[placingTower.value]
  towers.push({cx,cy,x:cx*CELL+CELL/2,y:cy*CELL+CELL/2,type:placingTower.value,range:placingTower.value==='cannon'?100:120,damage:placingTower.value==='cannon'?30:15,cooldown:0,rate:placingTower.value==='cannon'?60:30})
  placingTower.value=null; draw()
}
function getPathPos(progress){
  let dist=progress*CELL
  for(let i=0;i<PATH.length-1;i++){
    const a=PATH[i],b=PATH[i+1]
    const segLen=Math.hypot(b.x-a.x,b.y-a.y)*CELL
    if(dist<=segLen){const t=dist/segLen;return{x:(a.x+(b.x-a.x)*t)*CELL+CELL/2,y:(a.y+(b.y-a.y)*t)*CELL+CELL/2}}
    dist-=segLen
  }
  return{x:PATH[PATH.length-1].x*CELL+CELL/2,y:PATH[PATH.length-1].y*CELL+CELL/2}
}
function getTotalPathLen(){
  let len=0;for(let i=0;i<PATH.length-1;i++){len+=Math.hypot(PATH[i+1].x-PATH[i].x,PATH[i+1].y-PATH[i].y)*CELL};return len
}
function update(){
  // Spawn enemies
  if(waveEnemies>0){spawnTimer++;if(spawnTimer>=30){spawnTimer=0;waveEnemies--;
    enemies.push({progress:0,speed:0.02+wave.value*0.002,hp:20+wave.value*10,maxHp:20+wave.value*10,slow:0})}}
  // Move enemies
  const totalLen=getTotalPathLen()
  enemies.forEach(e=>{e.progress+=e.speed*(e.slow>0?0.5:1);if(e.slow>0)e.slow--;
    const pos=getPathPos(e.progress/totalLen*totalLen/CELL);e.x=pos.x;e.y=pos.y})
  // Remove reached end
  enemies=enemies.filter(e=>{if(e.progress>=totalLen/CELL){lives.value--;return false};return true})
  if(lives.value<=0){gameOver.value='💀 游戏结束!';running.value=false;return}
  // Towers shoot
  towers.forEach(t=>{t.cooldown--;if(t.cooldown>0)return;
    const target=enemies.find(e=>e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<t.range)
    if(target){t.cooldown=t.rate;projectiles.push({x:t.x,y:t.y,tx:target.x,ty:target.y,speed:5,damage:t.damage,type:t.type,target})}})
  // Projectiles
  projectiles.forEach(p=>{const dx=p.target.x-p.x,dy=p.target.y-p.y,d=Math.hypot(dx,dy)
    if(d<10){p.target.hp-=p.damage;if(p.type==='ice')p.target.slow=60;p.dead=true}
    else{p.x+=dx/d*p.speed;p.y+=dy/d*p.speed}})
  projectiles=projectiles.filter(p=>!p.dead)
  enemies.filter(e=>e.hp<=0).forEach(e=>{gold.value+=10+wave.value*2})
  enemies=enemies.filter(e=>e.hp>0)
  // Wave complete
  if(waveEnemies===0&&enemies.length===0){wave.value++;gold.value+=50;spawnWave()}
}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  ctx.fillStyle='#1a472a';ctx.fillRect(0,0,CW,CH)
  // Path
  ctx.strokeStyle='#8B7355';ctx.lineWidth=CELL*0.8;ctx.lineCap='round';ctx.lineJoin='round'
  ctx.beginPath();ctx.moveTo(PATH[0].x*CELL+CELL/2,PATH[0].y*CELL+CELL/2)
  for(let i=1;i<PATH.length;i++) ctx.lineTo(PATH[i].x*CELL+CELL/2,PATH[i].y*CELL+CELL/2)
  ctx.stroke()
  // Towers
  towers.forEach(t=>{ctx.fillStyle=t.type==='arrow'?'#8B4513':t.type==='cannon'?'#4a4a4a':'#87CEEB'
    ctx.fillRect(t.cx*CELL+4,t.cy*CELL+4,CELL-8,CELL-8)
    ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.textAlign='center'
    ctx.fillText(t.type==='arrow'?'🏹':t.type==='cannon'?'💣':'❄️',t.x,t.y+5)})
  // Enemies
  enemies.forEach(e=>{ctx.fillStyle=e.slow>0?'#87CEEB':'#ef4444'
    ctx.beginPath();ctx.arc(e.x,e.y,12,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#22c55e';ctx.fillRect(e.x-12,e.y-18,24*(e.hp/e.maxHp),4)})
  // Projectiles
  projectiles.forEach(p=>{ctx.fillStyle=p.type==='ice'?'#87CEEB':'#fbbf24';ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill()})
  // Start/End markers
  ctx.fillStyle='#22c55e';ctx.font='20px sans-serif';ctx.textAlign='center'
  ctx.fillText('🏁',PATH[0].x*CELL+CELL/2,PATH[0].y*CELL+CELL/2+6)
  ctx.fillText('🚪',PATH[PATH.length-1].x*CELL+CELL/2,PATH[PATH.length-1].y*CELL+CELL/2+6)
}
let lastTime=0
function gameLoop(time){if(!running.value)return;animFrame=requestAnimationFrame(gameLoop);if(time-lastTime<33)return;lastTime=time;update();draw()}
onMounted(()=>{reset()});onUnmounted(()=>{cancelAnimationFrame(animFrame)})
</script>
