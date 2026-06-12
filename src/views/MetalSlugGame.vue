<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🔫 合金弹头</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running && lives > 0">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="pause" v-else-if="running">⏸ 暂停</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
      <button class="btn-sm btn-secondary" @click="toggleSound">{{ soundOn ? '🔊' : '🔇' }} 音效</button>
    </div>
    <div class="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-sm font-mono">
      <span class="text-amber-400">🏆 {{ score }}</span>
      <span class="text-red-400">❤️ {{ '♥'.repeat(Math.max(0,lives)) }}{{ '♡'.repeat(Math.max(0,maxLives-lives)) }}</span>
      <span class="text-green-400">💣 {{ grenades }}</span>
      <span class="text-cyan-400">🌊 波次 {{ wave }}</span>
      <span class="text-purple-400" v-if="combo > 1">🔥 {{ combo }}连杀</span>
      <span class="text-yellow-300" v-if="powerUp">{{ powerUp }}</span>
    </div>
    <canvas ref="canvas" width="600" height="360" class="border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-800 block max-w-full shadow-lg shadow-black/40" style="width:min(600px,100%);image-rendering:auto"></canvas>
    <p class="text-xs text-gray-400 mt-2">← → 移动 · ↑ 跳跃(可二段跳) · 空格射击 · G 投雷 · Shift 冲刺 · 每5波 Boss</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref(null)
const CW = 600, CH = 360, GROUND = 310
const running = ref(false), score = ref(0), lives = ref(3), grenades = ref(5), wave = ref(1), combo = ref(0)
const soundOn = ref(true), powerUp = ref('')
const maxLives = 5
let animFrame, player, bullets, enemies, explosions, particles, scrollX, spawnTimer, keys = {}
let shakeX = 0, shakeY = 0, shakeTime = 0
let clouds = [], stars = [], buildings = [], mountains = [], decorations = []
let muzzleFlash = 0, gameTime = 0, killCount = 0
let pickups = [], obstacles = [], dustMotes = [], helicopters = [], bosses = []
let comboTimer = 0, rapidFire = 0, shieldTime = 0, slowMo = 0
let waveAnnounce = 0, waveAnnounceText = ''
let highScore = 0, totalKills = 0
let screenFlash = 0, screenFlashColor = '#ef4444'
let weatherTimer = 0, weatherType = 'clear', rainDrops = []
let dashCooldown = 0, jumpCount = 0
let audioCtx = null
// Performance: pre-computed colors & cached gradients
const PICKUP_COLORS = {health:'#22c55e',ammo:'#fbbf24',grenade:'#4ade80',coin:'#fde047',shield:'#38bdf8',rapid:'#f97316'}
const PICKUP_ICONS = {health:'♥',ammo:'⬟',grenade:'●',coin:'★',shield:'◆',rapid:'»'}
let cachedSkyGrad = null, cachedGroundGrad = null, cachedVigGrad = null, cachedWeather = ''
let ctx2d = null // persistent canvas context reference

// ── Audio System ──
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)() }
function playSound(type) {
  if (!soundOn.value || !audioCtx) return
  try {
  const now = audioCtx.currentTime
  const g = audioCtx.createGain(); g.connect(audioCtx.destination)
  const o = audioCtx.createOscillator()
  switch(type) {
    case 'shoot': o.type='square';o.frequency.setValueAtTime(800,now);o.frequency.exponentialRampToValueAtTime(200,now+0.08);g.gain.setValueAtTime(0.1,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.08);o.connect(g);o.start(now);o.stop(now+0.08);break
    case 'explode':{const n=audioCtx.createBufferSource();const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.3,audioCtx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);n.buffer=buf;g.gain.setValueAtTime(0.2,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.3);n.connect(g);n.start(now);break}
    case 'hit':o.type='sine';o.frequency.setValueAtTime(300,now);o.frequency.exponentialRampToValueAtTime(100,now+0.06);g.gain.setValueAtTime(0.08,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.06);o.connect(g);o.start(now);o.stop(now+0.06);break
    case 'jump':o.type='sine';o.frequency.setValueAtTime(250,now);o.frequency.exponentialRampToValueAtTime(600,now+0.12);g.gain.setValueAtTime(0.06,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.12);o.connect(g);o.start(now);o.stop(now+0.12);break
    case 'pickup':o.type='sine';o.frequency.setValueAtTime(523,now);o.frequency.setValueAtTime(659,now+0.06);o.frequency.setValueAtTime(784,now+0.12);g.gain.setValueAtTime(0.1,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.2);o.connect(g);o.start(now);o.stop(now+0.2);break
    case 'grenade':o.type='sawtooth';o.frequency.setValueAtTime(150,now);o.frequency.exponentialRampToValueAtTime(80,now+0.15);g.gain.setValueAtTime(0.08,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.15);o.connect(g);o.start(now);o.stop(now+0.15);break
    case 'combo':o.type='sine';[523,659,784,1047].forEach((n2,i)=>o.frequency.setValueAtTime(n2,now+i*0.05));g.gain.setValueAtTime(0.1,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.25);o.connect(g);o.start(now);o.stop(now+0.25);break
    case 'death':o.type='sawtooth';o.frequency.setValueAtTime(400,now);o.frequency.exponentialRampToValueAtTime(50,now+0.6);g.gain.setValueAtTime(0.12,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.6);o.connect(g);o.start(now);o.stop(now+0.6);break
    case 'wave':o.type='square';o.frequency.setValueAtTime(440,now);o.frequency.setValueAtTime(550,now+0.15);o.frequency.setValueAtTime(660,now+0.3);g.gain.setValueAtTime(0.08,now);g.gain.linearRampToValueAtTime(0.1,now+0.3);g.gain.exponentialRampToValueAtTime(0.001,now+0.5);o.connect(g);o.start(now);o.stop(now+0.5);break
    case 'dash':o.type='sine';o.frequency.setValueAtTime(200,now);o.frequency.exponentialRampToValueAtTime(800,now+0.1);g.gain.setValueAtTime(0.07,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.1);o.connect(g);o.start(now);o.stop(now+0.1);break
    case 'boss':o.type='sawtooth';o.frequency.setValueAtTime(80,now);o.frequency.setValueAtTime(100,now+0.2);o.frequency.setValueAtTime(80,now+0.4);o.frequency.setValueAtTime(120,now+0.6);g.gain.setValueAtTime(0.12,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.8);o.connect(g);o.start(now);o.stop(now+0.8);break
    case 'land':{const n2=audioCtx.createBufferSource();const buf2=audioCtx.createBuffer(1,audioCtx.sampleRate*0.06,audioCtx.sampleRate);const d2=buf2.getChannelData(0);for(let i=0;i<d2.length;i++)d2[i]=(Math.random()*2-1)*Math.pow(1-i/d2.length,3);n2.buffer=buf2;g.gain.setValueAtTime(0.06,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.06);n2.connect(g);n2.start(now);break}
    default: o.connect(g);o.start(now);o.stop(now+0.01)
  }} catch(e){}
}
function toggleSound() { initAudio(); soundOn.value = !soundOn.value }

