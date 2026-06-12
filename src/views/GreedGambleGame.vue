<template>
  <div class="game-container min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4"
    :class="{ 'red-alert': timer <= 1, 'red-alert-warning': timer <= 3 && timer > 1 }">
    
    <!-- 背景动画 -->
    <div class="bg-animation"></div>
    
    <!-- 红色警报遮罩 -->
    <div v-if="timer <= 3" class="red-alert-overlay" :class="timer <= 1 ? 'intense' : ''"></div>
    
    <!-- 雪花屏特效 -->
    <div v-if="showSnowEffect" class="snow-effect"></div>

    <!-- 游戏主界面 -->
    <div class="max-w-lg mx-auto relative z-10">
      
      <!-- 顶部状态栏 -->
      <div class="bg-black/50 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-purple-500/30">
        <div class="flex justify-between items-center mb-3">
          <div class="text-center">
            <p class="text-xs text-gray-400 uppercase tracking-wider">总资产</p>
            <p class="text-2xl font-bold" :class="(totalMoney + currentPot) >= 10000 ? 'text-yellow-400 animate-pulse' : 'text-green-400'">
              ¥{{ formatNum(totalMoney + currentPot) }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-400 uppercase tracking-wider">本局奖金</p>
            <p class="text-2xl font-bold text-yellow-400">¥{{ formatNum(currentPot) }}</p>
          </div>
        </div>
        <!-- 金牌显示 -->
        <div class="flex justify-center gap-2">
          <div v-for="i in 1" :key="i" 
            class="gold-card" :class="{ 'used': goldCards < i }">
            <span v-if="goldCards >= i">🥇</span>
            <span v-else class="opacity-30">🪙</span>
          </div>
        </div>
      </div>

      <!-- 游戏标题 -->
      <div class="text-center mb-4">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          贪婪的筹码
        </h1>
        <p class="text-sm text-gray-400 mt-1">The Greed Gamble</p>
      </div>

      <!-- 盲盒区域 -->
      <div v-if="gameState === 'playing'" class="mb-6">
        <!-- 倒计时显示 -->
        <div class="text-center mb-4">
          <div class="inline-block relative">
            <div class="timer-circle" :class="{ 'warning': timer <= 3, 'danger': timer <= 1 }">
              <span class="timer-text">{{ timer }}</span>
            </div>
            <div v-if="timer <= 1" class="timer-pulse"></div>
          </div>
          <p class="text-xs text-gray-400 mt-2" :class="{ 'text-red-400': timer <= 1 }">
            {{ timer <= 1 ? '贪婪失控！' : timer <= 4 ? '警告期' : '安全期' }}
          </p>
        </div>

        <!-- 盲盒网格（可自由选择） -->
        <div class="grid grid-cols-5 gap-2 mb-4">
          <div 
            v-for="(box, index) in boxes" 
            :key="index" 
            class="aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all duration-300 relative"
            :class="[getBoxClass(box), getPreviewClass(box)]"
            @click="selectBox(index)">
            <span v-if="box.opened" class="text-lg">{{ getBoxIcon(box) }}</span>
            <span v-else-if="box.revealed === 'bomb'" class="text-2xl opacity-80">💀</span>
            <span v-else-if="box.revealed === 'money'" class="text-2xl opacity-80">✨</span>
            <span v-else class="text-2xl opacity-60 cursor-pointer hover:opacity-100 transition-opacity">❓</span>
            <span v-if="box.opened" class="text-xs font-bold" :class="box.value === -1 ? 'text-white' : 'text-yellow-300'">
              {{ box.value === -1 ? '爆仓' : '¥' + box.value }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-3">
          <button 
            @click="useGoldCard" 
            :disabled="goldCards <= 0 || usedGoldThisTurn || isAutoPlaying"
            class="flex-1 py-3 rounded-xl font-bold transition-all duration-200"
            :class="goldCards > 0 && !usedGoldThisTurn && !isAutoPlaying 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/30' 
              : 'bg-gray-700 opacity-50 cursor-not-allowed'">
            🛡️ 主动买平安
            <span class="text-xs opacity-70">(消耗金牌)</span>
          </button>
          <button 
            @click="cashOut" 
            :disabled="currentPot === 0 || isAutoPlaying"
            class="flex-1 py-3 rounded-xl font-bold transition-all duration-200"
            :class="currentPot > 0 && !isAutoPlaying 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30' 
              : 'bg-gray-700 opacity-50 cursor-not-allowed'">
            💰 收手
          </button>
        </div>
      </div>

      <!-- 开始界面 -->
      <div v-if="gameState === 'idle'" class="text-center">
        <div class="bg-black/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 max-w-lg mx-auto">
          <!-- 标题 -->
          <div class="mb-6">
            <div class="text-6xl mb-2">🎰</div>
            <h1 class="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              贪婪的筹码
            </h1>
            <p class="text-sm text-gray-400 mt-1">The Greed Gamble</p>
          </div>

          <!-- 欢迎语 -->
          <div class="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-4 mb-4 border border-purple-500/30">
            <p class="text-gray-300 text-sm italic">
              在这里，运气只是敲门砖，真正的博弈在于你能否战胜内心的贪婪与恐惧。
            </p>
          </div>

          <!-- 游戏目标与入场 -->
          <div class="text-left mb-4">
            <h3 class="text-lg font-bold text-yellow-400 mb-2 flex items-center">
              <span class="mr-2">🎯</span> 游戏目标与入场
            </h3>
            <ul class="text-sm text-gray-300 space-y-1">
              <li>• 初始本金：<span class="text-green-400">¥500</span></li>
              <li>• 入场费：每局扣除 <span class="text-orange-400">¥200</span></li>
              <li>• 胜利条件：总资产 ≥ <span class="text-yellow-400">¥5000</span></li>
              <li>• 失败条件：本金归零</li>
            </ul>
          </div>

          <!-- 盲盒池 -->
          <div class="text-left mb-4">
            <h3 class="text-lg font-bold text-red-400 mb-2 flex items-center">
              <span class="mr-2">📦</span> 盲盒池与致命惩罚
            </h3>
            <ul class="text-sm text-gray-300 space-y-1">
              <li>• 每局10个盲盒：9个金钱 + 1个炸弹</li>
              <li>• 金钱奖励：5元(3个)、10元(3个)、50元(2个)、100元(1个)、200元(1个)</li>
              <li>• <span class="text-red-400">💣 致命炸弹</span>：奖金清零 + 扣除50元本金</li>
            </ul>
          </div>

          <!-- 免死金牌 -->
          <div class="text-left mb-4">
            <h3 class="text-lg font-bold text-orange-400 mb-2 flex items-center">
              <span class="mr-2">🛡️</span> 免死金牌（每局1枚）
            </h3>
            <ul class="text-sm text-gray-300 space-y-1">
              <li>• <span class="text-green-400">主动买平安</span>：翻牌前使用，若翻出炸弹则免除惩罚并保留奖金；若翻出金钱则正常获得奖励，但金牌作废</li>
              <li>• <span class="text-yellow-400">被动保命</span>：翻到炸弹后使用，免除50元本金扣款，但本局奖金清零</li>
            </ul>
          </div>

          <!-- 心跳倒计时 -->
          <div class="text-left mb-4">
            <h3 class="text-lg font-bold text-purple-400 mb-2 flex items-center">
              <span class="mr-2">⏱️</span> 心跳倒计时与贪婪失控
            </h3>
            <ul class="text-sm text-gray-300 space-y-1">
              <li>• 每次翻牌后有 <span class="text-red-400">10秒</span> 决策时间</li>
              <li>• 超时触发 <span class="text-red-400">贪婪失控</span>：强制翻牌，无法使用金牌</li>
              <li>• 关注屏幕红光与心跳声的警告</li>
            </ul>
          </div>

          <!-- 游戏忠告 -->
          <div class="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-3 mb-6 border border-gray-600/30">
            <p class="text-sm text-gray-400 italic">
              "真正的博弈高手，最懂得'见好就收'。祝您在贪婪与恐惧的夹缝中，保持清醒，成为最终的赢家！"
            </p>
          </div>

          <!-- 当前状态 -->
          <div class="flex justify-center mb-4">
            <div class="text-center">
              <p class="text-xs text-gray-400">当前本金</p>
              <p class="text-xl font-bold text-green-400">¥{{ formatNum(totalMoney) }}</p>
            </div>
          </div>

          <!-- 开始按钮 -->
          <button 
            @click="startGame"
            :disabled="totalMoney < 200"
            class="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200"
            :class="totalMoney >= 200 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30' 
              : 'bg-gray-700 opacity-50 cursor-not-allowed'">
            {{ totalMoney >= 200 ? '🎮 开始挑战' : '💸 余额不足' }}
          </button>
          <p v-if="totalMoney < 200" class="text-red-400 text-sm mt-2">需要至少 ¥200 才能开始</p>
        </div>
      </div>

      <!-- 炸弹弹窗 -->
      <Teleport to="body">
        <div v-if="showBombModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-black/80" @click="closeBombModal"></div>
          <div class="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-sm w-full border border-red-500/50 shadow-2xl"
            :class="{ 'animate-shake': true }">
            <div class="text-6xl text-center mb-4">💥</div>
            <h3 class="text-xl font-bold text-red-400 text-center mb-2">爆仓！</h3>
            <p class="text-gray-300 text-center mb-4">你翻到了炸弹！本局奖金清零</p>
            
            <div v-if="goldCards > 0" class="mb-4">
              <p class="text-sm text-yellow-400 text-center mb-3">使用金牌免除额外扣款？</p>
              <div class="flex gap-3">
                <button 
                  @click="useGoldCardOnBomb" 
                  class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500">
                  🥇 使用金牌 (-50元)
                </button>
                <button 
                  @click="acceptBombPenalty" 
                  class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-red-500 to-rose-500">
                  💔 接受惩罚
                </button>
              </div>
            </div>
            <div v-else class="text-center">
              <p class="text-red-400 mb-4">⚠️ 没有金牌可用</p>
              <button 
                @click="acceptBombPenalty" 
                class="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-red-500 to-rose-500">
                确认
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 胜利界面 -->
      <Teleport to="body">
        <div v-if="showWinModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-black/80"></div>
          <div class="relative bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-2xl p-6 max-w-sm w-full border border-yellow-500/50 shadow-2xl">
            <div class="text-6xl text-center mb-4">🏆</div>
            <h3 class="text-2xl font-bold text-yellow-400 text-center mb-2">恭喜通关！</h3>
            <p class="text-gray-300 text-center mb-4">你战胜了贪婪，成为了真正的赢家！</p>
            <div class="bg-black/30 rounded-xl p-4 mb-4">
              <p class="text-sm text-gray-400 text-center mb-1">最终总资产</p>
              <p class="text-3xl font-bold text-yellow-400 text-center">¥{{ formatNum(totalMoney) }}</p>
            </div>
            <button 
              @click="resetGame" 
              class="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition-transform">
              🎮 再来一局
            </button>
          </div>
        </div>
      </Teleport>

      <!-- 破产救济金弹窗 -->
      <Teleport to="body">
        <div v-if="showBailoutModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-black/80 animate-pulse"></div>
          <div class="relative bg-gradient-to-br from-red-900/80 to-gray-900/80 rounded-2xl p-6 max-w-sm w-full border border-red-500/50 shadow-2xl animate-bounce-in">
            <div class="text-6xl text-center mb-4">🩸</div>
            <h3 class="text-xl font-bold text-red-400 text-center mb-2">你已经破产了...</h3>
            <p class="text-gray-400 text-center mb-2">但命运给了你一次机会</p>
            
            <div class="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 mb-4 border border-yellow-500/30">
              <p class="text-lg font-bold text-yellow-400 text-center">🎁 破产救济金</p>
              <p class="text-3xl font-bold text-yellow-300 text-center mt-2">¥200</p>
              <p class="text-xs text-gray-400 text-center mt-1">+ 3次挑战机会</p>
            </div>
            
            <div class="text-center mb-4">
              <p class="text-sm text-gray-400">剩余时间</p>
              <p class="text-4xl font-bold text-red-400">{{ bailoutTimer }}s</p>
            </div>
            
            <div class="flex gap-3">
              <button 
                @click="claimBailout" 
                class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition-transform">
                ✅ 接受救济
              </button>
              <button 
                @click="closeBailoutModal" 
                class="flex-1 py-3 rounded-xl font-bold bg-gray-700 hover:bg-gray-600 transition-colors">
                ❌ 放弃
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 失败界面 -->
      <Teleport to="body">
        <div v-if="showLoseModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-black/80"></div>
          <div class="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-600/50 shadow-2xl">
            <div class="text-6xl text-center mb-4">💀</div>
            <h3 class="text-xl font-bold text-red-400 text-center mb-2">游戏结束</h3>
            <p class="text-gray-400 text-center mb-4">{{ totalMoney <= 0 ? '你已经破产了...' : '所有机会都已用完' }}</p>
            <div class="bg-black/30 rounded-xl p-4 mb-4">
              <p class="text-sm text-gray-400 text-center mb-1">最终总资产</p>
              <p class="text-3xl font-bold text-gray-300 text-center">¥{{ formatNum(totalMoney) }}</p>
            </div>
            <button 
              @click="resetGame" 
              class="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:scale-105 transition-transform">
              🔄 重新开始
            </button>
          </div>
        </div>
      </Teleport>

      <!-- 贪婪失控印章 -->
      <div v-if="showGreedOverload" class="greed-overload-stamp">
        <span>贪婪失控</span>
      </div>

      <!-- 差一点就赢效果 -->
      <div v-if="showNearMiss" class="near-miss-effect">
        <div class="near-miss-content">
          <span class="text-6xl">👑</span>
          <span class="text-3xl font-bold text-yellow-400">¥500</span>
        </div>
      </div>

      <!-- 金钱损失效果 -->
      <div v-if="showMoneyLossEffect" class="money-loss-effect">
        <div class="loss-amount">-¥{{ lossAmount }}</div>
      </div>

      <!-- 金币掉落特效 -->
      <div v-if="showCoinEffect" class="coin-effect">
        <div v-for="i in 10" :key="i" class="coin" :style="getCoinStyle(i)"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed } from 'vue'

// 游戏状态
const gameState = ref('idle') // idle, playing, win, lose
const totalMoney = ref(500)
const currentPot = ref(0)
const goldCards = ref(2)
const remainingChances = ref(5)
const timer = ref(10)
const openedBoxes = ref([])
const boxes = ref([])
const showBombModal = ref(false)
const showWinModal = ref(false)
const showLoseModal = ref(false)
const showSnowEffect = ref(false)
const showGreedOverload = ref(false)
const showCoinEffect = ref(false)
const usedGoldThisTurn = ref(false)
const isAutoPlaying = ref(false)
const gameCount = ref(0) // 当前是第几局（从0开始）
const isNewbieScript = ref(true) // 是否在新手剧本模式
const shieldActive = ref(false) // 护盾是否激活
const showShieldEffect = ref(false) // 护盾效果显示

// 新优化状态
const showNearMiss = ref(false) // 差一点就赢效果
const nextBoxPreview = ref(null) // 透视下一个盲盒结果
const showBailoutModal = ref(false) // 破产救济金弹窗
const bailoutTimer = ref(10) // 救济金倒计时
const showMoneyLossEffect = ref(false) // 金钱损失效果
const lossAmount = ref(0) // 损失金额

let timerInterval = null
let autoPlayTimeout = null
let bailoutTimerInterval = null

// 盲盒配置
const BOX_TYPES = {
  CONSOLATION: { value: 5, count: 3, icon: '🥉', name: '安慰奖' },
  SMALL: { value: 10, count: 3, icon: '🥈', name: '小奖' },
  MEDIUM: { value: 50, count: 2, icon: '🎁', name: '中奖' },
  LARGE: { value: 100, count: 1, icon: '💎', name: '大奖' },
  JACKPOT: { value: 200, count: 1, icon: '👑', name: '终极诱惑' },
  BOMB: { value: -1, count: 1, icon: '💣', name: '炸弹' }
}

// 格式化数字
function formatNum(num) {
  return num.toLocaleString()
}

// 生成盲盒（新手剧本模式）
function generateNewbieBoxes(round) {
  const BOX_TYPES = {
    CONSOLATION: { value: 5, count: 3, icon: '🥉', name: '安慰奖' },
    SMALL: { value: 10, count: 3, icon: '🥈', name: '小奖' },
    MEDIUM: { value: 50, count: 2, icon: '🎁', name: '中奖' },
    LARGE: { value: 100, count: 1, icon: '💎', name: '大奖' },
    JACKPOT: { value: 200, count: 1, icon: '👑', name: '终极诱惑' },
    BOMB: { value: -1, count: 1, icon: '💣', name: '炸弹' }
  }
  
  switch(round) {
    // 第一局：【甜头与错觉】100元 ➔ 50元 ➔ 100元 ➔ 炸弹
    case 0:
      return [
        { ...BOX_TYPES.MEDIUM },  // 100元
        { ...BOX_TYPES.SMALL },   // 50元
        { ...BOX_TYPES.MEDIUM },  // 100元
        { ...BOX_TYPES.BOMB },    // 炸弹
        { ...BOX_TYPES.CONSOLATION }, // 10元（备用）
        { ...BOX_TYPES.CONSOLATION }, // 10元（备用）
        { ...BOX_TYPES.CONSOLATION }, // 10元（备用）
        { ...BOX_TYPES.SMALL },   // 50元（备用）
        { ...BOX_TYPES.LARGE },   // 300元（备用）
        { ...BOX_TYPES.JACKPOT }  // 500元（备用）
      ]
    
    // 第二局：【温水煮青蛙】50元 ➔ 10元 ➔ 10元 ➔ 10元 ➔ 炸弹
    case 1:
      return [
        { ...BOX_TYPES.SMALL },   // 50元
        { ...BOX_TYPES.CONSOLATION }, // 10元
        { ...BOX_TYPES.CONSOLATION }, // 10元
        { ...BOX_TYPES.CONSOLATION }, // 10元
        { ...BOX_TYPES.BOMB },    // 炸弹
        { ...BOX_TYPES.SMALL },   // 50元（备用）
        { ...BOX_TYPES.MEDIUM },  // 100元（备用）
        { ...BOX_TYPES.MEDIUM },  // 100元（备用）
        { ...BOX_TYPES.LARGE },   // 300元（备用）
        { ...BOX_TYPES.JACKPOT }  // 500元（备用）
      ]
    
    // 第三局：【多巴胺狂飙】完全没有炸弹，全是钱
    case 2:
      return [
        { ...BOX_TYPES.CONSOLATION }, // 10元
        { ...BOX_TYPES.SMALL },   // 50元
        { ...BOX_TYPES.MEDIUM },  // 100元
        { ...BOX_TYPES.LARGE },   // 300元
        { ...BOX_TYPES.JACKPOT }, // 500元
        { ...BOX_TYPES.CONSOLATION }, // 10元
        { ...BOX_TYPES.SMALL },   // 50元
        { ...BOX_TYPES.SMALL },   // 50元
        { ...BOX_TYPES.MEDIUM },  // 100元
        { ...BOX_TYPES.LARGE }    // 300元
      ]
    
    // 第四局：【深渊凝视】炸弹放在第一个位置
    case 3:
      return [
        { ...BOX_TYPES.BOMB },    // 炸弹（第一个！）
        { ...BOX_TYPES.CONSOLATION }, // 10元
        { ...BOX_TYPES.CONSOLATION }, // 10元
        { ...BOX_TYPES.CONSOLATION }, // 10元
        { ...BOX_TYPES.SMALL },   // 50元
        { ...BOX_TYPES.SMALL },   // 50元
        { ...BOX_TYPES.SMALL },   // 50元
        { ...BOX_TYPES.MEDIUM },  // 100元
        { ...BOX_TYPES.MEDIUM },  // 100元
        { ...BOX_TYPES.JACKPOT }  // 500元
      ]
    
    default:
      return generateRandomBoxes()
  }
}

// 生成随机盲盒（正常模式）
function generateRandomBoxes() {
  const newBoxes = []
  Object.values(BOX_TYPES).forEach(type => {
    for (let i = 0; i < type.count; i++) {
      newBoxes.push({ ...type, opened: false })
    }
  })
  // 洗牌算法
  for (let i = newBoxes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newBoxes[i], newBoxes[j]] = [newBoxes[j], newBoxes[i]]
  }
  return newBoxes
}

