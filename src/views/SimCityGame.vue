<template>
  <div class="tool-card max-w-4xl mx-auto">
    <div class="header-wrapper">
      <h2 class="tool-header flex items-center gap-3 relative">
        <span class="city-title-icon">🏙️</span>
        <div class="title-text">
          <span class="title-main">模拟城市</span>
          <span class="title-sub">建造你的梦想都市</span>
        </div>
        <span class="ml-auto level-badge text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-500" :class="levelColor">
          <span class="level-dot" :class="{'level-dot-pulse': population > 0}"></span>
          {{ cityLevel }}
        </span>
        <div class="header-glow"></div>
      </h2>
    </div>

    <!-- 顶部操作栏 -->
    <div class="flex flex-wrap gap-2 mb-3 items-center">
      <button class="btn-sm btn-primary" @click="tick" :class="{'tick-pulse': isTicking}">
        <span v-if="speedMode===1">⏩ 推进一月</span><span v-else>⏩⏩ 快速×{{ speedMode }}</span>
      </button>
      <button class="btn-sm btn-secondary" @click="toggleSpeed" :class="{'!bg-primary-100 dark:!bg-primary-900/30 !text-primary-700 dark:!text-primary-300': speedMode>1}">
        {{ speedMode === 1 ? '🐢 正常' : '🚀 快速' }}
      </button>
      <button class="btn-sm btn-secondary" @click="undo" :disabled="history.length===0" :class="{'opacity-40 cursor-not-allowed': history.length===0}">↩️ 撤销</button>
      <button class="btn-sm text-xs" :class="building==='demolish'?'bg-red-500 text-white shadow-lg shadow-red-500/30':'btn-secondary'" @click="building='demolish'">🗑️ 拆除</button>
      <div class="ml-auto flex gap-1.5">
        <button class="btn-sm btn-secondary text-xs" @click="saveGame" title="保存">💾</button>
        <button class="btn-sm btn-secondary text-xs" @click="loadGame" title="读取">📂</button>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="flex gap-1 mb-3 border-b border-gray-200 dark:border-slate-700 pb-0">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn px-3 py-1.5 text-sm font-medium rounded-t-lg transition-all"
        :class="activeTab===tab.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'"
        @click="activeTab=tab.id">
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- 建设面板 -->
    <div v-show="activeTab==='build'" class="building-panel mb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <span>🔨</span> 建筑面板
        </span>
        <span class="text-xs text-gray-400 hidden sm:block">快捷键 1-9,0 · Q拆除 · 点击同类建筑升级</span>
      </div>
      <div class="grid grid-cols-5 sm:grid-cols-10 gap-2">
        <div v-for="(b,idx) in buildings" :key="b.type"
          class="building-card flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl cursor-pointer transition-all duration-250 text-xs border-2 relative overflow-hidden"
          :class="buildingCardClass(b)"
          @click="selectBuilding(b)">
          <span class="absolute top-1 right-1.5 text-[10px] text-gray-400 font-mono opacity-60">{{ idx < 9 ? idx+1 : 0 }}</span>
          <div class="building-emoji-wrapper">
            <span class="text-xl building-emoji">{{ b.emoji }}</span>
          </div>
          <span class="font-semibold text-gray-700 dark:text-gray-200 truncate w-full text-center leading-tight">{{ b.name }}</span>
          <span class="text-yellow-600 dark:text-yellow-400 font-bold text-sm">${{ b.cost }}</span>
          <!-- 解锁进度遮罩 -->
          <div v-if="b.unlockAt && population < b.unlockAt" class="building-lock-overlay">
            <div class="lock-content">
              <span>🔒</span>
              <span class="text-[10px] mt-1">{{ b.unlockAt }}人</span>
              <div class="lock-progress">
                <div class="lock-progress-bar" :style="{width: Math.min(100, population / b.unlockAt * 100) + '%'}"></div>
              </div>
            </div>
          </div>
          <div v-if="b.research && !researched.has(b.research)" class="building-lock-overlay research-lock">
            <div class="lock-content">
              <span>🔬</span>
              <span class="text-[10px] mt-1">研究解锁</span>
            </div>
          </div>
          <!-- 选中指示器 -->
          <div v-if="building===b.type" class="building-selected-indicator"></div>
        </div>
      </div>
    </div>

    <!-- 科技面板 -->
    <div v-show="activeTab==='research'" class="mb-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">🔬 科技研究</span>
        <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">🧪 {{ researchPoints }}</span>
        <span class="text-xs text-gray-400">（每月+{{ researchPerMonth }}）</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div v-for="tech in techs" :key="tech.id"
          class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer"
          :class="techCardClass(tech)"
          @click="researchTech(tech)">
          <span class="text-2xl">{{ tech.icon }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm text-gray-800 dark:text-gray-200">{{ tech.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ tech.desc }}</div>
          </div>
          <div class="text-right shrink-0">
            <div v-if="researched.has(tech.id)" class="text-green-500 font-bold text-xs">✅ 已研究</div>
            <div v-else class="text-blue-600 dark:text-blue-400 font-bold text-xs">🧪 {{ tech.cost }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 政策面板 -->
    <div v-show="activeTab==='policy'" class="mb-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">📜 城市政策</span>
        <span class="text-xs text-gray-400">激活政策获得持续加成（有上限）</span>
      </div>
      <!-- 税率 -->
      <div class="flex items-center gap-3 mb-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">💵 税率</span>
        <input type="range" min="0" max="30" v-model.number="taxRate" class="flex-1 accent-primary-500">
        <span class="text-sm font-bold w-12 text-right" :class="taxRate > 20 ? 'text-red-500' : taxRate > 10 ? 'text-yellow-500' : 'text-green-500'">{{ taxRate }}%</span>
        <span class="text-xs text-gray-400 w-20 text-right">收入+{{ taxIncome }}/月</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div v-for="pol in policies" :key="pol.id"
          class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer"
          :class="policyCardClass(pol)"
          @click="togglePolicy(pol)">
          <span class="text-2xl">{{ pol.icon }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm text-gray-800 dark:text-gray-200">{{ pol.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ pol.desc }}</div>
          </div>
          <div class="shrink-0">
            <span v-if="activePolicies.has(pol.id)" class="text-green-500 text-xs font-bold">✅ 生效中</span>
            <span v-else class="text-gray-400 text-xs">点击启用</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务面板 -->
    <div v-show="activeTab==='missions'" class="mb-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">📋 城市任务</span>
      </div>
      <div class="grid gap-2">
        <div v-for="m in missions" :key="m.id"
          class="flex items-center gap-3 p-3 rounded-xl border transition-all"
          :class="m.completed ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 opacity-70' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'">
          <span class="text-2xl">{{ m.icon }}</span>
          <div class="flex-1">
            <div class="font-bold text-sm text-gray-800 dark:text-gray-200">{{ m.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ m.desc }}</div>
            <div class="mt-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div class="h-full bg-primary-500 rounded-full transition-all duration-500" :style="{width: Math.min(100, m.progress()) + '%'}"></div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div v-if="m.completed" class="text-green-500 font-bold text-xs">✅ 已完成</div>
            <button v-else-if="m.progress() >= 100" class="btn-sm btn-primary text-xs" @click="claimMission(m)">🎁 领取</button>
            <div v-else class="text-xs text-gray-400">{{ Math.min(100, Math.floor(m.progress())) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 城市数据面板 -->
    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-3">
      <div class="stat-card sm stat-card-gold">
        <div class="stat-icon-wrapper stat-icon-gold">
          <span class="stat-icon">💰</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">资金</div>
          <div class="stat-value">${{ animatedMoney.toLocaleString() }}</div>
          <div v-if="lastIncome !== 0" class="stat-delta" :class="lastIncome > 0 ? 'text-green-500' : 'text-red-500'">
            {{ lastIncome > 0 ? '+' : '' }}{{ lastIncome.toLocaleString() }}
          </div>
        </div>
      </div>
      <div class="stat-card sm stat-card-blue">
        <div class="stat-icon-wrapper stat-icon-blue">
          <span class="stat-icon">👥</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">人口</div>
          <div class="stat-value">{{ population.toLocaleString() }}</div>
        </div>
      </div>
      <div class="stat-card sm stat-card-pink">
        <div class="stat-icon-wrapper stat-icon-pink">
          <span class="stat-icon">{{ happinessEmoji }}</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">幸福度</div>
          <div class="stat-value" :class="happinessColor">{{ happiness }}%</div>
          <div class="stat-progress">
            <div class="stat-progress-bar" :class="happinessBarColor" :style="{width: happiness+'%'}"></div>
          </div>
        </div>
      </div>
      <div class="stat-card sm stat-card-green">
        <div class="stat-icon-wrapper stat-icon-green">
          <span class="stat-icon">📅</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">时间</div>
          <div class="stat-value">{{ yearText }}年{{ monthText }}月</div>
        </div>
      </div>
      <div class="stat-card sm stat-card-cyan">
        <div class="stat-icon-wrapper stat-icon-cyan">
          <span class="stat-icon">⚡</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">电力</div>
          <div class="stat-value" :class="powerColor">{{ powerSupply }}%</div>
        </div>
      </div>
      <div class="stat-card sm stat-card-purple">
        <div class="stat-icon-wrapper stat-icon-purple">
          <span class="stat-icon">🏆</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">成就</div>
          <div class="stat-value">{{ unlockedAchievements.length }}/{{ achievements.length }}</div>
        </div>
      </div>
    </div>

    <!-- 事件/成就通知 -->
    <Transition name="event">
      <div v-if="eventMsg" class="notification-card mb-2 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg backdrop-blur-sm" :class="eventClass">
        <span class="notification-icon">{{ notificationIcon }}</span>
        <span class="flex-1">{{ eventMsg }}</span>
        <button class="notification-close opacity-60 hover:opacity-100 transition-opacity" @click="eventMsg=''">✕</button>
      </div>
    </Transition>
    <Transition name="achievement">
      <div v-if="achievementNotif" class="achievement-card mb-2 px-5 py-3 rounded-xl text-sm flex items-center gap-4 shadow-xl bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/30 dark:via-amber-900/30 dark:to-orange-900/30 border border-yellow-300 dark:border-yellow-700">
        <div class="achievement-icon-wrapper">
          <span class="text-2xl achievement-bounce">🏅</span>
        </div>
        <div>
          <div class="font-bold text-yellow-700 dark:text-yellow-300 text-base">成就解锁！</div>
          <div class="text-yellow-600 dark:text-yellow-400">{{ achievementNotif }}</div>
        </div>
        <button class="notification-close opacity-60 hover:opacity-100 transition-opacity" @click="achievementNotif=''">✕</button>
      </div>
    </Transition>

    <!-- 城市地图 -->
    <div class="relative overflow-x-auto pb-2">
      <div class="inline-grid gap-1 p-4 rounded-2xl city-map mx-auto relative" :style="{gridTemplateColumns:`repeat(${SIZE},1fr)`}">
        <div class="season-overlay pointer-events-none absolute inset-0 rounded-2xl" :class="seasonClass"></div>
        <div v-for="(cell,i) in grid" :key="i"
          class="city-cell group relative flex items-center justify-center text-xl cursor-pointer select-none"
          :class="cellClass(cell)" @click="place(i)" @mouseenter="hoveredCell=i" @mouseleave="hoveredCell=-1">
          <span class="cell-emoji" :class="{'cell-place-anim': cell.justPlaced, 'factory-smoke': cell.type==='factory', 'power-glow': cell.type==='power'}">{{ cell.emoji }}</span>
          <span v-if="cell.level > 1" class="cell-stars"><span v-for="s in Math.min(cell.level-1,3)" :key="s" class="text-[8px]">⭐</span></span>
          <Transition name="fade">
            <div v-if="hoveredCell===i && cell.type!=='empty'" class="cell-tooltip">
              <div class="font-semibold">{{ getBuildingInfo(cell.type) }}</div>
              <div v-if="cell.level>1" class="text-yellow-300 text-[10px]">Lv.{{ cell.level }}</div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 建筑统计 + 成就 -->
    <div class="flex flex-wrap gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400 justify-center">
      <span v-for="b in placedBuildings" :key="b.type" class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700">
        {{ b.emoji }} {{ b.name }} <span class="font-bold text-gray-700 dark:text-gray-300">×{{ b.count }}</span>
      </span>
      <span v-if="placedBuildings.length===0" class="text-gray-400 italic">还没有建筑，选择建筑开始建设吧！</span>
    </div>
    <div v-if="unlockedAchievements.length > 0" class="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700 flex flex-wrap gap-1.5">
      <span v-for="a in unlockedAchievements" :key="a.id" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">{{ a.icon }} {{ a.name }}</span>
    </div>

    <p class="text-xs text-gray-400 mt-3 text-center leading-relaxed">
      💡 住宅增人口 · 工厂/商店增收 · 公园/医院增幸福 · 研究所产科技点 · 电站供电 · 合理税率平衡收支<br>
      ⌨️ 1-9,0选建筑 · Q拆除 · Ctrl+S保存 · Ctrl+Z撤销
    </p>

    <!-- 破产 -->
    <Transition name="event">
      <div v-if="isBankrupt" class="bankrupt-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" @click.self="">
        <div class="bankrupt-card bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl border border-slate-200 dark:border-slate-700">
          <div class="bankrupt-icon-wrapper mb-4">
            <span class="text-5xl">💸</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">城市破产了！</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">资金耗尽，城市发展停滞。</p>
          <div class="flex gap-3 justify-center">
            <button class="btn-sm btn-primary" @click="reset">🔄 重新开始</button>
            <button class="btn-sm btn-secondary" @click="loadGame" v-if="hasSave">📂 读取存档</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const SIZE = 12, SAVE_KEY = 'simcity-save-v3'

const grid = ref([]), money = ref(1000), population = ref(0), happiness = ref(50), turn = ref(1)
const building = ref('house'), hoveredCell = ref(-1), eventMsg = ref(''), eventClass = ref('')
const lastIncome = ref(0), speedMode = ref(1), isTicking = ref(false), history = ref([])
const achievementNotif = ref(''), unlockedIds = ref(new Set()), animatedMoney = ref(1000)
const isBankrupt = ref(false), hasSave = ref(false)
const activeTab = ref('build')
const researchPoints = ref(0), researched = ref(new Set())
const activePolicies = ref(new Set()), taxRate = ref(10)
const completedMissions = ref(new Set())

const tabs = [
  { id: 'build', icon: '🔨', name: '建设' },
  { id: 'research', icon: '🔬', name: '科技' },
  { id: 'policy', icon: '📜', name: '政策' },
  { id: 'missions', icon: '📋', name: '任务' },
]

const buildings = [
  { type: 'house', emoji: '🏠', name: '住宅', cost: 100, desc: '人口+10', unlockAt: 0 },
  { type: 'factory', emoji: '🏭', name: '工厂', cost: 200, desc: '收入+$60', unlockAt: 0 },
  { type: 'shop', emoji: '🏪', name: '商店', cost: 150, desc: '收入+$40', unlockAt: 0 },
  { type: 'park', emoji: '🌳', name: '公园', cost: 50, desc: '幸福+5', unlockAt: 0 },
  { type: 'hospital', emoji: '🏥', name: '医院', cost: 300, desc: '幸福+8', unlockAt: 50 },
  { type: 'school', emoji: '🏫', name: '学校', cost: 250, desc: '幸福+6,科技+1', unlockAt: 50 },
  { type: 'police', emoji: '🚔', name: '警局', cost: 200, desc: '幸福+4', unlockAt: 100 },
  { type: 'lab', emoji: '🔬', name: '研究所', cost: 400, desc: '科技+3/月', unlockAt: 80, research: 'science' },
  { type: 'power', emoji: '⚡', name: '电站', cost: 500, desc: '供电+25%', unlockAt: 100, research: 'energy' },
  { type: 'stadium', emoji: '🏟️', name: '体育场', cost: 600, desc: '幸福+12', unlockAt: 200, research: 'culture' },
  { type: 'bank', emoji: '🏦', name: '银行', cost: 450, desc: '收入+$80', unlockAt: 150, research: 'finance' },
  { type: 'library', emoji: '📚', name: '图书馆', cost: 200, desc: '科技+2,幸福+3', unlockAt: 60 },
  { type: 'fire', emoji: '🚒', name: '消防站', cost: 180, desc: '防灾+幸福+3', unlockAt: 80 },
  { type: 'road', emoji: '🛤️', name: '道路', cost: 20, desc: '基础设施', unlockAt: 0 },
]
const buildingMap = Object.fromEntries(buildings.map(b => [b.type, b]))

const techs = [
  { id: 'science', icon: '🧬', name: '基础科学', desc: '解锁研究所，提升研究效率', cost: 10, prereq: null },
  { id: 'energy', icon: '⚡', name: '能源技术', desc: '解锁电站，为城市供电', cost: 15, prereq: 'science' },
  { id: 'culture', icon: '🎭', name: '文化建设', desc: '解锁体育场，大幅提升幸福', cost: 20, prereq: null },
  { id: 'finance', icon: '📊', name: '金融体系', desc: '解锁银行，增加被动收入', cost: 25, prereq: 'science' },
  { id: 'green', icon: '🌱', name: '绿色能源', desc: '电站污染减半，公园效果+50%', cost: 30, prereq: 'energy' },
  { id: 'smart', icon: '🤖', name: '智慧城市', desc: '所有建筑收入+20%', cost: 50, prereq: 'finance' },
]

const policies = [
  { id: 'tax_cut', icon: '📉', name: '减税政策', desc: '税率-5%，但人口增长+20%' },
  { id: 'green_city', icon: '🌿', name: '绿色城市', desc: '公园/图书馆效果翻倍，工厂收入-20%' },
  { id: 'education', icon: '🎓', name: '教育优先', desc: '学校/图书馆科技产出翻倍' },
  { id: 'welfare', icon: '🏥', name: '社会福利', desc: '幸福度+15，但每月-$50' },
  { id: 'industrial', icon: '🏭', name: '工业振兴', desc: '工厂收入+50%，幸福-10' },
  { id: 'tourism', icon: '✈️', name: '旅游推广', desc: '每月额外+$100，需要体育场' },
]

const missions = computed(() => [
  { id: 'm1', icon: '🏗️', name: '初出茅庐', desc: '放置10个建筑', completed: completedMissions.value.has('m1'), reward: 300, progress: () => grid.value.filter(c=>c.type!=='empty').length / 10 * 100 },
  { id: 'm2', icon: '👥', name: '百人之城', desc: '人口达到100', completed: completedMissions.value.has('m2'), reward: 500, progress: () => population.value / 100 * 100 },
  { id: 'm3', icon: '😊', name: '幸福家园', desc: '幸福度保持80%以上持续6个月', completed: completedMissions.value.has('m3'), reward: 400, progress: () => happyStreak.value / 6 * 100 },
  { id: 'm4', icon: '🔬', name: '科技先驱', desc: '研究3项科技', completed: completedMissions.value.has('m4'), reward: 600, progress: () => researched.value.size / 3 * 100 },
  { id: 'm5', icon: '💰', name: '万金之城', desc: '资金超过$10,000', completed: completedMissions.value.has('m5'), reward: 800, progress: () => money.value / 10000 * 100 },
  { id: 'm6', icon: '🌆', name: '大都市', desc: '人口达到500', completed: completedMissions.value.has('m6'), reward: 1500, progress: () => population.value / 500 * 100 },
  { id: 'm7', icon: '⬆️', name: '升级大师', desc: '升级5个建筑到Lv.2+', completed: completedMissions.value.has('m7'), reward: 500, progress: () => grid.value.filter(c=>c.level>1).length / 5 * 100 },
  { id: 'm8', icon: '📜', name: '政策专家', desc: '同时激活3项政策', completed: completedMissions.value.has('m8'), reward: 400, progress: () => activePolicies.value.size / 3 * 100 },
])

const happyStreak = ref(0)

const achievements = [
  { id: 'first_build', icon: '🏗️', name: '第一步', check: (g) => g.some(c => c.type !== 'empty') },
  { id: 'pop50', icon: '👥', name: '小聚落', check: () => population.value >= 50 },
  { id: 'pop200', icon: '🏘️', name: '新兴城镇', check: () => population.value >= 200 },
  { id: 'pop500', icon: '🌆', name: '繁华都市', check: () => population.value >= 500 },
  { id: 'rich', icon: '💎', name: '财政充裕', check: () => money.value >= 10000 },
  { id: 'happy90', icon: '😄', name: '幸福乐园', check: () => happiness.value >= 90 },
  { id: 'year5', icon: '📅', name: '五年规划', check: () => turn.value >= 60 },
  { id: 'diverse', icon: '🌈', name: '多元发展', check: (g) => new Set(g.filter(c=>c.type!=='empty').map(c=>c.type)).size >= 6 },
  { id: 'dense', icon: '🏙️', name: '高密度', check: (g) => g.filter(c=>c.type!=='empty').length >= 80 },
  { id: 'upgrade', icon: '⬆️', name: '升级改造', check: (g) => g.some(c => c.level > 1) },
  { id: 'researcher', icon: '🔬', name: '科研先锋', check: () => researched.value.size >= 3 },
  { id: 'alltech', icon: '🧠', name: '全知全能', check: () => researched.value.size >= techs.length },
  { id: 'policymaker', icon: '📜', name: '政策大师', check: () => activePolicies.value.size >= 4 },
  { id: 'power100', icon: '⚡', name: '满电运行', check: () => powerSupply.value >= 100 },
]
const unlockedAchievements = computed(() => achievements.filter(a => unlockedIds.value.has(a.id)))

// 电力计算
const powerSupply = computed(() => {
  const powerCount = grid.value.filter(c => c.type === 'power').length
  const baseDemand = grid.value.filter(c => c.type !== 'empty' && c.type !== 'road' && c.type !== 'park').length
  if (baseDemand === 0) return 100
  const supply = powerCount * 25
  return Math.min(100, Math.floor(supply / baseDemand * 100))
})
const powerColor = computed(() => powerSupply.value >= 80 ? 'text-green-600 dark:text-green-400' : powerSupply.value >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400')

// 税率收入
const taxIncome = computed(() => Math.floor(population.value * taxRate.value * 0.5))

// 研究速度
const researchPerMonth = computed(() => {
  let base = 0
  grid.value.forEach(c => {
    if (c.type === 'lab') base += 3 * (c.level || 1)
    if (c.type === 'school') base += 1 * (c.level || 1)
    if (c.type === 'library') base += 2 * (c.level || 1)
  })
  if (activePolicies.value.has('education')) base = Math.floor(base * 1.5)
  return base
})

const seasonClass = computed(() => {
  const m = ((turn.value - 1) % 12) + 1
  if (m >= 3 && m <= 5) return 'season-spring'
  if (m >= 6 && m <= 8) return 'season-summer'
  if (m >= 9 && m <= 11) return 'season-autumn'
  return 'season-winter'
})

const notificationIcon = computed(() => {
  if (eventClass.value.includes('success')) return '✅'
  if (eventClass.value.includes('warning')) return '⚠️'
  if (eventClass.value.includes('danger')) return '❌'
  return 'ℹ️'
})
const yearText = computed(() => Math.floor((turn.value - 1) / 12) + 1)
const monthText = computed(() => ((turn.value - 1) % 12) + 1)
const happinessEmoji = computed(() => happiness.value >= 80 ? '😄' : happiness.value >= 60 ? '😊' : happiness.value >= 40 ? '😐' : '😟')

const cityLevel = computed(() => {
  const p = population.value
  if (p >= 500) return '🌟 国际大都市'; if (p >= 300) return '🏙️ 大城市'
  if (p >= 150) return '🏘️ 城镇'; if (p >= 50) return '🏡 小镇'; return '🏕️ 村庄'
})
const levelColor = computed(() => {
  const p = population.value
  if (p >= 500) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
  if (p >= 300) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
  if (p >= 150) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
  if (p >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
  return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
})
const happinessColor = computed(() => happiness.value >= 80 ? 'text-green-600 dark:text-green-400' : happiness.value >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400')
const happinessBarColor = computed(() => happiness.value >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : happiness.value >= 50 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-rose-500')

const placedBuildings = computed(() => {
  const counts = {}
  grid.value.forEach(c => { if (c.type !== 'empty') counts[c.type] = (counts[c.type] || 0) + 1 })
  return Object.entries(counts).map(([type, count]) => ({ ...buildingMap[type], count })).sort((a, b) => b.count - a.count)
})

function getBuildingCount(t) { return grid.value.filter(c => c.type === t).length }
function getBuildingInfo(t) { const b = buildingMap[t]; return b ? `${b.emoji} ${b.name} - ${b.desc}` : t }

function buildingCardClass(b) {
  if (building.value === b.type) {
    return 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 scale-105 shadow-lg shadow-primary-500/25'
  }
  if ((b.unlockAt && population.value < b.unlockAt) || (b.research && !researched.value.has(b.research))) {
    return 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 opacity-80'
  }
  if (money.value < b.cost) {
    return 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
  }
  return 'border-transparent bg-white dark:bg-slate-700/70 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:scale-105 hover:shadow-md'
}

function selectBuilding(b) {
  if (b.research && !researched.value.has(b.research)) { showEvent(`🔬 需要先研究「${techs.find(t=>t.id===b.research)?.name}」`, 'warning'); return }
  if (b.unlockAt && population.value < b.unlockAt) { showEvent(`🔒 需要 ${b.unlockAt} 人口`, 'warning'); return }
  building.value = b.type
}

function techCardClass(t) {
  if (researched.value.has(t.id)) return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 cursor-default'
  if (t.prereq && !researched.value.has(t.prereq)) return 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
  if (researchPoints.value >= t.cost) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 hover:shadow-md hover:scale-[1.02]'
  return 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow'
}

function researchTech(t) {
  if (researched.value.has(t.id)) return
  if (t.prereq && !researched.value.has(t.prereq)) { showEvent(`🔒 需要先研究「${techs.find(x=>x.id===t.prereq)?.name}」`, 'warning'); return }
  if (researchPoints.value < t.cost) { showEvent(`🧪 科技点不足（需要${t.cost}，当前${researchPoints.value}）`, 'warning'); return }
  researchPoints.value -= t.cost
  researched.value.add(t.id)
  showEvent(`🔬 研究完成：${t.name}！${t.desc}`, 'success')
  checkAchievements()
}

function policyCardClass(p) {
  if (activePolicies.value.has(p.id)) return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
  return 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow hover:scale-[1.01]'
}

function togglePolicy(p) {
  if (activePolicies.value.has(p.id)) { activePolicies.value.delete(p.id); showEvent(`📜 已取消政策：${p.name}`, 'info') }
  else {
    if (activePolicies.value.size >= 3) { showEvent('⚠️ 最多同时激活3项政策', 'warning'); return }
    activePolicies.value.add(p.id); showEvent(`📜 已激活政策：${p.name}`, 'success')
  }
  checkAchievements()
}

function claimMission(m) {
  if (m.completed || m.progress() < 100) return
  completedMissions.value.add(m.id)
  money.value += m.reward
  showEvent(`🎁 任务完成「${m.name}」！奖励 $${m.reward}`, 'success')
}

function saveGame() {
  const data = { grid: grid.value, money: money.value, population: population.value, happiness: happiness.value, turn: turn.value, lastIncome: lastIncome.value, unlockedIds: [...unlockedIds.value], researchPoints: researchPoints.value, researched: [...researched.value], activePolicies: [...activePolicies.value], taxRate: taxRate.value, completedMissions: [...completedMissions.value], happyStreak: happyStreak.value }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); hasSave.value = true; showEvent('💾 已保存！', 'success') } catch(e) { showEvent('❌ 保存失败', 'danger') }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) { showEvent('📂 没有找到存档', 'warning'); return }
    const d = JSON.parse(raw)
    grid.value = d.grid; money.value = d.money; population.value = d.population; happiness.value = d.happiness
    turn.value = d.turn; lastIncome.value = d.lastIncome || 0; unlockedIds.value = new Set(d.unlockedIds || [])
    researchPoints.value = d.researchPoints || 0; researched.value = new Set(d.researched || [])
    activePolicies.value = new Set(d.activePolicies || []); taxRate.value = d.taxRate ?? 10
    completedMissions.value = new Set(d.completedMissions || []); happyStreak.value = d.happyStreak || 0
    animatedMoney.value = money.value; history.value = []; isBankrupt.value = false
    showEvent('📂 存档加载成功！', 'success')
  } catch(e) { showEvent('❌ 加载失败', 'danger') }
}

function pushHistory() {
  history.value.push({ grid: JSON.parse(JSON.stringify(grid.value)), money: money.value, population: population.value, happiness: happiness.value, turn: turn.value, lastIncome: lastIncome.value, researchPoints: researchPoints.value })
  if (history.value.length > 15) history.value.shift()
}

function undo() {
  if (history.value.length === 0) return
  const s = history.value.pop()
  grid.value = s.grid; money.value = s.money; population.value = s.population; happiness.value = s.happiness
  turn.value = s.turn; lastIncome.value = s.lastIncome; researchPoints.value = s.researchPoints
  animatedMoney.value = money.value; isBankrupt.value = false
  showEvent('↩️ 已撤销', 'info')
}

function toggleSpeed() { speedMode.value = speedMode.value === 1 ? 3 : 1 }

function cellClass(cell) {
  const base = 'rounded-lg transition-all duration-200'
  if (building.value === 'demolish' && cell.type !== 'empty') return `${base} bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 ring-2 ring-red-400 dark:ring-red-600 hover:scale-110 cursor-crosshair`
  if (cell.type === 'empty') return `${base} bg-green-100/80 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/50 hover:scale-105 hover:shadow-md`
  const colors = { house: 'bg-orange-100 dark:bg-orange-900/30', factory: 'bg-gray-200 dark:bg-gray-700/50', shop: 'bg-cyan-100 dark:bg-cyan-900/30', park: 'bg-emerald-100 dark:bg-emerald-900/30', hospital: 'bg-red-100 dark:bg-red-900/20', school: 'bg-blue-100 dark:bg-blue-900/30', police: 'bg-indigo-100 dark:bg-indigo-900/30', road: 'bg-stone-200 dark:bg-stone-700/50', lab: 'bg-violet-100 dark:bg-violet-900/30', power: 'bg-yellow-100 dark:bg-yellow-900/30', stadium: 'bg-rose-100 dark:bg-rose-900/30', bank: 'bg-amber-100 dark:bg-amber-900/30', library: 'bg-sky-100 dark:bg-sky-900/30', fire: 'bg-orange-100 dark:bg-orange-900/30' }
  return `${base} ${colors[cell.type] || 'bg-gray-100'} shadow-sm hover:shadow-md hover:scale-105`
}

function showEvent(msg, type = 'info') {
  eventMsg.value = msg
  eventClass.value = {
    info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    success: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    danger: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
  }[type]
  setTimeout(() => { eventMsg.value = '' }, 4000)
}

function checkAchievements() {
  achievements.forEach(a => {
    if (!unlockedIds.value.has(a.id) && a.check(grid.value)) {
      unlockedIds.value.add(a.id)
      achievementNotif.value = `${a.icon} ${a.name}`
      setTimeout(() => { achievementNotif.value = '' }, 4000)
    }
  })
}

function reset() {
  grid.value = Array.from({ length: SIZE * SIZE }, () => ({ type: 'empty', emoji: '🌿', justPlaced: false, level: 1 }))
  money.value = 1000; population.value = 0; happiness.value = 50; turn.value = 1
  lastIncome.value = 0; eventMsg.value = ''; building.value = 'house'
  history.value = []; isBankrupt.value = false; animatedMoney.value = 1000
  unlockedIds.value = new Set(); researchPoints.value = 0; researched.value = new Set()
  activePolicies.value = new Set(); taxRate.value = 10; completedMissions.value = new Set()
  happyStreak.value = 0; activeTab.value = 'build'
}

function place(i) {
  if (building.value === 'demolish') {
    if (grid.value[i].type === 'empty') return
    pushHistory()
    const b = buildingMap[grid.value[i].type]
    const refund = Math.floor((b?.cost || 0) * 0.3 * (grid.value[i].level || 1))
    money.value += refund
    grid.value[i] = { type: 'empty', emoji: '🌿', justPlaced: false, level: 1 }
    if (refund > 0) showEvent(`🗑️ 拆除，回收 $${refund}`, 'warning')
    return
  }
  const b = buildingMap[building.value]
  if (!b || money.value < b.cost) return
  if (b.research && !researched.value.has(b.research)) { showEvent(`🔬 需要先研究对应科技`, 'warning'); return }
  if (b.unlockAt && population.value < b.unlockAt) { showEvent(`🔒 需要 ${b.unlockAt} 人口`, 'warning'); return }
  if (grid.value[i].type === building.value) {
    const uc = Math.floor(b.cost * 0.6 * (grid.value[i].level || 1))
    if (money.value < uc) { showEvent(`💸 升级需要 $${uc}`, 'warning'); return }
    pushHistory(); money.value -= uc
    grid.value[i] = { ...grid.value[i], level: (grid.value[i].level || 1) + 1, justPlaced: true }
    setTimeout(() => { if (grid.value[i]) grid.value[i].justPlaced = false }, 400)
    showEvent(`⬆️ ${b.name} 升级到 Lv.${grid.value[i].level}！`, 'success')
    checkAchievements(); return
  }
  if (grid.value[i].type !== 'empty') return
  pushHistory(); money.value -= b.cost
  grid.value[i] = { type: building.value, emoji: b.emoji, justPlaced: true, level: 1 }
  setTimeout(() => { if (grid.value[i]) grid.value[i].justPlaced = false }, 400)
  checkAchievements()
}

function tick() {
  isTicking.value = true; setTimeout(() => { isTicking.value = false }, 300)
  for (let t = 0; t < speedMode.value; t++) doOneTick()
}

function doOneTick() {
  const counts = {}
  grid.value.forEach(c => { if (c.type !== 'empty') counts[c.type] = (counts[c.type] || 0) + 1 })
  const h = counts.house||0, f = counts.factory||0, s = counts.shop||0, p = counts.park||0
  const hos = counts.hospital||0, sch = counts.school||0, pol = counts.police||0
  const lab = counts.lab||0, pwr = counts.power||0, stad = counts.stadium||0
  const bnk = counts.bank||0, lib = counts.library||0, fire = counts.fire||0

  // 升级加成
  const lvlBonus = grid.value.filter(c => c.type !== 'empty' && c.level > 1).reduce((sum, c) => sum + (c.level - 1) * 0.2, 0)

  // 电力影响
  const powerFactor = powerSupply.value >= 80 ? 1 : powerSupply.value >= 50 ? 0.7 : 0.4

  // 人口
  let popGrowth = 1 + lvlBonus * 0.1
  if (activePolicies.value.has('tax_cut')) popGrowth *= 1.2
  population.value = Math.floor(h * 10 * popGrowth)

  // 收入
  let factoryIncome = f * 60, shopIncome = s * 40, bankIncome = bnk * 80
  if (activePolicies.value.has('green_city')) factoryIncome *= 0.8
  if (activePolicies.value.has('industrial')) factoryIncome *= 1.5
  if (researched.value.has('smart')) { factoryIncome *= 1.2; shopIncome *= 1.2; bankIncome *= 1.2 }
  const baseIncome = Math.floor((factoryIncome + shopIncome + bankIncome + population.value * 2) * powerFactor * (1 + lvlBonus * 0.05))
  const taxInc = Math.floor(population.value * taxRate.value * 0.5)
  const costs = hos * 20 + sch * 15 + pol * 10 + lab * 15 + stad * 25 + lib * 8 + fire * 8 + pwr * 10
  let welfareCost = activePolicies.value.has('welfare') ? 50 : 0
  let tourismIncome = activePolicies.value.has('tourism') && stad > 0 ? 100 : 0
  const income = baseIncome + taxInc - costs - welfareCost + tourismIncome
  money.value += income; lastIncome.value = income

  // 研究点
  let rp = 0
  grid.value.forEach(c => {
    if (c.type === 'lab') rp += 3 * (c.level || 1)
    if (c.type === 'school') rp += 1 * (c.level || 1)
    if (c.type === 'library') rp += 2 * (c.level || 1)
  })
  if (activePolicies.value.has('education')) rp = Math.floor(rp * 1.5)
  researchPoints.value += rp

  // 幸福度
  let parkEffect = p * 5
  if (researched.value.has('green')) parkEffect = Math.floor(parkEffect * 1.5)
  if (activePolicies.value.has('green_city')) parkEffect *= 2
  let libHappy = lib * 3; if (activePolicies.value.has('education')) libHappy *= 2
  let hap = 50 + parkEffect + hos * 8 + sch * 6 + pol * 4 + stad * 12 + libHappy + fire * 3 - f * 3
  if (activePolicies.value.has('welfare')) hap += 15
  if (activePolicies.value.has('industrial')) hap -= 10
  if (taxRate.value > 15) hap -= (taxRate.value - 15) * 2
  if (powerSupply.value < 50) hap -= 15
  happiness.value = Math.min(100, Math.max(0, Math.floor(hap)))

  // 幸福连续
  if (happiness.value >= 80) happyStreak.value++; else happyStreak.value = 0

  // 低幸福人口流失
  if (happiness.value < 20 && population.value > 0 && turn.value > 6) {
    const loss = Math.floor(population.value * 0.05)
    if (loss > 0) { population.value -= loss; showEvent(`😟 幸福度过低，${loss}人离开城市！`, 'danger') }
  }

  turn.value++
  if (money.value < -500) isBankrupt.value = true

  // 随机事件（含灾难）
  if (turn.value > 3 && Math.random() < 0.22) {
    const fireStations = fire || 0
    const events = [
      { msg: '🎉 城市庆典！+$200', type: 'success', fn: () => { money.value += 200 } },
      { msg: '🌪️ 暴风雨！-$150', type: 'danger', fn: () => { money.value -= 150 } },
      { msg: '📈 经济繁荣！收入翻倍', type: 'success', fn: () => { money.value += Math.max(0, income) } },
      { msg: '🎁 联邦拨款！+$300', type: 'success', fn: () => { money.value += 300 } },
      { msg: `🔥 火灾！${fireStations > 0 ? '消防站快速响应' : '损失惨重'} -${fireStations > 0 ? 30 : 150}`, type: 'danger', fn: () => { money.value -= fireStations > 0 ? 30 : 150 } },
      { msg: '🌈 市民幸福感提升！+10', type: 'info', fn: () => { happiness.value = Math.min(100, happiness.value + 10) } },
      { msg: '🎓 教育发展！科技+5', type: 'info', fn: () => { researchPoints.value += 5 } },
      { msg: '🏗️ 建筑商优惠！+$100', type: 'success', fn: () => { money.value += 100 } },
    ]
    if (population.value >= 100) events.push({ msg: '🏆 宜居城市！幸福+15', type: 'success', fn: () => { happiness.value = Math.min(100, happiness.value + 15) } })
    if (population.value >= 300) events.push({ msg: '🌍 国际投资！+$500', type: 'success', fn: () => { money.value += 500 } })
    // 灾难事件
    if (turn.value > 24 && Math.random() < 0.15) {
      events.push({ msg: '🌊 地震预警！紧急应对 -$300', type: 'danger', fn: () => { money.value -= 300 } })
      events.push({ msg: '🦠 疫情爆发！医疗支出翻倍本月', type: 'danger', fn: () => { money.value -= costs } })
    }
    const evt = events[Math.floor(Math.random() * events.length)]
    evt.fn(); showEvent(evt.msg, evt.type)
  }
  checkAchievements()
}

watch(money, (val) => {
  const diff = val - animatedMoney.value, steps = 12; let step = 0
  const iv = setInterval(() => { step++; animatedMoney.value = Math.round(animatedMoney.value + diff * (step / steps)); if (step >= steps) { animatedMoney.value = val; clearInterval(iv) } }, 25)
})

function handleKey(e) {
  if (e.key >= '1' && e.key <= '9') { const idx = parseInt(e.key) - 1; if (buildings[idx]) selectBuilding(buildings[idx]) }
  if (e.key === '0' && buildings[9]) selectBuilding(buildings[9])
  if (e.key === 'q' || e.key === 'Q') building.value = 'demolish'
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveGame() }
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo() }
}

onMounted(() => { reset(); hasSave.value = !!localStorage.getItem(SAVE_KEY); window.addEventListener('keydown', handleKey) })
onUnmounted(() => { window.removeEventListener('keydown', handleKey) })
</script>

<style scoped>
/* 头部样式 */
.header-wrapper {
  position: relative;
  margin-bottom: 12px;
}
.tool-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
  border-radius: 16px;
  border: 1px solid var(--primary-200);
  overflow: hidden;
}
:global(.dark) .tool-header {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.25) 100%);
  border-color: rgba(99, 102, 241, 0.3);
}
.header-glow {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
  animation: glow-pulse 3s ease-in-out infinite;
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}
.city-title-icon {
  font-size: 1.75rem;
  animation: float-icon 3s ease-in-out infinite;
}
@keyframes float-icon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.title-text {
  display: flex;
  flex-direction: column;
}
.title-main {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-900);
}
:global(.dark) .title-main {
  color: var(--white);
}
.title-sub {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-weight: 400;
}
:global(.dark) .title-sub {
  color: var(--gray-400);
}
.level-badge {
  backdrop-filter: blur(8px);
  border: 1px solid currentColor;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.level-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
}
.level-dot-pulse {
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
}

