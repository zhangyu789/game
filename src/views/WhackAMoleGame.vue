<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">🔨 打地鼠</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="start" v-if="!running">▶ 开始</button>
      <button class="btn-sm btn-secondary" @click="reset">🔄 重新开始</button>
      <select v-model="duration" class="btn-sm btn-secondary" @change="reset">
        <option :value="30">30秒</option>
        <option :value="60">60秒</option>
        <option :value="90">90秒</option>
      </select>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🏆 得分: {{ score }}</span>
      <span>⏱️ 时间: {{ timeLeft }}s</span>
      <span>🎯 连击: {{ combo }}</span>
      <span>🥇 最高: {{ highScore }}</span>
    </div>
    <div class="grid grid-cols-3 gap-3 max-w-[320px]">
      <div v-for="(hole, i) in holes" :key="i"
        class="w-20 h-20 rounded-full border-4 cursor-pointer flex items-center justify-center text-3xl transition-all duration-100 select-none"
        :class="hole.active ? 'border-yellow-400 bg-yellow-100 dark:bg-yellow-900 scale-110' : 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800'"
        @click="whack(i)" @touchstart.prevent="whack(i)">
        <span v-if="hole.active" class="animate-bounce">{{ hole.type === 'golden' ? '⭐' : '🐹' }}</span>
        <span v-else class="text-gray-300 dark:text-slate-600">🕳️</span>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-3">点击/触摸冒出的地鼠，金色地鼠分值更高！</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const running = ref(false), score = ref(0), combo = ref(0), timeLeft = ref(30)
const duration = ref(30)
const highScore = ref(parseInt(localStorage.getItem('whack_hs')||'0'))
const holes = ref(Array.from({length:9}, () => ({active:false,type:'normal',timer:null})))
let gameTimer, spawnTimer
function reset() {
  running.value = false; score.value = 0; combo.value = 0
  timeLeft.value = duration.value
  clearInterval(gameTimer); clearInterval(spawnTimer)
  holes.value.forEach(h => { h.active = false; clearTimeout(h.timer) })
}
function start() {
  reset(); running.value = true
  timeLeft.value = duration.value
  gameTimer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      running.value = false; clearInterval(gameTimer); clearInterval(spawnTimer)
      holes.value.forEach(h => { h.active = false; clearTimeout(h.timer) })
      if (score.value > highScore.value) { highScore.value = score.value; localStorage.setItem('whack_hs', highScore.value) }
    }
  }, 1000)
  spawnTimer = setInterval(spawn, 800)
}
function spawn() {
  if (!running.value) return
  const inactive = holes.value.filter(h => !h.active)
  if (inactive.length === 0) return
  const count = Math.min(1 + Math.floor(Math.random() * 2), inactive.length)
  for (let i = 0; i < count; i++) {
    const hole = inactive[Math.floor(Math.random() * inactive.length)]
    hole.active = true; hole.type = Math.random() < 0.15 ? 'golden' : 'normal'
    const showTime = 800 + Math.random() * 1200
    hole.timer = setTimeout(() => { hole.active = false; combo.value = 0 }, showTime)
  }
}
function whack(i) {
  const hole = holes.value[i]
  if (!hole.active || !running.value) return
  clearTimeout(hole.timer)
  combo.value++
  const points = hole.type === 'golden' ? 50 : 10
  score.value += points + combo.value * 2
  hole.active = false
}
onUnmounted(() => { reset() })
</script>