// 生成盲盒（根据是否新手剧本选择）
function generateBoxes() {
  let result = []
  if (isNewbieScript.value && gameCount.value < 4) {
    result = generateNewbieBoxes(gameCount.value)
  } else {
    result = generateRandomBoxes()
  }
  // 添加 opened 属性
  return result.map(box => ({ ...box, opened: false }))
}

// 开始游戏
function startGame() {
  if (totalMoney.value < 200) return
  
  totalMoney.value -= 200
  remainingChances.value--
  currentPot.value = 0
  goldCards.value = 1
  openedBoxes.value = []
  
  // 根据当前局数生成盲盒
  boxes.value = generateBoxes()
  
  // 增加游戏计数（在生成盲盒之后，因为生成盲盒需要当前局数）
  gameCount.value++
  
  gameState.value = 'playing'
  
  startTimer()
}

// 开始倒计时
function startTimer() {
  timer.value = 10
  usedGoldThisTurn.value = false
  isAutoPlaying.value = false
  shieldActive.value = false // 重置护盾状态
  nextBoxPreview.value = null // 清除透视效果
  
  if (timerInterval) clearInterval(timerInterval)
  
  timerInterval = setInterval(() => {
    timer.value--
    
    if (timer.value <= 0) {
      clearInterval(timerInterval)
      handleTimeout()
    }
  }, 1000)
}