// ── Init ──
function initBG() {
  clouds = Array.from({length:8},()=>({x:Math.random()*CW*3,y:20+Math.random()*60,w:40+Math.random()*60,speed:0.1+Math.random()*0.2,opacity:0.15+Math.random()*0.2}))
  stars = Array.from({length:35},()=>({x:Math.random()*CW*3,y:Math.random()*120,s:0.5+Math.random()*1.5,twinkle:Math.random()*Math.PI*2}))
  mountains = Array.from({length:12},(_,i)=>({x:i*200-100,h:60+Math.random()*80,w:120+Math.random()*100,color:`hsl(${210+Math.random()*20},${20+Math.random()*15}%,${15+Math.random()*10}%)`}))
  buildings = Array.from({length:14},(_,i)=>({x:i*150+Math.random()*80,h:30+Math.random()*70,w:25+Math.random()*35,windows:Math.floor(2+Math.random()*4),color:`hsl(${200+Math.random()*30},${10+Math.random()*10}%,${12+Math.random()*8}%)`,winSeed:Math.random()*100|0}))
  dustMotes = Array.from({length:18},()=>({x:Math.random()*CW,y:GROUND-20+Math.random()*40,vx:0.2+Math.random()*0.5,vy:-0.1-Math.random()*0.3,size:1+Math.random()*2,opacity:0.1+Math.random()*0.2,life:100+Math.random()*200}))
  decorations = Array.from({length:10},(_,i)=>({x:i*300+Math.random()*150,type:['tree','lamp','rock','sign'][Math.floor(Math.random()*4)],h:20+Math.random()*30}))
}
function spawnObstacles() {
  obstacles = []
  for(let i=0;i<6;i++){const bx=300+i*350+Math.random()*150;obstacles.push({x:bx,y:GROUND,w:20,h:22,hp:3,type:Math.random()>0.5?'barrel':'crate'})}
}
function initRain() { rainDrops = Array.from({length:40},()=>({x:Math.random()*CW,y:Math.random()*CH,speed:6+Math.random()*4,len:4+Math.random()*8})) }
function shake(intensity){shakeTime=8;shakeX=(Math.random()-0.5)*intensity;shakeY=(Math.random()-0.5)*intensity}
function flashScreen(color,dur){screenFlash=dur||6;screenFlashColor=color||'#ef4444'}

function reset() {
  running.value=false;cancelAnimationFrame(animFrame)
  score.value=0;lives.value=3;grenades.value=5;scrollX=0;spawnTimer=0;wave.value=1;killCount=0;gameTime=0;totalKills=0
  combo.value=0;comboTimer=0;rapidFire=0;shieldTime=0;slowMo=0;highScore=0
  powerUp.value='';dashCooldown=0;jumpCount=0;weatherType='clear';weatherTimer=0
  player={x:80,y:GROUND,vy:0,w:20,h:32,dir:1,grounded:true,shooting:0,walkFrame:0,invuln:0,dashing:0,dashDir:1}
  bullets=[];enemies=[];explosions=[];particles=[];pickups=[];helicopters=[];bosses=[]
  waveAnnounce=0;screenFlash=0
  shakeTime=0;muzzleFlash=0
  initBG();spawnObstacles();draw()
}
function start(){initAudio();running.value=true;animFrame=requestAnimationFrame(gameLoop)}
function pause(){running.value=false;cancelAnimationFrame(animFrame)}

// ── Pickups ──
function trySpawnPickup(x,y){
  if(Math.random()>0.3)return
  const types=['health','ammo','grenade','coin','shield','rapid'],weights=[0.2,0.25,0.15,0.25,0.08,0.07]
  let r=Math.random(),acc=0,type='coin'
  for(let i=0;i<types.length;i++){acc+=weights[i];if(r<acc){type=types[i];break}}
  pickups.push({x,y:y-10,vy:-3,type,life:400,bob:Math.random()*Math.PI*2})
}

// ── Enemies ──
function spawnEnemy(){
  const type=Math.random(),hpMul=1+(wave.value-1)*0.3
  if(type<0.35) enemies.push({x:CW+scrollX+50,y:GROUND,w:20,h:28,hp:Math.ceil(2*hpMul),maxHp:Math.ceil(2*hpMul),type:'soldier',dir:-1,shootTimer:60+Math.random()*60,walkFrame:0})
  else if(type<0.55) enemies.push({x:CW+scrollX+50,y:GROUND-10,w:30,h:30,hp:Math.ceil(4*hpMul),maxHp:Math.ceil(4*hpMul),type:'tank',dir:-1,shootTimer:90,walkFrame:0})
  else if(type<0.8) enemies.push({x:CW+scrollX+50,y:GROUND,w:18,h:24,hp:1,maxHp:1,type:'runner',dir:-1,speed:2+Math.random()*2,walkFrame:0})
  else helicopters.push({x:CW+scrollX+80,y:60+Math.random()*40,hp:Math.ceil(5*hpMul),maxHp:Math.ceil(5*hpMul),shootTimer:80,rotorAngle:0,dir:-1})
}
function spawnBoss(){
  const hpMul=1+(wave.value-1)*0.2
  bosses.push({x:CW+scrollX+100,y:GROUND-20,w:60,h:50,hp:Math.ceil(30*hpMul),maxHp:Math.ceil(30*hpMul),phase:0,shootTimer:40,moveTimer:0,dir:-1,walkFrame:0,chargeTimer:0,charging:false})
  waveAnnounce=150;waveAnnounceText='⚠ BOSS 来袭!'
  playSound('boss')
}

function shoot(){
  const cd=rapidFire>0?4:8
  if(player.shooting>0)return
  player.shooting=cd;muzzleFlash=4;playSound('shoot')
  const spread=rapidFire>0?(Math.random()-0.5)*2:0
  bullets.push({x:player.x+player.dir*18,y:player.y-16+spread,vx:player.dir*10,vy:spread*0.2,friendly:true,trail:[]})
  if(rapidFire>0) bullets.push({x:player.x+player.dir*18,y:player.y-14+spread,vx:player.dir*10,vy:-spread*0.2,friendly:true,trail:[]})
  particles.push({x:player.x,y:player.y-18,vx:-player.dir*(1+Math.random()*2),vy:-(2+Math.random()*2),life:20,color:'#d4a017',size:2,type:'shell'})
}
function throwGrenade(){
  if(grenades.value<=0)return
  grenades.value--;playSound('grenade')
  bullets.push({x:player.x,y:player.y-20,vx:player.dir*5,vy:-8,friendly:true,grenade:true,timer:60,spin:0})
}
function doDash(){
  if(dashCooldown>0||player.dashing>0)return
  player.dashing=12;player.dashDir=player.dir;dashCooldown=45;player.invuln=Math.max(player.invuln,12)
  playSound('dash')
  for(let i=0;i<6;i++) particles.push({x:player.x,y:player.y-10+Math.random()*20,vx:-player.dir*(2+Math.random()*3),vy:(Math.random()-0.5)*2,life:15,color:'#60a5fa',size:2+Math.random()*2,type:'spark'})
}

function addExplosion(x,y,big){
  const maxR=big?55:35;explosions.push({x,y,r:0,maxR,life:25,maxLife:25});playSound('explode')
  const count=big?10:5
  for(let i=0;i<count;i++){const a=(Math.PI*2/count)*i+Math.random()*0.5,s=2+Math.random()*(big?6:4);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:20+Math.random()*25,color:['#f97316','#ef4444','#eab308','#fb923c','#fde047'][Math.floor(Math.random()*5)],size:2+Math.random()*3,type:'spark'})}
  for(let i=0;i<3;i++) particles.push({x:x+(Math.random()-0.5)*10,y:y+(Math.random()-0.5)*10,vx:(Math.random()-0.5)*1.5,vy:-(1+Math.random()*2),life:30+Math.random()*20,color:'#6b7280',size:4+Math.random()*6,type:'smoke'})
  shake(big?8:4)
}
function addDamageText(x,y,text,color){particles.push({x,y,vx:(Math.random()-0.5)*1,vy:-2,life:30,color:color||'#fbbf24',text:String(text),type:'text'})}
function addLandDust(x){for(let i=0;i<5;i++)particles.push({x:x+(Math.random()-0.5)*10,y:GROUND+16,vx:(Math.random()-0.5)*3,vy:-(0.5+Math.random()*1.5),life:15+Math.random()*10,color:'#a8a29e',size:2+Math.random()*3,type:'smoke'})}

function handleKill(x,y,pts){
  score.value+=pts;killCount++;totalKills++;combo.value++;comboTimer=120
  if(combo.value>=3){playSound('combo');addDamageText(x,y-50,combo.value+'连杀!','#c084fc');score.value+=combo.value*5}
  if(combo.value>=5)slowMo=15
  trySpawnPickup(x,y);addExplosion(x,y)
}

