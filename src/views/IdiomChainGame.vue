<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">📝 成语接龙</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-secondary" @click="newGame">🔄 新游戏</button>
      <span class="btn-sm btn-secondary">得分: {{ score }}</span>
    </div>
    <div class="mb-4">
      <div v-for="(w,i) in chain" :key="i" class="inline-block px-2 py-1 mx-1 mb-1 rounded text-sm" :class="i%2===0?'bg-blue-100 dark:bg-blue-900/30 text-blue-700':'bg-red-100 dark:bg-red-900/30 text-red-700'">{{ w }}</div>
    </div>
    <div class="flex gap-2 mb-3">
      <input v-model="input" type="text" placeholder="输入成语（接最后一个字）" class="btn-sm btn-secondary flex-1" @keydown.enter="submit">
      <button class="btn-sm btn-primary" @click="submit">接龙</button>
    </div>
    <div class="text-sm" v-if="message">{{ message }}</div>
    <p class="text-xs text-gray-400 mt-2">输入四字成语，首字需与上一个成语末字相同</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const IDIOMS = ['一心一意','意气风发','发奋图强','强词夺理','理直气壮','壮志凌云','云开雾散','散兵游勇','勇往直前','前功尽弃',
  '弃暗投明','明察秋毫','毫不犹豫','豫则立之','知己知彼','彼此彼此','此起彼伏','伏案疾书','书声琅琅','琅琅上口',
  '口若悬河','河清海晏','晏然自若','若无其事','事半功倍','倍加努力','力挽狂澜','澜倒波随','随遇而安','安居乐业',
  '业精于勤','勤能补拙','拙口笨舌','舌战群儒','儒雅风流','流连忘返','返璞归真','真相大白','白日做梦','梦想成真',
  '真才实学','学而不厌','厌难折冲','冲冠一怒','怒发冲冠','冠冕堂皇','皇天后土','土崩瓦解','解甲归田','田月桑时',
  '时不我待','待人接物','物华天宝','宝刀不老','老当益壮','壮心不已','已陈刍狗','狗急跳墙','墙头马上','上行下效']
const chain = ref([]), input = ref(''), score = ref(0), message = ref('')
let usedSet = new Set()
function newGame() { chain.value = []; score.value = 0; message.value = ''; usedSet = new Set(); startAI() }
function startAI() {
  const idiom = IDIOMS[Math.floor(Math.random()*IDIOMS.length)]
  chain.value.push(idiom); usedSet.add(idiom)
}
function submit() {
  const word = input.value.trim()
  if (word.length < 2) { message.value = '请输入至少两个字的词语'; return }
  const lastChar = chain.value[chain.value.length-1].slice(-1)
  if (word[0] !== lastChar) { message.value = `需要以"${lastChar}"开头`; return }
  if (usedSet.has(word)) { message.value = '已经用过了'; return }
  chain.value.push(word); usedSet.add(word); score.value += 10; input.value = ''; message.value = ''
  // AI responds
  setTimeout(() => {
    const aiLast = chain.value[chain.value.length-1].slice(-1)
    const found = IDIOMS.find(i => i[0] === aiLast && !usedSet.has(i))
    if (found) { chain.value.push(found); usedSet.add(found); message.value = '' }
    else { message.value = 'AI接不上来，你赢了! 🎉'; score.value += 50 }
  }, 500)
}
onMounted(() => newGame())
</script>