// 处理超时
function handleTimeout() {
  showGreedOverload.value = true
  showSnowEffect.value = true
  
  setTimeout(() => {
    showSnowEffect.value = false
    showGreedOverload.value = false
  }, 500)
  
  isAutoPlaying.value = true
  
  // 强制随机翻开一个未打开的盲盒
  autoPlayTimeout = setTimeout(() => {
    const closedBoxes = boxes.value.map((box, index) => ({ box, index })).filter(item => !item.box.opened)
    if (closedBoxes.length > 0) {
      const randomIndex = Math.floor(Math.random() * closedBoxes.length)
      const selectedIndex = closedBoxes[randomIndex].index
      const box = boxes.value[selectedIndex]
      box.opened = true
      
      if (box.value === -1) {
        handleBomb(true)
      } else {
        currentPot.value += box.value
        triggerCoinEffect()
        
        if (totalMoney.value + currentPot.value >= 5000) {
          handleWin()
        } else {
          // 继续自动翻牌
          setTimeout(() => {
            handleTimeout()
          }, 500)
        }
      }
    } else {
      cashOut()
    }
  }, 300)
}



// 处理炸弹
function handleBomb(isAuto) {
  if (timerInterval) clearInterval(timerInterval)
  
  // 触发"差一点就赢"视觉欺诈效果
  showNearMiss.value = true
  
  setTimeout(() => {
    showNearMiss.value = false
    
    if (isAuto) {
      // 贪婪失控状态，无法使用金牌
      currentPot.value = 0
      triggerMoneyLossEffect(50)
      totalMoney.value = Math.max(0, totalMoney.value - 50)
      endRound()
    } else {
      showBombModal.value = true
    }
  }, 500)
}

