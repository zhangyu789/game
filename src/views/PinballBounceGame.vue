<template>
  <div class="pinball-bounce-game">
    <div id="gameWrap">
      <canvas 
        ref="gameCanvas" 
        width="440" 
        height="900"
        :style="canvasStyle"
        @touchstart.passive.prevent="onPointerDown"
        @touchmove.passive.prevent="onPointerMove"
        @touchend.passive="onPointerUp"
        @touchcancel.passive="onPointerUp"
        @mousedown.prevent="onPointerDown"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'

const gameCanvas = ref(null)
const canvasStyle = reactive({ width: 'auto', height: 'auto' })
let cv, ctx, W, H

const BASE_W = 440, BASE_H = 900

/** LED 七段字体 */
const FONT_LED = "'DS-Digital','DS Digital',monospace,system-ui,sans-serif"
const FONT_UI = "system-ui,-apple-system,'PingFang SC','Segoe UI',sans-serif"

let cssScale = 1, dpr = 1
/** 物理以 60fps 为基准：frameScale=dt*60，避免高刷/双循环加速 */
let frameScale = 1

const MAIN = { L: 30, R: 390, T: 45, B: 500 }
const ARC_CY = 105
const SLOPE = { top: 544, bot: 644 }
const SLOPE_SPAN_DEFAULT = 100
const PIT = { floor: 733, ready: 721, pull: 751 }
const CHAN_DIV_EXT = 14
const CHAN_H_DEFAULT = 28, CHAN_H_MIN = 28, CHAN_H_MAX = 140
const RISK_TABLE = { 5: 2, 4: 3, 3: 4, 2: 5, 1: 10 }
const GATE_H = 78, GATE_OPEN_TIME = 0.85, GATE_SPEED = 1 / 0.32, COL_EPS = 0.02
const ARC_ANG_MIN = -Math.PI / 2 - 0.08, ARC_ANG_MAX = 0.08
const REWARD_PER_SCORE = 30
const TOTAL_BEADS_INIT = 200
const PRESET_BIG_PIN = { x: 40, y: 96 }
const LAND_SLEEP_VY = 1.05, LAND_SLEEP_IMPACT = 1.35
const LAUNCH_MIN_PULL = 0.04
const REWARD_DROP_LIFE = 3.5
const REWARD_GAP_MS = 80
const LIT_COUNT_WEIGHTS = [{ n: 5, w: 35 }, { n: 4, w: 35 }, { n: 3, w: 15 }, { n: 2, w: 10 }, { n: 1, w: 5 }]
const CHAN_BREATH_MS = 420

const HOPPER_SPAWN = { x: 143, y: 689 }
const UI_BTN_ADD = { cx: 232, cy: 689, w: 96, h: 48, r: 24 }
const UI_BTN_START = { cx: 330, cy: 689, w: 96, h: 48, r: 24 }
const HOPPER_HOLE = { x: 51, y: 732, r: 12 }
const REWARD_HOLE = { x: 325, y: 765, r: 12 }

const COLORS = {
  bgPage: 'transparent',
  bgCanvasTop: '#3f4a63',
  bgCanvasBot: '#242c3c',
  bgBoard: 'transparent',
  bgLane: 'transparent',
  bgLaunchBox: 'transparent',
  bgReturn: 'transparent',
  bgChannel: '#0a1220',
  bgChannelOff: '#141c28',
  bgHudText: '#e8eefc',
  colWall: '#ffffff', colInner: '#ffffff', colArc: '#ffffff',
  colGate: '#ff5533', colSlope: '#ffffff'
}

const CFG = {
  innerR: 55, laneW: 28, lineW: 1, cornerR: 70,
  g: 0.11, bounce: 0.28, fric: 0.996,
  minSpd: 18, maxAdd: 34, powerScale: 1,
  springH: 60, springMinH: 3, springK: 1, rodLen: 78,
  ballR: 12, pinR: 3, randX: 0.12, jitter: 0.55,
  need: 5, slopeAcc: 0.25, pinBounceScale: 0.82,
  pinSideDist: 11, pinDown: 120, pinRowGap: 40,
  bigPinR: 11, bigPinUp: 100, bigPinArc: 25, bigPinShift: 0,
  trailLen: 75, trailAlpha: 0.45,
  pitReady: 721, pitDepth: 12, pullExtra: 18,
  pinDoublePass: true, laneLandBounce: 0.38, laneWallBounce: 0.42,
  rewardGapMs: REWARD_GAP_MS,
  boardColor: COLORS.bgBoard,
  colWall: COLORS.colWall, colInner: COLORS.colInner, colArc: COLORS.colArc,
  colGate: COLORS.colGate, colSlope: COLORS.colSlope,
  chanH: 28, slopeTop: 544
}

const HUD = {
  sel: 'total',
  total: { x: 44, y: 600, label: '总珠' },
  beads: { x: 44, y: 684, label: '投珠' },
  reward: { x: 168, y: 760, label: '奖励珠子' },
  status: { x: 42, y: 628 },
  step: 2,
  showHint: false
}

let customWalls = [
  { id: 1, x: 97, y: 672, len: 128, thick: 8, ang: 0, color: '#c8d4e0' },
  { id: 2, x: 33, y: 716, len: 80, thick: 8, ang: 90, color: '#c8d4e0' },
  { id: 3, x: 161, y: 698, len: 46, thick: 8, ang: 90, color: '#c8d4e0' },
  { id: 4, x: 97, y: 739, len: 128, thick: 8, ang: -15, color: '#c8d4e0' },
  { id: 5, x: 254, y: 748, len: 176, thick: 8, ang: 0, color: '#c8d4e0' },
  { id: 6, x: 99, y: 766, len: 136, thick: 8, ang: -15, color: '#c8d4e0' },
  { id: 7, x: 33, y: 825, len: 82, thick: 8, ang: 90, color: '#c8d4e0' },
  { id: 8, x: 342, y: 808, len: 115, thick: 8, ang: 90, color: '#c8d4e0' },
  { id: 9, x: 189, y: 866, len: 305, thick: 8, ang: 0, color: '#c8d4e0' }
]

let litCount = 0, riskMult = 1, litIndices = []
let justLaunched = 0, uiPress = null
let statusMsg = '从总珠投满 5 可开始', statusKind = ''
let hopperAnims = [], rewardDrops = []
let rewardQueue = 0, rewardQueueTimer = 0, rewardTotalQueued = 0, rewardSpawned = 0
let rewardRoundLeft = 0
let channelIdleBlink = true, showColorLabels = false

let state = 'wait', zone = 'slope'
let totalBeads = TOTAL_BEADS_INIT, beads = 0, bet = 0, rewardBeads = 0, lifetimeReward = 0, score = 0, shots = 0
let pull = 0, pulling = false, p0 = 0, y0 = 0
let gateT = 0, gate = 0, gateTimer = 0, scored = false, stuck = 0, landCool = 0
let plungerSnap = false, plungerPower = 0, plungerHitLock = 0, plungerHasHit = false
let seatBall = false
const ball = { x: 300, y: 600, vx: 0, vy: 0 }
let pins = [], chans = [], parts = [], trail = []
let last = 0
let animFrameId = null
/** ★ 只启动一次主循环（原先 font + setTimeout 会双开，速度翻倍） */
let loopStarted = false

const uiState = ref({
  totalBeads: TOTAL_BEADS_INIT,
  beads: 0,
  rewardBeads: 0,
  score: 0,
  statusMsg: '从总珠投满 5 可开始',
  canAddBead: true,
  canStart: false,
  pull: 0
})

function updateUI() {
  uiState.value.totalBeads = totalBeads
  uiState.value.beads = beads
  uiState.value.rewardBeads = rewardBeads
  uiState.value.score = score
  uiState.value.statusMsg = statusMsg
  uiState.value.canAddBead = canAddBead()
  uiState.value.canStart = beads >= CFG.need && state === 'wait'
  uiState.value.pull = pull
}

function wallEndpoints(w) {
  const rad = w.ang * Math.PI / 180, hx = Math.cos(rad) * w.len * 0.5, hy = Math.sin(rad) * w.len * 0.5
  return { x1: w.x - hx, y1: w.y - hy, x2: w.x + hx, y2: w.y + hy }
}

function getWallById(id) { return customWalls.find(w => w.id === id) || null }

function wall4Track() {
  const w = getWallById(4) || customWalls[3], ep = wallEndpoints(w)
  const hx = HOPPER_HOLE.x, hy = HOPPER_HOLE.y
  const d1 = Math.hypot(ep.x1 - hx, ep.y1 - hy), d2 = Math.hypot(ep.x2 - hx, ep.y2 - hy)
  let farX, farY, nearX, nearY
  if (d1 < d2) { nearX = ep.x1; nearY = ep.y1; farX = ep.x2; farY = ep.y2 }
  else { nearX = ep.x2; nearY = ep.y2; farX = ep.x1; farY = ep.y1 }
  let tx = nearX - farX, ty = nearY - farY, tlen = Math.hypot(tx, ty) || 1
  tx /= tlen; ty /= tlen
  let nx = -ty, ny = tx
  if (ny > 0) { nx = -nx; ny = -ny }
  return { w, ep, farX, farY, nearX, nearY, tx, ty, nx, ny, half: w.thick * 0.5, len: tlen }
}

function enqueueRewardDrops(n) {
  n = Math.max(0, n | 0); if (!n) return
  rewardQueue += n
  rewardRoundLeft += n
  rewardTotalQueued += n
  if (rewardQueueTimer <= 0) {
    spawnOneRewardDrop()
    rewardQueue--
    rewardSpawned++
    rewardQueueTimer = rewardGapSec()
  }
}

function rewardGapSec() { return (CFG.rewardGapMs || REWARD_GAP_MS) / 1000 }

function creditOneRewardBead() {
  totalBeads += 1
  lifetimeReward += 1
  refreshScoreFromReward()
  if (rewardRoundLeft > 0) {
    rewardRoundLeft--
    rewardBeads += 1
  }
}

function spawnOneRewardDrop() {
  creditOneRewardBead()
  const hx = REWARD_HOLE.x, hy = REWARD_HOLE.y, hr = REWARD_HOLE.r
  const br = Math.max(5.5, Math.min(10, ballRadius() * 0.72))
  const ang = -0.35 + Math.random() * 0.7, spd = 2.2 + Math.random() * 2.4
  rewardDrops.push({
    x: hx + (Math.random() - 0.5) * 2, y: hy - hr * 0.2,
    vx: Math.sin(ang) * spd + (Math.random() - 0.5) * 0.8,
    vy: Math.cos(ang) * spd * 0.35 + 1.2 + Math.random() * 1.2,
    r: br, rot: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.5, age: 0, alpha: 1
  })
}

function resolveDropPair(a, b) {
  let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy
  const min = a.r + b.r
  if (d2 >= min * min || d2 < 1e-12) return
  const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = min - d
  a.x -= nx * pen * 0.5; a.y -= ny * pen * 0.5; b.x += nx * pen * 0.5; b.y += ny * pen * 0.5
  const rvx = b.vx - a.vx, rvy = b.vy - a.vy, vn = rvx * nx + rvy * ny
  if (vn >= 0) return
  const j = -(1 + 0.35) * vn / 2
  a.vx -= j * nx; a.vy -= j * ny; b.vx += j * nx; b.vy += j * ny
}

