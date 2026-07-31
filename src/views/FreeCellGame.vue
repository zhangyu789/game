<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🃏 空当接龙</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newGame">🔄 新游戏</button>
      <button class="btn-sm btn-secondary" @click="undo">↩️ 悔棋</button>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🎯 将所有牌按花色A-K排列到基础牌堆</span>
      <span>{{ won ? '✅ 胜利!' : '' }}</span>
    </div>
    <!-- Free cells + foundations -->
    <div class="flex gap-2 mb-4">
      <div class="flex gap-1">
        <div v-for="(fc,i) in freeCells" :key="'fc'+i"
          class="w-12 h-16 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded flex items-center justify-center cursor-pointer"
          @click="clickFreeCell(i)">
          <span v-if="fc" class="text-lg" :class="fc.red ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'">{{ fc.display }}</span>
        </div>
      </div>
      <div class="flex-1"></div>
      <div class="flex gap-1">
        <div v-for="(f,i) in foundations" :key="'f'+i"
          class="w-12 h-16 border-2 border-gray-300 dark:border-slate-600 rounded flex items-center justify-center cursor-pointer"
          @click="clickFoundation(i)">
          <span v-if="f.length" class="text-lg" :class="f[0].red ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'">{{ f[f.length-1].display }}</span>
          <span v-else class="text-gray-300 text-xs">{{ ['♠','♥','♦','♣'][i] }}</span>
        </div>
      </div>
    </div>
    <!-- Tableau -->
    <div class="flex gap-1">
      <div v-for="(col,ci) in tableau" :key="'t'+ci" class="flex-1 min-w-0">
        <div v-for="(card,ri) in col" :key="ri"
          class="w-full h-12 border border-gray-200 dark:border-slate-600 rounded mb-0.5 flex items-center px-1 cursor-pointer text-xs"
          :class="[card.red ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800', selected?.col===ci && selected?.row===ri ? 'ring-2 ring-blue-500' : '']"
          @click="clickTableau(ci, ri)">
          {{ card.display }}
        </div>
        <div v-if="col.length===0" class="w-full h-12 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded" @click="clickEmptyCol(ci)"></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
const SUITS = ['♠','♥','♦','♣']
const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
let freeCells = ref([null,null,null,null])
let foundations = ref([[],[],[],[]])
let tableau = ref([[],[],[],[],[],[],[],[]])
let selected = ref(null), history = ref([]), won = ref(false)
function createDeck() {
  const d = []
  for (let s = 0; s < 4; s++) {
    for (let v = 0; v < 13; v++) {
      d.push({suit:SUITS[s], value:v+1, display:VALUES[v]+SUITS[s], red: s===1||s===2})
    }
  }
  for (let i = d.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [d[i],d[j]] = [d[j],d[i]] }
  return d
}
function newGame() {
  const deck = createDeck(); won.value = false; history.value = []
  tableau.value = Array.from({length:8}, () => [])
  for (let i = 0; i < 52; i++) tableau.value[i % 8].push(deck[i])
  freeCells.value = [null,null,null,null]
  foundations.value = [[],[],[],[]]
  selected.value = null
}
function canStack(card, target) {
  if (!target) return true
  return card.red !== target.red && card.value === target.value - 1
}
function autoMoveToFoundation(card) {
  for (let i = 0; i < 4; i++) {
    const f = foundations.value[i]
    const topCard = f[f.length - 1]
    if ((!topCard && card.value === 1 && SUITS.indexOf(card.suit) === i) ||
        (topCard && topCard.suit === card.suit && card.value === topCard.value + 1)) {
      f.push(card); return true
    }
  }
  return false
}
function clickTableau(ci, ri) {
  if (won.value) return
  const col = tableau.value[ci]
  if (selected.value) {
    if (selected.value.col === ci) { selected.value = null; return }
    // Move
    const fromCol = tableau.value[selected.value.col]
    const cards = fromCol.slice(selected.value.row)
    if (ri === col.length - 1 || col.length === 0) {
      if (canStack(cards[0], col[col.length - 1])) {
        history.value.push(JSON.parse(JSON.stringify({tableau:tableau.value, freeCells:freeCells.value})))
        fromCol.splice(selected.value.row)
        col.push(...cards)
        selected.value = null; checkWin(); return
      }
    }
    selected.value = null; return
  }
  selected.value = {col: ci, row: ri}
}
function clickFreeCell(i) {
  if (won.value) return
  if (freeCells.value[i] && selected.value) {
    selected.value = null; return
  }
  if (selected.value && !freeCells.value[i]) {
    const fromCol = tableau.value[selected.value.col]
    if (selected.value.row === fromCol.length - 1) {
      history.value.push(JSON.parse(JSON.stringify({tableau:tableau.value, freeCells:freeCells.value})))
      freeCells.value[i] = fromCol.pop()
      selected.value = null; return
    }
  }
  if (freeCells.value[i] && !selected.value) {
    // Put back
    history.value.push(JSON.parse(JSON.stringify({tableau:tableau.value, freeCells:freeCells.value})))
    const card = freeCells.value[i]
    if (autoMoveToFoundation(card)) { freeCells.value[i] = null; checkWin(); return }
    // Move to tableau
    for (const col of tableau.value) {
      if (canStack(card, col[col.length-1])) { col.push(card); freeCells.value[i] = null; return }
    }
  }
}
function clickFoundation(i) { selected.value = null }
function clickEmptyCol(ci) {
  if (selected.value && tableau.value[ci].length === 0) {
    const fromCol = tableau.value[selected.value.col]
    const cards = fromCol.slice(selected.value.row)
    history.value.push(JSON.parse(JSON.stringify({tableau:tableau.value, freeCells:freeCells.value})))
    fromCol.splice(selected.value.row)
    tableau.value[ci].push(...cards)
    selected.value = null
  }
}
function undo() {
  if (history.value.length === 0) return
  const state = history.value.pop()
  tableau.value = state.tableau; freeCells.value = state.freeCells; selected.value = null
}
function checkWin() {
  if (foundations.value.every(f => f.length === 13)) won.value = true
}
onMounted(() => newGame())
</script>