// 使用金牌抵挡炸弹
function useGoldCardOnBomb() {
  goldCards.value--
  currentPot.value = 0
  closeBombModal()
  endRound()
}

// 接受炸弹惩罚
function acceptBombPenalty() {
  currentPot.value = 0
  triggerMoneyLossEffect(50)
  totalMoney.value = Math.max(0, totalMoney.value - 50)
  closeBombModal()
  endRound()
}

// 触发金钱损失效果
function triggerMoneyLossEffect(amount) {
  lossAmount.value = amount
  showMoneyLossEffect.value = true
  
  // 触发震动反馈
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100])
  }
  
  setTimeout(() => {
    showMoneyLossEffect.value = false
  }, 1000)
}

// 使用金牌透视所有盲盒
function useGoldCard() {
  if (goldCards.value <= 0 || usedGoldThisTurn.value || isAutoPlaying.value) return
  
  goldCards.value--
  usedGoldThisTurn.value = true
  shieldActive.value = true
  
  // 显示护盾激活效果
  showShieldEffect.value = true
  setTimeout(() => {
    showShieldEffect.value = false
  }, 1000)
}

// 关闭炸弹弹窗
function closeBombModal() {
  showBombModal.value = false
}

// 处理胜利
function handleWin() {
  if (timerInterval) clearInterval(timerInterval)
  totalMoney.value += currentPot.value
  showWinModal.value = true
}