function collideDropWithSegment(b, x1, y1, x2, y2, half) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy || 1e-8
  let t = ((b.x - x1) * dx + (b.y - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const px = x1 + t * dx, py = y1 + t * dy, ox = b.x - px, oy = b.y - py
  const d = Math.hypot(ox, oy), min = b.r + half
  if (d >= min || d < 1e-8) return
  const nx = ox / d, ny = oy / d
  b.x += nx * (min - d + 0.02); b.y += ny * (min - d + 0.02)
  const vn = b.vx * nx + b.vy * ny
  if (vn < 0) {
    const tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty
    b.vx = nx * (-0.35 * vn) + tx * vt * 0.9
    b.vy = ny * (-0.35 * vn) + ty * vt * 0.9
  }
}

function updateRewardDrops(dt) {
  if (rewardQueue > 0) {
    rewardQueueTimer -= dt
    if (rewardQueueTimer <= 0) {
      spawnOneRewardDrop()
      rewardQueue--
      rewardSpawned++
      rewardQueueTimer = rewardGapSec()
    }
  } else if (rewardTotalQueued > 0 && rewardSpawned >= rewardTotalQueued && rewardDrops.length === 0) {
    rewardTotalQueued = 0; rewardSpawned = 0
  }
  // 奖励珠动画也按 60fps 标定（原 g=0.38 按帧）
  const g = 0.38 * frameScale, floorY = H - 8
  for (let i = rewardDrops.length - 1; i >= 0; i--) {
    const b = rewardDrops[i]; b.age += dt
    if (b.age >= REWARD_DROP_LIFE) {
      b.alpha -= dt * 5
      if (b.alpha <= 0) { rewardDrops.splice(i, 1); continue }
    }
    b.vy += g
    b.x += b.vx * frameScale; b.y += b.vy * frameScale
    b.vx *= Math.pow(0.992, frameScale); b.vy *= Math.pow(0.998, frameScale)
    b.rot += (b.spin + b.vx * 0.05) * frameScale
    b.spin *= Math.pow(0.98, frameScale)
    for (const w of customWalls) {
      const ep = wallEndpoints(w)
      collideDropWithSegment(b, ep.x1, ep.y1, ep.x2, ep.y2, w.thick * 0.5)
    }
    if (b.y + b.r > floorY) {
      b.y = floorY - b.r
      if (b.vy > 0) {
        if (b.vy > 0.8) b.vy = -b.vy * 0.28
        else { b.vy = 0; b.vx *= 0.86 }
      }
    }
    if (b.x - b.r < 8) { b.x = 8 + b.r; if (b.vx < 0) b.vx = -b.vx * 0.4 }
    if (b.x + b.r > W - 8) { b.x = W - 8 - b.r; if (b.vx > 0) b.vx = -b.vx * 0.4 }
  }
  const passes = rewardDrops.length > 40 ? 1 : rewardDrops.length > 20 ? 2 : 3
  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < rewardDrops.length; i++) {
      for (let j = i + 1; j < rewardDrops.length; j++) {
        resolveDropPair(rewardDrops[i], rewardDrops[j])
      }
    }
  }
}

function ballRadius() { return CFG.ballR }
function channelHeight() {
  let h = Number.isFinite(CFG.chanH) ? CFG.chanH : CHAN_H_DEFAULT
  return Math.max(CHAN_H_MIN, Math.min(CHAN_H_MAX, h))
}
function springNatural() { return Math.max(8, CFG.springH || 60) }
function springMin() { return Math.max(1, Math.min(springNatural() - 2, CFG.springMinH != null ? CFG.springMinH : 3)) }
function springCurrentH() {
  const H0 = springNatural(), H1 = springMin(), p = Math.max(0, Math.min(1, pull))
  return H0 + p * (H1 - H0)
}
function rodLength() { return Math.max(30, Math.min(140, CFG.rodLen || 78)) }

function springGeom(G) {
  const H0 = springNatural(), h = springCurrentH(), H1 = springMin(), rodLen = rodLength()
  const botY = Math.min(PIT.floor - 2, H - rodLen - 28), topY = botY - h
  const compress = (H0 - h) / Math.max(1, H0 - H1)
  const seatY = topY, rodTop = seatY + 2, rodBot = rodTop + rodLen, knobY = rodBot + 12
  const br = ballRadius(), ballSeatY = topY - br
  return { x: G.laneCX, botY, topY, h, H0, H1, compress: Math.max(0, Math.min(1, compress)), seatY, rodTop, rodBot, knobY, ballSeatY, br, rodLen }
}

function launchSpeedFromPull(p, sg) {
  p = Math.max(0, Math.min(1, p))
  const scale = Math.max(0.05, Number.isFinite(CFG.powerScale) ? CFG.powerScale : 1)
  const k = Math.max(0.2, Math.min(2.5, CFG.springK || 1))
  const stroke = Math.max(1, (sg && sg.H0 != null ? sg.H0 : springNatural()) - (sg && sg.H1 != null ? sg.H1 : springMin()))
  const t = 0.22 * p + 0.78 * Math.pow(p, 1.85)
  const lightSpd = 2.6 + CFG.minSpd * 0.08, fullSpd = (CFG.minSpd * 0.65 + CFG.maxAdd) + stroke * 0.18
  let hitSpd = lightSpd + (fullSpd - lightSpd) * t
  hitSpd += Math.pow(p, 2.4) * 10 * k
  hitSpd *= scale * (0.72 + 0.28 * k)
  hitSpd = Math.max(2.4 + p * 4.5, hitSpd)
  return Math.max(2.2, Math.min(48, hitSpd))
}

function refreshSlope() {
  const span = SLOPE_SPAN_DEFAULT
  let top = Number.isFinite(CFG.slopeTop) ? CFG.slopeTop : 544
  const chBottom = MAIN.B + channelHeight()
  const minTop = Math.max(chBottom + 16, MAIN.B + 40)
  const maxTop = Math.min((Number.isFinite(CFG.pitReady) ? CFG.pitReady : PIT.ready) - 50, H - 180)
  top = Math.max(minTop, Math.min(maxTop, top))
  CFG.slopeTop = top
  SLOPE.top = top
  SLOPE.bot = top + span
}

function refreshPit() {
  const minReady = SLOPE.top + 40, maxReady = H - 40
  let ready = Number.isFinite(CFG.pitReady) ? CFG.pitReady : 721
  ready = Math.max(minReady, Math.min(maxReady, ready))
  let depth = Number.isFinite(CFG.pitDepth) ? CFG.pitDepth : 12
  depth = Math.max(8, Math.min(80, depth))
  let pullExtra = Number.isFinite(CFG.pullExtra) ? CFG.pullExtra : 18
  pullExtra = Math.max(4, Math.min(100, pullExtra))
  let floor = ready + depth, pullY = floor + pullExtra
  const needBottom = rodLength() + 36
  if (pullY > H - 8) {
    const over = pullY - (H - 8); ready = Math.max(minReady, ready - over)
    floor = ready + depth; pullY = floor + pullExtra
  }
  if (floor + needBottom > H - 4) {
    pullExtra = Math.max(4, H - 4 - floor - needBottom + pullExtra)
    pullY = floor + pullExtra
  }
  CFG.pitReady = ready; CFG.pitDepth = depth; CFG.pullExtra = pullExtra
  PIT.ready = ready; PIT.floor = floor; PIT.pull = pullY
}

function geom() {
  const r = ballRadius(), iR = Math.max(20, CFG.innerR), minLane = 2 * r + CFG.lineW + 4
  const laneW = Math.max(minLane, CFG.laneW), oR = iR + laneW, cx = MAIN.R - iR, cy = ARC_CY
  const laneL = MAIN.R, laneR = MAIN.R + laneW, topY = cy - oR
  MAIN.T = topY
  const cornerR = Math.max(8, Math.min(CFG.cornerR, (MAIN.R - MAIN.L) / 2.2, (MAIN.B - topY) / 3))
  const halfLine = CFG.lineW * 0.5, rOut = oR - halfLine - r
  const pinDown = Math.max(0, Math.min(200, CFG.pinDown || 120))
  const vgap = Math.max(Math.ceil(CFG.pinR * 2 + 4), Math.min(100, CFG.pinRowGap || 40))
  const basePinTop = Math.max(topY + 40, 145)
  let pinTopY = basePinTop + pinDown
  pinTopY = Math.max(topY + 28, Math.min(MAIN.B - 70 - vgap * 4, pinTopY))
  return { iR, oR, laneW, cx, cy, laneL, laneR, laneCX: (laneL + laneR) / 2, rOut, cornerR, gateX: laneL, topY, pinTopY, pinVGap: vgap, outerTopX: cx, outerTopY: cy - oR, mouthX: MAIN.R, mouthY: cy }
}

function gateRest(G) {
  const surface = slopeY(G.gateX, G), bot = surface + 6, top = bot - GATE_H
  return { x: G.gateX, top, bot, surface }
}

function gateDraw(G) {
  const rest = gateRest(G), lift = gate * (GATE_H + 12)
  return { x: rest.x, top: rest.top - lift, bot: rest.bot - lift }
}

function btnRect(def) {
  return { x: def.cx - def.w / 2, y: def.cy - def.h / 2, w: def.w, h: def.h, r: def.r, cx: def.cx, cy: def.cy }
}

function bottomUILayout() {
  return {
    btnAdd: Object.assign(btnRect(UI_BTN_ADD), { label: '投珠' }),
    btnStart: Object.assign(btnRect(UI_BTN_START), { label: '开始' }),
    hole: HOPPER_HOLE,
    canStart: beads >= CFG.need && state === 'wait'
  }
}

function pointInRoundRect(p, b) {
  const x = p.x, y = p.y, rx = b.x, ry = b.y, rw = b.w, rh = b.h
  const rr = Math.min(b.r || 0, rw / 2, rh / 2)
  if (x < rx || x > rx + rw || y < ry || y > ry + rh) return false
  const lx = x < rx + rr, rxr = x > rx + rw - rr, ty = y < ry + rr, by = y > ry + rh - rr
  if (lx && ty) return Math.hypot(x - (rx + rr), y - (ry + rr)) <= rr
  if (rxr && ty) return Math.hypot(x - (rx + rw - rr), y - (ry + rr)) <= rr
  if (lx && by) return Math.hypot(x - (rx + rr), y - (ry + rh - rr)) <= rr
  if (rxr && by) return Math.hypot(x - (rx + rw - rr), y - (ry + rh - rr)) <= rr
  return true
}

function hitBottomUI(p) {
  const L = bottomUILayout(), pad = 14
  const inflate = b => ({ x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2, r: (b.r || 0) + pad })
  if (pointInRoundRect(p, inflate(L.btnStart))) return 'start'
  if (pointInRoundRect(p, inflate(L.btnAdd))) return 'add'
  if (Math.hypot(p.x - L.hole.x, p.y - L.hole.y) < L.hole.r + 16) return 'hopper'
  return null
}

function roundRectPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function canAddBead() {
  return (state === 'wait' || state === 'back') && totalBeads > 0
}

function doAddBead(n) {
  if (!(state === 'wait' || state === 'back')) { msg('球回斜坡后（上一局结束）可投珠', 'warn'); return }
  n = n || 1
  if (totalBeads <= 0) { msg('总珠不足', 'bad'); return }
  const take = Math.min(n, totalBeads)
  for (let i = 0; i < take; i++) setTimeout(() => spawnHopperBeadAnim(), i * 110)
  totalBeads -= take
  beads += take
  msg(beads >= CFG.need ? '' : '再投' + (CFG.need - beads) + ' 珠', 'ok')
}