/* 标签页 */
.tab-btn {
  position: relative;
}
.tab-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: var(--primary-500);
  transition: width 0.3s ease;
}
.tab-btn:hover::after {
  width: 50%;
}

/* 建筑面板 */
.building-panel {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--gray-200);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(8px);
}
:global(.dark) .building-panel {
  background: rgba(30, 41, 59, 0.8);
  border-color: var(--slate-600);
}
.building-card {
  min-width: 64px;
}
.building-emoji-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--gray-50);
  transition: all 0.25s ease;
}
:global(.dark) .building-emoji-wrapper {
  background: var(--slate-700);
}
.building-card:hover .building-emoji-wrapper {
  transform: scale(1.15);
  background: var(--primary-100);
}
:global(.dark) .building-card:hover .building-emoji-wrapper {
  background: var(--primary-900);
}
.building-emoji {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.building-card:hover .building-emoji {
  transform: scale(1.1) rotate(-5deg);
}
.building-card:active .building-emoji {
  transform: scale(0.9);
}
.building-lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.building-lock-overlay.research-lock {
  background: rgba(37, 99, 235, 0.65);
}
.lock-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
}
.lock-progress {
  width: 80%;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
  margin-top: 4px;
  overflow: hidden;
}
.lock-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--green-400), var(--emerald-500));
  border-radius: 1px;
  transition: width 0.3s ease;
}
.building-selected-indicator {
  position: absolute;
  inset: -2px;
  border: 2px solid var(--primary-500);
  border-radius: 14px;
  animation: selected-pulse 1.5s ease-in-out infinite;
}
@keyframes selected-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
}