// 结束本轮
function endRound() {
  if (totalMoney.value <= 0) {
    // 触发破产救济金机制
    showBailoutModal.value = true
    bailoutTimer.value = 10
    
    if (bailoutTimerInterval) clearInterval(bailoutTimerInterval)
    bailoutTimerInterval = setInterval(() => {
      bailoutTimer.value--
      if (bailoutTimer.value <= 0) {
        clearInterval(bailoutTimerInterval)
        showBailoutModal.value = false
        showLoseModal.value = true
      }
    }, 1000)
  } else {
    gameState.value = 'idle'
  }
}

// 领取救济金
function claimBailout() {
  if (bailoutTimerInterval) clearInterval(bailoutTimerInterval)
  showBailoutModal.value = false
  totalMoney.value = 200
  remainingChances.value = 3 // 重置部分机会
}

// 关闭救济金弹窗
function closeBailoutModal() {
  if (bailoutTimerInterval) clearInterval(bailoutTimerInterval)
  showBailoutModal.value = false
  showLoseModal.value = true
}

// 继续游戏
function continueGame() {
  if (isAutoPlaying.value) return
  
  if (timerInterval) clearInterval(timerInterval)
  openNextBox(false)
}

// 收手
function cashOut() {
  if (timerInterval) clearInterval(timerInterval)
  totalMoney.value += currentPot.value
  
  if (totalMoney.value >= 5000) {
    showWinModal.value = true
  } else {
    gameState.value = 'idle'
  }
}