function doStartFromUI() {
  if (beads >= CFG.need && state === 'wait') startRound()
  else if (state !== 'wait') msg(state === 'back' ? '等球到位后再点开始' : '本局进行中', 'warn')
  else msg('再投' + (CFG.need - beads) + ' 珠', 'bad')
}

function clearTrail() { trail.length = 0 }

function pushTrail() {
  const maxLen = Math.max(4, Math.min(120, CFG.trailLen | 0 || 75))
  if (trail.length) {
    const last = trail[trail.length - 1], dx = ball.x - last.x, dy = ball.y - last.y
    if (dx * dx + dy * dy < 1.2) return
  }
  trail.push({ x: ball.x, y: ball.y })
  while (trail.length > maxLen) trail.shift()
}

function fadeTrail() { if (trail.length) trail.shift() }

function slopeY(x, G) {
  const gateX = G.gateX, t = Math.max(0, Math.min(1, (x - MAIN.L) / Math.max(1, gateX - MAIN.L)))
  return SLOPE.top + 16 + t * (SLOPE.bot - SLOPE.top - 8)
}

function waitX(G) { return G.gateX - ballRadius() - 6 }

function msg(t, k) { statusMsg = t || ''; statusKind = k || '' }

function refreshScoreFromReward() { score = Math.floor(lifetimeReward / REWARD_PER_SCORE) }

function waitReadyMsg() {
  if (beads >= CFG.need) msg('可点开始', 'ok')
  else if (totalBeads > 0) msg(beads > 0 ? '再投' + (CFG.need - beads) + ' 珠' : '请投珠', 'bad')
  else msg('总珠不足', 'bad')
}

function ballReadyForPlunger(G) {
  if (state === 'wait' || state === 'entering' || state === 'fall' || state === 'back') return false
  if (zone === 'slope' || zone === 'main' || zone === 'arc' || zone === 'fall') return false
  if (zone !== 'lane' && zone !== 'pit') return false
  if (justLaunched > 0) return false
  const sg = springGeom(G), br = ballRadius()
  if (ball.x < G.laneL - br - 2 || ball.x > G.laneR + br + 2) return false
  if (ball.y < Math.max(G.cy + 80, PIT.ready - 90)) return false
  if (Math.abs(ball.x - sg.x) > br + 16) return false
  if (ball.y < sg.ballSeatY - 28 || ball.y > sg.botY + 24) return false
  if (Math.hypot(ball.vx, ball.vy) > 8 && !seatBall) return false
  return true
}

function buildPins() {
  const G = geom(); pins = []
  const pr = Math.max(2, Math.min(16, CFG.pinR || 3)); CFG.pinR = pr
  const minSide = pr + CFG.lineW * 0.5 + 1, maxSide = Math.max(minSide + 2, (MAIN.R - MAIN.L) / 4)
  let side = Math.max(minSide, Math.min(maxSide, CFG.pinSideDist || 11))
  const leftEdge = MAIN.L + side, rightEdge = MAIN.R - side, span = rightEdge - leftEdge
  if (span < 40) return
  const stepEven = span / 9, y0 = G.pinTopY, vgap = G.pinVGap
  let bigR = Math.max(4, Math.min(22, CFG.bigPinR || 11))
  let up = Math.max(20, Math.min(200, CFG.bigPinUp || 100))
  let arc = Math.max(0, Math.min(90, CFG.bigPinArc || 25))
  let sh = Math.max(-120, Math.min(120, CFG.bigPinShift || 0))
  let baseY = G.pinTopY - up
  const minY = G.topY + bigR + 18, maxY = G.pinTopY - bigR - pr - 8
  baseY = Math.max(minY, Math.min(maxY, baseY))
  const margin = bigR + 6
  let arcL = MAIN.L + margin + 8 + sh, arcR = MAIN.R - margin - 10 + sh
  const minL = MAIN.L + margin, maxR = MAIN.R - margin
  if (arcL < minL) { arcR += minL - arcL; arcL = minL }
  if (arcR > maxR) { arcL -= arcR - maxR; arcR = maxR }
  if (arcL < minL) arcL = minL
  if (arcR - arcL < 40) { const mid = (arcL + arcR) / 2; arcL = mid - 20; arcR = mid + 20 }
  const arcSpan = Math.max(40, arcR - arcL), arcDepth = arc
  for (let i = 1; i <= 5; i++) {
    const t = i / 6, x = arcL + t * arcSpan
    let y = baseY + arcDepth * Math.sin(Math.PI * t)
    y = Math.max(minY, Math.min(maxY, y))
    if (Math.hypot(x - G.cx, y - G.cy) > G.oR - G.laneW - bigR - 4 && y < G.cy + 30 && x > G.cx - 20) continue
    pins.push({ x, y, r: bigR, big: true })
  }
  let px = PRESET_BIG_PIN.x, py = PRESET_BIG_PIN.y
  px = Math.max(MAIN.L + bigR + 2, Math.min(MAIN.R - bigR - 2, px))
  py = Math.max(G.topY + bigR + 4, Math.min(MAIN.B - 60, py))
  PRESET_BIG_PIN.x = px; PRESET_BIG_PIN.y = py
  pins.push({ x: px, y: py, r: bigR, big: true, preset: true })
  for (let r = 0; r < 5; r++) {
    const y = y0 + r * vgap
    if (y > MAIN.B - 70) continue
    if (r % 2 === 0) {
      for (let c = 0; c < 10; c++) {
        const x = leftEdge + c * stepEven
        if (y < G.topY + 12) continue
        if (Math.hypot(x - G.cx, y - G.cy) > G.oR - G.laneW - 8 && y < G.cy + 20 && x > G.cx - 10) continue
        let o = false
        for (const bp of pins) { if (bp.big && Math.hypot(x - bp.x, y - bp.y) < bp.r + pr + 4) { o = true; break } }
        if (!o) pins.push({ x, y, r: pr })
      }
    } else {
      const sx = leftEdge + stepEven * 0.5
      for (let c = 0; c < 9; c++) {
        const x = sx + c * stepEven
        if (x < MAIN.L + pr || x > MAIN.R - pr || y < G.topY + 12) continue
        if (Math.hypot(x - G.cx, y - G.cy) > G.oR - G.laneW - 8 && y < G.cy + 20 && x > G.cx - 10) continue
        let o = false
        for (const bp of pins) { if (bp.big && Math.hypot(x - bp.x, y - bp.y) < bp.r + pr + 4) { o = true; break } }
        if (!o) pins.push({ x, y, r: pr })
      }
    }
  }
}

function buildChans() {
  const mults = [5, 8, 12, 15, 20, 50, 20, 15, 12, 8, 5]
  const n = 11, left = MAIN.L + 6, right = MAIN.R - 6, w = (right - left) / n
  chans = []
  for (let i = 0; i < n; i++) {
    const x0 = left + i * w
    chans.push({ i, x0, x1: x0 + w, cx: x0 + w / 2, w, mult: mults[i], on: false })
  }
}

function rollLitCount() {
  const total = LIT_COUNT_WEIGHTS.reduce((s, x) => s + x.w, 0)
  let r = Math.random() * total
  for (const item of LIT_COUNT_WEIGHTS) { r -= item.w; if (r <= 0) return item.n }
  return LIT_COUNT_WEIGHTS[LIT_COUNT_WEIGHTS.length - 1].n
}

function rollLights() {
  channelIdleBlink = false
  chans.forEach(c => c.on = false)
  litCount = rollLitCount()
  riskMult = RISK_TABLE[litCount] || 1
  const idx = chans.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]]
  }
  litIndices = idx.slice(0, litCount).sort((a, b) => a - b)
  litIndices.forEach(i => chans[i].on = true)
  msg('开始！亮 ' + litCount + ' 道 · 倍率 ×' + riskMult, 'ok')
}

function restoreChannelIdleBlink() {
  channelIdleBlink = true; litCount = 0; riskMult = 1; litIndices = []
  chans.forEach(c => c.on = false)
}

function placeWait() {
  const G = geom()
  state = 'wait'; zone = 'slope'
  gateT = 0; gateTimer = 0; scored = false; stuck = 0; landCool = 0
  plungerSnap = false; plungerPower = 0; plungerHitLock = 0; plungerHasHit = false
  pull = 0; seatBall = false; clearTrail(); justLaunched = 0
  ball.x = waitX(G); ball.y = slopeY(ball.x, G) - ballRadius()
  ball.vx = 0; ball.vy = 0
  restoreChannelIdleBlink()
  beads = 0
  waitReadyMsg()
}

function startRound() {
  if (beads < CFG.need || state !== 'wait') return
  bet = beads; beads = 0
  rewardBeads = 0
  rewardRoundLeft = 0
  rollLights()
  gateT = 1; gateTimer = GATE_OPEN_TIME
  state = 'entering'; zone = 'slope'
  clearTrail(); ball.vx = 1.8; ball.vy = 0
  scored = false; stuck = 0; landCool = 0
  plungerSnap = false; plungerHitLock = 0; plungerHasHit = false
  seatBall = false; pull = 0; justLaunched = 0
  const pendingTip = rewardQueue > 0 ? (' · 上局出珠动画剩余 ' + rewardQueue) : ''
  msg('押注 ' + bet + ' · 总珠 ' + totalBeads + ' · 本局奖励已清零' + pendingTip, 'warn')
}

function boom(x, y, c, n) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 1, life: 20, color: c }) }

function impactSpark(x, y, nx, ny, impact) {
  if (impact < 0.7) return
  const n = impact > 6 ? 10 : impact > 3 ? 6 : 3
  const power = Math.min(5, 1.2 + impact * 0.35)
  for (let i = 0; i < n; i++) {
    const spread = (Math.random() - 0.5) * 1.3
    const px = -ny * spread + nx * (0.25 + Math.random() * 0.8), py = nx * spread + ny * (0.25 + Math.random() * 0.8)
    parts.push({ x: x + nx * 2, y: y + ny * 2, vx: px * power + (Math.random() - 0.5) * 1.5, vy: py * power + (Math.random() - 0.5) * 1.5 - 0.5, life: 10 + (Math.random() * 12 | 0), color: impact > 4 ? '#ffe08a' : '#d5deea' })
  }
}

function onScore() {
  if (scored) return
  scored = true
  let hit = chans.find(c => ball.x >= c.x0 && ball.x < c.x1) || chans[0]
  for (const c of chans) if (Math.abs(ball.x - c.cx) < Math.abs(ball.x - hit.cx)) hit = c
  if (hit.on) {
    const gain = Math.max(1, bet) * riskMult
    enqueueRewardDrops(gain)
    msg('✓ 本局奖励出珠 ×' + gain + '（球回斜坡后可投新一局）', 'ok')
    boom(ball.x, ball.y, '#0f9', 16)
  } else {
    msg('✗ 未中亮道 · 球回斜坡后可投新一局', 'bad')
    boom(ball.x, ball.y, '#778', 8)
  }
  restoreChannelIdleBlink()
  bet = 0; state = 'fall'; zone = 'fall'
  gateT = 0; gateTimer = 0; seatBall = false; justLaunched = 0
}

