<template>
  <div class="plague-game">
    <canvas ref="particleCanvas" class="particle-bg"></canvas>

    <!-- ===== 开始界面 ===== -->
    <div class="start-screen" v-if="phase==='menu'">
      <div class="start-bg-anim"></div>
      <div class="start-content">
        <div class="start-virus-anim">🦠</div>
        <h2 class="start-title">瘟疫公司</h2>
        <p class="start-sub">PLAGUE INC.</p>
        <div class="pathogen-grid">
          <div v-for="p in pathogenTypes" :key="p.id" class="pathogen-card"
               :class="{picked: pickedPathogen===p.id}" @click="pickedPathogen=p.id">
            <span class="patho-icon">{{ p.icon }}</span>
            <span class="patho-name">{{ p.name }}</span>
            <span class="patho-diff">{{ p.diff }}</span>
            <span class="patho-desc">{{ p.desc }}</span>
          </div>
        </div>
        <button class="act-btn act-spread start-btn" @click="startGame" :disabled="!pickedPathogen">
          <span>开始感染世界</span>
          <svg viewBox="0 0 24 24" class="act-icon"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>

    <!-- ===== 游戏界面 ===== -->
    <template v-if="phase==='play'">
      <h2 class="game-title">
        <span class="title-icon">🦠</span>
        <span class="title-text">瘟疫公司</span>
        <span class="title-sub">{{ currentPathogen?.name || '' }}</span>
      </h2>

      <!-- HUD -->
      <div class="hud-bar">
        <div class="hud-stat" v-for="s in hudStats" :key="s.key">
          <div class="hud-ring" v-if="s.ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" :stroke="s.ringBg" stroke-width="3"/>
              <circle cx="18" cy="18" r="15.5" fill="none" :stroke="s.ringColor" stroke-width="3" stroke-linecap="round"
                :stroke-dasharray="`${s.pct * 0.974} 97.4`" stroke-dashoffset="24.35" class="ring-progress" style="transform:rotate(-90deg);transform-origin:center"/>
            </svg>
            <span class="ring-icon">{{ s.icon }}</span>
          </div>
          <span class="hud-big-icon" v-else>{{ s.icon }}</span>
          <div class="hud-info">
            <span class="hud-num" :class="s.numClass">{{ s.value }}</span>
            <span class="hud-label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- 解药 -->
      <div class="cure-wrap" v-if="cureStarted">
        <div class="cure-inner">
          <div class="cure-top"><span>💊 解药研发</span>
            <span class="cure-pct" :class="{'danger':cureProgress>70}">{{ Math.floor(cureProgress) }}%</span>
          </div>
          <div class="cure-track"><div class="cure-fill" :style="{width:cureProgress+'%'}"
            :class="{'cure-danger':cureProgress>70,'cure-warn':cureProgress>40&&cureProgress<=70}"><div class="cure-shimmer"></div></div></div>
        </div>
      </div>

      <!-- 地图 -->
      <div class="map-wrapper">
        <canvas ref="mapCanvas" class="map-canvas-overlay"></canvas>
        <svg viewBox="0 0 900 460" class="world-svg" @click="onMapClick">
          <defs>
            <linearGradient id="ocean-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#070e1f"/><stop offset="40%" stop-color="#0d2040"/><stop offset="100%" stop-color="#091830"/>
            </linearGradient>
            <radialGradient id="pulse-red"><stop offset="0%" stop-color="#ef4444" stop-opacity="0.5"><animate attributeName="stop-opacity" values="0.5;0.12;0.5" dur="2s" repeatCount="indefinite"/></stop><stop offset="100%" stop-color="#ef4444" stop-opacity="0"/></radialGradient>
            <radialGradient id="pulse-orange"><stop offset="0%" stop-color="#f97316" stop-opacity="0.4"><animate attributeName="stop-opacity" values="0.4;0.08;0.4" dur="2.5s" repeatCount="indefinite"/></stop><stop offset="100%" stop-color="#f97316" stop-opacity="0"/></radialGradient>
            <filter id="glow-sm"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="inner-shadow">
              <feComponentTransfer in="SourceAlpha"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>
              <feGaussianBlur stdDeviation="3"/><feOffset dx="0" dy="2" result="off"/>
              <feFlood flood-color="#000" flood-opacity="0.35" result="color"/><feComposite in2="off" operator="in"/><feComposite in2="SourceAlpha" operator="in"/>
              <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode/></feMerge>
            </filter>
            <linearGradient v-for="(c,i) in regionGradients" :key="'rg'+i" :id="'rf-'+i" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" :stop-color="c[0]"/><stop offset="100%" :stop-color="c[1]"/>
            </linearGradient>
            <!-- 海洋波纹 -->
            <pattern id="wave-pat" x="0" y="0" width="60" height="20" patternUnits="userSpaceOnUse">
              <path d="M0,10 Q15,0 30,10 T60,10" fill="none" stroke="rgba(96,165,250,0.04)" stroke-width="0.8">
                <animateTransform attributeName="transform" type="translate" values="0,0;60,0" dur="8s" repeatCount="indefinite"/>
              </path>
            </pattern>
          </defs>
          <rect width="900" height="460" fill="url(#ocean-grad)" rx="12"/>
          <rect width="900" height="460" fill="url(#wave-pat)" rx="12"/>
          <g stroke="rgba(96,165,250,0.05)" stroke-width="0.5" fill="none">
            <line v-for="i in 9" :key="'la'+i" x1="30" :y1="i*46" x2="870" :y2="i*46"/>
            <line v-for="i in 18" :key="'lo'+i" :x1="i*50" y1="10" :x2="i*50" y2="450"/>
          </g>

          <!-- 航线 -->
          <g v-for="(route,ri) in flightRoutes" :key="'route'+ri" opacity="0.08">
            <path :d="route.d" fill="none" stroke="#60a5fa" stroke-width="0.6" stroke-dasharray="4 6"/>
          </g>

          <!-- 区域 -->
          <g v-for="(r, i) in regions" :key="'reg'+i" class="region"
             :class="{selected:selectedRegion===i, hovered:hoveredRegion===i}"
             @click.stop="selectRegion(i)" @mouseenter="hoveredRegion=i" @mouseleave="hoveredRegion=-1">
            <path :d="r.path" fill="rgba(0,0,0,0.25)" transform="translate(2,3)" class="region-shadow"/>
            <path :d="r.path" :fill="`url(#rf-${i})`" :stroke="getStroke(r)" stroke-width="1.5" class="region-body" filter="url(#inner-shadow)"/>
            <path :d="r.path" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
            <circle v-if="r.infected>0" :cx="r.lx" :cy="r.ly" :r="pulseR(r)"
                    :fill="r.infected/r.pop>0.3?'url(#pulse-red)':'url(#pulse-orange)'" class="pulse-glow"/>
            <g v-for="(city,ci) in r.cities" :key="'c'+ci">
              <circle :cx="city[0]" :cy="city[1]" :r="r.infected>0?1.8:1.2" :fill="getCityColor(r)" :opacity="getCityOp(r)">
                <animate v-if="r.infected>0" attributeName="opacity" :values="`${getCityOp(r)};${getCityOp(r)*0.3};${getCityOp(r)}`" dur="1.5s" repeatCount="indefinite"/>
              </circle>
            </g>
            <g class="region-label" filter="url(#glow-sm)">
              <text :x="r.lx" :y="r.ly-12" text-anchor="middle" fill="#fff" font-size="12" font-weight="700"
                    :opacity="hoveredRegion===i||selectedRegion===i?1:0.85">{{ r.name }}</text>
              <text :x="r.lx" :y="r.ly+3" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="9">{{ formatNum(r.pop) }}万</text>
              <text v-if="r.infected>0" :x="r.lx" :y="r.ly+17" text-anchor="middle" fill="#fca5a5" font-size="10" font-weight="600">
                ☣ {{ formatNum(Math.floor(r.infected)) }}</text>
            </g>
          </g>

          <!-- 飞机 -->
          <g v-for="(p,i) in planes" :key="'pl'+i" :transform="`translate(${p.x},${p.y})`">
            <text font-size="10" opacity="0.4" :transform="p.vx<0?'scale(-1,1)':''">✈️</text>
          </g>
        </svg>

        <!-- 悬浮提示 -->
        <transition name="tip-fade">
          <div class="map-tooltip" v-if="hoveredRegion>=0" :style="tipStyle">
            <div class="tip-head">{{ regions[hoveredRegion].name }}</div>
            <div class="tip-bar-row" v-for="row in tipRows(hoveredRegion)" :key="row.label">
              <span class="tip-dot" :style="{background:row.color}"></span>
              <span class="tip-lbl">{{ row.label }}</span>
              <div class="tip-track"><div class="tip-fill" :style="{background:row.color,width:row.pct+'%'}"></div></div>
              <span class="tip-val">{{ row.val }}</span>
            </div>
          </div>
        </transition>

        <!-- 趋势图 -->
        <div class="trend-chart" v-if="history.length>2">
          <div class="trend-title">📈 全球趋势</div>
          <canvas ref="trendCanvas" width="180" height="70" class="trend-canvas"></canvas>
          <div class="trend-legend">
            <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>感染</span>
            <span class="legend-item"><span class="legend-dot" style="background:#6b7280"></span>死亡</span>
            <span class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span>解药</span>
          </div>
        </div>

        <!-- DNA螺旋可视化 -->
        <div class="dna-helix" v-if="totalInfected>0">
          <svg viewBox="0 0 40 120" class="helix-svg">
            <g v-for="n in 8" :key="'hx'+n">
              <circle :cx="20+Math.sin((n+helixPhase)*0.8)*14" :cy="n*14+4" r="3" :fill="`hsl(${280+n*10},70%,60%)`" opacity="0.7"/>
              <circle :cx="20-Math.sin((n+helixPhase)*0.8)*14" :cy="n*14+4" r="3" :fill="`hsl(${200+n*10},70%,60%)`" opacity="0.7"/>
              <line :x1="20+Math.sin((n+helixPhase)*0.8)*14" :y1="n*14+4"
                    :x2="20-Math.sin((n+helixPhase)*0.8)*14" :y2="n*14+4"
                    stroke="rgba(167,139,250,0.2)" stroke-width="1"/>
            </g>
          </svg>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="action-bar">
        <button class="act-btn act-spread" @click="tick" :disabled="gameOver">
          <svg viewBox="0 0 24 24" class="act-icon"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" fill="currentColor"/></svg>
          <span>推进</span>
        </button>
        <button class="act-btn act-auto" :class="{'is-active':autoPlay}" @click="toggleAuto">
          <svg viewBox="0 0 24 24" class="act-icon"><path v-if="!autoPlay" d="M8 5v14l11-7z" fill="currentColor"/><g v-else fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></g></svg>
          <span>{{ autoPlay?'暂停':'自动' }}</span>
        </button>
        <button class="act-btn act-speed" @click="changeSpeed" v-if="autoPlay"><span class="speed-badge">{{ speed }}x</span></button>
        <!-- 特殊技能 -->
        <button class="act-btn act-skill" v-for="sk in skills" :key="sk.id"
                :class="{'cd':sk.cooldown>0}" :disabled="sk.cooldown>0" @click="useSkill(sk)">
          <span>{{ sk.icon }}</span>
          <span>{{ sk.cooldown>0?sk.cooldown+'天':sk.name }}</span>
        </button>
        <div class="action-spacer"></div>
        <button class="act-btn act-reset" @click="backToMenu">
          <svg viewBox="0 0 24 24" class="act-icon"><path d="M17.65 6.35A7.96 7.96 0 0012 4a8 8 0 108 8h-2a6 6 0 11-1.76-4.24L14 10h7V3l-3.35 3.35z" fill="currentColor"/></svg>
          <span>新瘟疫</span>
        </button>
        <span class="click-hint" v-if="totalInfected===0 && !gameOver">👆 点击地图区域开始感染</span>
      </div>

      <!-- 进化面板 -->
      <div class="evo-panel" v-if="!gameOver">
        <div class="evo-header">
          <span class="evo-title-icon">🧬</span>
          <span class="evo-title-text">病原体进化</span>
          <span class="evo-dna-pill">🧬 {{ dnaPoints }}</span>
        </div>
        <div class="evo-grid">
          <div v-for="evo in evolutions" :key="evo.id" class="evo-card"
               :class="{can:dnaPoints>=evo.cost&&evo.level<evo.maxLevel, max:evo.level>=evo.maxLevel}" @click="evolve(evo)">
            <div class="evo-card-bg"></div>
            <div class="evo-card-top">
              <span class="evo-emoji">{{ evo.icon }}</span>
              <div class="evo-meta">
                <span class="evo-name">{{ evo.name }}</span>
                <span class="evo-lvl">Lv.{{ evo.level }}<span class="evo-lvl-max">/{{evo.maxLevel}}</span></span>
              </div>
              <div class="evo-cost-badge" v-if="evo.level<evo.maxLevel"><span>{{ evo.cost }}</span></div>
              <span class="evo-max-badge" v-else>MAX</span>
            </div>
            <div class="evo-desc">{{ evo.desc }}</div>
            <div class="evo-bar-track"><div class="evo-bar-fill" :style="{width:(evo.level/evo.maxLevel*100)+'%'}"></div></div>
            <div class="evo-dots"><span v-for="d in evo.maxLevel" :key="d" class="evo-dot" :class="{'filled':d<=evo.level}"></span></div>
          </div>
        </div>
      </div>

      <!-- 新闻 -->
      <div class="news-bar" v-if="news.length">
        <div class="news-tag">📰</div>
        <div class="news-list">
          <transition-group name="news-anim" tag="div" class="news-inner">
            <div class="news-row" v-for="n in visibleNews" :key="n.id">
              <span class="news-ico">{{ n.icon }}</span><span class="news-txt">{{ n.text }}</span><span class="news-day">D{{ n.day }}</span>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- 成就弹窗 -->
      <transition-group name="achieve-anim" tag="div" class="achieve-container">
        <div class="achieve-popup" v-for="a in achievePopups" :key="a.id">
          <span class="achieve-icon">{{ a.icon }}</span>
          <div class="achieve-info"><span class="achieve-title">{{ a.title }}</span><span class="achieve-desc">{{ a.desc }}</span></div>
        </div>
      </transition-group>

      <!-- 游戏结束 -->
      <transition name="over-fade">
        <div class="gameover-mask" v-if="gameOver">
          <div class="gameover-box" :class="gameWon?'win':'lose'">
            <div class="gameover-glow"></div>
            <div class="gameover-emoji">{{ gameWon?'🏆':'💊' }}</div>
            <h3 class="gameover-h">{{ gameWon?'瘟疫征服世界！':'人类研发出解药！' }}</h3>
            <p class="gameover-sub">{{ gameWon?'人类文明在瘟疫面前不堪一击':'你的病原体被成功遏制了' }}</p>
            <div class="gameover-stats">
              <div class="go-stat"><span class="go-icon">📅</span><span class="go-val">{{ day }}</span><span class="go-lbl">天</span></div>
              <div class="go-stat"><span class="go-icon">🦠</span><span class="go-val">{{ formatNum(totalInfectedAll) }}</span><span class="go-lbl">感染</span></div>
              <div class="go-stat"><span class="go-icon">💀</span><span class="go-val">{{ formatNum(totalDead) }}</span><span class="go-lbl">死亡</span></div>
              <div class="go-stat"><span class="go-icon">🧬</span><span class="go-val">{{ totalEvoLevel }}</span><span class="go-lbl">进化</span></div>
            </div>
            <!-- 关键事件时间线 -->
            <div class="go-timeline" v-if="milestones.length">
              <div class="go-tl-title">📜 关键事件</div>
              <div class="go-tl-item" v-for="(m,mi) in milestones.slice(-5)" :key="mi">
                <span class="go-tl-day">D{{ m.day }}</span><span class="go-tl-text">{{ m.text }}</span>
              </div>
            </div>
            <button class="act-btn act-spread" @click="backToMenu" style="margin-top:16px">
              <svg viewBox="0 0 24 24" class="act-icon"><path d="M17.65 6.35A7.96 7.96 0 0012 4a8 8 0 108 8h-2a6 6 0 11-1.76-4.24L14 10h7V3l-3.35 3.35z" fill="currentColor"/></svg>
              <span>再来一局</span>
            </button>
          </div>
        </div>
      </transition>
    </template>

    <p class="hint-text">点击地图区域开始感染 · 收集DNA进化瘟疫 · 空格/回车推进 · A键自动 · ESC重开</p>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'

