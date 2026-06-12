<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🎴 UNO</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <button class="btn-sm btn-secondary" @click="drawCard" v-if="!played">🃏 摸牌</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🤖 AI手牌: {{ aiHand.length }}</span>
      <span>🃏 牌堆: {{ deck.length }}</span>
      <span>{{ gameOver }}</span>
    </div>
    <!-- AI hand -->
    <div class="mb-4">
      <div class="text-xs text-gray-400 mb-1">AI 手牌</div>
      <div class="flex gap-1 flex-wrap">
        <div v-for="(_,i) in aiHand" :key="i" class="w-10 h-14 bg-blue-600 rounded text-white text-xs flex items-center justify-center">?</div>
      </div>
    </div>
    <!-- Discard pile -->
    <div class="flex items-center gap-4 mb-4">
      <div class="text-sm text-gray-400">弃牌堆:</div>
      <div v-if="discard" class="w-14 h-20 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
        :style="{background: discard.color}">
        {{ discard.display }}
      </div>
      <div v-if="currentWildColor" class="text-sm">当前颜色: <span class="inline-block w-4 h-4 rounded" :style="{background: currentWildColor}"></span></div>
    </div>
    <!-- Player hand -->
    <div>
      <div class="text-xs text-gray-400 mb-1">你的手牌 (点击出牌)</div>
      <div class="flex gap-1 flex-wrap">
        <div v-for="(card,i) in playerHand" :key="i"
          class="w-14 h-20 rounded-lg flex flex-col items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform shadow"
          :class="canPlay(card) ? '' : 'opacity-50'"
          :style="{background: card.color}"
          @click="playCard(i)">
          {{ card.display }}
        </div>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">点击手牌出牌，匹配颜色或数字</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const COLORS = ['#ef4444','#3b82f6','#22c55e','#eab308']
const COLOR_NAMES = ['红','蓝','绿','黄']
const deck = ref([]), playerHand = ref([]), aiHand = ref([])
const discard = ref(null), currentWildColor = ref('')
const played = ref(false), gameOver = ref('')
function createDeck() {
  const d = []
  for (let ci = 0; ci < 4; ci++) {
    for (let n = 0; n <= 9; n++) d.push({color: COLORS[ci], display: n, value: n, type: 'num'})
    for (let n = 1; n <= 9; n++) d.push({color: COLORS[ci], display: n, value: n, type: 'num'})
    d.push({color: COLORS[ci], display: '⊘', value: -1, type: 'skip'})
    d.push({color: COLORS[ci], display: '⊘', value: -1, type: 'skip'})
    d.push({color: COLORS[ci], display: '⇄', value: -2, type: 'rev'})
    d.push({color: COLORS[ci], display: '+2', value: -3, type: 'draw2'})
    d.push({color: '#000', display: 'W', value: -4, type: 'wild'})
    d.push({color: '#000', display: '+4', value: -5, type: 'wild4'})
  }
  // Shuffle
  for (let i = d.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [d[i],d[j]] = [d[j],d[i]] }
  return d
}
function canPlay(card) {
  if (!discard.value) return true
  const dc = currentWildColor.value || discard.value.color
  if (card.type === 'wild' || card.type === 'wild4') return true
  return card.color === dc || card.value === discard.value.value
}
function newGame() {
  deck.value = createDeck(); playerHand.value = []; aiHand.value = []
  for (let i = 0; i < 7; i++) { playerHand.value.push(deck.value.pop()); aiHand.value.push(deck.value.pop()) }
  // First discard (not wild)
  let first = deck.value.pop()
  while (first.type === 'wild' || first.type === 'wild4') { deck.value.unshift(first); first = deck.value.pop() }
  discard.value = first; currentWildColor.value = ''
  played.value = false; gameOver.value = ''
}
function playCard(i) {
  const card = playerHand.value[i]
  if (!canPlay(card) || played.value || gameOver.value) return
  playerHand.value.splice(i, 1)
  discard.value = card; played.value = true
  if (card.type === 'wild' || card.type === 'wild4') {
    currentWildColor.value = COLORS[0] // Auto pick red, simplified
  } else currentWildColor.value = ''
  if (playerHand.value.length === 0) { gameOver.value = '🎉 你赢了!'; return }
  if (card.type === 'wild4') { for (let j=0;j<4;j++) if(deck.value.length) aiHand.value.push(deck.value.pop()) }
  if (card.type === 'draw2') { for (let j=0;j<2;j++) if(deck.value.length) aiHand.value.push(deck.value.pop()) }
  setTimeout(aiTurn, 500)
}
function drawCard() {
  if (played.value || gameOver.value) return
  if (deck.value.length === 0) return
  playerHand.value.push(deck.value.pop())
  played.value = true
  setTimeout(aiTurn, 500)
}
function aiTurn() {
  // AI tries to play
  let played_card = false
  for (let i = 0; i < aiHand.value.length; i++) {
    if (canPlay(aiHand.value[i])) {
      const card = aiHand.value.splice(i, 1)[0]
      discard.value = card
      if (card.type === 'wild' || card.type === 'wild4') {
        // AI picks most common color in hand
        const counts = {}; aiHand.value.forEach(c => { if(c.color!=='#000') counts[c.color]=(counts[c.color]||0)+1 })
        currentWildColor.value = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || COLORS[0]
      } else currentWildColor.value = ''
      if (aiHand.value.length === 0) { gameOver.value = '😢 AI赢了!'; return }
      if (card.type === 'wild4') { for(let j=0;j<4;j++) if(deck.value.length) playerHand.value.push(deck.value.pop()) }
      if (card.type === 'draw2') { for(let j=0;j<2;j++) if(deck.value.length) playerHand.value.push(deck.value.pop()) }
      played_card = true; break
    }
  }
  if (!played_card && deck.value.length) aiHand.value.push(deck.value.pop())
  played.value = false
}
onMounted(() => newGame())
</script>