function polar(G) {
  const dx = ball.x - G.cx, dy = ball.y - G.cy, dist = Math.hypot(dx, dy) || 1e-6, ang = Math.atan2(dy, dx)
  return { dx, dy, dist, ang, nx: dx / dist, ny: dy / dist }
}

function inOuterArcWall(ang, loose) {
  if (loose) return ang >= ARC_ANG_MIN - 0.35 && ang <= ARC_ANG_MAX + 0.35
  return ang >= ARC_ANG_MIN && ang <= ARC_ANG_MAX
}

function constrainOuterArc(G) {
  const p = polar(G), { dist, nx, ny, ang } = p
  if (!inOuterArcWall(ang, false) || dist <= G.rOut) return null
  ball.x = G.cx + nx * G.rOut; ball.y = G.cy + ny * G.rOut
  const vr = ball.vx * nx + ball.vy * ny, tx = Math.sin(ang), ty = -Math.cos(ang), vt = ball.vx * tx + ball.vy * ty
  if (vr > 0) {
    const e = Math.min(CFG.bounce, 0.30)
    ball.vx = nx * (-vr * e) + tx * (vt * 0.998)
    ball.vy = ny * (-vr * e) + ty * (vt * 0.998)
  }
  return 'out'
}

function exitArcToMain(G) {
  zone = 'main'; stuck = 0
  const r = ballRadius()
  if (ball.x > MAIN.R - r && ball.y < G.cy + 30) ball.x = MAIN.R - r - 0.5
  if (ball.y < G.cy + 12) {
    const need = 2.8 + Math.min(7, Math.hypot(ball.vx, ball.vy) * 0.18)
    if (ball.vx > -need) ball.vx = -need
  }
}

function resolveArc() {
  const G = geom(), r = ballRadius()
  let p = polar(G)
  let { dist, ang } = p
  if (zone === 'lane' || zone === 'pit') {
    const inMouth = ball.x >= G.laneL - 3 && ball.x <= G.laneR + 3 && ball.y <= G.cy + 14
    if (inMouth && inOuterArcWall(ang, true) && dist < G.oR + 14) {
      if (ball.vy < 1.5 || ball.y <= G.cy + 2) zone = 'arc'
    }
  }
  if (zone !== 'arc') {
    if (inOuterArcWall(ang, true) && dist < G.rOut + 10 && dist > G.rOut - G.laneW - 20 && ball.y < G.cy + 20 && ball.x > G.cx - 20) {
      if (zone === 'lane' || zone === 'pit') zone = 'arc'
    }
  }
  if (zone !== 'arc') return false
  const leftIntoMain = ball.x + r < MAIN.R - 1 && ball.y > G.cy + 6
  const deepMain = ball.x < G.cx - 8 && ball.y > G.cy + 4
  const outOfFan = !inOuterArcWall(ang, true)
  if (leftIntoMain || deepMain || (outOfFan && ball.x < MAIN.R - 2)) { exitArcToMain(G); return true }
  constrainOuterArc(G)
  p = polar(G); dist = p.dist; ang = p.ang
  const speed = Math.hypot(ball.vx, ball.vy)
  if (ang > -0.25 && ball.vy > 1.2 && ball.y > G.cy + 4 && ball.x >= G.laneL - 2 && ball.x <= G.laneR + 2) {
    zone = 'lane'; stuck = 0; return true
  }
  const near12 = ang <= -Math.PI / 2 + (speed > 18 ? 0.30 : 0.45), atCrown = ball.y <= G.topY + 36 || ball.x <= G.cx + 16
  if ((near12 && atCrown) || (ball.x < G.cx && ang < -0.6)) { exitArcToMain(G); return true }
  if (speed < 0.55 && inOuterArcWall(ang, false)) {
    stuck++
    if (stuck > 30) {
      ball.vx = Math.min(ball.vx, -3.5)
      if (ball.vy < 0.4) ball.vy = 1.0
      exitArcToMain(G); stuck = 0
    }
  } else stuck = Math.max(0, stuck - 1)
  return true
}

function collideSpringPlate(G) {
  if (justLaunched > 0 && ball.vy < 0) return
  if (seatBall && (pulling || pull > 0.001 || plungerSnap)) return
  if (zone !== 'lane' && zone !== 'pit' && state !== 'fly') return
  const sg = springGeom(G), r = ballRadius(), plateHalf = Math.max(16, 14 + r * 0.25)
  if (Math.abs(ball.x - sg.x) > plateHalf) return
  const seatY = sg.topY - r
  if (ball.y < seatY - 60 || ball.y > sg.botY + r + 10) return
  const pen = ball.y - seatY
  if (pen < -1.5 && ball.vy < 0) return
  if (pen >= -1.5) {
    ball.y = seatY
    if (!pulling) ball.x += (sg.x - ball.x) * 0.15
    if (ball.x - r < G.laneL) ball.x = G.laneL + r
    if (ball.x + r > G.laneR) ball.x = G.laneR - r
    const impact = Math.max(0, ball.vy)
    ball.vx *= 0.86
    if (landCool > 0) {
      if (ball.vy > 0) ball.vy = 0
    } else if (impact > 0.12) {
      let e = Math.max(0.18, Math.min(0.48, CFG.laneLandBounce || 0.38))
      e *= (0.55 + 0.45 * Math.min(1, impact / 8))
      const outVy = -impact * e
      if (impact < LAND_SLEEP_IMPACT || -outVy < LAND_SLEEP_VY) {
        ball.vy = 0
        if (Math.abs(ball.vx) < 0.35) ball.vx = 0
        if (Math.abs(ball.vx) < 0.45) seatBall = true
      } else {
        ball.vy = outVy; landCool = 2
        impactSpark(ball.x, sg.topY, 0, -1, impact)
      }
    } else {
      if (ball.vy > 0) ball.vy = 0
      if (Math.abs(ball.vx) < 0.3 && Math.abs(ball.vy) < 0.3) {
        ball.vx = 0; ball.vy = 0; seatBall = true
      }
    }
  }
}

function clampLane() {
  const G = geom(), r = ballRadius(), locked = seatBall && (pulling || pull > 0.001 || plungerSnap)
  if (locked) {
    const sg = springGeom(G)
    ball.x = sg.x; ball.y = sg.ballSeatY; ball.vx = 0; ball.vy = 0
    if (ball.x - r < G.laneL) ball.x = G.laneL + r
    if (ball.x + r > G.laneR) ball.x = G.laneR - r
    return
  }
  if (justLaunched <= 0 || ball.vy >= 0) {
    const wallE = Math.max(0.25, Math.min(0.55, CFG.laneWallBounce || 0.42))
    const hitSide = (wallX, outward) => {
      const nx = outward, limit = r + CFG.lineW * 0.5, pen = limit - Math.abs(ball.x - wallX)
      if (pen <= 0) return
      ball.x = wallX + nx * (limit + COL_EPS)
      const vn = ball.vx * nx
      if (vn >= 0) return
      const impact = -vn
      ball.vx = nx * (impact * (wallE + 0.05 * (1 - Math.min(1, impact / 10))))
      ball.vy *= 0.9
      if (impact < 1.2) ball.vx *= 0.75
      impactSpark(ball.x, ball.y, nx, 0, impact)
    }
    if (ball.y > G.cy + 4) {
      if (ball.x - r < G.laneL) hitSide(G.laneL, +1)
      if (ball.x + r > G.laneR) hitSide(G.laneR, -1)
    } else {
      if (ball.x + r > G.laneR) hitSide(G.laneR, -1)
      if (ball.x >= G.laneL - r - 2 && ball.y > G.cy - 6 && ball.x - r < G.laneL) hitSide(G.laneL, +1)
      const p = polar(G)
      if (inOuterArcWall(p.ang, true) && p.dist > G.rOut - 4) constrainOuterArc(G)
    }
  }
  if (landCool > 0) landCool--
  collideSpringPlate(G)
  if (ball.y + r > PIT.floor + 2) { ball.y = PIT.floor - r; if (ball.vy > 0) ball.vy = -ball.vy * 0.25 }
}

function launchBall(G) {
  if (plungerHasHit) return
  const p = Math.max(LAUNCH_MIN_PULL, Math.min(1, plungerPower || pull || 0))
  pull = 0; plungerSnap = false; plungerPower = 0
  const sg = springGeom(G), br = ballRadius()
  if (!ballReadyForPlunger(G) && !seatBall) {
    msg('请投珠', 'bad')
    seatBall = false
    return
  }
  ball.x = sg.x; ball.y = sg.ballSeatY
  ball.vx = (Math.random() - 0.5) * (CFG.randX || 0.12) * (0.6 + 1.4 * p)
  const hitSpd = launchSpeedFromPull(p, sg)
  ball.vy = -hitSpd
  plungerHasHit = true; seatBall = false; justLaunched = 3; shots++; landCool = 4
  impactSpark(ball.x, ball.y + br * 0.3, 0, -1, Math.max(0.8, hitSpd * 0.35))
  boom(sg.x, sg.topY, '#ffd76a', hitSpd > 18 ? 10 : 5)
  msg('弹射 ' + (p * 100 | 0) + '% → 速度 ' + hitSpd.toFixed(1), hitSpd < 10 ? 'ok' : 'warn')
  if (state !== 'fly' && state !== 'entering') state = 'fly'; zone = 'lane'
}

function updateSpring(G) {
  if (state === 'wait' || state === 'entering' || state === 'fall' || state === 'back') {
    if (seatBall) seatBall = false
    return
  }
  if (zone === 'slope' || zone === 'main' || zone === 'arc' || zone === 'fall') {
    if (seatBall) seatBall = false
    return
  }
  if (zone !== 'lane' && zone !== 'pit') return
  const sg = springGeom(G), br = ballRadius(), ready = ballReadyForPlunger(G)
  if (pulling || (pull > 0.001 && !plungerSnap)) {
    if (ready || seatBall) {
      if (!ready && seatBall) seatBall = false
      else {
        seatBall = true
        ball.x = sg.x; ball.y = sg.ballSeatY; ball.vx = 0; ball.vy = 0
        if (ball.x - br < G.laneL) ball.x = G.laneL + br
        if (ball.x + br > G.laneR) ball.x = G.laneR + br
      }
    }
    return
  }
  if (!pulling && pull < 0.01 && !plungerSnap && !plungerHasHit) {
    const seatY = sg.ballSeatY
    if (ready && ball.y >= seatY - 2 && ball.vy >= -0.35 && Math.abs(ball.vx) < 1.8) {
      seatBall = true
      ball.y = seatY; ball.vy = 0; ball.vx *= 0.65
      if (Math.abs(ball.vx) < 0.25) ball.vx = 0
      ball.x += (sg.x - ball.x) * 0.3
    } else if (seatBall && (!ready || ball.y < seatY - 10 || ball.vy < -2)) seatBall = false
  }
}

function collideOnePin(p, r, pinB) {
  let dx = ball.x - p.x, dy = ball.y - p.y, d2 = dx * dx + dy * dy
  const min = r + p.r
  if (d2 >= min * min) return false
  if (d2 < 1e-12) {
    const a = Math.random() * Math.PI * 2
    dx = Math.cos(a); dy = Math.sin(a); d2 = 1
  }
  const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, tx = -ny, ty = nx
  ball.x += nx * ((min - d) + 0.04); ball.y += ny * ((min - d) + 0.04)
  const vn = ball.vx * nx + ball.vy * ny, vt = ball.vx * tx + ball.vy * ty
  if (vn >= 0) return true
  let e = pinB + 0.08 * (1 - Math.min(1, Math.abs(vn) / 14))
  if (p.big) {
    e *= (0.85 + Math.random() * 0.22)
  }
  e = Math.max(0.12, Math.min(0.95, e))
  let vtOut = vt * Math.max(0.55, 0.88 - 0.06 * Math.min(1, Math.abs(vn) / 16))
  if (p.big) vtOut *= (0.92 + Math.random() * 0.12)
  ball.vx = nx * (-e * vn) + tx * vtOut
  ball.vy = ny * (-e * vn) + ty * vtOut
  return true
}