// ── Main Update ──
function update(){
  gameTime++
  if(slowMo>0)slowMo--
  const dt=slowMo>0?0.5:1
  // Weather
  weatherTimer++
  if(weatherTimer>600+Math.random()*400){weatherTimer=0;weatherType=weatherType==='clear'?(Math.random()>0.5?'rain':'clear'):'clear';if(weatherType==='rain')initRain()}
  if(weatherType==='rain') rainDrops.forEach(r=>{r.y+=r.speed*dt;r.x-=1.5*dt;if(r.y>GROUND+20){r.y=-10;r.x=Math.random()*CW+scrollX}})
  // Player movement
  let moving=false
  if(player.dashing>0){player.x+=player.dashDir*8*dt;player.dashing-=dt;for(let i=0;i<2;i++)particles.push({x:player.x-player.dashDir*5,y:player.y-10+Math.random()*20,vx:-player.dashDir*(1+Math.random()*2),vy:(Math.random()-0.5),life:10,color:'rgba(96,165,250,0.5)',size:3,type:'spark'})}
  else{
    if(keys['ArrowLeft']||keys['a']){player.x-=3.5*dt;player.dir=-1;moving=true}
    if(keys['ArrowRight']||keys['d']){player.x+=3.5*dt;player.dir=1;moving=true}
  }
  if(moving)player.walkFrame+=0.2
  player.vy+=0.5*dt;player.y+=player.vy*dt
  const wasGrounded=player.grounded
  if(player.y>=GROUND){
    if(!wasGrounded&&player.vy>3){addLandDust(player.x);playSound('land')}
    player.y=GROUND;player.vy=0;player.grounded=true;jumpCount=0
  }else{player.grounded=false}
  if(player.shooting>0)player.shooting-=dt
  if(player.invuln>0)player.invuln--
  if(muzzleFlash>0)muzzleFlash--
  if(dashCooldown>0)dashCooldown-=dt
  if(rapidFire>0){rapidFire--;if(rapidFire<=0)powerUp.value=''}
  if(shieldTime>0){shieldTime--;if(shieldTime<=0)powerUp.value=''}
  if(comboTimer>0){comboTimer--;if(comboTimer<=0)combo.value=0}
  if(waveAnnounce>0)waveAnnounce--
  if(screenFlash>0)screenFlash--
  scrollX=Math.max(0,player.x-200)
  // Spawn
  spawnTimer+=dt
  const spawnRate=Math.max(40,90-wave.value*5)
  if(bosses.length===0&&spawnTimer>spawnRate+Math.random()*40){spawnTimer=0;spawnEnemy()}
  // Wave
  if(killCount>=wave.value*8){
    wave.value++;killCount=0
    if(wave.value%5===0){spawnBoss()}
    else{waveAnnounce=120;waveAnnounceText='第 '+wave.value+' 波';playSound('wave')}
    for(let i=0;i<2;i++){const bx=scrollX+CW+100+i*200+Math.random()*100;obstacles.push({x:bx,y:GROUND,w:20,h:22,hp:3,type:Math.random()>0.5?'barrel':'crate'})}
  }
  // Shake
  if(shakeTime>0){shakeTime--;shakeX=(Math.random()-0.5)*shakeTime;shakeY=(Math.random()-0.5)*shakeTime}else{shakeX=0;shakeY=0}
  // Bullets
  bullets.forEach(b=>{
    if(b.trail){b.trail.push({x:b.x,y:b.y});if(b.trail.length>5)b.trail.shift()}
    b.x+=b.vx*dt;b.y+=b.vy*dt
    if(b.grenade){b.vy+=0.3*dt;b.spin+=0.3;b.timer-=dt
      if(b.timer<=0||b.y>=GROUND){addExplosion(b.x,b.y,true);b.dead=true
        enemies.forEach(e=>{const dist=Math.hypot(e.x-b.x,e.y-b.y);if(dist<60){const dmg=Math.ceil(3*(1-dist/80));e.hp-=dmg;addDamageText(e.x,e.y-40,dmg)}})
        helicopters.forEach(h=>{const dist=Math.hypot(h.x-b.x,h.y-b.y);if(dist<70){h.hp-=3;addDamageText(h.x,h.y-20,3)}})
        bosses.forEach(bo=>{const dist=Math.hypot(bo.x-b.x,bo.y-b.y);if(dist<70){bo.hp-=3;addDamageText(bo.x,bo.y-50,3,'#f97316')}})
        obstacles.forEach(o=>{if(o.hp>0&&Math.hypot(o.x-b.x,o.y-b.y)<40){o.hp-=3;if(o.hp<=0)addExplosion(o.x,o.y)}})
      }
    }
  })
  // In-place compaction instead of filter()
  let bn=0;for(let i=0;i<bullets.length;i++){const b=bullets[i];if(!b.dead&&b.x>scrollX-50&&b.x<scrollX+CW+50&&b.y<CH+50)bullets[bn++]=b}bullets.length=bn
  // Enemy AI
  enemies.forEach(e=>{
    const dx=player.x-e.x;e.walkFrame=(e.walkFrame||0)+0.1*dt
    if(e.type==='runner')e.x+=e.speed*Math.sign(dx)*dt
    else if(e.type==='soldier'){e.x+=e.dir*0.5*dt;e.shootTimer-=dt;if(e.shootTimer<=0&&Math.abs(dx)<400){e.shootTimer=70+Math.random()*40;bullets.push({x:e.x,y:e.y-14,vx:Math.sign(dx)*5,vy:0,friendly:false,trail:[]})}}
    else if(e.type==='tank'){e.x+=e.dir*0.3*dt;e.shootTimer-=dt;if(e.shootTimer<=0&&Math.abs(dx)<500){e.shootTimer=100;bullets.push({x:e.x,y:e.y-20,vx:Math.sign(dx)*3.5,vy:-3,friendly:false,trail:[]})}}
  })
  helicopters.forEach(h=>{
    h.rotorAngle+=0.4;const dx=player.x-h.x;h.x+=Math.sign(dx)*1.2*dt;h.y+=Math.sin(gameTime*0.03)*0.3;h.shootTimer-=dt
    if(h.shootTimer<=0&&Math.abs(dx)<350){h.shootTimer=60+Math.random()*30;bullets.push({x:h.x,y:h.y+15,vx:0,vy:3,friendly:false,trail:[],bomb:true})}
  })
  // Bomb gravity (inline loop, no filter)
  for(let i=0;i<bullets.length;i++){if(bullets[i].bomb)bullets[i].vy+=0.1*dt}
  // Boss AI
  bosses.forEach(bo=>{
    const dx=player.x-bo.x;bo.walkFrame+=0.05*dt;bo.moveTimer+=dt
    // Movement
    if(!bo.charging){bo.x+=Math.sign(dx)*0.6*dt;bo.shootTimer-=dt
      if(bo.shootTimer<=0){bo.shootTimer=30+Math.random()*20
        // Triple shot
        for(let a=-1;a<=1;a++) bullets.push({x:bo.x,y:bo.y-30,vx:Math.sign(dx)*4,vy:a*2,friendly:false,trail:[]})
      }
      // Charge attack
      bo.chargeTimer+=dt
      if(bo.chargeTimer>180&&Math.abs(dx)<300){bo.charging=true;bo.chargeTimer=0;bo.dir=Math.sign(dx)}
      // Phase 2 at half HP
      if(bo.hp<bo.maxHp*0.5&&bo.phase===0){bo.phase=1;bo.shootTimer=20
        for(let i=0;i<8;i++) bullets.push({x:bo.x,y:bo.y-25,vx:Math.cos(Math.PI*2/8*i)*4,vy:Math.sin(Math.PI*2/8*i)*4,friendly:false,trail:[]})
      }
    } else {
      bo.x+=bo.dir*5*dt;bo.chargeTimer+=dt
      if(bo.chargeTimer>40){bo.charging=false;bo.chargeTimer=0}
    }
  })
  // Friendly bullets vs targets (avoid filter, use flags)
  for(let bi=0;bi<bullets.length;bi++){const b=bullets[bi];if(!b.friendly||b.grenade||b.dead)continue
    for(let ei=0;ei<enemies.length;ei++){const e=enemies[ei]
      if(e.hp>0&&Math.abs(b.x-e.x)<e.w/2+2&&Math.abs(b.y-(e.y-e.h/2))<e.h/2+2){
        e.hp--;b.dead=true;score.value+=10;playSound('hit');addDamageText(e.x,e.y-35,1)
        for(let i=0;i<2;i++)particles.push({x:b.x,y:b.y,vx:(Math.random()-0.5)*3,vy:(Math.random()-0.5)*3,life:8,color:'#fde047',size:2,type:'spark'})
        if(e.hp<=0)handleKill(e.x,e.y,30);break
      }
    }
    if(b.dead)continue
    for(let hi=0;hi<helicopters.length;hi++){const h=helicopters[hi]
      if(h.hp>0&&Math.abs(b.x-h.x)<22&&Math.abs(b.y-h.y)<15){
        h.hp--;b.dead=true;score.value+=10;playSound('hit');addDamageText(h.x,h.y-20,1)
        for(let i=0;i<2;i++)particles.push({x:b.x,y:b.y,vx:(Math.random()-0.5)*3,vy:(Math.random()-0.5)*3,life:8,color:'#fde047',size:2,type:'spark'})
        if(h.hp<=0)handleKill(h.x,h.y,50);break
      }
    }
    if(b.dead)continue
    for(let boi=0;boi<bosses.length;boi++){const bo=bosses[boi]
      if(bo.hp>0&&Math.abs(b.x-bo.x)<bo.w/2+4&&Math.abs(b.y-(bo.y-bo.h/2))<bo.h/2+4){
        bo.hp--;b.dead=true;score.value+=5;playSound('hit');addDamageText(b.x,b.y-10,1,'#f97316')
        particles.push({x:b.x,y:b.y,vx:(Math.random()-0.5)*3,vy:(Math.random()-0.5)*3,life:8,color:'#fde047',size:2,type:'spark'})
        if(bo.hp<=0){handleKill(bo.x,bo.y,200);flashScreen('#fde047',12);slowMo=30
          for(let i=0;i<3;i++) pickups.push({x:bo.x+(Math.random()-0.5)*40,y:bo.y-10,vy:-3-Math.random()*3,type:['health','grenade','rapid','shield','coin'][Math.floor(Math.random()*5)],life:500,bob:Math.random()*Math.PI*2})
        };break
      }
    }
    if(b.dead)continue
    for(let oi=0;oi<obstacles.length;oi++){const o=obstacles[oi]
      if(o.hp>0&&Math.abs(b.x-o.x)<o.w/2+2&&Math.abs(b.y-(o.y-o.h/2))<o.h/2+2){
        o.hp--;b.dead=true;playSound('hit')
        for(let i=0;i<2;i++)particles.push({x:b.x,y:b.y,vx:(Math.random()-0.5)*3,vy:(Math.random()-0.5)*3,life:8,color:o.type==='barrel'?'#92400e':'#a16207',size:2,type:'spark'})
        if(o.hp<=0){addExplosion(o.x,o.y);trySpawnPickup(o.x,o.y)};break
      }
    }
  }
  // In-place compaction for all entity arrays
  let en=0;for(let i=0;i<enemies.length;i++){const e=enemies[i];if(e.hp>0&&e.x>scrollX-100)enemies[en++]=e}enemies.length=en
  let hn=0;for(let i=0;i<helicopters.length;i++){const h=helicopters[i];if(h.hp>0&&h.x>scrollX-200&&h.x<scrollX+CW+200)helicopters[hn++]=h}helicopters.length=hn
  let bon=0;for(let i=0;i<bosses.length;i++){if(bosses[i].hp>0)bosses[bon++]=bosses[i]}bosses.length=bon
  let on=0;for(let i=0;i<obstacles.length;i++){if(obstacles[i].hp>0)obstacles[on++]=obstacles[i]}obstacles.length=on
  // Damage player
  const dmgPlayer=()=>{
    if(player.dashing>0)return // i-frames during dash
    if(shieldTime>0){shieldTime=0;powerUp.value='';addDamageText(player.x,player.y-40,'护盾吸收!','#38bdf8');shake(4);return}
    lives.value--;player.invuln=60;shake(10);flashScreen('#ef4444',8);playSound('death');addExplosion(player.x,player.y)
    if(lives.value<=0){running.value=false;if(score.value>highScore)highScore=score.value}
  }
  if(player.invuln<=0){
    for(let i=0;i<bullets.length;i++){const b=bullets[i];if(!b.friendly&&!b.dead&&Math.abs(b.x-player.x)<15&&Math.abs(b.y-(player.y-16))<20){b.dead=true;dmgPlayer();break}}
    enemies.forEach(e=>{if(e.hp>0&&Math.abs(e.x-player.x)<20&&Math.abs(e.y-player.y)<30){e.hp=0;dmgPlayer();addExplosion(e.x,e.y)}})
    bosses.forEach(bo=>{if(bo.hp>0&&Math.abs(bo.x-player.x)<35&&Math.abs(bo.y-player.y)<40){dmgPlayer()}})
  }
  // Pickups
  pickups.forEach(p=>{
    p.vy+=0.15;p.y+=p.vy;p.bob+=0.08;p.life--
    if(p.y>=GROUND+5){p.y=GROUND+5;p.vy=0}
    if(Math.abs(p.x-player.x)<22&&Math.abs(p.y-player.y)<30){
      p.dead=true;playSound('pickup')
      switch(p.type){
        case'health':lives.value=Math.min(maxLives,lives.value+1);addDamageText(p.x,p.y-10,'+1 HP','#22c55e');break
        case'ammo':score.value+=50;addDamageText(p.x,p.y-10,'+50','#fbbf24');break
        case'grenade':grenades.value=Math.min(9,grenades.value+2);addDamageText(p.x,p.y-10,'+2💣','#4ade80');break
        case'coin':score.value+=100;addDamageText(p.x,p.y-10,'+100','#fde047');break
        case'shield':shieldTime=300;powerUp.value='🛡️ 护盾';addDamageText(p.x,p.y-10,'护盾!','#38bdf8');break
        case'rapid':rapidFire=300;powerUp.value='🔥 连射';addDamageText(p.x,p.y-10,'连射!','#f97316');break
      }
    }
  })
  let pn=0;for(let i=0;i<pickups.length;i++){const p=pickups[i];if(!p.dead&&p.life>0)pickups[pn++]=p}pickups.length=pn
  // Particles
  particles.forEach(p=>{
    if(p.type==='smoke'){p.x+=p.vx;p.y+=p.vy;p.size+=0.3;p.life--}
    else if(p.type==='text'){p.x+=p.vx;p.y+=p.vy;p.life--}
    else{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=0.15;p.life--}
  })
  let ptn=0;for(let i=0;i<particles.length;i++){if(particles[i].life>0)particles[ptn++]=particles[i]}particles.length=ptn
  let exn=0;for(let i=0;i<explosions.length;i++){const e=explosions[i];e.r+=2.5;e.life--;if(e.life>0)explosions[exn++]=e}explosions.length=exn
  clouds.forEach(c=>{c.x-=c.speed;if(c.x+c.w<scrollX-100)c.x=scrollX+CW+100})
  dustMotes.forEach(d=>{d.x+=d.vx;d.y+=d.vy+Math.sin(gameTime*0.02+d.x*0.01)*0.1;d.life--;if(d.life<=0||d.x>CW+10){d.x=scrollX-10;d.y=GROUND-10+Math.random()*30;d.life=100+Math.random()*200}})
}