/* ===== 游戏配置常量 ===== */
const GAME_CONFIG = {
  INFECT_THRESHOLD: 0.05,      // 感染阈值触发解药
  DNA_BASE: 1,                  // 基础DNA获取
  DNA_INFECTED_DIV: 80,         // DNA获取除数
  MUTATION_BASE: 0.02,          // 基础突变率
  DEATH_BASE: 0.0008,           // 基础死亡率
  AUTO_MIN_INTERVAL: 120,       // 自动播放最小间隔
  AUTO_BASE_INTERVAL: 600,      // 自动播放基础间隔
  MAX_HISTORY: 120,             // 历史记录最大条数
  MAX_NEWS: 20,                 // 新闻最大条数
  WIN_DEATH_PCT: 0.95,          // 获胜死亡百分比
  CLIMATE_MULT: { tropical: 1.15, temperate: 1, arid: 0.9 },
  EVOLUTION_COST_MULT: 1.6,     // 进化费用倍率
  EVENT_INTERVAL: 50           // 事件检测间隔
}

const pathogenTypes = [
  { id:'bacteria', name:'细菌', icon:'🦠', diff:'⭐ 简单', desc:'传播力强，适合新手', bonus:{transmission:2,stealth:1}, color:'#22c55e', difficulty:1 },
  { id:'virus', name:'病毒', icon:'🧬', diff:'⭐⭐ 普通', desc:'均衡型，突变概率高', bonus:{transmission:1,mutation:1}, color:'#ef4444', difficulty:2 },
  { id:'fungus', name:'真菌', icon:'🍄', diff:'⭐⭐⭐ 困难', desc:'传播慢但致死高', bonus:{lethality:2,resistance:1}, color:'#a855f7', difficulty:3 },
  { id:'parasite', name:'寄生虫', icon:'🐛', diff:'⭐⭐⭐ 困难', desc:'隐匿性强，抗性高', bonus:{stealth:2,resistance:1}, color:'#f97316', difficulty:3 },
  { id:'prion', name:'朊病毒', icon:'🧪', diff:'⭐⭐⭐⭐ 噩梦', desc:'极隐匿但缓慢致命', bonus:{stealth:3,lethality:1}, color:'#eab308', difficulty:4 },
  { id:'nanobot', name:'纳米病毒', icon:'⚛️', diff:'⭐⭐⭐⭐ 噩梦', desc:'高科技病原体', bonus:{transmission:2,mutation:2}, color:'#06b6d4', difficulty:4 },
  { id:'bioWeapon', name:'生化武器', icon:'☣️', diff:'⭐⭐⭐⭐⭐ 地狱', desc:'致命性极高', bonus:{lethality:3,resistance:2}, color:'#dc2626', difficulty:5 }
]