/* 城市地图 */
.city-map {
  background: linear-gradient(145deg, #e8f5e9 0%, #c8e6c9 40%, #a5d6a7 100%);
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.08);
  border-radius: 20px;
}
:global(.dark) .city-map {
  background: linear-gradient(145deg, #0f1f0f 0%, #162416 40%, #1a3320 100%);
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2);
}
.season-overlay {
  transition: background 1.5s ease;
  z-index: 1;
  border-radius: 20px;
}
.season-spring {
  background: radial-gradient(ellipse at 20% 80%, rgba(255, 182, 193, 0.15) 0%, transparent 60%);
}
.season-summer {
  background: radial-gradient(ellipse at 80% 20%, rgba(255, 235, 59, 0.12) 0%, transparent 60%);
}
.season-autumn {
  background: radial-gradient(ellipse at 50% 50%, rgba(255, 152, 0, 0.15) 0%, transparent 60%);
}
.season-winter {
  background: radial-gradient(ellipse at 30% 30%, rgba(200, 220, 255, 0.18) 0%, transparent 60%);
}
.city-cell {
  width: 44px;
  height: 44px;
  position: relative;
  z-index: 2;
  border-radius: 10px;
}
.cell-emoji {
  transition: transform 0.2s ease;
  position: relative;
  z-index: 1;
  font-size: 1.25rem;
}
.cell-place-anim {
  animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop-in {
  0% { transform: scale(0) rotate(-15deg); opacity: 0; }
  60% { transform: scale(1.3) rotate(5deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
.cell-demolish-anim {
  animation: demolish-out 0.3s ease-out forwards;
}
@keyframes demolish-out {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
  100% { transform: scale(0); opacity: 0; }
}
.factory-smoke {
  animation: smoke 2s ease-in-out infinite;
}
.power-glow {
  animation: glow 1.5s ease-in-out infinite;
}
@keyframes smoke {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.4) drop-shadow(0 0 6px rgba(250, 204, 21, 0.6)); }
}
.cell-stars {
  position: absolute;
  top: 1px;
  right: 2px;
  display: flex;
  z-index: 3;
}
.cell-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: rgba(15, 23, 42, 0.95);
  color: white;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  pointer-events: none;
  z-index: 20;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
.cell-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(15, 23, 42, 0.95);
}

/* 统计卡片 */
.stat-card {
  position: relative;
  border-radius: 14px;
  border: 1px solid;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.stat-card:hover {
  transform: translateY(-2px) scale(1.02);
}
.stat-card-gold {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
  border-color: rgba(251, 191, 36, 0.3);
}
.stat-card-blue {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-color: rgba(59, 130, 246, 0.3);
}
.stat-card-pink {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
  border-color: rgba(236, 72, 153, 0.3);
}
.stat-card-green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
  border-color: rgba(34, 197, 94, 0.3);
}
.stat-card-cyan {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
  border-color: rgba(6, 182, 212, 0.3);
}
.stat-card-purple {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
  border-color: rgba(168, 85, 247, 0.3);
}
.stat-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}
.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.1);
}
.stat-icon-gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}
.stat-icon-blue {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}
.stat-icon-pink {
  background: linear-gradient(135deg, #ec4899, #be185d);
}
.stat-icon-green {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
.stat-icon-cyan {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
}
.stat-icon-purple {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
}
.stat-icon {
  font-size: 1.25rem;
  animation: icon-breathe 3s ease-in-out infinite;
}
@keyframes icon-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.stat-label {
  font-size: 10px;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
:global(.dark) .stat-label {
  color: var(--gray-400);
}
.stat-value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--gray-900);
}
:global(.dark) .stat-value {
  color: var(--white);
}
.stat-delta {
  font-size: 11px;
  font-weight: 600;
  margin-top: 1px;
}
.stat-progress {
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}
.stat-progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 按钮动画 */
.tick-pulse {
  animation: tick-anim 0.3s ease;
}
@keyframes tick-anim {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

/* 成就动画 */
.achievement-bounce {
  animation: ach-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes ach-bounce {
  0% { transform: scale(0) rotate(-30deg); }
  60% { transform: scale(1.3) rotate(10deg); }
  100% { transform: scale(1) rotate(0); }
}

/* 过渡动画 */
.event-enter-active {
  animation: slide-down 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.event-leave-active {
  animation: slide-down 0.25s ease-in reverse;
}
@keyframes slide-down {
  from { transform: translateY(-12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.achievement-enter-active {
  animation: ach-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.achievement-leave-active {
  animation: ach-slide 0.3s ease-in reverse;
}
@keyframes ach-slide {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 通知卡片 */
.notification-card {
  border: 1px solid;
}
.notification-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}
.notification-close {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}
.notification-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 成就卡片 */
.achievement-card {
  border: 2px solid;
  position: relative;
  overflow: hidden;
}
.achievement-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -30%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
}
.achievement-icon-wrapper {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

/* 破产弹窗 */
.bankrupt-overlay {
  animation: fade-in 0.3s ease;
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.bankrupt-card {
  animation: modal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modal-pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.bankrupt-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(239, 68, 68, 0.3);
  animation: shake 0.5s ease-in-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

/* 响应式 */
@media (max-width: 640px) {
  .city-cell {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  .stat-value {
    font-size: 14px;
  }
  .stat-icon-wrapper {
    width: 30px;
    height: 30px;
  }
  .stat-icon {
    font-size: 1rem;
  }
  .title-main {
    font-size: 1rem;
  }
  .level-badge {
    padding: 4px 8px;
    font-size: 10px;
  }
  .notification-card, .achievement-card {
    padding: 10px 14px;
  }
}
</style>
