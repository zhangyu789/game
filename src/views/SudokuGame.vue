<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🔢 数独</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button v-for="d in diffs" :key="d.label" @click="init(d.empty)" :class="['btn-sm',curDiff===d.label?'btn-primary':'btn-secondary']">{{ d.label }}</button>
      <button class="btn-sm btn-secondary ml-auto" @click="solve">🤖 求解</button>
    </div>
    <div class="inline-block border-2 border-gray-800 dark:border-gray-300 rounded">
      <div v-for="(row,r) in board" :key="r" class="flex">
        <div v-for="(cell,c) in row" :key="c"
          :class="['w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center border border-gray-300 dark:border-slate-600 cursor-pointer text-sm sm:text-base font-medium',
            r%3===2&&r<8?'border-b-2 border-b-gray-800 dark:border-b-gray-300':'',
            c%3===2&&c<8?'border-r-2 border-r-gray-800 dark:border-r-gray-300':'',
            fixed[r]?.[c]?'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-100':'text-blue-600 dark:text-blue-400',
            selR===r&&selC===c?'!bg-primary-100 dark:!bg-primary-900':'',
            errors[r]?.[c]?'!bg-red-100 dark:!bg-red-900 text-red-600':'']"
          @click="select(r,c)">
          {{ cell || '' }}
        </div>
      </div>
    </div>
    <div class="flex flex-wrap gap-1 mt-3">
      <button v-for="n in 9" :key="n" class="btn-sm btn-secondary w-9" @click="input(n)">{{ n }}</button>
      <button class="btn-sm btn-secondary" @click="input(0)">⌫</button>
    </div>
    <p v-if="msg" class="mt-2 text-sm" :class="msgType==='ok'?'text-green-500':'text-red-500'">{{ msg }}</p>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const diffs = [{label:'简单',empty:30},{label:'中等',empty:45},{label:'困难',empty:55}]
const curDiff = ref('简单')
const board = ref(Array.from({length:9},()=>Array(9).fill(0)))
const fixed = ref(Array.from({length:9},()=>Array(9).fill(false)))
const errors = ref(Array.from({length:9},()=>Array(9).fill(false)))
const selR = ref(-1), selC = ref(-1)
const msg = ref(''), msgType = ref('ok')

function generate() {
  const b = Array.from({length:9},()=>Array(9).fill(0))
  fill(b); return b
}
function fill(b) {
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(!b[r][c]){
    const nums=shuffle([1,2,3,4,5,6,7,8,9])
    for(const n of nums) if(valid(b,r,c,n)){b[r][c]=n;if(fill(b))return true;b[r][c]=0}
    return false
  }
  return true
}
function valid(b,r,c,n){
  for(let i=0;i<9;i++){if(b[r][i]===n||b[i][c]===n)return false}
  const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3
  for(let i=br;i<br+3;i++)for(let j=bc;j<bc+3;j++)if(b[i][j]===n)return false
  return true
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function init(empty){
  curDiff.value = diffs.find(d=>d.empty===empty)?.label||'简单'
  msg.value=''; errors.value=Array.from({length:9},()=>Array(9).fill(false))
  const full=generate()
  const b=full.map(r=>[...r]), f=Array.from({length:9},()=>Array(9).fill(true))
  const positions=shuffle([...Array(81).keys()])
  let removed=0
  for(const p of positions){if(removed>=empty)break;const r=Math.floor(p/9),c=p%9;b[r][c]=0;f[r][c]=false;removed++}
  board.value=b;fixed.value=f
}
function select(r,c){selR.value=r;selC.value=c}
function input(n){
  if(selR.value<0||fixed.value[selR.value]?.[selC.value])return
  board.value[selR.value][selC.value]=n
  errors.value[selR.value][selC.value]=false
  board.value=board.value.map(r=>[...r])
  checkComplete()
}
function checkComplete(){
  const b=board.value
  if(!b.flat().includes(0)){
    let ok=true
    for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!valid(b,r,c,b[r][c])&&b[r][c]){
      // recheck without self
      let dup=false
      for(let i=0;i<9;i++){if(i!==c&&b[r][i]===b[r][c])dup=true;if(i!==r&&b[i][c]===b[r][c])dup=true}
      if(dup){ok=false;errors.value[r][c]=true}
    }
    if(ok){msg.value='🎉 恭喜完成！';msgType.value='ok'}
  }
}
function solve(){
  const b=board.value.map(r=>[...r])
  if(solveSudoku(b)){board.value=b;msg.value='已求解';msgType.value='ok'}
  else{msg.value='无解';msgType.value='err'}
}
function solveSudoku(b){
  for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!b[r][c]){
    for(let n=1;n<=9;n++)if(valid(b,r,c,n)){b[r][c]=n;if(solveSudoku(b))return true;b[r][c]=0}
    return false
  }
  return true
}
init(30)
</script>