function collidePins(r, pinB) {
  const hits = []
  for (const p of pins) {
    const d2 = (ball.x - p.x) ** 2 + (ball.y - p.y) ** 2
    const min = r + p.r
    if (d2 < min * min) hits.push({ p, pen: min - Math.sqrt(Math.max(d2, 1e-12)) })
  }
  if (!hits.length) return
  hits.sort((a, b) => b.pen - a.pen)
  for (const h of hits) collideOnePin(h.p, r, pinB)
  if (CFG.pinDoublePass !== false) for (const p of pins) collideOnePin(p, r, pinB)
}

function collideDividerCapsule(wx, y1, y2, half, r, pinB) {
  const cy = Math.max(y1, Math.min(y2, ball.y))
  let dx = ball.x - wx, dy = ball.y - cy, d2 = dx * dx + dy * dy
  const min = r + half
  if (d2 >= min * min) return false
  if (d2 < 1e-12) { dx = ball.x >= wx ? 1 : -1; dy = 0.05; d2 = 1 }
  const d = Math.sqrt(d2), nx = dx / d, ny = dy / d
  ball.x += nx * ((min - d) + 0.06); ball.y += ny * ((min - d) + 0.06)
  const vn = ball.vx * nx + ball.vy * ny
  if (vn >= 0) return true
  const tx = -ny, ty = nx, vt = ball.vx * tx + ball.vy * ty
  const e = Math.max(0.16, Math.min(0.86, pinB))
  ball.vx = nx * (-e * vn) + tx * (vt * 0.9); ball.vy = ny * (-e * vn) + ty * (vt * 0.9)
  return true
}

function collideChannelDividers(r) {
  const chH = channelHeight()
  if (!chans.length || ball.y + r < MAIN.B - CHAN_DIV_EXT - 14 || ball.y - r > MAIN.B + chH + 14) return
  const half = 1.5, y1 = MAIN.B - CHAN_DIV_EXT - 6, y2 = MAIN.B + chH + 8
  const pinB = CFG.bounce * 0.82
  const xs = []
  for (let i = 0; i <= chans.length; i++) xs.push(i === 0 ? chans[0].x0 : i === chans.length ? chans[chans.length - 1].x1 : chans[i].x0)
  for (const wx of xs) collideDividerCapsule(wx, y1, y2, half, r, pinB)
}

function collideSegment(x1, y1, x2, y2, half, b) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy || 1e-8
  let t = ((ball.x - x1) * dx + (ball.y - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const px = x1 + t * dx, py = y1 + t * dy, ox = ball.x - px, oy = ball.y - py
  const d = Math.hypot(ox, oy), min = ballRadius() + half
  if (d >= min || d < 1e-8) return
  const nx = ox / d, ny = oy / d
  ball.x += nx * (min - d + COL_EPS); ball.y += ny * (min - d + COL_EPS)
  const vn = ball.vx * nx + ball.vy * ny
  if (vn < 0) {
    const tx = -ny, ty = nx, vt = ball.vx * tx + ball.vy * ty
    const e = Math.max(0.1, Math.min(0.9, b))
    ball.vx = nx * (-e * vn) + tx * vt * 0.92; ball.vy = ny * (-e * vn) + ty * vt * 0.92
  }
}

function collideCustomWalls() {
  for (const w of customWalls) {
    const ep = wallEndpoints(w)
    collideSegment(ep.x1, ep.y1, ep.x2, ep.y2, w.thick * 0.5, CFG.bounce)
  }
}

function collideMain() {
  const G = geom(), r = ballRadius(), topY = G.topY, cr = G.cornerR, ccx = MAIN.L + cr, ccy = topY + cr
  const pinB = CFG.bounce * 0.82
  if (ball.x < MAIN.L + cr + r + 4 && ball.y < topY + cr + r + 4 && ball.x <= ccx && ball.y <= ccy) {
    const dx = ball.x - ccx, dy = ball.y - ccy, d = Math.hypot(dx, dy) || 1e-4
    const limit = Math.max(COL_EPS, cr - r)
    if (d > limit) {
      const nx = dx / d, ny = dy / d
      ball.x = ccx + nx * limit; ball.y = ccy + ny * limit
      const dot = ball.vx * nx + ball.vy * ny
      if (dot > 0) {
        ball.vx -= (1 + Math.min(CFG.bounce, 0.28)) * dot * nx
        ball.vy -= (1 + Math.min(CFG.bounce, 0.28)) * dot * ny
      }
    }
  }
  if (ball.y > topY + cr && ball.x - r < MAIN.L) {
    ball.x = MAIN.L + r
    if (ball.vx < 0) ball.vx = -ball.vx * CFG.bounce
  }
  if (ball.x > MAIN.L + cr && ball.y - r < topY) {
    const p = polar(G)
    if (ball.x >= G.cx - 2 && inOuterArcWall(p.ang, true)) constrainOuterArc(G)
    else { ball.y = topY + r; if (ball.vy < 0) ball.vy = -ball.vy * Math.min(0.15, CFG.bounce * 0.4) }
  }
  if (ball.x + r > MAIN.R && ball.y > G.cy + 2) {
    ball.x = MAIN.R - r
    if (ball.vx > 0) ball.vx = -ball.vx * CFG.bounce
  }
  collidePins(r, pinB)
  collideCustomWalls()
  collideChannelDividers(r)
}

function collideFall() {
  const G = geom(), r = ballRadius()
  if (ball.y > G.topY + G.cornerR && ball.x - r < MAIN.L) { ball.x = MAIN.L + r; ball.vx = Math.abs(ball.vx) * 0.4 }
  if (ball.x + r > MAIN.R && ball.y > G.cy) { ball.x = MAIN.R - r; ball.vx = -Math.abs(ball.vx) * 0.4 }
  collideCustomWalls(); collideChannelDividers(r)
  const surface = slopeY(Math.min(Math.max(ball.x, MAIN.L), G.gateX - 1), G)
  if (ball.y + r >= surface) {
    ball.y = surface - r; ball.vy *= 0.15
    state = 'back'; zone = 'slope'
    if (ball.vx < 1.2) ball.vx = 1.3
  }
}

function collideSlope(pass) {
  const G = geom(), r = ballRadius(), opened = gate > 0.85, gateX = G.gateX
  if (!pass && !opened) {
    const half = CFG.lineW * 0.5 + r, rest = gateRest(G)
    if (Math.abs(ball.x - gateX) < half && ball.y > rest.surface - 20 && ball.y < rest.bot + 8) {
      if (ball.x + r > gateX - CFG.lineW * 0.5) { ball.x = gateX - CFG.lineW * 0.5 - r; ball.vx = Math.min(0, ball.vx) * 0.2 }
    }
  }
  if (ball.x - r < MAIN.L) { ball.x = MAIN.L + r; ball.vx = Math.abs(ball.vx) * 0.2 }
  collideCustomWalls()
  if (pass || opened || ball.x > gateX) {
    if (ball.x > gateX) {
      const t = Math.max(0, Math.min(1, (ball.x - gateX) / Math.max(1, G.laneCX - gateX)))
      const surface = slopeY(gateX, G) + t * (PIT.ready + r - slopeY(gateX, G))
      if (ball.y + r > surface) {
        ball.y = surface - r; ball.vy *= 0.12; ball.vx += CFG.slopeAcc
        if (ball.vx < 1) ball.vx = 1
      }
      if (ball.x - r < G.laneL) { ball.x = G.laneL + r; ball.vx = Math.abs(ball.vx) * 0.2 }
      if (ball.x + r > G.laneR) { ball.x = G.laneR - r; ball.vx = -Math.abs(ball.vx) * 0.2 }
    } else {
      const surface = slopeY(ball.x, G)
      if (ball.y + r > surface) { ball.y = surface - r; ball.vy *= 0.12; ball.vx += CFG.slopeAcc; if (ball.vx < 1) ball.vx = 1 }
    }
  } else {
    const surface = slopeY(ball.x, G)
    if (ball.y + r > surface) {
      ball.y = surface - r; ball.vy *= 0.12
      if (ball.x + r < gateX - 3) { ball.vx += CFG.slopeAcc; if (ball.vx < 1) ball.vx = 1 }
    }
  }
}

/** 积分步进：按 frameScale 标定到 60fps 手感 */
function integrateBall(div) {
  const fs = frameScale
  ball.vy += CFG.g / div * fs
  ball.x += ball.vx / div * fs
  ball.y += ball.vy / div * fs
  const fr = Math.pow(CFG.fric, fs / div)
  ball.vx *= fr; ball.vy *= fr
}

function stepFlySub(div) {
  const G = geom()
  const fs = frameScale
  const lockedByPlunger = seatBall && ballReadyForPlunger(G) && (pulling || pull > 0.001 || plungerSnap)
  if (!lockedByPlunger && justLaunched <= 0) {
    integrateBall(div)
  } else if (justLaunched > 0) {
    ball.x += ball.vx / div * fs; ball.y += ball.vy / div * fs
  }
  if (zone === 'main') { collideMain(); if (ball.y + ballRadius() >= MAIN.B) { onScore(); return } return }
  if (zone === 'arc') {
    resolveArc()
    if (zone === 'main') { collideMain(); if (ball.y + ballRadius() >= MAIN.B) { onScore(); return } }
    else if (zone === 'lane') { clampLane(); collideCustomWalls(); updateSpring(G) }
    return
  }
  clampLane(); collideCustomWalls(); updateSpring(G)
  if (ball.y <= G.cy + 12) {
    resolveArc()
    if (zone === 'main') { collideMain(); if (ball.y + ballRadius() >= MAIN.B) { onScore(); return } }
  }
  if (ball.y > H - 10) {
    if (ball.x > MAIN.R) {
      const sg = springGeom(G)
      ball.x = sg.x; ball.y = sg.ballSeatY; ball.vx = 0; ball.vy = 0; seatBall = true
    } else {
      ball.y = H - 20; onScore()
    }
  }
}

function updateGame(ts) {
  // dt 封顶 33ms，避免切后台回来一次跳太大
  const dt = Math.min(0.033, (ts - last) / 1000) || 0.016
  last = ts
  // ★ 60fps 基准：1.0；120fps≈0.5；30fps≈2.0（再封顶）
  frameScale = Math.min(2, Math.max(0.25, dt * 60))
  
  const G = geom()
  if (gate < gateT) gate = Math.min(gateT, gate + GATE_SPEED * dt)
  else if (gate > gateT) gate = Math.max(gateT, gate - GATE_SPEED * dt)
  if (gateT === 1 && gate >= 0.999) {
    if (gateTimer > 0) { gateTimer -= dt; if (gateTimer <= 0) { gateTimer = 0; gateT = 0 } }
  }
  if (plungerHitLock > 0) plungerHitLock--
  if (justLaunched > 0) justLaunched--
  if (seatBall && !ballReadyForPlunger(G) && !pulling) seatBall = false
  if (plungerSnap && !pulling && !plungerHasHit) {
    pull = 0; plungerSnap = false
    if (plungerPower >= LAUNCH_MIN_PULL) launchBall(G)
    else plungerPower = 0
  }
  updateHopperAnims()
  updateRewardDrops(dt)
  if (state === 'wait') {
    zone = 'slope'; fadeTrail(); seatBall = false
    const x = waitX(G)
    if (Math.abs(ball.x - x) > 1) {
      ball.vx += (x > ball.x ? 0.15 : -0.15) * frameScale
      ball.vy += CFG.g * frameScale
      collideSlope(false)
    } else {
      ball.x = x; ball.y = slopeY(x, G) - ballRadius()
      ball.vx = 0; ball.vy = 0
    }
  } else if (state === 'entering') {
    zone = ball.x > G.gateX ? 'pit' : 'slope'; seatBall = false
    for (let s = 0; s < 3; s++) {
      ball.vy += CFG.g / 3 * frameScale
      ball.x += ball.vx / 3 * frameScale; ball.y += ball.vy / 3 * frameScale
      collideSlope(true)
    }
    pushTrail()
    if (ball.x >= G.laneL + 2) {
      zone = 'lane'; state = 'fly'
      const sg = springGeom(G)
      if (ball.y < sg.ballSeatY - 10) ball.vy = Math.max(ball.vy, 2.0)
      msg('', 'ok')
    }
    if (gateT === 0 && gate < 0.2 && ball.x < G.gateX) { state = 'back'; if (ball.vx > 0.5) ball.vx = 0.5 }
  } else if (state === 'fall') {
    zone = 'fall'; seatBall = false
    for (let s = 0; s < 4; s++) {
      ball.vy += CFG.g / 4 * frameScale
      ball.x += ball.vx / 4 * frameScale; ball.y += ball.vy / 4 * frameScale
      ball.vx *= Math.pow(0.999, frameScale / 4); collideFall()
      if (state !== 'fall') break
    }
    pushTrail()
  } else if (state === 'back') {
    zone = 'slope'; seatBall = false
    for (let s = 0; s < 3; s++) {
      ball.vy += CFG.g / 3 * frameScale
      ball.x += ball.vx / 3 * frameScale; ball.y += ball.vy / 3 * frameScale
      collideSlope(false)
    }
    pushTrail()
    const surface = slopeY(Math.min(ball.x, G.gateX - 1), G)
    if (ball.y + ballRadius() > surface) ball.y = surface - ballRadius()
    if (ball.x + ballRadius() >= G.gateX - 3) {
      ball.x = waitX(G); ball.y = slopeY(ball.x, G) - ballRadius()
      ball.vx = 0; ball.vy = 0; state = 'wait'; clearTrail()
      bet = 0; seatBall = false; justLaunched = 0
      waitReadyMsg()
    }
  } else if (state === 'fly') {
    const sp = Math.hypot(ball.vx, ball.vy)
    const busy = pulling && ballReadyForPlunger(G)
    const sub = sp > 18 || busy ? 4 : 3
    for (let s = 0; s < sub; s++) {
      if (state !== 'fly') break
      stepFlySub(sub)
      if (state === 'fly') pushTrail()
    }
    const sp2 = Math.hypot(ball.vx, ball.vy)
    if (sp2 > 56) { ball.vx *= 56 / sp2; ball.vy *= 56 / sp2 }
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]
    p.x += p.vx * frameScale; p.y += p.vy * frameScale; p.vy += 0.12 * frameScale
    p.life -= frameScale
    if (p.life <= 0) parts.splice(i, 1)
  }
  updateUI()
}