const phase = ref('menu')
const pickedPathogen = ref(null)
const currentPathogen = computed(() => pathogenTypes.find(p=>p.id===pickedPathogen.value))

/* ===== 地图数据 ===== */
const regionDefs = [
  { name:'北美', path:'M60,70 C70,55 120,40 175,45 C195,48 215,60 220,80 C228,105 230,135 215,155 C205,168 185,180 165,185 C145,188 120,178 105,165 C85,148 70,125 62,100 C58,88 57,78 60,70Z',
    lx:145, ly:115, pop:580, climate:'temperate', cities:[[90,80],[130,65],[160,90],[180,130],[140,155],[110,135],[175,70]] },
  { name:'南美', path:'M170,205 C185,195 210,192 225,200 C240,210 248,235 250,260 C252,285 245,315 235,335 C225,350 210,358 195,350 C180,342 170,320 165,295 C160,270 160,240 163,220 C165,210 168,207 170,205Z',
    lx:210, ly:275, pop:430, climate:'tropical', cities:[[195,215],[220,240],[230,280],[215,320],[190,300],[185,250]] },
  { name:'欧洲', path:'M340,55 C360,42 395,38 420,42 C440,45 458,55 462,72 C466,90 460,110 448,125 C435,138 415,140 395,138 C375,135 355,125 342,110 C330,96 328,75 332,62 C334,57 337,56 340,55Z',
    lx:400, ly:90, pop:750, climate:'temperate', cities:[[360,60],[390,55],[420,65],[440,85],[430,115],[395,125],[365,110],[350,85]] },
  { name:'非洲', path:'M355,155 C375,142 410,138 435,148 C455,158 468,178 472,205 C476,235 472,270 462,300 C452,325 435,340 415,342 C395,343 375,330 362,310 C350,290 345,265 344,235 C343,205 348,178 352,162 C353,158 354,156 355,155Z',
    lx:410, ly:240, pop:1400, climate:'tropical', cities:[[380,165],[420,175],[445,210],[450,260],[430,310],[400,325],[375,300],[365,240],[390,200]] },
  { name:'中东', path:'M462,105 C480,95 510,88 535,95 C550,100 558,115 555,132 C550,148 538,160 520,165 C502,168 482,162 470,150 C458,138 455,122 458,112 C459,108 460,106 462,105Z',
    lx:510, ly:130, pop:410, climate:'arid', cities:[[480,105],[510,100],[535,115],[525,145],[495,150],[475,135]] },
  { name:'亚洲', path:'M480,42 C510,32 560,28 610,32 C645,35 675,45 690,62 C702,78 700,100 690,118 C678,135 658,148 632,152 C605,155 575,150 548,140 C522,130 500,115 488,95 C478,78 475,58 478,46Z',
    lx:595, ly:90, pop:4600, climate:'varied', cities:[[510,50],[550,45],[600,50],[650,60],[670,85],[660,120],[630,140],[580,135],[540,120],[510,95],[550,75],[620,70]] },
  { name:'东南亚', path:'M620,162 C645,152 680,148 710,158 C730,165 742,180 740,200 C738,218 725,235 705,242 C685,248 660,245 642,235 C625,225 615,210 615,192 C615,178 617,168 620,162Z',
    lx:680, ly:200, pop:680, climate:'tropical', cities:[[640,165],[670,160],[700,175],[720,200],[700,225],[665,235],[640,215],[655,185]] },
  { name:'大洋洲', path:'M660,285 C685,272 720,268 750,278 C770,285 782,300 778,320 C774,338 760,352 740,358 C720,362 695,358 678,345 C662,332 655,315 655,298 C655,290 657,287 660,285Z',
    lx:720, ly:318, pop:45, climate:'temperate', cities:[[685,290],[720,280],[750,295],[760,320],[735,345],[700,340],[680,315]] }
]

/* ===== 状态 ===== */
const regions = ref([])
const day = ref(1), dnaPoints = ref(0), cureProgress = ref(0), cureStarted = ref(false)
const gameOver = ref(false), gameWon = ref(false), autoPlay = ref(false), speed = ref(1)
const selectedRegion = ref(-1), hoveredRegion = ref(-1)
const news = ref([]), planes = ref([]), history = ref([]), milestones = ref([])
const totalInfectedAll = ref(0), helixPhase = ref(0)
const achievePopups = ref([])
const unlockedAchievements = ref(new Set())
let newsId=0, autoTimer=null, planeTimer=null, animFrame=null, achieveId=0

const particleCanvas = ref(null), mapCanvas = ref(null), trendCanvas = ref(null)

/* ===== 特殊技能 ===== */
const skills = reactive([
  { id:'genetic_surge', name:'基因激增', icon:'⚡', desc:'瞬间获得20DNA', cooldown:0, maxCd:30,
    use(){ dnaPoints.value += 20; addNews('⚡','基因突变激增！获得20DNA') } },
  { id:'necrosis', name:'坏死爆发', icon:'💀', desc:'所有区域瞬间大量死亡', cooldown:0, maxCd:40,
    use(){ regions.value.forEach(r=>{if(r.infected>0){const d=r.infected*0.05;r.dead=Math.min(r.pop,r.dead+d);r.infected=Math.max(0,r.infected-d)}});addNews('💀','坏死爆发！大量感染者死亡') } },
  { id:'airborne', name:'空气传播', icon:'🌪️', desc:'感染一个未感染区域', cooldown:0, maxCd:50,
    use(){const clean=regions.value.filter(r=>r.infected===0);if(clean.length){const t=clean[Math.floor(Math.random()*clean.length)];t.infected=5;totalInfectedAll.value+=5;addNews('🌪️',`空气传播！${t.name}被感染`)}} },
  { id:'water_contaminate', name:'水源污染', icon:'💧', desc:'感染所有沿海区域', cooldown:0, maxCd:60,
    use(){regions.value.forEach((r,i)=>{if(['tropical','temperate'].includes(r.climate)&&r.infected===0){r.infected=3;totalInfectedAll.value+=3}});addNews('💧','水源污染！沿海区域被污染')}},
  { id:'resistance_boost', name:'抗性强化', icon:'🛡️', desc:'减缓解药研发50%', cooldown:0, maxCd:70,
    use(){resistanceBoost.value=true;setTimeout(()=>{resistanceBoost.value=false},10000);addNews('🛡️','抗性强化！解药研发受阻')}},
  { id:'storm_spread', name:'风暴传播', icon:'🌀', desc:'感染所有热带区域', cooldown:0, maxCd:55,
    use(){regions.value.forEach(r=>{if(r.climate==='tropical'&&r.infected===0){r.infected=4;totalInfectedAll.value+=4}});addNews('🌀','风暴传播！热带区域大规模感染')}}
])
const resistanceBoost = ref(false)

/* ===== 进化 ===== */
const evolutions = reactive([
  { id:'transmission', name:'传播能力', icon:'🌬️', desc:'提升感染速度', level:1, maxLevel:10, cost:8 },
  { id:'lethality', name:'致死性', icon:'☠️', desc:'提升致死率', level:0, maxLevel:10, cost:12 },
  { id:'resistance', name:'抗性', icon:'🛡️', desc:'减缓解药研发', level:0, maxLevel:7, cost:15 },
  { id:'mutation', name:'突变', icon:'🧬', desc:'随机跨区域传播', level:0, maxLevel:7, cost:20 },
  { id:'stealth', name:'隐匿性', icon:'👁️', desc:'延迟被发现', level:0, maxLevel:5, cost:25 },
  { id:'adaptability', name:'适应性', icon:'🔄', desc:'DNA获取加速', level:0, maxLevel:6, cost:18 },
  { id:'drug_resistance', name:'耐药性', icon:'💊', desc:'阻止治愈能力', level:0, maxLevel:5, cost:22 },
  { id:'extreme_mutation', name:'极端突变', icon:'⚠️', desc:'快速致死', level:0, maxLevel:3, cost:30 }
])