// 重置游戏
function resetGame() {
  if (timerInterval) clearInterval(timerInterval)
  if (autoPlayTimeout) clearTimeout(autoPlayTimeout)
  if (bailoutTimerInterval) clearInterval(bailoutTimerInterval)
  
  totalMoney.value = 500
  currentPot.value = 0
  goldCards.value = 1
  remainingChances.value = 5
  openedBoxes.value = []
  boxes.value = []
  showWinModal.value = false
  showLoseModal.value = false
  gameState.value = 'idle'
  gameCount.value = 0 // 重置游戏计数
  isNewbieScript.value = true // 重置新手剧本状态
  showNearMiss.value = false
  nextBoxPreview.value = null
  showBailoutModal.value = false
  showMoneyLossEffect.value = false
}

// 触发金币特效
function triggerCoinEffect() {
  showCoinEffect.value = true
  setTimeout(() => {
    showCoinEffect.value = false
  }, 1000)
}

// 获取盲盒样式类
function getBoxClass(box) {
  // 未打开的盲盒
  if (!box.opened) {
    return 'bg-gradient-to-br from-purple-600/70 to-purple-800/70 border-2 border-purple-500/50 hover:border-purple-400 hover:bg-purple-600/90 cursor-pointer'
  }
  // 已打开的盲盒
  if (box.value === -1) return 'bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-500'
  if (box.value >= 500) return 'bg-gradient-to-br from-yellow-500 to-amber-600 border-2 border-yellow-400 animate-pulse'
  if (box.value >= 300) return 'bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-purple-400'
  if (box.value >= 100) return 'bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-blue-400'
  if (box.value >= 50) return 'bg-gradient-to-br from-green-500 to-green-700 border-2 border-green-400'
  return 'bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-gray-500'
}