// ── Drawing ──
function drawCloud(ctx,x,y,w,opacity){
  ctx.globalAlpha=opacity;ctx.fillStyle='#94a3b8'
  ctx.beginPath();ctx.ellipse(x,y,w*0.5,w*0.16,0,0,Math.PI*2);ctx.fill()
  ctx.beginPath();ctx.ellipse(x-w*0.25,y+w*0.04,w*0.3,w*0.12,0,0,Math.PI*2);ctx.fill()
  ctx.beginPath();ctx.ellipse(x+w*0.25,y+w*0.02,w*0.35,w*0.14,0,0,Math.PI*2);ctx.fill()
  ctx.globalAlpha=1
}
function drawPlayer(ctx,ox){
  const px=player.x+ox,py=player.y
  if(player.invuln>0&&Math.floor(player.invuln/4)%2)return
  const bob=player.grounded?Math.sin(player.walkFrame)*2:0
  // Dash trail
  if(player.dashing>0){ctx.globalAlpha=0.3;ctx.fillStyle='#60a5fa';ctx.fillRect(px-player.dashDir*15-8,py-32,16,32);ctx.globalAlpha=1}
  if(shieldTime>0){ctx.globalAlpha=0.15+Math.sin(gameTime*0.1)*0.1;ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(px,py-16,24,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(px,GROUND+22,14,4,0,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#4a3728';const legOff=player.grounded?Math.sin(player.walkFrame)*4:3
  ctx.fillRect(px-8,py-6+bob,7,8);ctx.fillRect(px+1,py-6+bob-legOff*0.3,7,8)
  ctx.fillStyle='#2563eb';ctx.fillRect(px-7,py-14+bob,6,10);ctx.fillRect(px+1,py-14+bob,6,10)
  ctx.fillStyle='#3b82f6';ctx.fillRect(px-10,py-28+bob,20,16)
  ctx.fillStyle='#1d4ed8';ctx.fillRect(px-10,py-20+bob,20,8)
  ctx.fillStyle='#78350f';ctx.fillRect(px-10,py-14+bob,20,3)
  ctx.fillStyle='#d4a017';ctx.fillRect(px-2,py-14+bob,4,3)
  ctx.fillStyle='#60a5fa';const gunY=py-20+bob
  ctx.fillRect(px+player.dir*4,gunY,player.dir*6,4)
  ctx.fillStyle='#374151';ctx.fillRect(px+player.dir*8,gunY-1,player.dir*14,5)
  ctx.fillStyle='#1f2937';ctx.fillRect(px+player.dir*18,gunY,player.dir*4,3)
  if(rapidFire>0){ctx.fillStyle='#f97316';ctx.fillRect(px+player.dir*8,gunY+4,player.dir*10,2)}
  if(muzzleFlash>0){const mx=px+player.dir*24,my=gunY+1;ctx.globalAlpha=muzzleFlash/4;ctx.fillStyle='#fde047';ctx.beginPath();ctx.arc(mx,my,10,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  ctx.fillStyle='#fcd34d';ctx.beginPath();ctx.arc(px,py-34+bob,7,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#1e40af';ctx.beginPath();ctx.arc(px,py-36+bob,8,Math.PI,0);ctx.fill();ctx.fillRect(px-9,py-36+bob,18,3)
  ctx.fillStyle='#1e293b';ctx.fillRect(px+player.dir*2-1,py-35+bob,2,2)
}
function drawEnemy(ctx,e,ox){
  const ex=e.x+ox,ey=e.y,bob=Math.sin(e.walkFrame||0)*1.5
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(ex,GROUND+22,e.type==='tank'?20:12,3,0,0,Math.PI*2);ctx.fill()
  if(e.type==='soldier'){
    ctx.fillStyle='#3f3f46';ctx.fillRect(ex-7,ey-6+bob,6,7);ctx.fillRect(ex+1,ey-6+bob,6,7)
    ctx.fillStyle='#dc2626';ctx.fillRect(ex-9,ey-26+bob,18,10)
    ctx.fillStyle='#991b1b';ctx.fillRect(ex-9,ey-16+bob,18,8)
    ctx.fillStyle='#fca5a5';ctx.beginPath();ctx.arc(ex,ey-30+bob,6,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#7f1d1d';ctx.beginPath();ctx.arc(ex,ey-33+bob,7,Math.PI,0);ctx.fill()
    ctx.fillStyle='#52525b';ctx.fillRect(ex+(player.x>e.x?6:-16),ey-18+bob,12,3)
  }else if(e.type==='tank'){
    ctx.fillStyle='#374151';ctx.fillRect(ex-22,ey-4,44,10);ctx.fillStyle='#4b5563';for(let i=-18;i<20;i+=8)ctx.fillRect(ex+i,ey-2,5,6)
    ctx.fillStyle='#6b7280';ctx.fillRect(ex-18,ey-4,36,10)
    ctx.fillStyle='#4b5563'
    ctx.beginPath();ctx.moveTo(ex-18,ey-4);ctx.lineTo(ex-14,ey-20);ctx.lineTo(ex+14,ey-20);ctx.lineTo(ex+18,ey-4);ctx.fill()
    ctx.fillStyle='#6b7280';ctx.fillRect(ex-10,ey-30,20,12);ctx.fillStyle='#9ca3af';ctx.beginPath();ctx.arc(ex,ey-28,7,0,Math.PI*2);ctx.fill()
    const cdir=player.x>e.x?1:-1;ctx.fillStyle='#4b5563';ctx.fillRect(ex+cdir*8,ey-28,cdir*18,4)
    ctx.fillStyle='#ef4444';ctx.font='8px sans-serif';ctx.fillText('★',ex-4,ey-10)
  }else{
    ctx.fillStyle='#ea580c';ctx.fillRect(ex-8,ey-22+bob,16,16);ctx.fillStyle='#fdba74';ctx.beginPath();ctx.arc(ex,ey-26+bob,5,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#ef4444';ctx.fillRect(ex-1,ey-27+bob,2,2);ctx.fillStyle='#ea580c';ctx.fillRect(ex+(player.x>e.x?8:-14),ey-18+bob,8,3)
  }
  if(e.hp>0&&e.maxHp>1){const bw=26;ctx.fillStyle='#1f2937';ctx.fillRect(ex-bw/2-1,ey-42,bw+2,5);ctx.fillStyle='#ef4444';ctx.fillRect(ex-bw/2,ey-41,bw,3);const r=e.hp/e.maxHp;ctx.fillStyle=r>0.5?'#22c55e':r>0.25?'#eab308':'#ef4444';ctx.fillRect(ex-bw/2,ey-41,bw*r,3)}
}
function drawHelicopter(ctx,h,ox){
  const hx=h.x+ox,hy=h.y
  ctx.fillStyle='rgba(0,0,0,0.15)';ctx.beginPath();ctx.ellipse(hx,GROUND+22,18,3,0,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#4b5563'
  ctx.beginPath();ctx.ellipse(hx,hy,20,10,0,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='rgba(56,189,248,0.4)';ctx.beginPath();ctx.ellipse(hx+(player.x>h.x?12:-12),hy-2,7,6,0,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#374151';ctx.fillRect(hx+(player.x>h.x?-30:15),hy-3,18,5);ctx.fillRect(hx+(player.x>h.x?-33:28),hy-8,5,12)
  ctx.strokeStyle='#9ca3af';ctx.lineWidth=2;const rL=28
  ctx.beginPath();ctx.moveTo(hx+Math.cos(h.rotorAngle)*rL,hy-12+Math.sin(h.rotorAngle)*2);ctx.lineTo(hx-Math.cos(h.rotorAngle)*rL,hy-12-Math.sin(h.rotorAngle)*2);ctx.stroke()
  ctx.beginPath();ctx.moveTo(hx+Math.cos(h.rotorAngle+Math.PI/2)*rL,hy-12+Math.sin(h.rotorAngle+Math.PI/2)*2);ctx.lineTo(hx-Math.cos(h.rotorAngle+Math.PI/2)*rL,hy-12-Math.sin(h.rotorAngle+Math.PI/2)*2);ctx.stroke()
  ctx.lineWidth=1;ctx.fillStyle='#6b7280';ctx.beginPath();ctx.arc(hx,hy-12,3,0,Math.PI*2);ctx.fill()
  const bw=30;ctx.fillStyle='#1f2937';ctx.fillRect(hx-bw/2-1,hy-22,bw+2,5);const r=h.hp/h.maxHp;ctx.fillStyle=r>0.5?'#22c55e':r>0.25?'#eab308':'#ef4444';ctx.fillRect(hx-bw/2,hy-21,bw*r,3)
}
function drawBoss(ctx,bo,ox){
  const bx=bo.x+ox,by=bo.y,bob=Math.sin(bo.walkFrame)*2
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(bx,GROUND+22,35,6,0,0,Math.PI*2);ctx.fill()
  // Legs
  ctx.fillStyle='#1f2937'
  ctx.fillRect(bx-20,by-8+bob,12,14);ctx.fillRect(bx+8,by-8+bob,12,14)
  // Body
  ctx.fillStyle='#991b1b';ctx.fillRect(bx-28,by-42+bob,56,18)
  ctx.fillStyle='#7f1d1d';ctx.fillRect(bx-28,by-24+bob,56,18)
  // Armor plates
  ctx.fillStyle='#374151';ctx.fillRect(bx-25,by-35+bob,50,4);ctx.fillRect(bx-25,by-20+bob,50,4)
  // Shoulder cannons
  ctx.fillStyle='#4b5563'
  ctx.fillRect(bx-32,by-38+bob,10,8);ctx.fillRect(bx+22,by-38+bob,10,8)
  const pdir=player.x>bo.x?1:-1
  ctx.fillStyle='#1f2937';ctx.fillRect(bx+pdir*28,by-36+bob,pdir*14,4);ctx.fillRect(bx-pdir*28-(pdir>0?0:14),by-36+bob,14,4)
  // Head
  ctx.fillStyle='#b91c1c';ctx.beginPath();ctx.arc(bx,by-48+bob,12,0,Math.PI*2);ctx.fill()
  // Visor
  ctx.fillStyle='#fbbf24';ctx.fillRect(bx-8,by-52+bob,16,5)
  ctx.fillStyle='#ef4444';ctx.fillRect(bx-6,by-51+bob,12,3)
  // Phase 2 rage glow
  if(bo.phase>=1){
    ctx.globalAlpha=0.15+Math.sin(gameTime*0.15)*0.08
    ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(bx,by-25,40,0,Math.PI*2);ctx.fill()
    ctx.globalAlpha=1
  }
  // Charge indicator
  if(bo.charging){
    ctx.strokeStyle='#fbbf24';ctx.lineWidth=2;ctx.setLineDash([4,4])
    ctx.beginPath();ctx.moveTo(bx,by-25);ctx.lineTo(bx+bo.dir*80,by-25);ctx.stroke()
    ctx.setLineDash([]);ctx.lineWidth=1
  }
  // HP bar (big)
  const hpW=80;ctx.fillStyle='#1f2937';ctx.fillRect(bx-hpW/2-1,by-62,hpW+2,7)
  ctx.fillStyle='#7f1d1d';ctx.fillRect(bx-hpW/2,by-61,hpW,5)
  const hpR=bo.hp/bo.maxHp
  ctx.fillStyle=hpR>0.5?'#ef4444':hpR>0.25?'#f97316':'#fbbf24'
  ctx.fillRect(bx-hpW/2,by-61,hpW*hpR,5)
  ctx.fillStyle='#fff';ctx.font='bold 7px monospace';ctx.textAlign='center'
  ctx.fillText('BOSS',bx,by-55);ctx.textAlign='start'
}
function drawPickup(ctx,p,ox){
  const px=p.x+ox,py=p.y+Math.sin(p.bob)*3
  const alpha=p.life<60?p.life/60:1
  const c=PICKUP_COLORS[p.type]||'#fff'
  ctx.globalAlpha=alpha*0.3;ctx.fillStyle=c;ctx.beginPath();ctx.arc(px,py,10,0,Math.PI*2);ctx.fill()
  ctx.globalAlpha=alpha;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px-8,py-8,16,16);ctx.strokeStyle=c;ctx.lineWidth=1;ctx.strokeRect(px-8,py-8,16,16)
  ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillStyle=c;ctx.fillText(PICKUP_ICONS[p.type]||'?',px,py+4);ctx.textAlign='start';ctx.globalAlpha=1;ctx.lineWidth=1
}
function drawObstacle(ctx,o,ox){
  const oxp=o.x+ox,oy=o.y
  if(o.type==='barrel'){
    ctx.fillStyle='#78350f';ctx.fillRect(oxp-10,oy-22,20,22)
    ctx.fillStyle='#92400e';ctx.fillRect(oxp-8,oy-20,16,8)
    ctx.fillStyle='#ef4444';ctx.font='8px sans-serif';ctx.textAlign='center';ctx.fillText('⚠',oxp,oy-10);ctx.textAlign='start'
  }else{
    ctx.fillStyle='#a16207';ctx.fillRect(oxp-10,oy-20,20,20)
    ctx.fillStyle='#713f12';ctx.fillRect(oxp-10,oy-10,20,10)
  }
  if(o.hp<3){ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(oxp-3,oy-15);ctx.lineTo(oxp+2,oy-10);ctx.lineTo(oxp-1,oy-5);ctx.stroke()}
}
function drawDecoration(ctx,d,ox){
  const dx=d.x+ox,dy=GROUND+18
  if(d.type==='tree'){
    ctx.fillStyle='#5c4033';ctx.fillRect(dx-3,dy-d.h,6,d.h)
    ctx.fillStyle='#166534';ctx.beginPath();ctx.moveTo(dx-14,dy-d.h+5);ctx.lineTo(dx,dy-d.h-18);ctx.lineTo(dx+14,dy-d.h+5);ctx.fill()
    ctx.fillStyle='#15803d';ctx.beginPath();ctx.moveTo(dx-11,dy-d.h-5);ctx.lineTo(dx,dy-d.h-22);ctx.lineTo(dx+11,dy-d.h-5);ctx.fill()
  }else if(d.type==='lamp'){
    ctx.fillStyle='#6b7280';ctx.fillRect(dx-2,dy-d.h-10,4,d.h+10)
    ctx.fillStyle='#fbbf24';ctx.globalAlpha=0.6+Math.sin(gameTime*0.05)*0.2
    ctx.beginPath();ctx.arc(dx,dy-d.h-12,5,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='rgba(251,191,36,0.1)';ctx.beginPath();ctx.arc(dx,dy-d.h-12,20,0,Math.PI*2);ctx.fill()
    ctx.globalAlpha=1
  }else if(d.type==='rock'){
    ctx.fillStyle='#4b5563';ctx.beginPath();ctx.ellipse(dx,dy-4,10,6,0,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#6b7280';ctx.beginPath();ctx.ellipse(dx+2,dy-5,7,4,0.2,0,Math.PI*2);ctx.fill()
  }else{
    ctx.fillStyle='#78350f';ctx.fillRect(dx-2,dy-18,4,18);ctx.fillStyle='#a16207';ctx.fillRect(dx-8,dy-22,16,8)
    ctx.fillStyle='#fbbf24';ctx.font='6px sans-serif';ctx.textAlign='center';ctx.fillText('!',dx,dy-16);ctx.textAlign='start'
  }
}
function drawMinimap(ctx){
  const mmW=100,mmH=20,mmX=CW-mmW-8,mmY=8
  const worldW=Math.max(scrollX+CW+200,2000)
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(mmX-1,mmY-1,mmW+2,mmH+2)
  ctx.fillStyle='rgba(30,41,59,0.8)';ctx.fillRect(mmX,mmY,mmW,mmH)
  ctx.fillStyle='#3b82f6';ctx.fillRect(mmX+(player.x/worldW)*mmW-1,mmY+mmH/2-2,3,4)
  enemies.forEach(e=>{ctx.fillStyle='#ef4444';ctx.fillRect(mmX+(e.x/worldW)*mmW,mmY+mmH/2-1,2,2)})
  helicopters.forEach(h=>{ctx.fillStyle='#f97316';ctx.fillRect(mmX+(h.x/worldW)*mmW,mmY+4,2,2)})
  bosses.forEach(bo=>{ctx.fillStyle='#fbbf24';ctx.fillRect(mmX+(bo.x/worldW)*mmW-2,mmY+mmH/2-3,5,6)})
  pickups.forEach(p=>{ctx.fillStyle='#22c55e';ctx.fillRect(mmX+(p.x/worldW)*mmW,mmY+mmH/2,2,2)})
  const vx1=mmX+(scrollX/worldW)*mmW,vx2=mmX+((scrollX+CW)/worldW)*mmW
  ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;ctx.strokeRect(vx1,mmY,vx2-vx1,mmH)
}
// HUD bars
function drawHUD(ctx){
  // Health bar
  const hbX=8,hbY=CH-22,hbW=80,hbH=8
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(hbX-1,hbY-1,hbW+2,hbH+2)
  ctx.fillStyle='#7f1d1d';ctx.fillRect(hbX,hbY,hbW,hbH)
  const hpR=lives.value/maxLives;ctx.fillStyle=hpR>0.5?'#ef4444':'#fbbf24';ctx.fillRect(hbX,hbY,hbW*hpR,hbH)
  ctx.fillStyle='#fff';ctx.font='bold 7px monospace';ctx.fillText('HP',hbX+2,hbY+7)
  // Grenade bar
  const gbX=hbX+hbW+8;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(gbX-1,hbY-1,42,hbH+2)
  ctx.fillStyle='#365314';ctx.fillRect(gbX,hbY,40,hbH)
  ctx.fillStyle='#4ade80';ctx.fillRect(gbX,hbY,40*(grenades.value/9),hbH)
  ctx.fillStyle='#fff';ctx.fillText('💣',gbX+2,hbY+7)
  // Dash cooldown
  if(dashCooldown>0){
    const dcX=gbX+48;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(dcX-1,hbY-1,32,hbH+2)
    ctx.fillStyle='#1e3a5f';ctx.fillRect(dcX,hbY,30,hbH);ctx.fillStyle='#38bdf8';ctx.fillRect(dcX,hbY,30*(1-dashCooldown/45),hbH)
    ctx.fillStyle='#fff';ctx.font='bold 6px monospace';ctx.fillText('冲刺',dcX+2,hbY+6)
  }
  // Power-up timer
  if(rapidFire>0||shieldTime>0){
    const t=rapidFire>0?rapidFire:shieldTime,mx=300;const ptX=CW/2-30,ptY=CH-22
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(ptX-1,ptY-1,62,hbH+2)
    ctx.fillStyle=rapidFire>0?'#7c2d12':'#0c4a6e';ctx.fillRect(ptX,ptY,60,hbH)
    ctx.fillStyle=rapidFire>0?'#f97316':'#38bdf8';ctx.fillRect(ptX,ptY,60*(t/mx),hbH)
    ctx.fillStyle='#fff';ctx.font='bold 6px monospace';ctx.fillText(rapidFire>0?'连射':'护盾',ptX+2,ptY+6)
  }
}

// ── Main Draw ──
function draw(){
  const ctx=canvas.value?.getContext('2d');if(!ctx)return
  ctx.save();ctx.translate(shakeX,shakeY)
  // Cache sky & ground gradients (only recreate on weather change)
  if(cachedWeather!==weatherType){
    cachedWeather=weatherType
    cachedSkyGrad=ctx.createLinearGradient(0,0,0,GROUND)
    if(weatherType==='rain'){cachedSkyGrad.addColorStop(0,'#0f172a');cachedSkyGrad.addColorStop(0.5,'#1e293b');cachedSkyGrad.addColorStop(1,'#334155')}
    else{cachedSkyGrad.addColorStop(0,'#020617');cachedSkyGrad.addColorStop(0.3,'#0c1e3a');cachedSkyGrad.addColorStop(0.7,'#1a2744');cachedSkyGrad.addColorStop(1,'#1e3a2f')}
    cachedGroundGrad=ctx.createLinearGradient(0,GROUND+18,0,CH);cachedGroundGrad.addColorStop(0,weatherType==='rain'?'#374151':'#4d7c0f');cachedGroundGrad.addColorStop(0.3,'#365314');cachedGroundGrad.addColorStop(1,'#1a2e05')
  }
  ctx.fillStyle=cachedSkyGrad;ctx.fillRect(0,0,CW,CH)
  stars.forEach(s=>{const sx=((s.x-scrollX*0.05)%(CW+100)+CW+100)%(CW+100);const tw=0.3+0.7*Math.abs(Math.sin(gameTime*0.03+s.twinkle));ctx.globalAlpha=tw*(weatherType==='rain'?0.15:0.6);ctx.fillRect(sx,s.y,s.s,s.s)});ctx.globalAlpha=1
  const moonX=((450-scrollX*0.02)%CW+CW)%CW
  ctx.globalAlpha=weatherType==='rain'?0.3:1
  // Simplified moon (no gradient)
  ctx.globalAlpha=weatherType==='rain'?0.3:1
  ctx.fillStyle='rgba(253,224,71,0.15)';ctx.beginPath();ctx.arc(moonX,50,22,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#fde047';ctx.beginPath();ctx.arc(moonX,50,14,0,Math.PI*2);ctx.fill()
  ctx.globalAlpha=1
  mountains.forEach(m=>{const mx=((m.x-scrollX*0.15)%(CW*2.5)+CW*2.5)%(CW*2.5)-200;ctx.fillStyle=m.color;ctx.beginPath();ctx.moveTo(mx-m.w/2,GROUND+20);ctx.lineTo(mx,GROUND+20-m.h);ctx.lineTo(mx+m.w/2,GROUND+20);ctx.fill();ctx.fillStyle='rgba(226,232,240,0.3)';ctx.beginPath();ctx.moveTo(mx-m.w*0.1,GROUND+20-m.h+m.h*0.15);ctx.lineTo(mx,GROUND+20-m.h);ctx.lineTo(mx+m.w*0.1,GROUND+20-m.h+m.h*0.15);ctx.fill()})
  buildings.forEach(b=>{const bx=((b.x-scrollX*0.3)%(CW*3)+CW*3)%(CW*3)-100;ctx.fillStyle=b.color;ctx.fillRect(bx,GROUND+20-b.h,b.w,b.h);const wTime=Math.floor(gameTime/200);for(let wy=0;wy<b.windows;wy++)for(let wx=0;wx<2;wx++){ctx.fillStyle=((b.winSeed+wy*13+wx*17+wTime)%5)>1?'rgba(253,224,71,0.4)':'rgba(59,130,246,0.15)';ctx.fillRect(bx+4+wx*(b.w/2),GROUND+24-b.h+wy*14+4,b.w/3-4,8)}})
  clouds.forEach(c=>{const cx=((c.x-scrollX*0.1)%(CW*3)+CW*3)%(CW*3)-200;drawCloud(ctx,cx,c.y,c.w,c.opacity*(weatherType==='rain'?2:1))})
  ctx.fillStyle=cachedGroundGrad;ctx.fillRect(0,GROUND+18,CW,CH-GROUND)
  ctx.fillStyle=weatherType==='rain'?'#4b5563':'#65a30d';const gox=-(scrollX%16)
  for(let i=-1;i<CW/8+2;i++){const gx=gox+i*8;ctx.fillRect(gx,GROUND+16,5,4);if(i%3===0)ctx.fillRect(gx+2,GROUND+13,2,5)}
  ctx.fillStyle='#3f6212';for(let i=-1;i<CW/12+2;i++)ctx.fillRect(gox+i*12+4,GROUND+20,8,3)
  // Decorations (behind entities)
  decorations.forEach(d=>drawDecoration(ctx,d,-scrollX))
  // Rain
  if(weatherType==='rain'){ctx.strokeStyle='rgba(148,163,184,0.3)';ctx.lineWidth=1;rainDrops.forEach(r=>{const rx=((r.x-scrollX*0.8)%CW+CW)%CW;ctx.beginPath();ctx.moveTo(rx,r.y);ctx.lineTo(rx-2,r.y+r.len);ctx.stroke()})}
  // Dust
  if(weatherType!=='rain')dustMotes.forEach(d=>{const dx=((d.x-scrollX*0.5)%CW+CW)%CW;ctx.globalAlpha=d.opacity*Math.min(1,d.life/30);ctx.fillStyle='#a8a29e';ctx.beginPath();ctx.arc(dx,d.y,d.size,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1
  const ox=-scrollX
  obstacles.forEach(o=>drawObstacle(ctx,o,ox));pickups.forEach(p=>drawPickup(ctx,p,ox));enemies.forEach(e=>drawEnemy(ctx,e,ox));helicopters.forEach(h=>drawHelicopter(ctx,h,ox));bosses.forEach(bo=>drawBoss(ctx,bo,ox))
  drawPlayer(ctx,ox)
  // Bullets
  bullets.forEach(b=>{
    const bx=b.x+ox,by=b.y
    if(b.grenade){ctx.save();ctx.translate(bx,by);ctx.rotate(b.spin||0);ctx.fillStyle='#365314';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#65a30d';ctx.fillRect(-1,-8,2,4);ctx.restore()}
    else if(b.bomb){ctx.fillStyle='#1f2937';ctx.beginPath();ctx.arc(bx,by,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(bx,by-5,2,0,Math.PI*2);ctx.fill()}
    else{
      if(b.trail&&b.trail.length>1){ctx.strokeStyle=b.friendly?'rgba(251,191,36,0.3)':'rgba(239,68,68,0.3)';ctx.lineWidth=2;ctx.beginPath();b.trail.forEach((t,i)=>{i===0?ctx.moveTo(t.x+ox,t.y):ctx.lineTo(t.x+ox,t.y)});ctx.lineTo(bx,by);ctx.stroke()}
      // Simplified bullet (no gradient glow)
      ctx.fillStyle=b.friendly?'rgba(251,191,36,0.4)':'rgba(239,68,68,0.4)';ctx.fillRect(bx-5,by-3,10,6)
      ctx.fillStyle=b.friendly?'#fde047':'#fca5a5';ctx.fillRect(bx-4,by-1.5,8,3)
    }
  })
  explosions.forEach(e=>{ctx.globalAlpha=e.life/e.maxLife*0.8;ctx.fillStyle='#f97316';ctx.beginPath();ctx.arc(e.x+ox,e.y,e.r,0,Math.PI*2);ctx.fill();if(e.life>e.maxLife*0.7){ctx.fillStyle='#fde047';ctx.beginPath();ctx.arc(e.x+ox,e.y,e.r*0.4,0,Math.PI*2);ctx.fill()};ctx.globalAlpha=1})
  particles.forEach(p=>{const ppx=p.x+ox;if(p.type==='text'){ctx.globalAlpha=Math.min(1,p.life/15);ctx.fillStyle=p.color;ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(p.text,ppx,p.y);ctx.textAlign='start'}else if(p.type==='smoke'){ctx.globalAlpha=(p.life/50)*0.4;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(ppx,p.y,p.size,0,Math.PI*2);ctx.fill()}else{ctx.globalAlpha=Math.min(1,p.life/20);ctx.fillStyle=p.color;if(p.type==='shell')ctx.fillRect(ppx-1,p.y-1,p.size,p.size);else{ctx.beginPath();ctx.arc(ppx,p.y,p.size||2,0,Math.PI*2);ctx.fill()}}});ctx.globalAlpha=1
  // Vignette
  // Cached vignette
  if(!cachedVigGrad){cachedVigGrad=ctx.createRadialGradient(CW/2,CH/2,CW*0.3,CW/2,CH/2,CW*0.7);cachedVigGrad.addColorStop(0,'transparent');cachedVigGrad.addColorStop(1,'rgba(0,0,0,0.3)')}
  ctx.fillStyle=cachedVigGrad;ctx.fillRect(0,0,CW,CH)
  // Screen flash
  if(screenFlash>0){ctx.globalAlpha=screenFlash/12*0.3;ctx.fillStyle=screenFlashColor;ctx.fillRect(0,0,CW,CH);ctx.globalAlpha=1}
  if(slowMo>0){ctx.globalAlpha=0.08;ctx.fillStyle='#c084fc';ctx.fillRect(0,0,CW,CH);ctx.globalAlpha=1}
  // Wave announce
  if(waveAnnounce>0){const a=waveAnnounce>120?(150-waveAnnounce)/30:waveAnnounce>30?1:waveAnnounce/30;ctx.globalAlpha=a;ctx.fillStyle=waveAnnounceText.includes('BOSS')?'#ef4444':'#fbbf24';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText(waveAnnounceText,CW/2,CH/2-40);if(waveAnnounceText.includes('BOSS')){ctx.fillStyle='#fbbf24';ctx.font='14px sans-serif';ctx.fillText('准备战斗!',CW/2,CH/2-15)}else{ctx.fillStyle='#ef4444';ctx.font='14px sans-serif';ctx.fillText('敌人变得更强了!',CW/2,CH/2-15)};ctx.textAlign='start';ctx.globalAlpha=1}
  // Combo
  if(combo.value>=2){ctx.fillStyle='#c084fc';ctx.font='bold 14px monospace';ctx.textAlign='left';ctx.fillText('COMBO x'+combo.value,10,24);ctx.fillStyle='#7c3aed';ctx.fillRect(10,28,60*(comboTimer/120),3);ctx.textAlign='start'}
  // Kill counter
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='10px monospace';ctx.fillText('击杀: '+totalKills,10,CH-28)
  drawMinimap(ctx);drawHUD(ctx)
  // Game Over
  if(lives.value<=0){
    ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(0,0,CW,CH);ctx.textAlign='center'
    ctx.fillStyle='#ef4444';ctx.font='bold 36px sans-serif';ctx.fillText('GAME OVER',CW/2,CH/2-30)
    ctx.fillStyle='#fbbf24';ctx.font='18px sans-serif';ctx.fillText('得分: '+score.value+' | 波次: '+wave.value+' | 击杀: '+totalKills,CW/2,CH/2+5)
    if(highScore>0){ctx.fillStyle='#fde047';ctx.font='14px sans-serif';ctx.fillText('最高分: '+highScore,CW/2,CH/2+28)}
    ctx.fillStyle='#94a3b8';ctx.font='14px sans-serif';ctx.fillText('点击「重新开始」再来一局',CW/2,CH/2+52);ctx.textAlign='start'
  }
  if(!running.value&&lives.value>0&&score.value===0){
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(0,0,CW,CH);ctx.textAlign='center'
    ctx.fillStyle='#e2e8f0';ctx.font='bold 22px sans-serif';ctx.fillText('🔫 合金弹头',CW/2,CH/2-30)
    ctx.fillStyle='#94a3b8';ctx.font='14px sans-serif';ctx.fillText('点击「开始」按钮开始游戏',CW/2,CH/2+5)
    ctx.fillStyle='#64748b';ctx.font='11px sans-serif'
    ctx.fillText('击败敌人 · 拾取补给 · 连杀得分 · 每5波Boss',CW/2,CH/2+28)
    ctx.fillText('↑二段跳 · Shift冲刺闪避',CW/2,CH/2+44)
    ctx.textAlign='start'
  }
  ctx.restore()
}

let lastTime=0
function gameLoop(time){
  if(!running.value)return;animFrame=requestAnimationFrame(gameLoop)
  if(!lastTime)lastTime=time
  const elapsed=time-lastTime
  if(elapsed<15)return // ~60fps cap (16ms, using 15 for tolerance)
  lastTime=time;update();draw()
}
function onKey(e){
  keys[e.key]=true
  if(e.key===' '){e.preventDefault();shoot()}
  if(e.key==='g'||e.key==='G')throwGrenade()
  if(e.key==='Shift'){e.preventDefault();doDash()}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault()
  if(!e.repeat&&(e.key==='ArrowUp'||e.key==='w')){
    if(player.grounded&&jumpCount===0){player.vy=-11;player.grounded=false;jumpCount=1;playSound('jump')}
    else if(!player.grounded&&jumpCount<2){player.vy=-9;jumpCount++;playSound('jump');for(let i=0;i<4;i++)particles.push({x:player.x+(Math.random()-0.5)*10,y:player.y,vx:(Math.random()-0.5)*2,vy:1+Math.random(),life:10,color:'#60a5fa',size:2,type:'spark'})}
  }
}
function onKeyUp(e){keys[e.key]=false}
onMounted(()=>{reset();window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp)})
onUnmounted(()=>{cancelAnimationFrame(animFrame);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp)})
</script>