const totalEvoLevel = computed(() => evolutions.reduce((s,e)=>s+e.level, 0))

/* ===== 计算 ===== */
const totalPop = computed(()=>regions.value.reduce((s,r)=>s+r.pop,0))
const totalInfected = computed(()=>Math.floor(regions.value.reduce((s,r)=>s+r.infected,0)))
const totalDead = computed(()=>Math.floor(regions.value.reduce((s,r)=>s+r.dead,0)))
const totalHealthy = computed(()=>Math.floor(regions.value.reduce((s,r)=>s+Math.max(0,r.pop-r.infected-r.dead),0)))
const infectedPercent = computed(()=>totalPop.value?(totalInfected.value/totalPop.value*100):0)
const deadPercent = computed(()=>totalPop.value?(totalDead.value/totalPop.value*100):0)
const healthyPercent = computed(()=>totalPop.value?(totalHealthy.value/totalPop.value*100):0)
const visibleNews = computed(()=>news.value.slice(-3))

const hudStats = computed(()=>[
  { key:'inf', icon:'🦠', label:'感染', value:formatNum(totalInfected.value), pct:infectedPercent.value, ring:true, ringBg:'rgba(239,68,68,0.12)', ringColor:'#ef4444' },
  { key:'dead', icon:'💀', label:'死亡', value:formatNum(totalDead.value), pct:deadPercent.value, ring:true, ringBg:'rgba(107,114,128,0.12)', ringColor:'#6b7280' },
  { key:'hp', icon:'👥', label:'健康', value:formatNum(totalHealthy.value), pct:healthyPercent.value, ring:true, ringBg:'rgba(34,197,94,0.12)', ringColor:'#22c55e' },
  { key:'day', icon:'📅', label:'天数', value:day.value },
  { key:'dna', icon:'🧬', label:'DNA', value:dnaPoints.value, numClass:'hud-dna' }
])

const regionGradients = computed(()=>regions.value.map(r=>{
  const ir=r.infected/r.pop,dr=r.dead/r.pop
  if(dr>0.9)return['#1a1a2e','#0f0f1a'];if(dr>0.5)return['#2d1b3d','#1a0f2e']
  if(ir>0.7)return['#991b1b','#7f1d1d'];if(ir>0.4)return['#dc2626','#b91c1c']
  if(ir>0.15)return['#ea580c','#c2410c'];if(ir>0.03)return['#d97706','#b45309']
  if(ir>0)return['#65a30d','#4d7c0f'];return['#166534','#14532d']
}))

const flightRoutes = computed(()=>{
  const r = regions.value; if(r.length<8)return[]
  return [
    { d:`M${r[0].lx},${r[0].ly} Q${(r[0].lx+r[2].lx)/2},${(r[0].ly+r[2].ly)/2-40} ${r[2].lx},${r[2].ly}` },
    { d:`M${r[2].lx},${r[2].ly} Q${(r[2].lx+r[5].lx)/2},${(r[2].ly+r[5].ly)/2-30} ${r[5].lx},${r[5].ly}` },
    { d:`M${r[5].lx},${r[5].ly} Q${(r[5].lx+r[6].lx)/2},${(r[5].ly+r[6].ly)/2-20} ${r[6].lx},${r[6].ly}` },
    { d:`M${r[0].lx},${r[0].ly} Q${(r[0].lx+r[1].lx)/2-20},${(r[0].ly+r[1].ly)/2} ${r[1].lx},${r[1].ly}` },
    { d:`M${r[3].lx},${r[3].ly} Q${(r[3].lx+r[4].lx)/2+10},${(r[3].ly+r[4].ly)/2-15} ${r[4].lx},${r[4].ly}` },
  ]
})

/* ===== 辅助 ===== */
function formatNum(n){if(n>=10000)return(n/10000).toFixed(1)+'亿';if(n>=1000)return(n/1000).toFixed(1)+'k';return String(Math.floor(n))}
function getStroke(r){if(!r||r.infected===0)return'rgba(100,200,150,0.2)';return'rgba(239,68,68,0.45)'}
function pulseR(r){return 12+Math.min(r.infected/r.pop,1)*40}
function getCityColor(r){if(r.dead/r.pop>0.5)return'#4b5563';if(r.infected>0)return'#fca5a5';return'#86efac'}
function getCityOp(r){return r.infected>0?0.85:0.3}
function healthyIn(i){return Math.max(0,regions.value[i].pop-regions.value[i].infected-regions.value[i].dead)}
function infectedPct(i){const r=regions.value[i];return r.pop?(r.infected/r.pop*100):0}
function deadPct(i){const r=regions.value[i];return r.pop?(r.dead/r.pop*100):0}
function healthyPct(i){const r=regions.value[i];return r.pop?(healthyIn(i)/r.pop*100):0}
function tipRows(i){
  const r=regions.value[i]
  return[
    {label:'健康',color:'#22c55e',pct:healthyPct(i),val:formatNum(healthyIn(i))},
    {label:'感染',color:'#ef4444',pct:infectedPct(i),val:formatNum(Math.floor(r.infected))},
    {label:'死亡',color:'#6b7280',pct:deadPct(i),val:formatNum(Math.floor(r.dead))}
  ]
}
const tipStyle = computed(()=>{if(hoveredRegion.value<0)return{};const r=regions.value[hoveredRegion.value];return{left:(r.lx/900*100)+'%',top:(r.ly/460*100-18)+'%'}})
function getLevel(id){return evolutions.find(e=>e.id===id).level}

/* ===== 音效 ===== */
let audioCtx = null
function playSound(type){
  try{
    if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)()
    const osc=audioCtx.createOscillator(),gain=audioCtx.createGain()
    osc.connect(gain);gain.connect(audioCtx.destination)
    gain.gain.value=0.08
    if(type==='infect'){osc.frequency.value=220;osc.type='sine';gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.3)}
    else if(type==='evolve'){osc.frequency.value=440;osc.type='triangle';gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.5)}
    else if(type==='news'){osc.frequency.value=660;osc.type='sine';gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.15)}
    else if(type==='skill'){osc.frequency.value=330;osc.type='square';gain.gain.value=0.04;gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.4)}
    else if(type==='win'){osc.frequency.value=523;osc.type='triangle';gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+1)}
    osc.start();osc.stop(audioCtx.currentTime+1)
  }catch(e){}
}

/* ===== 成就系统 ===== */
function checkAchievements(){
  const checks = [
    { id:'first_blood', icon:'🩸', title:'首次感染', desc:'成功感染第一个区域', cond:()=>totalInfected.value>0 },
    { id:'million', icon:'💯', title:'百万感染', desc:'全球感染超过100万', cond:()=>totalInfected.value>100 },
    { id:'billion', icon:'🌐', title:'全球大流行', desc:'全球感染超过10亿', cond:()=>totalInfected.value>1000 },
    { id:'pandemic', icon:'🌍', title:'感染过半', desc:'感染超过50%人口', cond:()=>infectedPercent.value>50 },
    { id:'all_regions', icon:'✈️', title:'无孔不入', desc:'所有区域都被感染', cond:()=>regions.value.every(r=>r.infected>0) },
    { id:'evo_master', icon:'🧬', title:'进化大师', desc:'进化总等级达到15', cond:()=>totalEvoLevel.value>=15 },
    { id:'evo_god', icon:'⚡', title:'进化之神', desc:'进化总等级达到30', cond:()=>totalEvoLevel.value>=30 },
    { id:'dark_day', icon:'💀', title:'黑暗之日', desc:'单日死亡超过100万', cond:()=>{const h=history.value;return h.length>=2&&(h[h.length-1].dead-h[h[h.length-2]?h.length-2:0].dead)>100} },
    { id:'cure_rush', icon:'💊', title:'绝地逆转', desc:'解药进度超过80%时逆转', cond:()=>gameWon.value&&cureProgress.value>80 },
    { id:'stealth_master', icon:'👁️', title:'隐匿大师', desc:'存活超过100天且未被大规模发现', cond:()=>day.value>100&&cureProgress.value<20 },
    { id:'quick_kill', icon:'⚡', title:'闪电战', desc:'在50天内感染90%人口', cond:()=>day.value<=50&&infectedPercent.value>90 },
    { id:'total_extinction', icon:'🔥', title:'完全灭绝', desc:'100%人口死亡', cond:()=>totalDead.value>=totalPop.value*0.999 },
    { id:'speed_demon', icon:'🚀', title:'极速传播', desc:'一天内感染3个新区域', cond:()=>{return false} },
    { id:'cure_resist', icon:'🛡️', title:'抗药性', desc:'阻止解药研发超过30天', cond:()=>cureStarted.value&&day.value>30&&cureProgress.value<15 }
  ]
  checks.forEach(c=>{
    if(!unlockedAchievements.value.has(c.id)&&c.cond()){
      unlockedAchievements.value.add(c.id)
      achievePopups.value.push({id:++achieveId,...c})
      setTimeout(()=>{if(achievePopups.value.length)achievePopups.value.shift()},3500)
    }
  })
}