// 获取透视效果样式类
function getPreviewClass(box) {
  if (box.opened) return ''
  if (box.revealed === 'bomb') return 'preview-bomb'
  if (box.revealed === 'money') return 'preview-money'
  return ''
}

// 选择盲盒
function selectBox(index) {
  if (isAutoPlaying.value) return
  
  const box = boxes.value[index]
  if (!box || box.opened) return
  
  if (timerInterval) clearInterval(timerInterval)
  
  // 翻开选中的盲盒
  box.opened = true
  
  if (box.value === -1) {
    // 炸弹
    if (shieldActive.value) {
      // 护盾激活，免除惩罚
      shieldActive.value = false
      showShieldEffect.value = true
      setTimeout(() => {
        showShieldEffect.value = false
      }, 1000)
      // 继续游戏
      startTimer()
    } else {
      handleBomb(false)
    }
  } else {
    // 奖金
    currentPot.value += box.value
    triggerCoinEffect()
    
    // 如果使用了护盾但翻到了金钱，护盾消耗但无事发生
    if (shieldActive.value) {
      shieldActive.value = false
    }
    
    // 检查胜利条件
    if (totalMoney.value + currentPot.value >= 5000) {
      handleWin()
      return
    }
    
    // 继续游戏
    startTimer()
  }
}

// 获取盲盒图标
function getBoxIcon(box) {
  return box.icon
}

