<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🏛️ 文明(简化)</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="nextTurn">⏩ 下一回合</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 新文明</button>
    </div>
    <div class="flex gap-3 mb-3 text-sm flex-wrap">
      <span>📅 回合 {{ turn }}</span><span>🌾 食物 {{ food }}</span><span>⚒️ 产能 {{ production }}</span>
      <span>🔬 科技 {{ science }}</span><span>💰 金币 {{ gold }}</span><span>⚔️ 军事 {{ military }}</span>
    </div>
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div v-for="(b,i) in buildings" :key="i" class="p-2 rounded-lg border dark:border-slate-600 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
        :class="b.built?'bg-green-100 dark:bg-green-900/30':'bg-white dark:bg-slate-800'" @click="build(i)">
        <div class="font-bold">{{ b.icon }} {{ b.name }}</div>
        <div class="text-xs text-gray-500">{{ b.desc }} | 花费: {{ b.cost }}</div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div v-for="(t,i) in techs" :key="i" class="p-2 rounded-lg border dark:border-slate-600 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
        :class="t.researched?'bg-blue-100 dark:bg-blue-900/30':'bg-white dark:bg-slate-800'" @click="research(i)">
        <div class="font-bold">🔬 {{ t.name }}</div>
        <div class="text-xs text-gray-500">{{ t.effect }} | 需要: {{ t.cost }}科技</div>
      </div>
    </div>
    <div class="text-sm">{{ message }}</div>
    <p class="text-xs text-gray-400 mt-2">建造建筑和研究科技发展文明</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const turn = ref(1), food = ref(10), production = ref(5), science = ref(0), gold = ref(20), military = ref(0)
const message = ref(''), buildings = ref([]), techs = ref([])
function reset() {
  turn.value=1;food.value=10;production.value=5;science.value=0;gold.value=20;military.value=0;message.value=''
  buildings.value = [
    {name:'农场',icon:'🌾',desc:'食物+5',cost:20,built:false,effect:()=>{food.value+=5}},
    {name:'矿场',icon:'⛏️',desc:'产能+3',cost:30,built:false,effect:()=>{production.value+=3}},
    {name:'市场',icon:'🏪',desc:'金币+10',cost:40,built:false,effect:()=>{gold.value+=10}},
    {name:'兵营',icon:'⚔️',desc:'军事+5',cost:50,built:false,effect:()=>{military.value+=5}},
    {name:'图书馆',icon:'📚',desc:'科技+3/回合',cost:35,built:false,effect:()=>{}},
    {name:'城墙',icon:'🏰',desc:'军事+3',cost:45,built:false,effect:()=>{military.value+=3}},
  ]
  techs.value = [
    {name:'农业',cost:10,researched:false,effect:'食物产量翻倍'},
    {name:'铁器',cost:20,researched:false,effect:'产能+5'},
    {name:'数学',cost:30,researched:false,effect:'金币+15'},
    {name:'火药',cost:50,researched:false,effect:'军事+10'},
  ]
}
function build(i) {
  const b = buildings.value[i]
  if (b.built || gold.value < b.cost) { message.value = '金币不足!'; return }
  gold.value -= b.cost; b.built = true; b.effect(); message.value = `建造了${b.name}!`
}
function research(i) {
  const t = techs.value[i]
  if (t.researched || science.value < t.cost) { message.value = '科技点不足!'; return }
  science.value -= t.cost; t.researched = true
  if (i===0) food.value*=2; if(i===1) production.value+=5; if(i===2) gold.value+=15; if(i===3) military.value+=10
  message.value = `研究了${t.name}!`
}
function nextTurn() {
  turn.value++; food.value += 5 + buildings.value.filter(b=>b.name==='农场'&&b.built).length*5
  gold.value += 5 + buildings.value.filter(b=>b.name==='市场'&&b.built).length*3
  science.value += 2 + buildings.value.filter(b=>b.name==='图书馆'&&b.built).length*3
  message.value = `第${turn.value}回合`
}
onMounted(() => reset())
</script>