/* ===== 游戏逻辑 ===== */
function startGame(){
  if(!pickedPathogen.value)return
  phase.value='play'
  const bonus = currentPathogen.value.bonus
  regions.value = regionDefs.map(r=>({...r, infected:0, dead:0}))
  day.value=1; dnaPoints.value=0; cureProgress.value=0; cureStarted.value=false
  gameOver.value=false; gameWon.value=false; autoPlay.value=false; speed.value=1
  selectedRegion.value=-1; totalInfectedAll.value=0; history.value=[]; milestones.value=[]
  news.value=[]; newsId=0; achievePopups.value=[]; unlockedAchievements.value=new Set()
  evolutions.forEach(e=>{
    e.level=0; e.cost=e.id==='transmission'?8:e.id==='lethality'?12:e.id==='resistance'?15:e.id==='mutation'?20:e.id==='stealth'?25:18
  })
  // 应用病原体加成
  Object.entries(bonus).forEach(([k,v])=>{const evo=evolutions.find(e=>e.id===k);if(evo)evo.level=v})
  skills.forEach(s=>s.cooldown=0)
  stopAuto(); initPlanes(); addNews('🦠',`${currentPathogen.value.name}正在世界各地潜伏...`)
  nextTick(()=>{initParticles();drawParticles();drawMapOverlay()})
}

function backToMenu(){ phase.value='menu'; stopAuto(); if(planeTimer)clearInterval(planeTimer); if(animFrame)cancelAnimationFrame(animFrame) }

function selectRegion(i){
  selectedRegion.value=i
  if(regions.value[i].infected===0 && totalInfected.value===0){
    regions.value[i].infected=1; totalInfectedAll.value=1
    addNews('⚠️',`${regions.value[i].name}发现不明疾病！`); playSound('infect')
    addMilestone(`${regions.value[i].name}发现首例感染`)
  }
}
function onMapClick(){}

function addMilestone(text){ milestones.value.push({day:day.value,text}) }

function tick(){
  if(gameOver.value)return
  const trans=getLevel('transmission'),leth=getLevel('lethality'),mut=getLevel('mutation'),adapt=getLevel('adaptability'),drugRes=getLevel('drug_resistance'),extreme=getLevel('extreme_mutation')
  // 气候影响传播
  regions.value.forEach((r,i)=>{
    if(r.infected>0){
      const climateMult = GAME_CONFIG.CLIMATE_MULT[r.climate] || 1
      const g=trans*0.04*climateMult*(1-r.infected/r.pop)
      r.infected=Math.min(r.pop-r.dead, r.infected+r.infected*g)
      // 自然传播到相邻区域
      if(r.infected/r.pop>0.1 && Math.random()<0.008*trans){
        const adj=[[1,2],[0,2,3],[0,1,3,4],[1,2,4,5],[2,3,5,6],[3,4,6,7],[4,5,7],[5,6]]
        const a=adj[i]||[]
        if(a.length){const t=a[Math.floor(Math.random()*a.length)];if(regions.value[t].infected===0){regions.value[t].infected=1;totalInfectedAll.value++;addNews('✈️',`疾病传播到${regions.value[t].name}！`);addMilestone(`疾病扩散至${regions.value[t].name}`)}}
      }
      if(mut>0 && Math.random()<mut*GAME_CONFIG.MUTATION_BASE){
        const adj=[[1,2],[0,2,3],[0,1,3,4],[1,2,4,5],[2,3,5,6],[3,4,6,7],[4,5,7],[5,6]]
        const a=adj[i]||[]
        if(a.length){const t=a[Math.floor(Math.random()*a.length)];if(regions.value[t].infected===0){regions.value[t].infected=1;totalInfectedAll.value++;addNews('🧬',`突变！${regions.value[t].name}被感染！`)}}
      }
      // 极端突变效果
      const deathMult = extreme>0 ? (1 + extreme*0.5) : 1
      const nd=r.infected*leth*GAME_CONFIG.DEATH_BASE*deathMult
      r.dead=Math.min(r.pop,r.dead+nd)
      r.infected=Math.max(0,r.infected-nd)
    }
  })
  totalInfectedAll.value=Math.max(totalInfectedAll.value,totalInfected.value+totalDead.value)
  dnaPoints.value+=GAME_CONFIG.DNA_BASE+Math.floor(totalInfected.value/GAME_CONFIG.DNA_INFECTED_DIV)+adapt*2
  if(totalInfected.value>totalPop.value*GAME_CONFIG.INFECT_THRESHOLD){
    cureStarted.value=true
    let s=0.8-getLevel('stealth')*0.15-getLevel('resistance')*0.08
    if(resistanceBoost.value) s*=0.5
    if(drugRes>0) s*=Math.max(0.3, 1-drugRes*0.15)
    cureProgress.value=Math.min(100,cureProgress.value+Math.max(0.1,s))
  }
  day.value++
  history.value.push({inf:totalInfected.value,dead:totalDead.value,cure:cureProgress.value})
  if(history.value.length>GAME_CONFIG.MAX_HISTORY)history.value.shift()
  // 技能冷却
  skills.forEach(s=>{if(s.cooldown>0)s.cooldown--})
  // DNA螺旋动画
  helixPhase.value+=0.15
  checkEvents(); checkAchievements()
  if(totalDead.value>=totalPop.value*GAME_CONFIG.WIN_DEATH_PCT){gameOver.value=true;gameWon.value=true;addNews('💀','人类文明崩溃...');addMilestone('瘟疫胜利');stopAuto();playSound('win')}
  else if(cureProgress.value>=100){gameOver.value=true;gameWon.value=false;addNews('💊','解药完成！');addMilestone('人类获胜');stopAuto()}
}

function evolve(evo){
  if(evo.level>=evo.maxLevel||dnaPoints.value<evo.cost||gameOver.value)return
  dnaPoints.value-=evo.cost;evo.level++;evo.cost=Math.floor(evo.cost*1.6)
  addNews('🧬',`${evo.name} → Lv.${evo.level}`); playSound('evolve')
  if(evo.level===evo.maxLevel)addMilestone(`${evo.name}达到满级`)
}

function useSkill(sk){
  if(sk.cooldown>0||gameOver.value)return
  sk.use(); sk.cooldown=sk.maxCd; playSound('skill')
}

function checkEvents(){
  const ir=totalInfected.value/totalPop.value
  if(day.value===30&&ir>0){addNews('📺','各国政府注意到异常疾病。');addMilestone('疾病被发现')}
  if(day.value===60&&ir>0.1){addNews('🏥','WHO宣布全球紧急状态！');addMilestone('全球紧急状态')}
  if(day.value===90&&ir>0.3){addNews('✈️','多国关闭边境。');addMilestone('国际航线中断')}
  if(day.value===120&&ir>0.5){addNews('🪖','军队部署维持秩序。');addMilestone('社会秩序崩溃')}
  if(day.value===150&&ir>0.7){addNews('⚠️','多国进入紧急状态！');addMilestone('全球紧急状态升级')}
  if(day.value===200&&ir>0.85){addNews('🔥','医疗系统彻底崩溃！');addMilestone('医疗系统崩溃')}
  if(ir>0.01&&day.value%GAME_CONFIG.EVENT_INTERVAL===0&&Math.random()<0.5){
    const evts=[
      {icon:'📰',text:'多国出现不明肺炎病例。'},
      {icon:'🏦',text:'全球股市暴跌。'},
      {icon:'🔬',text:'科学家加速研究病原体。'},
      {icon:'😷',text:'民众开始囤积物资。'},
      {icon:'🏗️',text:'各地建设方舱医院。'},
      {icon:'📉',text:'全球经济严重受创。'},
      {icon:'🌍',text:'联合国召开紧急会议。'},
      {icon:'💊',text:'药企投入研发疫苗。'},
      {icon:'🚫',text:'国际航班大规模取消。'},
      {icon:'🏠',text:'多国实施居家隔离。'},
      {icon:'⚔️',text:'多地出现物资哄抢。'},
      {icon:'🔒',text:'多国宣布戒严。'},
      {icon:'📢',text:'政府呼吁民众待在家中。'},
      {icon:'💀',text:'殡葬行业不堪重负。'},
      {icon:'🏭',text:'多个工厂被迫停产。'},
      {icon:'🌾',text:'粮食供应链断裂。'},
      {icon:'💔',text:'大量家庭支离破碎。'},
      {icon:'⚡',text:'病原体出现新突变！'}
    ]
    const e=evts[Math.floor(Math.random()*evts.length)];addNews(e.icon,e.text);playSound('news')
  }
}