// 获取金币特效样式
function getCoinStyle(index) {
  const left = Math.random() * 100
  const delay = index * 0.1
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`
  }
}

// 清理
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (autoPlayTimeout) clearTimeout(autoPlayTimeout)
})
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.bg-animation {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%);
  animation: bgPulse 4s ease-in-out infinite;
}

@keyframes bgPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.red-alert-overlay {
  position: absolute;
  inset: 0;
  background: rgba(239, 68, 68, 0.1);
  pointer-events: none;
  transition: all 0.3s;
}

.red-alert-overlay.intense {
  background: rgba(239, 68, 68, 0.3);
  animation: flash 0.1s infinite;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.red-alert .timer-circle {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
}

.red-alert-warning .timer-circle {
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.timer-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  position: relative;
}

.timer-circle.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.timer-circle.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.timer-text {
  font-size: 24px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.timer-pulse {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid rgba(239, 68, 68, 0.5);
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}

.gold-card {
  font-size: 24px;
  transition: all 0.3s;
}

.gold-card.used {
  filter: grayscale(1);
}

.animate-shake {
  animation: shake 0.5s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.snow-effect {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.8);
  pointer-events: none;
  animation: snow 0.3s ease-out;
}

@keyframes snow {
  0% { opacity: 0; }
  50% { opacity: 1; background: rgba(255,255,255,0.3); }
  100% { opacity: 0; }
}

.greed-overload-stamp {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 48px;
  font-weight: bold;
  color: rgba(239, 68, 68, 0.8);
  text-shadow: 
    0 0 10px rgba(239, 68, 68, 0.5),
    0 0 20px rgba(239, 68, 68, 0.3);
  animation: stamp 0.5s ease-out;
  z-index: 100;
}

@keyframes stamp {
  0% { transform: translate(-50%, -50%) rotate(-15deg) scale(2); opacity: 0; }
  50% { transform: translate(-50%, -50%) rotate(-15deg) scale(1.1); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(-15deg) scale(1); opacity: 0.8; }
}

.coin-effect {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 50;
}

.coin {
  position: absolute;
  top: -50px;
  font-size: 32px;
  animation: coinDrop 1s ease-in forwards;
}

@keyframes coinDrop {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

button {
  color: white;
  border: none;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

/* 差一点就赢效果 */
.near-miss-effect {
  position: fixed;
  inset: 0;
  background: rgba(251, 191, 36, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  animation: nearMiss 0.5s ease-out forwards;
}

.near-miss-content {
  text-align: center;
  animation: nearMissContent 0.5s ease-out forwards;
}

@keyframes nearMiss {
  0% { opacity: 0; }
  20% { opacity: 1; background: rgba(251, 191, 36, 0.5); }
  80% { opacity: 1; background: rgba(239, 68, 68, 0.3); }
  100% { opacity: 0; }
}

@keyframes nearMissContent {
  0% { transform: scale(0.5); opacity: 0; }
  30% { transform: scale(1.2); opacity: 1; }
  70% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0; filter: blur(10px); }
}

/* 金钱损失效果 */
.money-loss-effect {
  position: fixed;
  inset: 0;
  background: rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 80;
  animation: moneyLoss 1s ease-out forwards;
}

.loss-amount {
  font-size: 48px;
  font-weight: bold;
  color: #ef4444;
  text-shadow: 
    0 0 10px rgba(239, 68, 68, 0.8),
    0 0 20px rgba(239, 68, 68, 0.6);
  animation: lossDrop 1s ease-out forwards;
}

@keyframes moneyLoss {
  0% { opacity: 0; }
  20% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes lossDrop {
  0% { transform: translateY(-100px); opacity: 1; }
  60% { transform: translateY(40vh); opacity: 1; }
  100% { transform: translateY(60vh); opacity: 0; }
}

/* 透视护盾效果 - 金钱 */
.preview-money {
  border-color: rgba(251, 191, 36, 0.8) !important;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.4), inset 0 0 10px rgba(251, 191, 36, 0.2);
  animation: moneyGlow 0.5s ease-in-out infinite;
}

@keyframes moneyGlow {
  0%, 100% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.4), inset 0 0 10px rgba(251, 191, 36, 0.2); }
  50% { box-shadow: 0 0 25px rgba(251, 191, 36, 0.8), inset 0 0 15px rgba(251, 191, 36, 0.3); }
}

/* 透视护盾效果 - 炸弹 */
.preview-bomb {
  border-color: rgba(239, 68, 68, 0.8) !important;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4), inset 0 0 10px rgba(239, 68, 68, 0.2);
  animation: bombGlow 0.5s ease-in-out infinite;
}

@keyframes bombGlow {
  0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.4), inset 0 0 10px rgba(239, 68, 68, 0.2); }
  50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.8), inset 0 0 15px rgba(239, 68, 68, 0.3); }
}

/* 破产救济金弹窗动画 */
.animate-bounce-in {
  animation: bounceIn 0.5s ease-out;
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}
</style>