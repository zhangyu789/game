<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">📦 推箱子</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button v-for="(lv,i) in levels" :key="i" @click="loadLevel(i)" :class="['btn-sm',curLevel===i?'btn-primary':'btn-secondary']">第{{i+1}}关</button>
      <button class="btn-sm btn-secondary ml-auto" @click="undo">↩ 撤销</button>
      <span class="self-center text-sm ml-2">步数: {{ steps }}</span>
    </div>
    <div class="inline-block select-none">
      <div v-for="(row,r) in display" :key="r" class="flex">
        <div v-for="(cell,c) in row" :key="c"
          :class="['w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg',
            cell==='#'?'bg-amber-800':'',
            cell==='.'?'bg-green-200 dark:bg-green-900':'',
            cell==='$'?'bg-yellow-300 dark:bg-yellow-700 rounded':'',
            cell==='*'?'bg-green-500 rounded':'',
            cell==='@'?'bg-blue-400 rounded-full':'',
            cell==='+'?'bg-blue-400 rounded-full':'',
            cell===' '?'bg-gray-100 dark:bg-slate-800':'']">
          {{ cell==='@'||cell==='+'?'🧑':cell==='$'?'📦':cell==='*'||cell==='.'?'🎯':'' }}
        </div>
      </div>
    </div>
    <p v-if="won" class="text-green-500 font-bold mt-2">🎉 过关！</p>
    <div class="grid grid-cols-3 gap-1 mt-3 max-w-[160px]">
      <div></div><button class="btn-sm btn-secondary" @click="move(0,-1)">▲</button><div></div>
      <button class="btn-sm btn-secondary" @click="move(-1,0)">◀</button>
      <div></div>
      <button class="btn-sm btn-secondary" @click="move(1,0)">▶</button>
      <div></div><button class="btn-sm btn-secondary" @click="move(0,1)">▼</button><div></div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
const levels = [
  ['  ###  ','  #.#  ','  # ###','###$ $.#','#. $@###','# #### #','#      #','########'],
  ['######','#    #','# ## #','# .$ #','# .$@#','# ## #','#    #','######'],
  ['  ####  ','###  ###','#   $  #','# .#.  #','#  $ ##','#.# $#','#  @ #','########'],
  ['#####','#   #','# $ #','# .##','#.# #','#   #','#@  #','#####'],
  [' ########','#  #   #','#  $ # #','#  #.# #','# .$   #','## ####  ','#   @    ','########'],
]
const curLevel=ref(0), steps=ref(0), won=ref(false)
let map,player,history=[]
const WALL='#',EMPTY=' ',TARGET='.',BOX='$',ON_TARGET='*',PLAYER='@',PLAYER_ON_TARGET='+'

function loadLevel(i){
  curLevel.value=i;steps.value=0;won.value=false;history=[]
  map=levels[i].map(r=>r.split(''))
  player=null
  for(let r=0;r<map.length;r++)for(let c=0;c<map[r].length;c++)if(map[r][c]==='@'||map[r][c]==='+')player={x:c,y:r}
}
const display=computed(()=>map||[])

function move(dx,dy){
  if(won.value||!player)return
  const nx=player.x+dx,ny=player.y+dy
  if(!map[ny]||map[ny][nx]===undefined||map[ny][nx]===WALL)return
  const prev=map.map(r=>[...r]);const pp={...player}
  if(map[ny][nx]==='$'||map[ny][nx]==='*'){
    const bx=nx+dx,by=ny+dy
    if(!map[by]||map[by][bx]===undefined||map[by][bx]===WALL||map[by][bx]==='$'||map[by][bx]==='*')return
    map[by][bx]=map[by][bx]==='.'||map[by][bx]==='+'?'*':'$'
    map[ny][nx]=map[ny][nx]==='*'?'.':map[ny][nx]==='$'?EMPTY:EMPTY
  }
  const cur=map[player.y][player.x]
  map[player.y][player.x]=cur==='+'||cur==='.'?'.':EMPTY
  player={x:nx,y:ny}
  const dest=map[ny][nx]
  map[ny][nx]=dest==='.'||dest==='+'||dest==='*'?'+':'@'
  history.push({map:prev,player:pp})
  steps.value++;trigger()
  checkWin()
}
function undo(){if(history.length){const s=history.pop();map=s.map;player=s.player;steps.value--;trigger()}}
function checkWin(){
  for(const row of map)for(const c of row)if(c==='$')return
  won.value=true
}
function trigger(){map=map.map(r=>[...r])}
function onKey(e){
  const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}
  if(m[e.key]){e.preventDefault();move(m[e.key][0],m[e.key][1])}
  if(e.key==='z'&&(e.ctrlKey||e.metaKey)){e.preventDefault();undo()}
}
onMounted(()=>{loadLevel(0);window.addEventListener('keydown',onKey)})
onUnmounted(()=>window.removeEventListener('keydown',onKey))
</script>