function addNews(icon,text){news.value.push({id:++newsId,icon,text,day:day.value});if(news.value.length>GAME_CONFIG.MAX_NEWS)news.value.shift()}
function toggleAuto(){autoPlay.value=!autoPlay.value;if(autoPlay.value)startAuto();else stopAuto()}
function startAuto(){stopAuto();autoTimer=setInterval(()=>{if(!gameOver.value)tick();else stopAuto()},Math.max(GAME_CONFIG.AUTO_MIN_INTERVAL,GAME_CONFIG.AUTO_BASE_INTERVAL/speed.value))}
function stopAuto(){autoPlay.value=false;if(autoTimer){clearInterval(autoTimer);autoTimer=null}}
function changeSpeed(){speed.value=speed.value>=4?1:speed.value*2;if(autoPlay.value)startAuto()}

function initPlanes(){
  planes.value=Array.from({length:5},()=>({x:Math.random()*900,y:40+Math.random()*380,vx:(Math.random()-0.5)*2.5,vy:(Math.random()-0.5)*0.6}))
  planeTimer=setInterval(()=>{planes.value.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<-20)p.x=920;if(p.x>920)p.x=-20;if(p.y<15||p.y>445)p.vy=-p.vy})},40)
}

/* ===== 键盘快捷键 ===== */
function handleKeydown(e){
  if(phase.value==='menu')return
  if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!gameOver.value)tick()}
  else if(e.key==='a'||e.key==='A'){e.preventDefault();toggleAuto()}
  else if(e.key==='1'){e.preventDefault();useSkill(skills[0])}
  else if(e.key==='2'){e.preventDefault();useSkill(skills[1])}
  else if(e.key==='3'){e.preventDefault();useSkill(skills[2])}
  else if(e.key==='Escape'){e.preventDefault();backToMenu()}
}

