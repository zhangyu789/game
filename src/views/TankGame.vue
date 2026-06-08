<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🔫 坦克大战</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="init">🔄 重新开始</button>
      <span class="self-center text-sm ml-auto">得分: {{ score }} | 生命: {{ lives }}</span>
    </div>
    <canvas ref="canvas" width="520" height="520" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-900 block mx-auto" style="max-width:520px;width:100%"></canvas>
    <p class="text-xs text-gray-400 mt-2">WASD/方向键移动，空格发射子弹</p>
    <div class="grid grid-cols-3 gap-1 mt-3 max-w-[160px] lg:hidden">
      <div></div><button class="btn-sm btn-secondary" @click="setDir('up')">▲</button><div></div>
      <button class="btn-sm btn-secondary" @click="setDir('left')">◀</button>
      <button class="btn-sm btn-secondary" @click="shoot">●</button>
      <button class="btn-sm btn-secondary" @click="setDir('right')">▶</button>
      <div></div><button class="btn-sm btn-secondary" @click="setDir('down')">▼</button><div></div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas=ref(null)
const W=520,H=520,TS=40,BULLET_S=6
let player,enemies,bullets,ebullets,walls,running_,score_,lives_,animId,keys={},spawnTimer
const running=ref(false),score=ref(0),lives=ref(3)

function init(){
  player={x:W/2-TS/2,y:H-TS-10,dir:'up',color:'#22c55e'}
  enemies=[];bullets=[];ebullets=[];score_=0;lives_=3;spawnTimer=0
  score.value=0;lives.value=3;running.value=false;running_=false
  // Walls
  walls=[]
  for(let r=0;r<13;r++)for(let c=0;c<13;c++){
    if(Math.random()<0.2&&!(r>10&&c>4&&c<8))walls.push({x:c*40,y:r*40,w:40,h:40})
  }
  draw()
}
function start(){running.value=true;running_=true;loop()}
function setDir(d){if(player)player.dir=d}
function shoot(){if(!player||!running_)return;const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[player.dir];bullets.push({x:player.x+TS/2+d[0]*TS/2,y:player.y+TS/2+d[1]*TS/2,dx:d[0]*BULLET_S,dy:d[1]*BULLET_S})}
function loop(){
  if(!running_)return
  update();draw();animId=requestAnimationFrame(loop)
}
function update(){
  // Player move
  const speed=3
  const dm={up:[0,-speed],down:[0,speed],left:[-speed,0],right:[speed,0]}
  if(keys['ArrowUp']||keys['w'])player.dir='up'
  if(keys['ArrowDown']||keys['s'])player.dir='down'
  if(keys['ArrowLeft']||keys['a'])player.dir='left'
  if(keys['ArrowRight']||keys['d'])player.dir='right'
  const d=dm[player.dir]
  if(keys['ArrowUp']||keys['ArrowDown']||keys['ArrowLeft']||keys['ArrowRight']||keys['w']||keys['a']||keys['s']||keys['d']){
    const nx=player.x+d[0],ny=player.y+d[1]
    if(!collidesWall(nx,ny)&&nx>=0&&nx<=W-TS&&ny>=0&&ny<=H-TS){player.x=nx;player.y=ny}
  }
  // Spawn enemies
  spawnTimer++
  if(spawnTimer%120===0&&enemies.length<5){
    const ex=Math.floor(Math.random()*12)*40
    enemies.push({x:ex,y:0,dir:'down',color:'#ef4444',timer:0})
  }
  // Enemy AI
  for(const e of enemies){
    e.timer++
    if(e.timer%60===0){const dirs=['up','down','left','right'];e.dir=dirs[Math.floor(Math.random()*4)];
      if(Math.random()<0.3){const dd={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[e.dir];ebullets.push({x:e.x+TS/2,y:e.y+TS/2,dx:dd[0]*4,dy:dd[1]*4})}}
    const ed={up:[0,-2],down:[0,2],left:[-2,0],right:[2,0]}[e.dir]
    const nx=e.x+ed[0],ny=e.y+ed[1]
    if(!collidesWall(nx,ny)&&nx>=0&&nx<=W-TS&&ny>=0&&ny<=H-TS){e.x=nx;e.y=ny}
  }
  // Update bullets
  for(const b of bullets){b.x+=b.dx;b.y+=b.dy}
  bullets=bullets.filter(b=>b.x>0&&b.x<W&&b.y>0&&b.y<H)
  for(const b of ebullets){b.x+=b.dx;b.y+=b.dy}
  ebullets=ebullets.filter(b=>b.x>0&&b.x<W&&b.y>0&&b.y<H)
  // Bullet-wall collision
  bullets=bullets.filter(b=>!walls.some(w=>b.x>w.x&&b.x<w.x+w.w&&b.y>w.y&&b.y<w.y+w.h))
  ebullets=ebullets.filter(b=>!walls.some(w=>b.x>w.x&&b.x<w.x+w.w&&b.y>w.y&&b.y<w.y+w.h))
  // Bullet-enemy collision
  bullets=bullets.filter(b=>{
    for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(b.x>e.x&&b.x<e.x+TS&&b.y>e.y&&b.y<e.y+TS){enemies.splice(i,1);score_+=10;score.value=score_;return false}}return true})
  // Enemy bullet-player collision
  ebullets=ebullets.filter(b=>{if(b.x>player.x&&b.x<player.x+TS&&b.y>player.y&&b.y<player.y+TS){lives_--;lives.value=lives_;if(lives_<=0){running_=false;running.value=false}return false}return true})
  // Enemy-player collision
  for(const e of enemies){if(Math.abs(e.x-player.x)<TS&&Math.abs(e.y-player.y)<TS){lives_--;lives.value=lives_;enemies.splice(enemies.indexOf(e),1);if(lives_<=0){running_=false;running.value=false}break}}
}
function collidesWall(x,y){return walls.some(w=>x<w.x+w.w&&x+TS>w.x&&y<w.y+w.h&&y+TS>w.y)}
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  ctx.fillStyle='#111827';ctx.fillRect(0,0,W,H)
  // Walls
  for(const w of walls){ctx.fillStyle='#78716c';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeStyle='#57534e';ctx.strokeRect(w.x,w.y,w.w,w.h)}
  // Player
  drawTank(ctx,player)
  // Enemies
  for(const e of enemies)drawTank(ctx,e)
  // Bullets
  ctx.fillStyle='#facc15';for(const b of bullets){ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#ef4444';for(const b of ebullets){ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill()}
}
function drawTank(ctx,t){
  ctx.fillStyle=t.color;ctx.fillRect(t.x+5,t.y+5,TS-10,TS-10)
  ctx.fillRect(...{up:[t.x+TS/2-3,t.y,6,TS/2],down:[t.x+TS/2-3,t.y+TS/2,6,TS/2],left:[t.x,t.y+TS/2-3,TS/2,6],right:[t.x+TS/2,t.y+TS/2-3,TS/2,6]}[t.dir])
}
function onKey(e){keys[e.key]=true;if(e.key===' '){e.preventDefault();shoot()}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault()}
function onKeyUp(e){keys[e.key]=false}
onMounted(()=>{init();window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp)})
onUnmounted(()=>{cancelAnimationFrame(animId);running_=false;window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp)})
</script>