function drawSpring(G) {
  const sg = springGeom(G), top = sg.topY, bot = sg.botY, x = sg.x, comp = sg.compress
  if (bot - top < 2) return
  const coils = Math.max(4, Math.round(6 + (1 - comp) * 5)), amp = Math.max(3.5, 9 - comp * 4), steps = coils * 4
  const c0 = comp > 0.55 ? '#ffe08a' : comp > 0.2 ? '#c5d4e8' : '#8fa3b8'
  ctx.fillStyle = '#6a7a8c'; ctx.fillRect(x - 12, bot - 3, 24, 6); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x - 12, bot - 3, 24, 6)
  ctx.strokeStyle = c0; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath()
  for (let i = 0; i <= steps; i++) { const t = i / steps, yy = top + t * (bot - top), xx = x + Math.sin(t * coils * Math.PI * 2) * amp; if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy) }
  ctx.stroke()
  ctx.fillStyle = comp > 0.35 ? '#ffd76a' : '#b0c0d0'; ctx.fillRect(x - 14, top - 4, 28, 6); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x - 14, top - 4, 28, 6)
}

function drawRod(G) {
  const sg = springGeom(G), x = sg.x
  ctx.strokeStyle = '#cfdfff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, sg.rodTop); ctx.lineTo(x, sg.rodBot); ctx.stroke(); ctx.lineCap = 'butt'
  const grd = ctx.createRadialGradient(x - 3, sg.knobY - 3, 2, x, sg.knobY, 12)
  grd.addColorStop(0, pull > 0.1 ? '#ff8a5b' : '#ff6b4a'); grd.addColorStop(1, '#884433')
  ctx.beginPath(); ctx.arc(x, sg.knobY, 12, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#3a4a5c'; ctx.fillRect(x - 14, sg.knobY + 10, 28, 8)
}

function drawTrail() {
  const n = trail.length; if (n < 2) return
  const baseA = Math.max(0.05, Math.min(1, CFG.trailAlpha)), maxW = Math.max(3, ballRadius() * 0.85)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (let i = 1; i < n; i++) {
    const t1 = i / (n - 1)
    ctx.strokeStyle = `rgba(180,200,220,${baseA * (0.08 + 0.62 * t1 * t1)})`
    ctx.lineWidth = maxW * (0.28 + 0.72 * t1)
    ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke()
  }
}

function drawBall() {
  const r = ballRadius(), x = ball.x, y = ball.y
  ctx.beginPath(); ctx.ellipse(x + r * 0.1, y + r * 0.82, r * 0.75, r * 0.26, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill()
  const body = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.05, x + r * 0.15, y + r * 0.2, r * 1.08)
  body.addColorStop(0, '#fff'); body.addColorStop(0.35, '#c5ccd4'); body.addColorStop(0.7, '#8e97a1'); body.addColorStop(1, '#2f353c')
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill()
  ctx.beginPath(); ctx.arc(x, y, r - 0.5, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(30,35,40,0.65)'; ctx.lineWidth = 1; ctx.stroke()
}

function drawMetalPin(p) {
  const x = p.x, y = p.y, r = p.r, isBig = !!p.big
  const body = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.05)
  if (isBig) { body.addColorStop(0, '#e8ecef'); body.addColorStop(0.4, '#4a5560'); body.addColorStop(1, '#050607') }
  else { body.addColorStop(0, '#f4f7fa'); body.addColorStop(0.55, '#8b949e'); body.addColorStop(1, '#2a3038') }
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill()
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r - 0.4), 0, Math.PI * 2)
  ctx.strokeStyle = isBig ? 'rgba(0,0,0,0.85)' : 'rgba(25,30,36,0.7)'; ctx.lineWidth = isBig ? 1.6 : 1; ctx.stroke()
}

function strokeSeg(x1, y1, x2, y2, color, w) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke() }

function drawCustomWalls() {
  customWalls.forEach(w => {
    const ep = wallEndpoints(w); ctx.lineCap = 'round'; ctx.strokeStyle = w.color || '#c8d4e0'; ctx.lineWidth = w.thick
    ctx.beginPath(); ctx.moveTo(ep.x1, ep.y1); ctx.lineTo(ep.x2, ep.y2); ctx.stroke()
  })
  ctx.lineCap = 'butt'
}

function idleBreathChannelIndex(t) {
  const n = chans.length || 11; if (n <= 1) return 0
  const cycle = 2 * (n - 1), step = Math.floor(t / CHAN_BREATH_MS) % cycle
  return step < n ? step : cycle - step
}

