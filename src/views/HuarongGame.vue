<template>
  <div class="tool-card max-w-lg mx-auto">
    <h2 class="tool-header">🧩 华容道</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button v-for="(lv,i) in levels" :key="i" @click="loadLevel(i)" :class="['btn-sm',curLevel===i?'btn-primary':'btn-secondary']">{{ lv.name }}</button>
      <button class="btn-sm btn-secondary" @click="loadLevel(curLevel)">🔄 重置</button>
      <span class="self-center text-sm ml-auto">步数: {{ steps }}</span>
    </div>
    <div class="relative mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-lg border-2 border-amber-800 p-1 select-none" style="width:240px;height:300px">
      <div v-for="(p,i) in pieces" :key="i"
        :class="['absolute rounded flex items-center justify-center font-bold text-sm cursor-pointer transition-all shadow border',
          p.type==='king'?'bg-red-500 text-white border-red-700':'bg-amber-300 text-amber-900 border-amber-500',
          selected===i?'ring-2 ring-blue-400':'']"
        :style="{left:p.x*58+2+'px',top:p.y*58+2+'px',width:p.w*58-4+'px',height:p.h*58-4+'px'}"
        @mousedown="startDrag(i,$event)" @touchstart="startDrag(i,$event)">
        {{ p.name }}
      </div>
    </div>
    <p v-if="won" class="text-green-500 font-bold mt-2 text-center">🎉 通关！</p>
    <p class="text-xs text-gray-400 mt-2">拖拽滑块，将红色「曹操」移到出口</p>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const levels=[
  {name:'横刀立马',pieces:[{name:'曹操',x:1,y:0,w:2,h:2,type:'king'},{name:'关羽',x:1,y:2,w:2,h:1,type:'h'},{name:'张飞',x:0,y:0,w:1,h:2,type:'v'},{name:'赵云',x:3,y:0,w:1,h:2,type:'v'},{name:'马超',x:0,y:2,w:1,h:2,type:'v'},{name:'黄忠',x:3,y:2,w:1,h:2,type:'v'},{name:'兵',x:1,y:3,w:1,h:1,type:'s'},{name:'兵',x:2,y:3,w:1,h:1,type:'s'},{name:'兵',x:0,y:4,w:1,h:1,type:'s'},{name:'兵',x:3,y:4,w:1,h:1,type:'s'}]},
  {name:'指挥若定',pieces:[{name:'曹操',x:1,y:0,w:2,h:2,type:'king'},{name:'关羽',x:1,y:2,w:2,h:1,type:'h'},{name:'张飞',x:0,y:0,w:1,h:2,type:'v'},{name:'赵云',x:3,y:0,w:1,h:2,type:'v'},{name:'马超',x:0,y:2,w:1,h:2,type:'v'},{name:'黄忠',x:3,y:2,w:1,h:2,type:'v'},{name:'兵',x:0,y:4,w:1,h:1,type:'s'},{name:'兵',x:1,y:3,w:1,h:1,type:'s'},{name:'兵',x:2,y:3,w:1,h:1,type:'s'},{name:'兵',x:3,y:4,w:1,h:1,type:'s'}]},
  {name:'将拥曹公',pieces:[{name:'曹操',x:1,y:0,w:2,h:2,type:'king'},{name:'关羽',x:1,y:3,w:2,h:1,type:'h'},{name:'张飞',x:0,y:0,w:1,h:2,type:'v'},{name:'赵云',x:3,y:0,w:1,h:2,type:'v'},{name:'马超',x:0,y:2,w:1,h:2,type:'v'},{name:'黄忠',x:3,y:2,w:1,h:2,type:'v'},{name:'兵',x:1,y:2,w:1,h:1,type:'s'},{name:'兵',x:2,y:2,w:1,h:1,type:'s'},{name:'兵',x:0,y:4,w:1,h:1,type:'s'},{name:'兵',x:3,y:4,w:1,h:1,type:'s'}]},
]
const pieces=ref([]),curLevel=ref(0),steps=ref(0),won=ref(false),selected=ref(-1)
let dragPiece=-1,startX=0,startY=0,pieceStartX=0,pieceStartY=0

function loadLevel(i){
  curLevel.value=i;steps.value=0;won.value=false;selected.value=-1
  pieces.value=levels[i].pieces.map(p=>({...p}))
}
function startDrag(i,e){
  if(won.value)return
  selected.value=i;dragPiece=i
  const evt=e.touches?e.touches[0]:e
  startX=evt.clientX;startY=evt.clientY
  pieceStartX=pieces.value[i].x;pieceStartY=pieces.value[i].y
  const onMove=(ev)=>{
    const ev2=ev.touches?ev.touches[0]:ev
    const dx=ev2.clientX-startX,dy=ev2.clientY-startY
    const p=pieces.value[dragPiece]
    const cellX=Math.round(dx/58),cellY=Math.round(dy/58)
    let nx=pieceStartX+cellX,ny=pieceStartY+cellY
    nx=Math.max(0,Math.min(4-p.w,nx));ny=Math.max(0,Math.min(5-p.h,ny))
    if(canMove(dragPiece,nx,ny)){p.x=nx;p.y=ny}
  }
  const onUp=()=>{
    if(dragPiece>=0){
      const p=pieces.value[dragPiece]
      if(p.x!==pieceStartX||p.y!==pieceStartY)steps.value++
      if(p.type==='king'&&p.x===1&&p.y===3)won.value=true
    }
    dragPiece=-1;document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp)
    document.removeEventListener('touchmove',onMove);document.removeEventListener('touchend',onUp)
  }
  document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp)
  document.addEventListener('touchmove',onMove,{passive:false});document.addEventListener('touchend',onUp)
}
function canMove(idx,nx,ny){
  const p=pieces.value[idx]
  // Check bounds
  if(nx<0||ny<0||nx+p.w>4||ny+p.h>5)return false
  // Check overlap
  for(let i=0;i<pieces.value.length;i++){
    if(i===idx)continue
    const o=pieces.value[i]
    if(nx<o.x+o.w&&nx+p.w>o.x&&ny<o.y+o.h&&ny+p.h>o.y)return false
  }
  return true
}
loadLevel(0)
</script>