/* ===== Canvas ===== */
let particles=[], infectionParticles=[]
function initParticles(){
  const c=particleCanvas.value;if(!c)return
  c.width=c.parentElement.clientWidth;c.height=c.parentElement.clientHeight
  particles=Array.from({length:60},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:0.8+Math.random()*2.5,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,a:0.08+Math.random()*0.25,hue:Math.random()*40+340}))
  infectionParticles=Array.from({length:20},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:2+Math.random()*4,vx:(Math.random()-0.5)*1,vy:(Math.random()-0.5)*1,a:0.15+Math.random()*0.3,hue:0,d:0}))
}
function drawParticles(){
  const c=particleCanvas.value;if(!c)return
  const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height)
  particles.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=c.width;if(p.x>c.width)p.x=0;if(p.y<0)p.y=c.height;if(p.y>c.height)p.y=0
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`hsla(${p.hue},80%,60%,${p.a})`;ctx.fill()
  })
  // 感染粒子效果
  const totalInf = totalInfected.value
  if(totalInf>0){
    infectionParticles.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.d+=0.02
      if(p.d>1){p.x=Math.random()*c.width;p.y=Math.random()*c.height;p.d=0}
      const size = p.r*(1-p.d*0.5), alpha = p.a*(1-p.d)
      ctx.beginPath();ctx.arc(p.x,p.y,size,0,Math.PI*2)
      const gradient=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,size)
      gradient.addColorStop(0,`hsla(${0},80%,50%,${alpha})`)
      gradient.addColorStop(1,`hsla(${0},80%,50%,0)`)
      ctx.fillStyle=gradient;ctx.fill()
    })
  }
  animFrame=requestAnimationFrame(drawParticles)
}
function drawMapOverlay(){
  const c=mapCanvas.value;if(!c)return
  const svg=c.parentElement.querySelector('.world-svg');if(!svg)return
  const rect=svg.getBoundingClientRect();c.width=rect.width;c.height=rect.height;c.style.width=rect.width+'px';c.style.height=rect.height+'px'
  const ctx=c.getContext('2d'),sx=rect.width/900,sy=rect.height/460
  ctx.clearRect(0,0,c.width,c.height)
  const infected=regions.value.filter(r=>r.infected>0)
  for(let i=0;i<infected.length;i++){for(let j=i+1;j<infected.length;j++){
    const a=infected[i],b=infected[j],ax=a.lx*sx,ay=a.ly*sy,bx=b.lx*sx,by=b.ly*sy,dist=Math.hypot(bx-ax,by-ay)
    if(dist<350*sx){ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo((ax+bx)/2+(Math.sin(day.value*0.1+i))*15,(ay+by)/2-20+Math.cos(day.value*0.1+j)*8,bx,by);
    ctx.strokeStyle=`rgba(239,68,68,${0.06+Math.min(a.infected/a.pop,b.infected/b.pop)*0.12})`;ctx.lineWidth=1;ctx.stroke()
    // 流动粒子
    const t=(Date.now()%3000)/3000
    const mx=ax+(bx-ax)*t+Math.sin(t*Math.PI)*10, my=ay+(by-ay)*t-15*Math.sin(t*Math.PI)
    ctx.beginPath();ctx.arc(mx,my,1.5,0,Math.PI*2);ctx.fillStyle='rgba(239,68,68,0.5)';ctx.fill()
  }}}
  requestAnimationFrame(drawMapOverlay)
}
function drawTrend(){
  const c=trendCanvas.value;if(!c||history.value.length<2)return
  const ctx=c.getContext('2d'),w=180,h=70;ctx.clearRect(0,0,w,h)
  const maxV=Math.max(100,...history.value.map(d=>d.inf),...history.value.map(d=>d.dead))
  const draw=(data,color)=>{ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=1.5
    data.forEach((v,i)=>{const x=i/(data.length-1)*w,y=h-v/maxV*h*0.85;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.stroke()
    ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fillStyle=color.replace(',1)',',0.06)');ctx.fill()}
  draw(history.value.map(d=>d.inf),'rgba(239,68,68,1)')
  draw(history.value.map(d=>d.dead),'rgba(107,114,128,1)')
  draw(history.value.map(d=>d.cure/100*maxV),'rgba(59,130,246,1)')
}
watch(history,()=>drawTrend(),{deep:true})

onMounted(()=>{window.addEventListener('keydown',handleKeydown)})
onUnmounted(()=>{stopAuto();window.removeEventListener('keydown',handleKeydown);if(planeTimer)clearInterval(planeTimer);if(animFrame)cancelAnimationFrame(animFrame)})
</script>

<style scoped>
.plague-game{position:relative;padding:20px 16px;overflow:hidden;border-radius:16px;background:linear-gradient(165deg,#070d1a,#0c1829 40%,#0a1525);min-height:500px}
.particle-bg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.5}

/* 开始界面 */
.start-screen{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:480px;text-align:center}
.start-bg-anim{position:absolute;inset:-20px;background:radial-gradient(circle at 50% 50%,rgba(239,68,68,0.06),transparent 60%);animation:pulse-bg 4s ease-in-out infinite}
@keyframes pulse-bg{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.1);opacity:1}}
.start-content{position:relative;z-index:1}
.start-virus-anim{font-size:72px;margin-bottom:16px;animation:virus-float 3s ease-in-out infinite;filter:drop-shadow(0 0 20px rgba(239,68,68,0.3))}
@keyframes virus-float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(10deg)}}
.start-title{font-size:36px;font-weight:900;color:#f1f5f9;letter-spacing:3px;margin-bottom:4px;text-shadow:0 0 30px rgba(239,68,68,0.2)}
.start-sub{font-size:13px;color:#475569;letter-spacing:6px;margin-bottom:32px;font-weight:300}
.pathogen-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;max-width:600px;margin:0 auto 28px}
.pathogen-card{padding:14px 12px;border-radius:14px;background:rgba(255,255,255,0.03);border:2px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;position:relative;overflow:hidden}
.pathogen-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,var(--glow-color,transparent) 0%,transparent 60%);opacity:0;transition:opacity 0.3s}
.pathogen-card:hover::before{opacity:0.1}
.pathogen-card:hover{background:rgba(255,255,255,0.06);transform:translateY(-3px) scale(1.02);box-shadow:0 8px 24px rgba(0,0,0,0.3)}
.pathogen-card.picked{border-color:var(--glow-color);background:rgba(var(--glow-rgb),0.08);box-shadow:0 0 24px rgba(var(--glow-rgb),0.2);animation:pulse-pick 2s ease-in-out infinite}
@keyframes pulse-pick{0%,100%{box-shadow:0 0 24px rgba(var(--glow-rgb),0.2)}50%{box-shadow:0 0 36px rgba(var(--glow-rgb),0.35)}}
.pathogen-card:nth-child(1){--glow-color:rgba(34,197,94,0.4);--glow-rgb:34,197,94}
.pathogen-card:nth-child(2){--glow-color:rgba(239,68,68,0.4);--glow-rgb:239,68,68}
.pathogen-card:nth-child(3){--glow-color:rgba(168,85,247,0.4);--glow-rgb:168,85,247}
.pathogen-card:nth-child(4){--glow-color:rgba(249,115,22,0.4);--glow-rgb:249,115,22}
.pathogen-card:nth-child(5){--glow-color:rgba(234,179,8,0.4);--glow-rgb:234,179,8}
.pathogen-card:nth-child(6){--glow-color:rgba(6,182,212,0.4);--glow-rgb:6,182,212}
.pathogen-card:nth-child(7){--glow-color:rgba(220,38,38,0.4);--glow-rgb:220,38,38}
.patho-icon{font-size:32px;margin-bottom:4px}
.patho-name{font-size:14px;font-weight:700;color:#f1f5f9}
.patho-diff{font-size:10px;color:#fbbf24}
.patho-desc{font-size:9px;color:#64748b;line-height:1.3}
.start-btn{font-size:16px!important;padding:12px 32px!important}

/* 标题 */
.game-title{display:flex;align-items:center;gap:10px;margin-bottom:14px;position:relative;z-index:1}
.title-icon{font-size:26px;filter:drop-shadow(0 0 8px rgba(239,68,68,0.4))}
.title-text{font-size:20px;font-weight:800;color:#f1f5f9;letter-spacing:1px}
.title-sub{font-size:11px;color:#64748b;letter-spacing:1px;margin-top:2px}

/* HUD */
.hud-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;position:relative;z-index:1}
.hud-stat{display:flex;align-items:center;gap:6px;padding:5px 9px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);transition:all 0.3s;position:relative;overflow:hidden}
.hud-stat::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.03),transparent);pointer-events:none}
.hud-stat:hover{background:rgba(255,255,255,0.06);transform:translateY(-1px)}
.hud-ring{width:36px;height:36px;position:relative;display:flex;align-items:center;justify-content:center}
.hud-ring svg{width:36px;height:36px;filter:drop-shadow(0 0 4px rgba(var(--ring-glow),0.3))}
.hud-stat:nth-child(1){--ring-glow:239,68,68}
.hud-stat:nth-child(2){--ring-glow:107,114,128}
.hud-stat:nth-child(3){--ring-glow:34,197,94}
.ring-progress{transition:stroke-dasharray 0.6s ease}
.ring-icon{position:absolute;font-size:14px;filter:drop-shadow(0 0 4px rgba(255,255,255,0.2))}
.hud-info{display:flex;flex-direction:column}
.hud-num{font-size:15px;font-weight:700;color:#f1f5f9;font-variant-numeric:tabular-nums;transition:color 0.3s,text-shadow 0.3s}
.hud-num:hover{text-shadow:0 0 10px rgba(255,255,255,0.3)}
.hud-dna{color:#a78bfa;text-shadow:0 0 8px rgba(167,139,250,0.3)}
.hud-label{font-size:8px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}
.hud-big-icon{font-size:18px;filter:drop-shadow(0 0 4px rgba(255,255,255,0.1))}

/* 解药 */
.cure-wrap{margin-bottom:10px;position:relative;z-index:1}
.cure-inner{padding:8px 12px;border-radius:10px;background:rgba(30,58,95,0.4);border:1px solid rgba(59,130,246,0.15)}
.cure-top{display:flex;justify-content:space-between;font-size:11px;color:#93c5fd;margin-bottom:5px}
.cure-pct{font-weight:800;font-size:13px;color:#60a5fa}
.cure-pct.danger{color:#f87171;animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.5}}
.cure-track{height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden}
.cure-fill{height:100%;border-radius:3px;transition:width 0.5s;position:relative;overflow:hidden;background:linear-gradient(90deg,#2563eb,#60a5fa)}
.cure-warn{background:linear-gradient(90deg,#d97706,#f59e0b)!important}
.cure-danger{background:linear-gradient(90deg,#dc2626,#ef4444)!important}
.cure-shimmer{position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);animation:shimmer 2s infinite}
@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}

/* 地图 */
.map-wrapper{position:relative;border-radius:14px;overflow:hidden;margin-bottom:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:1;border:1px solid rgba(255,255,255,0.06)}
.world-svg{width:100%;display:block}
.map-canvas-overlay{position:absolute;inset:0;pointer-events:none;z-index:2}
.region-shadow{pointer-events:none}
.region-body{cursor:pointer;transition:fill 0.5s,stroke 0.3s}
.region:hover .region-body{filter:brightness(1.25)}
.region.selected .region-body{stroke:#fbbf24!important;stroke-width:2.5}
.region-label{pointer-events:none}
.pulse-glow{pointer-events:none}

/* DNA螺旋 */
.dna-helix{position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:3;opacity:0.5}
.helix-svg{width:24px;height:80px}

/* 提示框 */
.map-tooltip{position:absolute;transform:translate(-50%,-110%);z-index:10;background:rgba(10,20,35,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;min-width:160px;pointer-events:none;backdrop-filter:blur(10px);box-shadow:0 10px 36px rgba(0,0,0,0.5)}
.tip-head{font-size:13px;font-weight:700;color:#f1f5f9;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid rgba(255,255,255,0.08)}
.tip-bar-row{display:flex;align-items:center;gap:5px;margin:3px 0;font-size:10px}
.tip-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.tip-lbl{color:#94a3b8;width:26px;flex-shrink:0}
.tip-track{flex:1;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden}
.tip-fill{height:100%;border-radius:2px;transition:width 0.3s}
.tip-val{color:#e2e8f0;font-weight:600;width:36px;text-align:right;font-size:10px;font-variant-numeric:tabular-nums}
.tip-fade-enter-active,.tip-fade-leave-active{transition:opacity 0.2s}
.tip-fade-enter-from,.tip-fade-leave-to{opacity:0}

/* 趋势图 */
.trend-chart{position:absolute;bottom:10px;right:10px;z-index:3;background:rgba(10,20,35,0.85);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:6px 8px;backdrop-filter:blur(6px)}
.trend-title{font-size:9px;color:#94a3b8;margin-bottom:3px}
.trend-canvas{display:block;border-radius:3px}
.trend-legend{display:flex;gap:6px;margin-top:3px}
.legend-item{font-size:7px;color:#94a3b8;display:flex;align-items:center;gap:2px}
.legend-dot{width:4px;height:4px;border-radius:50%}

/* 操作栏 */
.action-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:12px;position:relative;z-index:1}
.act-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:9px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;font-size:12px;font-weight:600;color:#f1f5f9;transition:all 0.2s;background:rgba(255,255,255,0.04)}
.act-btn:hover{background:rgba(255,255,255,0.08);transform:translateY(-1px)}
.act-btn:active{transform:translateY(0)}
.act-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none}
.act-icon{width:16px;height:16px}
.act-spread{background:linear-gradient(135deg,rgba(220,38,38,0.3),rgba(185,28,28,0.3));border-color:rgba(239,68,68,0.25)}
.act-spread:hover{box-shadow:0 0 16px rgba(239,68,68,0.2)}
.act-auto{background:linear-gradient(135deg,rgba(37,99,235,0.25),rgba(29,78,216,0.25));border-color:rgba(59,130,246,0.25)}
.act-auto.is-active{background:linear-gradient(135deg,rgba(217,119,6,0.35),rgba(180,83,9,0.35));border-color:rgba(245,158,11,0.35)}
.act-speed{padding:7px 9px}
.speed-badge{font-size:11px;font-weight:700;color:#fbbf24}
.act-skill{background:linear-gradient(135deg,rgba(168,85,247,0.2),rgba(139,92,246,0.2));border-color:rgba(168,85,247,0.2);font-size:11px;padding:6px 10px;position:relative;overflow:hidden}
.act-skill::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.05),transparent);opacity:0;transition:opacity 0.3s}
.act-skill:hover:not(:disabled)::before{opacity:1}
.act-skill:hover:not(:disabled){border-color:rgba(168,85,247,0.5);box-shadow:0 0 12px rgba(168,85,247,0.15),0 4px 12px rgba(0,0,0,0.2);transform:translateY(-2px)}
.act-skill.cd{opacity:0.4}
.act-skill.cd span:first-child{animation:skill-cd 1s ease-in-out infinite}
@keyframes skill-cd{0%,100%{opacity:0.4}50%{opacity:0.7}}
.act-reset{background:rgba(255,255,255,0.03)}
.action-spacer{flex:1}
.click-hint{font-size:12px;color:#fbbf24;animation:float 2s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}

/* 进化面板 */
.evo-panel{margin-bottom:12px;padding:14px;border-radius:12px;position:relative;z-index:1;background:rgba(15,23,42,0.5);border:1px solid rgba(255,255,255,0.04)}
.evo-header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.evo-title-icon{font-size:18px;animation:evo-pulse 2s ease-in-out infinite}
@keyframes evo-pulse{0%,100%{transform:scale(1);filter:drop-shadow(0 0 4px rgba(124,58,237,0.3))}50%{transform:scale(1.1);filter:drop-shadow(0 0 8px rgba(124,58,237,0.5))}}
.evo-title-text{font-size:14px;font-weight:700;color:#e2e8f0}
.evo-dna-pill{margin-left:auto;font-size:11px;font-weight:700;color:#c4b5fd;padding:2px 8px;border-radius:7px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.2);animation:glow-pill 2s ease-in-out infinite}
@keyframes glow-pill{0%,100%{box-shadow:0 0 4px rgba(124,58,237,0.2)}50%{box-shadow:0 0 8px rgba(124,58,237,0.4)}}
.evo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}
.evo-card{position:relative;padding:10px 12px;border-radius:10px;cursor:pointer;overflow:hidden;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1)}
.evo-card-bg{position:absolute;inset:0;background:radial-gradient(circle at 20% 50%,rgba(124,58,237,0.05),transparent 60%);opacity:0;transition:opacity 0.3s}
.evo-card:hover .evo-card-bg{opacity:1}
.evo-card:hover{border-color:rgba(255,255,255,0.08);transform:translateY(-2px) scale(1.01);box-shadow:0 6px 20px rgba(0,0,0,0.3)}
.evo-card.can{border-color:rgba(124,58,237,0.3)}
.evo-card.can:hover{border-color:rgba(124,58,237,0.5);box-shadow:0 0 20px rgba(124,58,237,0.15),0 6px 20px rgba(0,0,0,0.3)}
.evo-card.can:active{transform:scale(0.98)}
.evo-card.max{opacity:0.4;cursor:default}
.evo-card-top{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.evo-emoji{font-size:22px;filter:drop-shadow(0 0 4px rgba(124,58,237,0.3));transition:transform 0.3s}
.evo-card:hover .evo-emoji{transform:scale(1.2) rotate(10deg)}
.evo-meta{flex:1;display:flex;flex-direction:column}
.evo-name{font-size:12px;font-weight:700;color:#f1f5f9}
.evo-lvl{font-size:9px;color:#94a3b8}
.evo-lvl-max{color:#475569}
.evo-cost-badge{font-size:11px;font-weight:800;color:#a78bfa;padding:2px 7px;border-radius:5px;background:rgba(124,58,237,0.12);animation:glow-badge 2s ease-in-out infinite}
@keyframes glow-badge{0%,100%{box-shadow:0 0 2px rgba(124,58,237,0.2)}50%{box-shadow:0 0 6px rgba(124,58,237,0.4)}}
.evo-max-badge{font-size:9px;font-weight:800;color:#fbbf24;letter-spacing:1px;text-shadow:0 0 4px rgba(251,191,36,0.3)}
.evo-desc{font-size:9px;color:#64748b;margin-bottom:6px}
.evo-bar-track{height:2px;background:rgba(255,255,255,0.04);border-radius:1px;overflow:hidden;margin-bottom:5px}
.evo-bar-fill{height:100%;border-radius:1px;transition:width 0.4s;background:linear-gradient(90deg,#7c3aed,#a78bfa);position:relative}
.evo-bar-fill::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);animation:shimmer-bar 2s infinite}
@keyframes shimmer-bar{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.evo-dots{display:flex;gap:3px}
.evo-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.06);transition:all 0.3s}
.evo-dot.filled{background:#7c3aed;box-shadow:0 0 3px rgba(124,58,237,0.3);transform:scale(1.1)}

/* 新闻 */
.news-bar{display:flex;align-items:flex-start;gap:8px;padding:8px 12px;border-radius:10px;position:relative;z-index:1;background:rgba(15,23,42,0.4);border:1px solid rgba(255,255,255,0.04);min-height:32px}
.news-tag{font-size:14px;flex-shrink:0;margin-top:1px}
.news-list{flex:1;overflow:hidden}
.news-inner{display:flex;flex-direction:column;gap:2px}
.news-row{display:flex;align-items:center;gap:5px;font-size:10px;color:#cbd5e1}
.news-ico{font-size:12px;flex-shrink:0}
.news-txt{flex:1}
.news-day{font-size:8px;color:#475569;font-weight:600;flex-shrink:0}
.news-anim-enter-active{transition:all 0.35s ease}
.news-anim-leave-active{transition:all 0.25s ease}
.news-anim-enter-from{opacity:0;transform:translateY(-6px)}
.news-anim-leave-to{opacity:0;transform:translateX(16px)}

/* 成就弹窗 */
.achieve-container{position:fixed;top:20px;right:20px;z-index:50;display:flex;flex-direction:column;gap:8px}
.achieve-popup{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:12px;background:rgba(15,23,42,0.95);border:1px solid rgba(250,204,21,0.3);box-shadow:0 8px 32px rgba(0,0,0,0.5);backdrop-filter:blur(12px);position:relative;overflow:hidden}
.achieve-popup::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(250,204,21,0.05),transparent);pointer-events:none}
.achieve-icon{font-size:28px;filter:drop-shadow(0 0 6px rgba(250,204,21,0.3));animation:achieve-icon 0.5s cubic-bezier(0.34,1.56,0.64,1)}
@keyframes achieve-icon{from{transform:scale(0) rotate(-180deg)}to{transform:scale(1) rotate(0deg)}}
.achieve-info{display:flex;flex-direction:column}
.achieve-title{font-size:13px;font-weight:700;color:#fbbf24;text-shadow:0 0 6px rgba(251,191,36,0.2)}
.achieve-desc{font-size:10px;color:#94a3b8}
.achieve-anim-enter-active{transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1)}
.achieve-anim-leave-active{transition:all 0.3s ease}
.achieve-anim-enter-from{opacity:0;transform:translateX(40px) scale(0.8)}
.achieve-anim-leave-to{opacity:0;transform:translateX(40px)}

/* 游戏结束 */
.gameover-mask{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);border-radius:16px}
.gameover-box{text-align:center;padding:32px 40px;border-radius:18px;position:relative;overflow:hidden;animation:pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both}
@keyframes pop-in{from{transform:scale(0.7) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.gameover-glow{position:absolute;inset:-2px;border-radius:20px;z-index:-1}
.gameover-box.win .gameover-glow{background:linear-gradient(135deg,rgba(239,68,68,0.25),rgba(124,58,247,0.25));animation:glow-win 2s ease-in-out infinite}
@keyframes glow-win{0%,100%{box-shadow:0 0 20px rgba(239,68,68,0.2)}50%{box-shadow:0 0 40px rgba(124,58,247,0.3)}}
.gameover-box.lose .gameover-glow{background:linear-gradient(135deg,rgba(59,130,246,0.25),rgba(34,197,94,0.25));animation:glow-lose 2s ease-in-out infinite}
@keyframes glow-lose{0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.2)}50%{box-shadow:0 0 40px rgba(34,197,94,0.3)}}
.gameover-box.win{background:linear-gradient(160deg,#1a1025,#15102a);border:1px solid rgba(239,68,68,0.2)}
.gameover-box.lose{background:linear-gradient(160deg,#0a1a2a,#102030);border:1px solid rgba(59,130,246,0.2)}
.gameover-emoji{font-size:52px;margin-bottom:10px;animation:bounce-emoji 1s ease-in-out infinite}
@keyframes bounce-emoji{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.gameover-h{font-size:22px;font-weight:800;color:#f1f5f9;margin-bottom:6px;text-shadow:0 0 10px rgba(255,255,255,0.1)}
.gameover-sub{font-size:12px;color:#94a3b8;margin-bottom:16px}
.gameover-stats{display:flex;justify-content:center;gap:16px;flex-wrap:wrap}
.go-stat{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.04);transition:all 0.3s}
.go-stat:hover{background:rgba(255,255,255,0.04);transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.2)}
.go-icon{font-size:18px;filter:drop-shadow(0 0 4px rgba(255,255,255,0.1))}
.go-val{font-size:18px;font-weight:800;color:#f1f5f9}
.go-lbl{font-size:9px;color:#64748b}
.go-timeline{margin-top:16px;text-align:left;max-width:300px;margin-left:auto;margin-right:auto}
.go-tl-title{font-size:11px;color:#94a3b8;margin-bottom:6px;font-weight:600}
.go-tl-item{display:flex;align-items:center;gap:8px;font-size:10px;color:#cbd5e1;padding:2px 0;transition:all 0.2s}
.go-tl-item:hover{color:#f1f5f9;transform:translateX(4px)}
.go-tl-day{font-weight:700;color:#fbbf24;width:36px;flex-shrink:0;font-size:9px}
.go-tl-text{flex:1}
.over-fade-enter-active{transition:all 0.4s}
.over-fade-leave-active{transition:all 0.3s}
.over-fade-enter-from,.over-fade-leave-to{opacity:0}

.hint-text{text-align:center;font-size:10px;color:#475569;margin-top:10px;position:relative;z-index:1}
</style>
