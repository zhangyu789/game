<template>
  <div class="tool-card max-w-2xl mx-auto">
    <h2 class="tool-header">✏️ 一笔画</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-sm btn-primary" @click="newPuzzle">🔄 新关卡</button>
      <button class="btn-sm btn-secondary" @click="undo">↩️ 撤销</button>
      <span class="btn-sm btn-secondary">关卡 {{ level }}</span>
    </div>
    <div class="flex gap-4 mb-3 text-sm">
      <span>🎯 步数: {{ path.length - 1 }}/{{ targetEdges }}</span>
      <span>{{ completed ? '✅ 完成!' : '' }}</span>
    </div>
    <canvas ref="canvas" width="400" height="400" class="border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 block max-w-full cursor-pointer" style="width:min(400px,100%)" @click="onClick"></canvas>
    <p class="text-xs text-gray-400 mt-2">点击节点一笔画完所有边，不重复</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const canvas = ref(null)
const level = ref(1)
let nodes = [], edges = [], path = ref([]), completed = ref(false), targetEdges = 0
let startNode = -1
const LEVELS = [
  // Level 1: Simple triangle
  { nodes: [{x:200,y:80},{x:100,y:320},{x:300,y:320}], edges: [[0,1],[1,2],[2,0]], start: 0 },
  // Level 2: Square with diagonal
  { nodes: [{x:100,y:100},{x:300,y:100},{x:300,y:300},{x:100,y:300}], edges: [[0,1],[1,2],[2,3],[3,0],[0,2]], start: 0 },
  // Level 3: House shape
  { nodes: [{x:200,y:60},{x:100,y:180},{x:300,y:180},{x:100,y:340},{x:300,y:340}], edges: [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4]], start: 0 },
  // Level 4: Star
  { nodes: [{x:200,y:60},{x:120,y:160},{x:280,y:160},{x:140,y:280},{x:260,y:280},{x:200,y:180}], edges: [[0,1],[0,2],[1,5],[2,5],[1,3],[2,4],[3,5],[4,5],[3,4]], start: 0 },
  // Level 5: Complex
  { nodes: [{x:100,y:100},{x:200,y:100},{x:300,y:100},{x:100,y:200},{x:200,y:200},{x:300,y:200},{x:100,y:300},{x:200,y:300},{x:300,y:300}], edges: [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[1,4],[2,5],[3,6],[4,7],[5,8]], start: 0 },
]
function newPuzzle() {
  const lvl = LEVELS[(level.value - 1) % LEVELS.length]
  nodes = lvl.nodes.map(n => ({...n}))
  edges = lvl.edges.map(e => [...e])
  targetEdges = edges.length
  startNode = lvl.start
  path.value = [startNode]; completed.value = false
  draw()
}
function undo() {
  if (path.value.length > 1) { path.value.pop(); completed.value = false; draw() }
}
function onClick(e) {
  if (completed.value) return
  const rect = canvas.value.getBoundingClientRect()
  const mx = (e.clientX - rect.left) * (400 / rect.width)
  const my = (e.clientY - rect.top) * (400 / rect.height)
  // Find clicked node
  let clicked = -1
  nodes.forEach((n, i) => { if (Math.hypot(n.x - mx, n.y - my) < 25) clicked = i })
  if (clicked === -1) return
  const last = path.value[path.value.length - 1]
  if (clicked === last) return
  // Check if edge exists and not used
  const edgeIdx = edges.findIndex(([a, b]) =>
    ((a === last && b === clicked) || (a === clicked && b === last))
  )
  // Check if this edge was already traversed
  const edgeKey = `${Math.min(last, clicked)}-${Math.max(last, clicked)}`
  const usedEdges = new Set()
  for (let i = 0; i < path.value.length - 1; i++) {
    const a = path.value[i], b = path.value[i+1]
    usedEdges.add(`${Math.min(a,b)}-${Math.max(a,b)}`)
  }
  if (edgeIdx !== -1 && !usedEdges.has(edgeKey)) {
    path.value.push(clicked)
    // Check completion
    if (path.value.length - 1 === targetEdges) { completed.value = true; level.value++ }
    draw()
  }
}
function draw() {
  const ctx = canvas.value?.getContext('2d'); if (!ctx) return
  const isDark = document.documentElement.classList.contains('dark')
  ctx.fillStyle = isDark ? '#0f172a' : '#f9fafb'; ctx.fillRect(0, 0, 400, 400)
  // Draw unused edges
  const usedEdges = new Set()
  for (let i = 0; i < path.value.length - 1; i++) {
    const a = path.value[i], b = path.value[i+1]
    usedEdges.add(`${Math.min(a,b)}-${Math.max(a,b)}`)
  }
  edges.forEach(([a, b]) => {
    const key = `${Math.min(a,b)}-${Math.max(a,b)}`
    ctx.strokeStyle = usedEdges.has(key) ? '#22c55e' : (isDark ? '#475569' : '#9ca3af')
    ctx.lineWidth = usedEdges.has(key) ? 4 : 2
    ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke()
  })
  // Draw path
  if (path.value.length > 1) {
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.setLineDash([5,5])
    ctx.beginPath(); ctx.moveTo(nodes[path.value[0]].x, nodes[path.value[0]].y)
    for (let i = 1; i < path.value.length; i++) ctx.lineTo(nodes[path.value[i]].x, nodes[path.value[i]].y)
    ctx.stroke(); ctx.setLineDash([])
  }
  // Draw nodes
  nodes.forEach((n, i) => {
    const inPath = path.value.includes(i)
    const isCurrent = path.value[path.value.length - 1] === i
    ctx.fillStyle = isCurrent ? '#ef4444' : inPath ? '#3b82f6' : (isDark ? '#64748b' : '#6b7280')
    ctx.beginPath(); ctx.arc(n.x, n.y, 15, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(i + 1, n.x, n.y + 4)
    if (i === startNode) {
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(n.x, n.y, 20, 0, Math.PI*2); ctx.stroke()
    }
  })
}
onMounted(() => newPuzzle())
</script>