function drawChannels() {
  const y = MAIN.B, h = channelHeight(), t = Date.now()
  ctx.fillStyle = COLORS.bgChannel; ctx.fillRect(MAIN.L, y - 2, MAIN.R - MAIN.L, h + 6)
  const activeI = channelIdleBlink ? idleBreathChannelIndex(t) : -1
  const local = channelIdleBlink ? ((t % CHAN_BREATH_MS) / CHAN_BREATH_MS) : 0
  const breathWave = Math.sin(local * Math.PI)
  for (const c of chans) {
    const x = c.x0 + 1.5, w = c.w - 3; let lit = false, intensity = 0
    if (channelIdleBlink) { if (c.i === activeI) { lit = true; intensity = breathWave } }
    else { lit = !!c.on; intensity = lit ? (0.72 + Math.sin(t / 140 + c.i) * 0.28) : 0 }
    if (lit && intensity > 0.02) {
      const pulse = intensity; const g = ctx.createLinearGradient(x, y, x, y + h)
      if (channelIdleBlink) {
        g.addColorStop(0, `rgba(120,255,255,${0.95 * pulse})`)
        g.addColorStop(0.45, `rgba(255,60,200,${0.75 * pulse})`)
        g.addColorStop(1, `rgba(40,0,80,${0.9 * pulse})`)
      } else {
        g.addColorStop(0, `rgba(180,255,220,${0.95 * pulse})`); g.addColorStop(1, 'rgba(0,120,70,0.95)')
      }
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h)
      if (channelIdleBlink) {
        ctx.save(); ctx.shadowBlur = 10 + 18 * pulse; ctx.shadowColor = `rgba(0,255,255,${0.55 * pulse})`
        ctx.strokeStyle = `rgba(255,120,255,${0.5 + 0.5 * pulse})`; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); ctx.restore()
        ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.45 * pulse})`; ctx.fillRect(x + 2, y + 2, w - 4, Math.max(2, h * 0.12))
      } else {
        ctx.strokeStyle = 'rgba(255,230,80,0.85)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h)
        ctx.fillStyle = '#002a18'; ctx.font = 'bold 14px ' + FONT_LED; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(bet > 0 ? ('+' + (bet * riskMult)) : 'ON', c.cx, y + h * 0.5)
      }
    } else { ctx.fillStyle = COLORS.bgChannelOff; ctx.fillRect(x, y, w, h) }
    ctx.fillStyle = '#3a5470'; ctx.fillRect(c.x0 - 1.5, y - CHAN_DIV_EXT - 6, 3, h + CHAN_DIV_EXT + 12)
  }
  ctx.textBaseline = 'alphabetic'
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const G = geom(), topY = G.topY, cr = G.cornerR, rest = gateRest(G), gd = gateDraw(G), r = ballRadius()
  const colW = CFG.colWall, colI = CFG.colInner, colA = CFG.colArc, colG = CFG.colGate, colS = CFG.colSlope
  const retFloorY = Math.max(SLOPE.bot + 10, slopeY(MAIN.L, G) + 40), retRightX = G.gateX + 12, chanBottom = MAIN.B + channelHeight()
  ctx.clearRect(0, 0, W, H)

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, COLORS.bgCanvasTop); bg.addColorStop(1, COLORS.bgCanvasBot)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = COLORS.bgBoard === 'transparent' ? 'rgba(0,0,0,0)' : COLORS.bgBoard
  ctx.beginPath(); ctx.moveTo(MAIN.L + cr, topY); ctx.lineTo(G.outerTopX, G.outerTopY); ctx.lineTo(G.mouthX, G.mouthY)
  ctx.lineTo(MAIN.R, MAIN.B); ctx.lineTo(MAIN.L, MAIN.B); ctx.lineTo(MAIN.L, topY + cr)
  ctx.arc(MAIN.L + cr, topY + cr, cr, Math.PI, Math.PI * 1.5, false); ctx.closePath(); ctx.fill()

  strokeSeg(MAIN.L + cr, topY, G.outerTopX, G.outerTopY, colW, CFG.lineW)
  ctx.strokeStyle = colW; ctx.lineWidth = CFG.lineW
  ctx.beginPath(); ctx.arc(MAIN.L + cr, topY + cr, cr, Math.PI, Math.PI * 1.5, false); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(MAIN.L, topY + cr); ctx.lineTo(MAIN.L, retFloorY); ctx.lineTo(retRightX, retFloorY); ctx.stroke()
  strokeSeg(MAIN.L, MAIN.B, MAIN.R, MAIN.B, colW, CFG.lineW); strokeSeg(MAIN.R, MAIN.B, MAIN.R, G.mouthY, colW, CFG.lineW)

  const ll = G.laneL, rr = G.laneR, lw = G.laneW
  ctx.fillStyle = COLORS.bgLane === 'transparent' ? 'rgba(0,0,0,0)' : COLORS.bgLane
  ctx.fillRect(ll, G.cy, lw, Math.max(8, PIT.floor - G.cy + 60))
  strokeSeg(ll, G.cy, ll, rest.top, colI, CFG.lineW); if (rest.bot < PIT.floor - 1) strokeSeg(ll, rest.bot, ll, PIT.floor, colI, CFG.lineW)
  strokeSeg(rr, G.cy, rr, PIT.floor, colW, CFG.lineW); strokeSeg(ll, PIT.floor, rr, PIT.floor, colW, CFG.lineW)

  const sg = springGeom(G)
  ctx.strokeStyle = 'rgba(92,225,255,0.35)'; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(ll, sg.ballSeatY); ctx.lineTo(rr, sg.ballSeatY); ctx.stroke(); ctx.setLineDash([])
  const canHit = ballReadyForPlunger(G), boxTop = Math.min(sg.topY, PIT.ready) - 4
  ctx.fillStyle = canHit ? 'rgba(60,180,255,0.10)' : (COLORS.bgLaunchBox === 'transparent' ? 'rgba(0,0,0,0)' : COLORS.bgLaunchBox)
  ctx.fillRect(ll - 1, boxTop, lw + 2, Math.max(20, PIT.floor - boxTop))
  ctx.strokeStyle = canHit ? '#5ce1ff' : colW; ctx.strokeRect(ll - 1, boxTop, lw + 2, Math.max(20, PIT.floor - boxTop))

  ctx.strokeStyle = colA; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.oR, -Math.PI / 2, 0, false); ctx.stroke()
  for (const p of pins) drawMetalPin(p)
  drawCustomWalls()

  ctx.beginPath(); ctx.moveTo(MAIN.L, chanBottom); ctx.lineTo(retRightX, chanBottom); ctx.lineTo(retRightX, retFloorY); ctx.lineTo(MAIN.L, retFloorY); ctx.closePath()
  ctx.fillStyle = COLORS.bgReturn === 'transparent' ? 'rgba(0,0,0,0)' : COLORS.bgReturn; ctx.fill()

  strokeSeg(MAIN.L, slopeY(MAIN.L, G), G.gateX, slopeY(G.gateX, G), colS, CFG.lineW)
  strokeSeg(G.gateX, slopeY(G.gateX, G), G.laneCX, PIT.ready + r, colS, CFG.lineW)
  strokeSeg(gd.x, gd.top, gd.x, gd.bot, colG, CFG.lineW)
  drawChannels(); drawSpring(G); drawRod(G)
  drawRewardHole(); drawRewardDrops()
  drawBottomUI(); drawHopperAnims(); drawTrail(); drawBall()
  for (const p of parts) { ctx.globalAlpha = Math.max(0, p.life / 40); ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4) } ctx.globalAlpha = 1

  drawTopHUD()
  drawColorLabels()
}

function getEventPoint(e) {
  const rect = cv.getBoundingClientRect()
  let clientX, clientY
  if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX
    clientY = e.changedTouches[0].clientY
  } else if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  const rw = rect.width || 1, rh = rect.height || 1
  return { x: (clientX - rect.left) * (W / rw), y: (clientY - rect.top) * (H / rh) }
}

function hitPull(p) {
  const G = geom(), sg = springGeom(G)
  return Math.hypot(p.x - sg.x, p.y - sg.knobY) < 36
    || Math.hypot(p.x - sg.x, p.y - sg.seatY) < 28
    || (Math.abs(p.x - sg.x) < 22 && p.y >= sg.rodTop && p.y <= sg.knobY + 20)
}

function onPointerDown(e) {
  if (e.preventDefault) e.preventDefault()
  const p = getEventPoint(e), uiHit = hitBottomUI(p)
  if (uiHit) {
    uiPress = uiHit
    if (uiHit === 'add' || uiHit === 'hopper') doAddBead(1)
    else if (uiHit === 'start') doStartFromUI()
    return
  }
  if (hitPull(p)) {
    pulling = true; plungerSnap = false; y0 = p.y; p0 = pull; const G = geom()
    if (ballReadyForPlunger(G)) { const sg = springGeom(G); seatBall = true; ball.x = sg.x; ball.y = sg.ballSeatY; ball.vx = 0; ball.vy = 0 }
    else seatBall = false
  }
}

function onPointerMove(e) {
  if (!pulling) return
  if (e.preventDefault) e.preventDefault()
  const p = getEventPoint(e)
  pull = Math.max(0, Math.min(1, p0 + (p.y - y0) / 100))
  const G = geom()
  if (seatBall && ballReadyForPlunger(G)) { const sg = springGeom(G); ball.y = sg.ballSeatY; ball.x += (sg.x - ball.x) * 0.7; ball.vx = 0; ball.vy = 0 }
  else if (seatBall && !ballReadyForPlunger(G)) seatBall = false
}

function onPointerUp(e) {
  if (e && e.preventDefault) e.preventDefault()
  if (uiPress) { uiPress = null; return }
  if (!pulling) return; pulling = false
  if (pull >= LAUNCH_MIN_PULL) { plungerPower = Math.max(LAUNCH_MIN_PULL, Math.min(1, pull)); plungerHasHit = false; plungerHitLock = 0; launchBall(geom()) }
  else { pull = 0; plungerSnap = false; plungerPower = 0 }
}

function hudTarget() {
  if (HUD.sel === 'total') return HUD.total
  if (HUD.sel === 'beads') return HUD.beads
  if (HUD.sel === 'reward') return HUD.reward
  if (HUD.sel === 'status') return HUD.status
  return null
}

function moveBigPin(dx, dy) {
  PRESET_BIG_PIN.x += dx; PRESET_BIG_PIN.y += dy; buildPins()
}

function onKeyDown(e) {
  const k = e.key
  if (k === 'Tab') {
    e.preventDefault()
    const order = ['total', 'beads', 'reward', 'status', 'bigPin']
    HUD.sel = order[(order.indexOf(HUD.sel) + 1) % order.length]
    return
  }
  if (k === 'c' || k === 'C') { showColorLabels = !showColorLabels; return }
  if (k === 'h' || k === 'H') { HUD.showHint = !HUD.showHint; return }
  if (k === '0') { HUD.sel = 'total'; return }
  if (k === '1') { HUD.sel = 'beads'; return }
  if (k === '2') { HUD.sel = 'reward'; return }
  if (k === '3') { HUD.sel = 'status'; return }
  if (k === '4' || k === 'p' || k === 'P') { HUD.sel = 'bigPin'; return }

  const sp = e.shiftKey ? HUD.step * 5 : HUD.step
  let dx = 0, dy = 0
  if (k === 'ArrowLeft') dx = -sp; else if (k === 'ArrowRight') dx = sp
  else if (k === 'ArrowUp') dy = -sp; else if (k === 'ArrowDown') dy = sp; else return
  e.preventDefault()
  if (HUD.sel === 'bigPin') { moveBigPin(dx, dy); return }
  const t = hudTarget(); if (!t) return
  t.x = Math.max(0, Math.min(W - 40, t.x + dx))
  t.y = Math.max(0, Math.min(H - 20, t.y + dy))
}

function loop(ts) {
  updateGame(ts || performance.now())
  draw()
  animFrameId = requestAnimationFrame(loop)
}

function startLoop() {
  if (loopStarted) return
  loopStarted = true
  last = performance.now()
  animFrameId = requestAnimationFrame(loop)
}

let resizeHandler = null

function fitCanvasToPhone() {
  if (!cv) return
  const wrap = cv.parentElement
  const hasWindow = typeof window !== 'undefined'
  const aw = Math.max(1, (wrap && wrap.clientWidth) || (hasWindow ? window.innerWidth : BASE_W))
  const ah = Math.max(1, (wrap && wrap.clientHeight) || (hasWindow ? window.innerHeight : BASE_H))
  let scale = Math.min(aw / BASE_W, ah / BASE_H)
  cssScale = scale
  dpr = hasWindow ? Math.min(3, Math.max(1, window.devicePixelRatio || 1)) : 1
  const w = Math.floor(BASE_W * scale)
  const h = Math.floor(BASE_H * scale)
  canvasStyle.width = w + 'px'
  canvasStyle.height = h + 'px'
  // DPR 缩放：实际 canvas 分辨率按 dpr 放大
  const bw = Math.round(BASE_W * dpr), bh = Math.round(BASE_H * dpr)
  if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.imageSmoothingEnabled = true
}

onMounted(() => {
  cv = gameCanvas.value
  ctx = cv.getContext('2d', { alpha: false })
  W = BASE_W
  H = BASE_H
  refreshSlope()
  refreshPit()
  buildPins()
  buildChans()
  placeWait()
  updateUI()
  fitCanvasToPhone()
  startLoop()
  
  if (typeof window !== 'undefined') {
    resizeHandler = () => setTimeout(fitCanvasToPhone, 100)
    window.addEventListener('resize', resizeHandler)
    window.addEventListener('orientationchange', resizeHandler)
  }
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (typeof window !== 'undefined' && resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    window.removeEventListener('orientationchange', resizeHandler)
  }
})

function drawRewardHole() {
  const { x, y, r } = REWARD_HOLE
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.lineWidth = 1; ctx.stroke()
  if (rewardQueue > 0) {
    ctx.fillStyle = '#3dff8a'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText('剩余 ' + rewardQueue, x, y + r + 4)
  }
}

function drawRewardDrops() {
  for (const b of rewardDrops) {
    ctx.globalAlpha = Math.max(0, b.alpha); const r = b.r
    ctx.beginPath(); ctx.ellipse(b.x + r * 0.08, b.y + r * 0.72, r * 0.7, r * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill()
    const body = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.4, r * 0.05, b.x + r * 0.1, b.y + r * 0.15, r * 1.05)
    body.addColorStop(0, '#fff'); body.addColorStop(0.35, '#c5ccd4'); body.addColorStop(0.7, '#8e97a1'); body.addColorStop(1, '#2f353c')
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill()
    ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(0.5, r - 0.5), 0, Math.PI * 2); ctx.strokeStyle = 'rgba(30,35,40,0.55)'; ctx.lineWidth = 1; ctx.stroke()
    const hx = b.x + Math.cos(b.rot) * r * 0.35, hy = b.y + Math.sin(b.rot) * r * 0.35
    ctx.beginPath(); ctx.arc(hx, hy, Math.max(0.7, r * 0.12), 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill()
  }
  ctx.globalAlpha = 1
}

function spawnHopperBeadAnim() {
  const jitter = (Math.random() - 0.5) * 3
  hopperAnims.push({
    x: HOPPER_SPAWN.x + jitter, y: HOPPER_SPAWN.y + (Math.random() - 0.5) * 2,
    vx: -0.15 + Math.random() * 0.1, vy: 0.8 + Math.random() * 0.5,
    r: Math.max(7, ballRadius() * 0.82), rot: Math.random() * Math.PI * 2,
    spin: -(0.15 + Math.random() * 0.2), phase: 'appear', alpha: 0, t: 0, suckT: 0, scale: 1, trail: []
  })
}

function projectOnWall4(a, track) {
  const dx = a.x - track.farX, dy = a.y - track.farY
  let t = (dx * track.tx + dy * track.ty); t = Math.max(0, Math.min(track.len, t))
  const px = track.farX + track.tx * t, py = track.farY + track.ty * t
  return { t, px, py, surfX: px + track.nx * (track.half + a.r * 0.92), surfY: py + track.ny * (track.half + a.r * 0.92) }
}

function updateHopperAnims() {
  const hx = HOPPER_HOLE.x, hy = HOPPER_HOLE.y, hr = HOPPER_HOLE.r, track = wall4Track(), gAlong = 0.22
  const fs = frameScale
  for (let i = hopperAnims.length - 1; i >= 0; i--) {
    const a = hopperAnims[i]; a.t += fs
    if (a.phase === 'appear') {
      a.alpha = Math.min(1, a.t / 6); a.vy += 0.18 * fs; a.x += a.vx * fs; a.y += a.vy * fs; a.rot += a.spin * fs
      if (a.t >= 6) { a.phase = 'fall'; a.alpha = 1 }
    } else if (a.phase === 'fall') {
      a.vy += 0.28 * fs; a.x += a.vx * fs; a.y += a.vy * fs; a.rot += (a.spin + a.vx * 0.06) * fs
      const hit = projectOnWall4(a, track)
      const toSurfX = hit.surfX - a.x, toSurfY = hit.surfY - a.y
      const normal = toSurfX * track.nx + toSurfY * track.ny
      if (normal <= 2 && hit.t > 2 && hit.t < track.len - 2 && a.y >= hit.surfY - a.r * 0.3) {
        a.phase = 'roll'; a.x = hit.surfX; a.y = hit.surfY
        const vT = a.vx * track.tx + a.vy * track.ty
        a.vx = track.tx * Math.max(0.6, Math.abs(vT) * 0.4 + 0.8); a.vy = track.ty * Math.max(0.6, Math.abs(vT) * 0.4 + 0.8); a.spin = -0.35
      }
      if (Math.hypot(a.x - hx, a.y - hy) < hr + a.r * 1.1) { a.phase = 'suck'; a.suckT = 0 }
      if (a.t > 180) hopperAnims.splice(i, 1)
    } else if (a.phase === 'roll') {
      const speed = Math.hypot(a.vx, a.vy), acc = (gAlong + 0.08) * fs
      a.vx = track.tx * (Math.min(5.5, Math.max(1.2, speed) + acc))
      a.vy = track.ty * (Math.min(5.5, Math.max(1.2, speed) + acc))
      a.x += a.vx * fs; a.y += a.vy * fs
      const hit = projectOnWall4(a, track); a.x = hit.surfX; a.y = hit.surfY
      a.rot += (a.spin - (speed * 0.12)) * fs; a.spin = -(0.25 + speed * 0.08)
      if (hit.t >= track.len - 8 || Math.hypot(a.x - hx, a.y - hy) < hr + a.r * 2.2) {
        a.phase = 'toHole'; a.vx = (hx - a.x) * 0.08 - 0.4; a.vy = (hy - a.y) * 0.08 + 0.6
      }
      if (a.t > 200) hopperAnims.splice(i, 1)
    } else if (a.phase === 'toHole') {
      a.vx += (hx - a.x) * 0.05 * fs; a.vy += ((hy - a.y) * 0.05 + 0.12) * fs; a.vx *= Math.pow(0.96, fs)
      a.x += a.vx * fs; a.y += a.vy * fs; a.rot += a.spin * fs
      if (Math.hypot(a.x - hx, a.y - hy) < hr + a.r * 0.85) { a.phase = 'suck'; a.suckT = 0 }
      if (a.t > 220) hopperAnims.splice(i, 1)
    } else if (a.phase === 'suck') {
      a.suckT += fs; const k = Math.min(1, a.suckT / 12)
      a.x += (hx - a.x) * (0.3 + k * 0.45) * fs; a.y += (hy - a.y) * (0.3 + k * 0.45) * fs
      a.scale = 1 - k; a.alpha = 1 - k * 0.95; a.rot += a.spin * 2.2 * fs
      if (k >= 1) hopperAnims.splice(i, 1)
    }
    if (a.phase !== 'suck' || a.suckT < 6) { a.trail.push({ x: a.x, y: a.y, a: a.alpha * 0.5 }); if (a.trail.length > 10) a.trail.shift() }
  }
}

function drawHopperAnims() {
  for (const a of hopperAnims) {
    for (let i = 0; i < a.trail.length; i++) {
      const t = a.trail[i], u = i / a.trail.length
      ctx.globalAlpha = (t.a || 0.3) * u * 0.5
      ctx.beginPath(); ctx.arc(t.x, t.y, a.r * (0.3 + 0.45 * u) * (a.scale || 1), 0, Math.PI * 2); ctx.fillStyle = '#b8c4d0'; ctx.fill()
    }
    ctx.globalAlpha = a.alpha != null ? a.alpha : 1
    const sc = a.scale != null ? a.scale : 1, rr = a.r * sc; if (rr < 0.4) { ctx.globalAlpha = 1; continue }
    ctx.beginPath(); ctx.ellipse(a.x + rr * 0.08, a.y + rr * 0.75, rr * 0.7, rr * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill()
    const body = ctx.createRadialGradient(a.x - rr * 0.35, a.y - rr * 0.4, rr * 0.05, a.x + rr * 0.1, a.y + rr * 0.15, rr * 1.05)
    body.addColorStop(0, '#fff'); body.addColorStop(0.35, '#c5ccd4'); body.addColorStop(0.7, '#8e97a1'); body.addColorStop(1, '#2f353c')
    ctx.beginPath(); ctx.arc(a.x, a.y, rr, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill()
    ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(0.5, rr - 0.5), 0, Math.PI * 2); ctx.strokeStyle = 'rgba(30,35,40,0.55)'; ctx.lineWidth = 1; ctx.stroke()
    const hx2 = a.x + Math.cos(a.rot) * rr * 0.35, hy2 = a.y + Math.sin(a.rot) * rr * 0.35
    ctx.beginPath(); ctx.arc(hx2, hy2, Math.max(0.8, rr * 0.12), 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); ctx.globalAlpha = 1
  }
}

function drawUIButton(b, opt) {
  const { pressed, enabled, grad, textColor } = opt; const yOff = pressed && enabled ? 1 : 0
  roundRectPath(b.x, b.y + yOff, b.w, b.h, b.r)
  const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h); g.addColorStop(0, grad[0]); g.addColorStop(1, grad[1])
  ctx.fillStyle = g; ctx.globalAlpha = enabled ? 1 : 0.5; ctx.fill(); ctx.globalAlpha = 1
  ctx.strokeStyle = enabled ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.stroke()
  if (enabled) { roundRectPath(b.x + 2, b.y + 2 + yOff, b.w - 4, b.h * 0.42, Math.max(2, b.r - 2)); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill() }
  ctx.fillStyle = textColor; ctx.font = 'bold 16px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + yOff + 0.5)
}

function drawHopperHole() {
  const { x, y, r } = HOPPER_HOLE
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.lineWidth = 1; ctx.stroke()
  if (uiPress === 'hopper') { ctx.beginPath(); ctx.arc(x, y, r + 1, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,215,100,0.7)'; ctx.lineWidth = 2; ctx.stroke() }
}

function drawBottomUI() {
  const L = bottomUILayout(), canAdd = canAddBead()
  drawHopperHole()
  drawUIButton(L.btnAdd, { pressed: uiPress === 'add' || uiPress === 'hopper', enabled: canAdd, grad: canAdd ? ['#ffd76a', '#ff9f1a'] : ['#3a4a58', '#2a3540'], textColor: canAdd ? '#2a1600' : '#6a7a88' })
  drawUIButton(L.btnStart, { pressed: uiPress === 'start', enabled: L.canStart, grad: L.canStart ? ['#3dff8a', '#28b7ff'] : ['#3a4a58', '#2a3540'], textColor: L.canStart ? '#002018' : '#6a7a88' })
}

function drawTopHUD() {
  const tot = HUD.total, b = HUD.beads, r = HUD.reward, s = HUD.status
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.font = '18px ' + FONT_LED
  ctx.fillStyle = HUD.sel === 'total' ? '#ffd76a' : COLORS.bgHudText
  ctx.fillText(tot.label + ' ' + totalBeads, tot.x, tot.y)
  ctx.fillStyle = HUD.sel === 'beads' ? '#5ce1ff' : COLORS.bgHudText
  ctx.fillText(b.label + ' ' + beads, b.x, b.y)
  ctx.fillStyle = HUD.sel === 'reward' ? '#9dffc0' : '#3dff8a'
  const pendingRound = rewardRoundLeft > 0 ? (' (+' + rewardRoundLeft + ')') : ''
  ctx.fillText(r.label + ' ' + rewardBeads + pendingRound, r.x, r.y)
  if (statusMsg) {
    const col = statusKind === 'bad' ? '#f66' : statusKind === 'ok' ? '#3dff8a' : statusKind === 'warn' ? '#fc0' : '#9cf'
    ctx.font = '14px ' + FONT_LED
    ctx.fillStyle = col; ctx.fillText(statusMsg, s.x, s.y)
  }
}

function drawColorLabels() {
  if (!showColorLabels) return
  ctx.font = 'bold 12px ' + FONT_LED; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  const tag = { t: 'fs ' + frameScale.toFixed(2) + ' dpr ' + dpr.toFixed(1), x: 8, y: H - 20 }
  const tw = ctx.measureText(tag.t).width
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(tag.x - 3, tag.y - 8, tw + 6, 16)
  ctx.fillStyle = '#ffe08a'; ctx.fillText(tag.t, tag.x, tag.y)
}
</script>

<style scoped>
.pinball-bounce-game {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0c;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  padding: 
    env(safe-area-inset-top, 0px)
    env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px)
    env(safe-area-inset-left, 0px);
  box-sizing: border-box;
  z-index: 100;
}

#gameWrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

canvas {
  display: block;
  background: #323c53;
  border: 0;
  border-radius: 0;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  image-rendering: auto;
}
</style>