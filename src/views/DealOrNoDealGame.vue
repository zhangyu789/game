<template>
  <div class="game-container" :class="{'red-alert': redAlertLevel > 0, 'red-alert-level-3': redAlertLevel >= 3}">
    
    <!-- 赛博朋克背景 -->
    <div class="cyber-background" :style="cyberBgStyle">
      <div class="cyber-grid"></div>
      <div class="cyber-scanlines"></div>
      <div class="cyber-glow"></div>
    </div>
    
    <!-- 红色警戒效果层 -->
    <div v-if="redAlertLevel > 0" class="red-alert-overlay" :class="'level-' + redAlertLevel"></div>
    
    <!-- 【深渊协议】新手引导开场 -->
    <div v-if="gameState === 'TUTORIAL'" class="tutorial-overlay">
      <div class="tutorial-terminal">
        <div class="terminal-header">
          <span class="terminal-title">ABYSS CAPITAL - LIQUIDATION PROTOCOL</span>
          <span class="terminal-status">ONLINE</span>
        </div>
        <div class="terminal-content">
          <div v-for="(line, index) in terminalLines" :key="index" 
            class="terminal-line" :class="{ 'system-line': line.isSystem }">
            <span v-if="!line.complete">></span>
            {{ line.text }}
            <span v-if="!line.complete" class="cursor">_</span>
          </div>
        </div>
        <div class="terminal-loading">
          <div class="loading-bar"></div>
        </div>
      </div>
      
      <!-- AI 阿特拉斯形象 -->
      <div class="atlas-container">
        <div class="atlas-image-wrapper">
          <img :src="atlasAiImg" alt="AI Atlas" class="atlas-image" />
          <div class="atlas-overlay"></div>
        </div>
        <div class="atlas-eyes-glow"></div>
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <div class="tool-card dond-main-panel max-w-6xl mx-auto select-none" :style="atmosphereStyle" :class="{'warm-filter': warmFilterActive, 'hope-flash': hopeFlashActive}">
      
      <!-- 债务警告倒计时（图五风格） -->
      <div v-if="abyssProtocolActive && debt > 0" class="debt-warning-panel">
        <div class="debt-counter">
          <span class="debt-label">DEBT</span>
          <span class="debt-value">£{{ formatNum(debt) }}</span>
          <span class="debt-interest-rate">+{{ (interestRate * debtMultiplier * 100).toFixed(0) }}%</span>
        </div>
        <div class="survival-gauge">
          <div class="gauge-label">SURVIVAL</div>
          <div class="gauge-bar">
            <div class="gauge-fill" :style="{ width: survivalPoints + '%' }" :class="survivalGaugeClass"></div>
          </div>
          <div class="gauge-value">{{ Math.round(survivalPoints) }}%</div>
        </div>
      </div>

      <h2 class="tool-header cyber-title">💰 一掷千金：秘密金库</h2>

      <!-- 顶部控制栏 -->
      <div class="flex flex-wrap gap-2 mb-4 items-center">
        <button class="btn-sm btn-secondary" @click="showStartScreen=true">🔄 新游戏</button>
        <button class="btn-sm btn-secondary" @click="toggleSound">
        {{ soundOn ? '🔊' : '🔇' }}
      </button>
      <button class="btn-sm btn-secondary" @click="showStats=true">📊 金库</button>
      <button v-if="gameState!=='IDLE'&&gameState!=='SELECT_MY_BOX'&&(scriptedGame===0||stats.totalGames>=4)" class="bm-icon-btn" @click="showBlackMarket=true" :class="{'bm-pulse': bankerMood==='angry'||remainingCount<=3}">🏴‍☠️</button>
      <span class="ml-auto font-mono flex items-center gap-3">
        <span class="text-xs" style="color:#ffd700;text-shadow:0 0 8px rgba(255,215,0,0.3)">💼 £{{ formatNum(wallet) }}</span>
        <span class="text-xs" style="color:#00f0ff">
          R{{ round }}/6 · 📦{{ remainingCount }}
        </span>
      </span>
    </div>

    <!-- 双栏主布局：左侧金额+状态 | 右侧箱子 -->
    <div class="flex flex-col lg:flex-row gap-4">

      <!-- ===== 左栏：金额面板 + 银行家状态 + 提示 ===== -->
      <div class="lg:w-64 xl:w-72 shrink-0 flex flex-col gap-3">
        <!-- 金额面板 -->
        <div class="rounded-xl p-3" style="background:rgba(0,0,0,0.3);border:1px solid rgba(0,240,255,0.1)">
          <p class="text-xs font-bold mb-2 uppercase tracking-wider" style="color:#64748b">💰 奖金池</p>
          <div class="grid grid-cols-2 gap-1">
            <div v-for="amt in activeAmounts" :key="amt"
              :class="['flex items-center gap-1 px-2 py-1 rounded transition-all duration-300',
                isEliminated(amt) ? 'opacity-15 line-through' : '']"
              :style="amountRowStyle(amt)">
              <span v-if="!isEliminated(amt)" class="w-1.5 h-1.5 rounded-full shrink-0"
                :style="{background: amt>=10000?'#ffd700':amt>=1000?'#00f0ff':'#64748b'}"></span>
              <span :class="['text-xs font-bold', isEliminated(amt)?'':'' ]" :style="amountStyle(amt)">
                £{{ formatNum(amt) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 黑市道具状态 -->
        <div v-if="purchasedCards.length" class="rounded-xl p-3"
          style="background:rgba(139,92,246,0.05);border:1px solid rgba(139,92,246,0.2)">
          <p class="text-xs font-bold mb-1.5 uppercase tracking-wider" style="color:#64748b">🏴‍☠️ 黑市契约</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="(c,i) in purchasedCards" :key="i"
              class="px-2 py-1 rounded text-xs font-bold"
              style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.25);color:#a78bfa">
              {{ c.icon }} {{ c.name }}
            </span>
          </div>
        </div>

        <!-- 直觉值仪表盘 -->
        <div v-if="gameState!=='IDLE'&&gameState!=='GAME_OVER'" class="rounded-xl p-2 intuition-meter" :class="{'intuition-flash': intuitionFlash}">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-bold" :style="{color: intuitionValue>70?'#ffd700':intuitionValue>40?'#fb923c':'#64748b'}">
              🧠 直觉值
            </span>
            <span class="text-xs font-bold" :style="{color: intuitionValue>70?'#ffd700':intuitionValue>40?'#fb923c':'#94a3b8'}">
              {{ intuitionValue }}%
            </span>
          </div>
          <div class="w-full h-2 rounded-full overflow-hidden" style="background:rgba(0,0,0,0.4)">
            <div class="h-full rounded-full transition-all duration-500 intuition-bar" :style="{width: intuitionValue+'%', background: intuitionValue>70?'linear-gradient(90deg,#f59e0b,#ffd700)':intuitionValue>40?'linear-gradient(90deg,#fb923c,#f59e0b)':'linear-gradient(90deg,#64748b,#94a3b8)'}"></div>
          </div>
          <p v-if="intuitionValue>=80" class="text-xs mt-1 italic" style="color:#ffd700">✨ 直觉敏锐！大奖似乎在召唤你...</p>
          <p v-else-if="intuitionValue>=50" class="text-xs mt-1 italic" style="color:#fb923c">🔥 运气正在累积...</p>
        </div>
        <div v-if="gameState !== 'IDLE' && gameState !== 'TUTORIAL'" class="atlas-portrait-side mb-2">
          <img :src="atlasAiImg" alt="AI Atlas" class="atlas-portrait-img" />
          <p class="text-xs text-center mt-1" style="color:#64748b">AI 阿特拉斯 · 监控中</p>
        </div>
        <div v-if="bankerMessage || typewriterText" class="banker-bubble" :class="'mood-'+bankerMood">
          <span class="text-2xl mr-2 shrink-0">{{ bankerEmoji || '📞' }}</span>
          <div class="min-w-0">
            <p class="text-xs font-bold mb-0.5" style="color:#64748b">银行家</p>
            <p class="text-base font-bold leading-tight" style="color:#ffd700">{{ typewriterText || bankerMessage }}</p>
            <p v-if="bankerBubbleText && !typewriterText" class="text-sm mt-1 italic" style="color:#ff6b6b">"{{ bankerBubbleText }}"</p>
          </div>
        </div>

        <!-- 游戏状态提示 -->
        <div class="rounded-xl p-3 min-h-[3rem] flex items-center justify-center"
          style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05)">
          <p v-if="gameState==='SELECT_MY_BOX'" class="text-base font-bold animate-pulse text-center" style="color:#00f0ff">
            👆 请选择你的幸运盒子！
          </p>
          <p v-else-if="gameState==='OPEN_BOXES'" class="text-base font-bold text-center" style="color:#00f0ff">
            👆 长按 0.8 秒开启盒子<br>
            <span class="text-lg">本轮还需 <span class="text-yellow-400">{{ boxesToOpenThisRound }}</span> 个</span>
            <template v-if="bmActiveEffects.length"><br><span v-for="e in bmActiveEffects" :key="e" class="text-xs text-purple-400">⚠️ {{ e }}</span></template>
          </p>
          <p v-else-if="gameState==='BANKER_OFFER'" class="text-lg font-bold animate-pulse text-center" style="color:#ffd700">
            📞 银行家来电...
          </p>
          <p v-else-if="gameState==='FINAL_SWAP'" class="text-lg font-bold animate-pulse text-center" style="color:#ff6b6b">
            🔄 终极抉择！
          </p>
          <p v-else-if="gameState==='GAME_OVER'" class="text-lg font-bold text-center" style="color:#ffd700">
            🎊 游戏结束！
          </p>
          <p v-else class="text-sm text-center" style="color:#334155">准备开始</p>
        </div>
      </div>

      <!-- ===== 右栏：宝箱网格 ===== -->
      <div class="flex-1 min-w-0 relative">
        <div v-if="boxLongPressHint" class="box-longpress-toast">{{ boxLongPressHint }}</div>
        <div class="grid gap-2 sm:gap-3" :class="gridCols">
          <div v-for="box in boxes" :key="box.id"
            :class="chestClasses(box)"
            @mousedown="startLongPressOpenBox(box)"
            @mouseup="cancelLongPressOpenBox"
            @mouseleave="onBoxMouseLeave"
            @touchstart.prevent="startLongPressOpenBox(box)"
            @touchend="cancelLongPressOpenBox"
            @click="onBoxClick(box)"
            @mouseenter="onBoxHover(box)">
            <!-- 宝箱图片 -->
            <img :src="chestImg" class="chest-img" :class="{'chest-img-opened': box.opened, 'chest-img-shake': box.animStage==='shake', 'chest-img-glow': box.animStage==='glow', 'chest-img-lucky': !box.opened&&box.id===boxLuckyGlow&&gameState==='SELECT_MY_BOX'}" draggable="false">
            <!-- 箱子编号 -->
            <div v-if="!box.opened && box.animStage!=='reveal'" class="chest-number">{{ box.id + 1 }}</div>
            <!-- 透视标记（XRay道具） -->
            <div v-if="box.peeked&&!box.opened" class="peeked-badge">🔍</div>
            <!-- 开箱动画：开盖光效 -->
            <div v-if="box.animStage==='glow'" class="chest-lid-glow"></div>
            <!-- 揭晓金额 -->
            <div v-if="box.animStage==='reveal' || box.opened" class="chest-reveal" :class="{'chest-reveal-enter': box.animStage==='reveal'}">
              <div class="text-center">
                <p class="chest-amount" :class="box.amount >= 10000 ? 'amount-gold' : box.amount >= 1000 ? 'amount-cyan' : 'amount-gray'">
                  £{{ formatNum(box.amount) }}
                </p>
              </div>
            </div>
            <!-- 我的箱子标记 -->
            <div v-if="box.isMyBox" class="absolute -top-1.5 -right-1.5 text-sm z-10">⭐</div>
            <!-- 透视标记 -->
            <div v-if="box.peeked && !box.opened && box.animStage!=='reveal'" class="absolute bottom-1 right-1 text-xs opacity-60">👁️</div>
            <div v-if="longPressBoxId===box.id && longPressProgress>0"
              class="chest-longpress-progress" :style="{width: longPressProgress+'%'}"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 伪大奖全屏闪光 -->
    <div v-if="pseudoBigWinActive" class="pseudo-bigwin-overlay"></div>
    <!-- 暗角特效 -->
    <div v-if="vignetteActive" class="vignette-overlay"></div>
    <!-- 金光特效 -->
    <div v-if="goldGlow" class="gold-glow-overlay"></div>
    <!-- 屏幕震动 -->
    <div v-if="screenShake" class="screen-shake-layer"></div>
    <!-- 聚光灯 -->
    <div v-if="spotlightOn" class="spotlight-overlay"></div>
    <!-- 碎裂特效 -->
    <div v-if="shatterEffect" class="shatter-overlay">
      <div v-for="i in 12" :key="i" class="shard" :style="shardStyle(i)"></div>
    </div>
    <!-- 金光粒子 -->
    <div v-if="goldParticles" class="gold-particles-layer">
      <div v-for="i in 20" :key="i" class="gold-particle" :style="particleStyle(i)"></div>
    </div>
    <!-- 弹幕层 -->
    <div v-if="danmakuItems.length" class="danmaku-container" :class="{'danmaku-dimmed': bankerStampTarget>=0}">
      <div v-for="d in danmakuItems" :key="d.id" class="danmaku-item"
        :style="{color: d.color, top: d.top+'px', animationDuration: d.speed+'s', '--travel': travelDist}"
        :class="{
          'danmaku-stamped': bankerStampTarget===d.id,
          'left': d.direction === 'left',
          'execution': d.isExecution,
          'shatter': d.shatter
        }">
        {{ d.text }}
        <span v-if="bankerStampTarget===d.id" class="banker-x">✖</span>
      </div>
    </div>
    <!-- 银行家印章 -->
    <div v-if="bankerStampTarget>=0" class="banker-stamp-overlay">
      <div class="banker-stamp">BANKER SAYS NO</div>
    </div>

    <!-- ===== 破产界面 ===== -->
    <Teleport to="body">
      <div v-if="isBankrupt && !showResult" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/80"></div>
        <div class="relative rounded-2xl p-8 max-w-sm w-full text-center banker-modal" :style="shopTerminalStyle">
          <div class="text-6xl mb-4">💀</div>
          <p class="text-xl font-bold mb-2" style="color:#ff4444">破产了！</p>
          <p class="text-sm mb-4" style="color:#94a3b8">你的资金已不足以进入任何场次<br>当前余额: <span style="color:#ff6b6b">£{{ formatNum(wallet) }}</span></p>
          <div class="flex gap-3 justify-center">
            <button class="btn-primary px-6" @click="resetWallet">🆓 领取救济金</button>
          </div>
          <p class="text-xs mt-3" style="color:#475569">救济金将重置钱包至£100,000</p>
        </div>
      </div>
    </Teleport>

    <!-- ===== 开始/设置界面 ===== -->
    <Teleport to="body">
      <div v-if="showStartScreen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/70" @click="showStartScreen=false"></div>
        <div class="relative rounded-2xl p-6 max-w-md w-full banker-modal max-h-[85vh] overflow-y-auto" :style="shopTerminalStyle">
          <div class="flex justify-center mb-3">
            <img :src="atlasAiImg" alt="Atlas" class="atlas-start-preview" />
          </div>
          <h3 class="text-xl font-bold mb-3 text-center" style="color:#ffd700">💰 一掷千金</h3>

          <p v-if="!tutorialComplete && stats.totalGames < 4" class="text-xs text-center mb-3 px-3 py-2 rounded-lg italic"
            style="color:#a78bfa;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2)">
            📖 深渊协议 {{ stats.totalGames + 1 }}/4 · {{ scriptedActLabelNext }}
          </p>

          <!-- 钱包余额 -->
          <div class="rounded-xl p-3 mb-4 text-center" style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.25)">
            <p class="text-xs mb-1" style="color:#64748b">💼 钱包余额</p>
            <p class="text-2xl font-bold" style="color:#ffd700;text-shadow:0 0 12px rgba(255,215,0,0.4)">£{{ formatNum(wallet) }}</p>
          </div>

          <!-- 门票档位 -->
          <div class="mb-4">
            <p class="text-xs mb-2" style="color:#64748b">🎫 选择场次（门票从钱包扣除）</p>
            <div class="space-y-2">
              <button v-for="(tier,idx) in TICKET_TIERS" :key="tier.id"
                :class="['w-full rounded-xl p-3 text-left transition-all duration-200',
                  selectedTier===idx ? 'ring-2 ring-yellow-400' : '',
                  wallet < tier.cost ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]']"
                :style="{
                  background: selectedTier===idx ? 'rgba(255,215,0,0.12)' : 'rgba(0,0,0,0.3)',
                  border: selectedTier===idx ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.08)'
                }"
                @click="wallet >= tier.cost && (selectedTier = idx)">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-lg mr-1.5">{{ tier.icon }}</span>
                    <span class="text-sm font-bold" style="color:#e2e8f0">{{ tier.name }}</span>
                  </div>
                  <span class="text-sm font-bold" style="color:#ffd700">门票 £{{ formatNum(tier.cost) }}</span>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <span class="text-xs" style="color:#64748b">奖金: £{{ formatNum(tier.amounts[0]) }} ~ £{{ formatNum(tier.amounts[tier.amounts.length-1]) }}</span>
                  <span v-if="wallet < tier.cost" class="text-xs" style="color:#ff4444">余额不足</span>
                </div>
              </button>
            </div>
          </div>

          <!-- 盒子皮肤 -->
          <div class="mb-4" v-if="vaultLevel >= 1">
            <p class="text-xs mb-2" style="color:#64748b">盒子皮肤</p>
            <div class="flex gap-2 flex-wrap">
              <button v-for="s in unlockedSkins" :key="s.id"
                :class="['btn-sm', boxSkin===s.id?'btn-primary':'btn-secondary']"
                @click="boxSkin=s.id">{{ s.icon }} {{ s.name }}</button>
            </div>
          </div>

          <div class="flex gap-2">
            <button class="btn-primary flex-1" @click="startNewGame"
              :disabled="wallet < TICKET_TIERS[selectedTier].cost">
              {{ !tutorialComplete && stats.totalGames < 4 ? '🎬 进入' + (stats.totalGames + 1) + '幕' : '🎮 开始游戏' }}
            </button>
            <button class="btn-secondary" @click="showStartScreen=false">✖</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== 银行家报价弹窗 ===== -->
    <Teleport to="body">
      <div v-if="showOfferModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/70"></div>
        <div class="relative rounded-2xl p-6 max-w-sm w-full text-center banker-modal" :style="shopTerminalStyle" :class="{'shake-anim': bankerMood==='panic'}">
          <img :src="atlasAiImg" alt="Atlas" class="atlas-modal-preview mx-auto mb-2" />
          <div class="text-5xl mb-2">{{ bankerMood==='angry'?'😡':bankerMood==='panic'?'😰':'📞' }}</div>
          <p class="text-xs mb-1" style="color:#64748b">银行家报价</p>
          <p class="text-4xl font-bold mb-3 offer-amount-smash" style="color:#ffd700;text-shadow:0 0 20px rgba(255,215,0,0.5)">
            £{{ formatNum(currentOffer) }}
          </p>
          <p v-if="bankerBubbleText" class="text-sm mb-3 italic banker-typewriter" style="color:#ff6b6b">"{{ bankerBubbleText }}"</p>
          <!-- 限时倒计时 -->
          <div v-if="offerTimer > 0" class="mb-3">
            <div class="text-2xl font-bold font-mono" :style="{color: offerTimer<=3?'#ff4444':'#ffd700'}">
              ⏱️ {{ offerTimer }}s
            </div>
            <div class="w-full h-1 rounded mt-1" style="background:rgba(255,255,255,0.1)">
              <div class="h-full rounded transition-all duration-1000" style="background:#ffd700"
                :style="{width: (offerTimer/10*100)+'%'}"></div>
            </div>
          </div>
          <div class="flex gap-3 justify-center flex-wrap">
            <button class="deal-btn px-6 py-3 rounded-xl font-bold text-white text-lg" 
              @click="acceptOffer" @mouseenter="onDealHover">
              <span class="deal-btn-glow">💰 Deal</span>
            </button>
            <button class="nodeal-btn px-6 py-3 rounded-xl font-bold text-white text-lg relative overflow-hidden"
              @mousedown="startLongPressReject" @mouseup="cancelLongPressReject" @mouseleave="cancelLongPressReject"
              @touchstart.prevent="startLongPressReject" @touchend="cancelLongPressReject"
              @mouseenter="onNoDealHover">
              🚫 No Deal
              <div class="nodeal-progress" :style="{width: longPressProgress+'%'}"></div>
            </button>
          </div>
          <p v-if="longPressProgress>0&&longPressProgress<100" class="text-xs mt-1" style="color:#ff6b6b">长按0.9秒确认拒绝...</p>
        </div>
      </div>
    </Teleport>

    <!-- ===== 终极抉择弹窗 ===== -->
    <Teleport to="body">
      <div v-if="gameState==='FINAL_SWAP'" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/80"></div>
        <div class="relative rounded-2xl p-6 max-w-sm w-full text-center banker-modal" :style="shopTerminalStyle" :class="{'shake-anim': finalTimer<=3&&finalTimer>0}">
          <div class="text-5xl mb-2">🔄</div>
          <p class="text-lg font-bold mb-2" style="color:#ff6b6b">⚡ 终极抉择 ⚡</p>
          <p class="text-base mb-1" style="color:#00f0ff">你的盒子: <strong>{{ myBoxId!==null?(myBoxId+1)+'号':'?' }}</strong></p>
          <p class="text-sm mb-2" style="color:#ff6b6b">
            剩余: <span v-for="(b,i) in remainingBoxes" :key="b.id">{{ i>0?', ':'' }}{{ b.id+1 }}号</span>
          </p>
          <!-- 银行家终极台词 -->
          <p v-if="bankerBubbleText" class="text-sm mb-3 italic p-3 rounded-lg" style="color:#ffd700;background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2)">
            "{{ bankerBubbleText }}"
          </p>
          <!-- 限时 -->
          <div v-if="finalTimer > 0" class="mb-3">
            <div class="text-3xl font-bold font-mono" :style="{color: finalTimer<=3?'#ff4444':'#ffd700'}">
              ⏱️ {{ finalTimer }}s
            </div>
            <div class="w-full h-2 rounded mt-1" style="background:rgba(255,255,255,0.1)">
              <div class="h-full rounded transition-all duration-1000" style="background:linear-gradient(90deg,#ff4444,#ffd700)"
                :style="{width: (finalTimer/15*100)+'%'}"></div>
            </div>
          </div>
          <div class="flex gap-3 justify-center flex-wrap">
            <button class="deal-btn px-5 py-3 rounded-xl font-bold text-white" @click="doSwap">
              <span class="deal-btn-glow">🔄 交换</span>
            </button>
            <button class="nodeal-btn px-5 py-3 rounded-xl font-bold text-white relative overflow-hidden" @click="noSwap">✋ 保留</button>
            <button v-if="remainingBoxes.length===1"
              class="double-btn px-5 py-3 rounded-xl font-bold text-white"
              @click="doubleOrNothing">
              🎰 双倍对赌
            </button>
          </div>
          <p v-if="remainingBoxes.length===1" class="text-xs mt-2" style="color:#64748b">
            ⚠️ 大奖翻倍，小奖清零
          </p>
        </div>
      </div>
    </Teleport>

    <!-- ===== 结算弹窗（赛博金库终端） ===== -->
    <Teleport to="body">
      <div v-if="showResult" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/80"></div>
        <div class="relative rounded-2xl p-6 max-w-md w-full text-center banker-modal max-h-[90vh] overflow-y-auto result-terminal" :style="shopTerminalStyle">
          <!-- 过渡动画 -->
          <div v-if="resultTransition" class="result-transition">
            <div v-for="i in 8" :key="i" class="transition-blind" :style="{animationDelay:i*0.06+'s'}"></div>
          </div>
          <!-- 战利品展示 -->
          <div class="mb-4">
            <div class="text-4xl mb-2 result-icon-anim">{{ winAmount>=50000?'🎉':winAmount>=10000?'😊':'😅' }}</div>
            <p class="text-sm mb-1" style="color:#94a3b8">
              {{ offerAccepted?'你接受了报价':doubleMode?'双倍对赌！':'你打开了自己的盒子' }}
            </p>
            <div class="slot-machine">
              <p class="text-5xl font-black slot-number" :class="winAmount>=50000?'text-gold':winAmount>=10000?'text-cyan':'text-gray'">
                £{{ formatNum(displayAmount) }}
              </p>
            </div>
            <div v-if="winAmount>=50000" class="win-glow-ring"></div>
          </div>
          <!-- 剧本幕次 -->
          <div v-if="scriptedGame>=1&&scriptedGame<=4" class="mb-3 px-3 py-2 rounded-lg"
            style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.25)">
            <p class="text-xs font-bold" style="color:#a78bfa">{{ scriptedActLabel }}</p>
            <p v-if="scriptedNextHook" class="text-xs mt-1 italic" style="color:#94a3b8">{{ scriptedNextHook }}</p>
          </div>
          <!-- 本局标签 -->
          <div v-if="gameTags.length" class="flex flex-wrap gap-1 justify-center mb-3">
            <span v-for="t in gameTags" :key="t" class="px-2 py-0.5 rounded text-xs font-bold" style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);color:#ffd700">{{ t }}</span>
          </div>
          <!-- 终极审判 -->
          <div v-if="offerAccepted && myBoxRevealText" class="p-3 rounded-lg mb-3" :style="myBoxRevealStyle">
            <p class="text-lg font-bold mb-1">{{ myBoxRevealEmoji }}</p>
            <p class="text-sm" :style="{color: myBoxRevealColor}">{{ myBoxRevealText }}</p>
            <p class="text-xs mt-1" style="color:#64748b">{{ bankerReactionText }}</p>
          </div>
          <!-- 银行家赛后点评 -->
          <div class="banker-post p-3 rounded-xl mb-3" :class="'banker-post-'+bankerPostMood">
            <div class="flex items-start gap-2">
              <span class="text-3xl shrink-0">{{ bankerPostEmoji }}</span>
              <div class="min-w-0">
                <p class="text-xs font-bold" style="color:#64748b">银行家赛后点评</p>
                <p class="text-sm font-bold leading-tight" style="color:#ffd700">"{{ bankerPostComment }}"</p>
              </div>
            </div>
          </div>
          <!-- 错失大奖揭晓 -->
          <div v-if="nearMissRevealActive" class="near-miss-panel mb-3 px-3 py-2 rounded-lg"
            :class="{'near-miss-complete': nearMissRevealComplete}">
            <p class="text-xs font-bold mb-1" style="color:#ff6b6b">💔 场上剩余盒子揭晓</p>
            <div class="w-full h-1.5 rounded mb-2" style="background:rgba(255,255,255,0.1)">
              <div class="h-full rounded transition-all duration-300" style="background:linear-gradient(90deg,#ff4444,#ffd700)"
                :style="{width: nearMissRevealProgress+'%'}"></div>
            </div>
            <p v-if="nearMissRevealComplete" class="text-sm font-bold animate-pulse" style="color:#ffd700">{{ nearMissRevealText }}</p>
            <p v-else class="text-xs italic" style="color:#64748b">正在翻开剩余盒子…</p>
          </div>
          <!-- 黑金碎片 -->
          <div v-if="fragmentsEarnedThisGame > 0" class="fragment-panel mb-3 px-3 py-2 rounded-lg"
            style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2)">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-bold" style="color:#ffd700">🧩 黑金碎片 +{{ fragmentsEarnedThisGame }}</span>
              <span class="text-xs" style="color:#94a3b8">{{ stats.blackGoldFragments }}/{{ FRAGMENT_GOAL }}</span>
            </div>
            <div class="w-full h-2 rounded" style="background:rgba(0,0,0,0.3)">
              <div class="h-full rounded transition-all" style="background:linear-gradient(90deg,#64748b,#ffd700)"
                :style="{width: fragmentProgress+'%'}"></div>
            </div>
            <p v-if="fragmentsToUnlock > 0 && fragmentsToUnlock <= 3" class="text-xs mt-1 animate-pulse" style="color:#ffd700">
              再收集 {{ fragmentsToUnlock }} 个解锁【🦹 暗黑银行家】皮肤！
            </p>
            <p v-else-if="fragmentsToUnlock === 0" class="text-xs mt-1" style="color:#4ade80">✨ 【暗黑银行家】皮肤已解锁！</p>
          </div>
          <!-- 挑衅成就 -->
          <div v-if="provocationBadge" class="provocation-badge mb-3 px-3 py-2 rounded-lg"
            style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.35)">
            <p class="text-lg mb-0.5">{{ provocationBadge.icon }}</p>
            <p class="text-sm font-bold" style="color:#ff6b6b">挑衅成就：{{ provocationBadge.name }}</p>
            <p class="text-xs italic" style="color:#94a3b8">{{ provocationBadge.desc }}</p>
          </div>
          <!-- 弹幕定格 -->
          <div v-if="frozenDanmaku.length" class="mb-3">
            <p class="text-xs mb-1" style="color:#64748b">💬 弹幕定格</p>
            <div class="flex flex-wrap gap-1 justify-center">
              <span v-for="(d,i) in frozenDanmaku" :key="i" class="px-2 py-0.5 rounded text-xs" :style="{color:d.color,background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)'}">{{ d.text }}</span>
            </div>
          </div>
          <!-- 收支明细 -->
          <div class="rounded-lg p-2 mb-3" style="background:rgba(0,0,0,0.3)">
            <div class="flex justify-between text-xs" style="color:#94a3b8"><span>🎫 门票支出</span><span style="color:#ff6b6b">-£{{ formatNum(currentTicketCost) }}</span></div>
            <div class="flex justify-between text-xs" style="color:#94a3b8"><span>💰 本局收益</span><span :style="{color:winAmount>currentTicketCost?'#4ade80':'#ff6b6b'}">+£{{ formatNum(winAmount) }}</span></div>
            <div class="border-t my-1" style="border-color:rgba(255,255,255,0.08)"></div>
            <div class="flex justify-between text-xs font-bold" style="color:#e2e8f0">
              <span>净盈亏</span>
              <span :style="{color:(winAmount-currentTicketCost)>=0?'#4ade80':'#ff6b6b'}">{{ (winAmount-currentTicketCost)>=0?'+':'' }}£{{ formatNum(winAmount-currentTicketCost) }}</span>
            </div>
            <div class="flex justify-between text-xs mt-1" style="color:#94a3b8"><span>💼 钱包余额</span><span style="color:#ffd700">£{{ formatNum(wallet) }}</span></div>
          </div>
          <!-- 破产 -->
          <div v-if="isBankrupt" class="rounded-lg p-3 mb-3" style="background:rgba(255,0,0,0.1);border:1px solid rgba(255,0,0,0.3)">
            <p class="text-sm font-bold mb-2" style="color:#ff4444">💀 破产了！</p>
            <button class="btn-sm btn-secondary" @click="resetWallet">🆓 领取救济金 £100,000</button>
          </div>
          <!-- 本局数据 -->
          <div class="grid grid-cols-3 gap-2 mb-3 text-xs" style="color:#94a3b8">
            <div><p style="color:#64748b">贪婪指数</p><p style="color:#00f0ff">{{ greedIndex }}%</p></div>
            <div><p style="color:#64748b">运气评分</p><p style="color:#ffd700">{{ luckScore }}</p></div>
            <div><p style="color:#64748b">抗压能力</p><p style="color:#ff6b6b">{{ stressResist }}%</p></div>
          </div>
          <!-- 成就 -->
          <div v-if="newAchievements.length" class="mb-3">
            <p class="text-xs mb-1" style="color:#ffd700">🏅 新成就解锁！</p>
            <div class="flex flex-wrap gap-1 justify-center">
              <span v-for="a in newAchievements" :key="a" class="game-badge">{{ a }}</span>
            </div>
          </div>
          <!-- 解锁进度 -->
          <div v-if="unlockHint" class="rounded-lg p-2 mb-3" style="background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.15)">
            <p class="text-xs" style="color:#00f0ff">{{ unlockHint }}</p>
          </div>
          <!-- 黑市账单 -->
          <div v-if="purchasedCards.length" class="rounded-lg p-3 mb-3" style="background:rgba(139,92,246,0.05);border:1px solid rgba(139,92,246,0.2)">
            <p class="text-xs font-bold mb-1" style="color:#a78bfa">🏴‍☠️ 黑市账单</p>
            <div v-for="(c,i) in purchasedCards" :key="i" class="flex justify-between text-xs py-0.5" style="color:#94a3b8">
              <span>{{ c.icon }} {{ c.name }}</span>
              <span style="color:#ff6b6b">-£{{ formatNum(c.costPaid) }}</span>
            </div>
            <div class="border-t my-1" style="border-color:rgba(139,92,246,0.2)"></div>
            <div class="flex justify-between text-xs font-bold">
              <span style="color:#a78bfa">总支出</span>
              <span style="color:#ff6b6b">-£{{ formatNum(bmTotalSpent) }}</span>
            </div>
            <p v-if="bmSideEffectLog" class="text-xs mt-1 italic" style="color:#ff6b6b">⚠️ {{ bmSideEffectLog }}</p>
          </div>
          <!-- 平行宇宙对比 -->
          <div v-if="parallelUniverseActive" class="parallel-universe rounded-xl p-3 mb-3">
            <p class="text-xs font-bold mb-2 text-center" style="color:#64748b">⚖️ 平行宇宙复盘</p>
            <div class="flex gap-2">
              <div class="flex-1 rounded-lg p-2" style="background:rgba(255,68,68,0.08);border:1px solid rgba(255,68,68,0.25)">
                <p class="text-xs mb-0.5" style="color:#ff6b6b">❗ 残酷现实</p>
                <p class="text-lg font-black" style="color:#ff6b6b">£{{ formatNum(winAmount) }}</p>
                <p class="text-xs" style="color:#64748b">{{ offerAccepted?'接受了报价':'开出的盒子' }}</p>
              </div>
              <div class="flex items-center">
                <span class="text-2xl">⚔️</span>
              </div>
              <div class="flex-1 rounded-lg p-2" style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.25)">
                <p class="text-xs mb-0.5" style="color:#ffd700">✨ 如果…</p>
                <p class="text-lg font-black" style="color:#ffd700">£{{ formatNum(parallelUniverseWin) }}</p>
                <p class="text-xs" style="color:#64748b">{{ offerAccepted?'你的盒子实际价值':'接受最高报价' }}</p>
              </div>
            </div>
            <p class="text-xs mt-2 text-center italic" style="color:#ff6b6b">你“损失”了 £{{ formatNum(revengeAmount) }}</p>
          </div>
          <p class="text-xs mb-2" style="color:#64748b">金库点数 +{{ earnedPoints }}</p>
          <!-- 按钮区 -->
          <div class="flex gap-2 justify-center mb-2 flex-wrap">
            <button v-if="revengeButtonLabel" class="revenge-btn px-6 py-3 rounded-xl font-bold text-white text-lg" @click="quickReplay">
              {{ revengeButtonLabel }}
            </button>
            <button class="quick-replay-btn px-6 py-3 rounded-xl font-bold text-white text-lg quick-replay-pulse" @click="quickReplay">
              🔄 再来一局
            </button>
            <button class="btn-secondary px-4 py-3" @click="generateBattleReport">📸 战报</button>
            <button class="btn-secondary px-4" @click="showResult=false;showStats=true">📊 金库</button>
          </div>
          <p class="text-xs" style="color:#334155">按 <kbd class="px-1 py-0.5 rounded" style="background:rgba(255,255,255,0.1);color:#94a3b8">空格</kbd> 极速重开 · 0.5秒进入下一局</p>
          <div class="flex items-center justify-center gap-3 mt-2 flex-wrap">
            <label v-if="scriptedGame===0||stats.totalGames>=4" class="flex items-center gap-1 text-xs cursor-pointer" style="color:#64748b">
              <input type="checkbox" v-model="skipAnimation" @change="saveSettings" class="accent-cyan-500"> 跳过开箱动画
            </label>
            <label v-if="scriptedGame===0||stats.totalGames>=4" class="flex items-center gap-1 text-xs cursor-pointer" style="color:#64748b">
              <input type="checkbox" v-model="skipBankerDialog" @change="saveSettings" class="accent-cyan-500"> 跳过银行家废话
            </label>
            <p v-else class="text-xs italic" style="color:#334155">🔒 新手引导中，请完整体验剧情...</p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== 战报海报 ===== -->
    <Teleport to="body">
      <div v-if="showBattleReport" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/85" @click="showBattleReport=false"></div>
        <div class="relative rounded-2xl p-5 max-w-sm w-full battle-report-card" :style="shopTerminalStyle">
          <div ref="battleReportRef" class="battle-report-inner" v-html="battleReportHtml"></div>
          <div class="flex gap-2 mt-4">
            <button class="btn-primary flex-1 py-2" @click="copyBattleReport">📋 复制战报</button>
            <button class="btn-secondary px-4" @click="showBattleReport=false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== 黑市商店 ===== -->
    <Teleport to="body">
      <div v-if="showBlackMarket" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/80" @click="showBlackMarket=false"></div>
        <div class="relative rounded-2xl p-6 max-w-lg w-full bm-shop max-h-[85vh] overflow-y-auto" :style="shopTerminalStyle">
          <h3 class="text-lg font-bold mb-1 text-center" style="color:#a78bfa">🏴‍☠️ 黑市特权卡</h3>
          <p class="text-xs text-center mb-4" style="color:#64748b">高风险杠杆 · 后果自负</p>
          <!-- 杠杆倍率仪表盘 -->
          <div class="mb-4">
            <div class="flex justify-between text-xs mb-1" style="color:#94a3b8">
              <span>💼 £{{ formatNum(wallet) }}</span>
              <span :style="{color: wallet<20000?'#ff4444':wallet<50000?'#ffd700':'#4ade80'}">
                {{ wallet<20000?'⚠️ 爆仓警告':wallet<50000?'⚠️ 资金紧张':'✅ 安全区' }}
              </span>
            </div>
            <div class="w-full h-2 rounded" style="background:rgba(255,255,255,0.1)">
              <div class="h-full rounded transition-all" :style="{width: Math.min(100,wallet/200000*100)+'%', background: wallet<20000?'#ff4444':wallet<50000?'#ffd700':'#4ade80'}"></div>
            </div>
          </div>
          <!-- 道具卡列表 -->
          <div class="space-y-3">
            <div v-for="card in BLACK_MARKET_CARDS" :key="card.id" class="bm-card" :class="{'bm-card-disabled': !canBuyCard(card)}">
              <div class="flex gap-3">
                <div class="text-3xl shrink-0">{{ card.icon }}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <p class="text-sm font-bold" style="color:#ffd700">{{ card.name }}</p>
                    <p class="text-xs font-bold shrink-0" style="color:#ff6b6b">£{{ formatNum(getCardCost(card)) }}</p>
                  </div>
                  <p class="text-xs mt-0.5" style="color:#e2e8f0">{{ card.desc }}</p>
                  <p class="text-xs mt-0.5" style="color:#ff6b6b">⚠️ {{ card.sideEffect }}</p>
                </div>
              </div>
              <button class="bm-buy-btn mt-2 w-full py-2 rounded-lg text-xs font-bold text-white"
                :disabled="!canBuyCard(card)" @click="buyCard(card)">
                {{ canBuyCard(card) ? '⚡ 签署契约' : (wallet<getCardCost(card)?'💸 资金不足':'🔒 不可用') }}
              </button>
            </div>
          </div>
          <button class="btn-sm btn-secondary w-full mt-4" @click="showBlackMarket=false">关闭黑市</button>
        </div>
      </div>
    </Teleport>

    <!-- ===== 金库/统计弹窗 ===== -->
    <Teleport to="body">
      <div v-if="showStats" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/70" @click="showStats=false"></div>
        <div class="relative rounded-2xl p-6 max-w-md w-full banker-modal max-h-[85vh] overflow-y-auto" :style="shopTerminalStyle">
          <h3 class="text-lg font-bold mb-4" style="color:#ffd700">🏦 {{ vaultName }}</h3>
          <!-- 钱包 -->
          <div class="rounded-lg p-2 mb-4 text-center" style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2)">
            <p class="text-xs" style="color:#64748b">💼 钱包余额</p>
            <p class="text-xl font-bold" style="color:#ffd700">£{{ formatNum(wallet) }}</p>
          </div>
          <!-- 黑金碎片 -->
          <div class="rounded-lg p-2 mb-4" style="background:rgba(100,116,139,0.08);border:1px solid rgba(255,215,0,0.15)">
            <div class="flex justify-between text-xs mb-1">
              <span style="color:#64748b">🧩 黑金碎片</span>
              <span style="color:#ffd700">{{ stats.blackGoldFragments || 0 }}/{{ FRAGMENT_GOAL }}</span>
            </div>
            <div class="w-full h-2 rounded" style="background:rgba(0,0,0,0.3)">
              <div class="h-full rounded" style="background:linear-gradient(90deg,#64748b,#ffd700)"
                :style="{width: fragmentProgress+'%'}"></div>
            </div>
            <p class="text-xs mt-1" style="color:#94a3b8">集齐解锁【🦹 暗黑银行家】皮肤 · 银行家仇恨 {{ stats.bankerHatred || 0 }}</p>
          </div>
          <!-- 金库等级 -->
          <div class="mb-4">
            <div class="flex justify-between text-xs mb-1" style="color:#94a3b8">
              <span>等级 {{ vaultLevel }}</span>
              <span>{{ vaultPoints }}/{{ nextVaultCost }} pts</span>
            </div>
            <div class="w-full h-2 rounded" style="background:rgba(255,255,255,0.1)">
              <div class="h-full rounded" style="background:linear-gradient(90deg,#00f0ff,#ffd700)"
                :style="{width: Math.min(100,vaultPoints/nextVaultCost*100)+'%'}"></div>
            </div>
            <button v-if="vaultPoints >= nextVaultCost && vaultLevel < 5"
              class="btn-sm btn-primary mt-2 w-full" @click="upgradeVault">⬆️ 升级金库</button>
          </div>
          <!-- 统计 -->
          <div class="space-y-1.5 text-sm mb-4">
            <div class="flex justify-between" style="color:#94a3b8"><span>总局数</span><span style="color:#00f0ff">{{ stats.totalGames }}</span></div>
            <div class="flex justify-between" style="color:#94a3b8"><span>最高收益</span><span style="color:#ffd700">£{{ formatNum(stats.bestScore) }}</span></div>
            <div class="flex justify-between" style="color:#94a3b8"><span>平均收益</span><span style="color:#00f0ff">£{{ formatNum(avgScore) }}</span></div>
            <div class="flex justify-between" style="color:#94a3b8"><span>总拒绝次数</span><span style="color:#ff6b6b">{{ stats.totalRejects }}</span></div>
          </div>
          <!-- 雷达图 -->
          <div class="flex justify-center mb-4">
            <canvas ref="radarCanvas" width="200" height="200" class="rounded-lg" style="background:rgba(0,0,0,0.3)"></canvas>
          </div>
          <!-- 成就 -->
          <div class="mb-4">
            <p class="text-xs mb-2" style="color:#64748b">🏅 成就 ({{ allAchievements.length }}/{{ totalAchievementCount }})</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="a in allAchievements" :key="a.name"
                :class="['game-badge', a.unlocked?'':'opacity-30']"
                :title="a.desc">{{ a.icon }} {{ a.name }}</span>
            </div>
          </div>
          <button class="btn-sm btn-secondary w-full" @click="showStats=false">关闭</button>
        </div>
      </div>
    </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import chestImg from '@/assets/chest.png'
import atlasAiImg from '@/assets/atlas-ai.png'
import cyberpunkCasinoBg from '@/assets/cyberpunk-casino-bg.png'
import shopTerminalBg from '@/assets/shop-terminal-bg.png'

const cyberBgStyle = {
  backgroundImage: `url(${cyberpunkCasinoBg})`
}
const shopTerminalStyle = {
  backgroundImage: `linear-gradient(145deg, rgba(13,17,23,0.78) 0%, rgba(22,27,34,0.85) 50%, rgba(13,17,23,0.82) 100%), url(${shopTerminalBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}

// === 门票档位（残酷压榨版）===
// 最高大奖严格控制在门票的 2.5倍 左右，让玩家时刻面临“亏损”或“微赚”的煎熬
const TICKET_TIERS = [
  { 
    id: 'bronze', 
    name: '铜牌场', 
    icon: '', 
    cost: 50000, // 门票：5万
    // 最高大奖设为 12万 (2.4倍)
    // 策略：大量1-500的“垃圾奖”，中期断层，后期只有微薄的大奖
    amounts: [1, 5, 10, 50, 100, 250, 500, 1000, 2000, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 120000] 
  },
  { 
    id: 'silver', 
    name: '银牌场', 
    icon: '', 
    cost: 200000, // 门票：20万
    // 最高大奖设为 50万 (2.5倍)
    // 策略：增加了几千块的“中等奖”来迷惑玩家，但大奖依然吝啬
    amounts: [250, 500, 1000, 2000, 5000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000, 180000, 200000, 500000] 
  },
  { 
    id: 'gold', 
    name: '金牌场', 
    icon: '', 
    cost: 800000, // 门票：80万
    // 最高大奖设为 200万 (2.5倍)
    // 策略：这里的“大奖”在前期看来是天文数字，但随着债务累积，玩家会觉得越来越不够用
    amounts: [1000, 5000, 10000, 20000, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 600000, 700000, 800000, 900000, 1000000, 2000000] 
  },
  { 
    id: 'diamond', 
    name: '钻石场', 
    icon: '', 
    cost: 2000000, // 门票：200万
    // 最高大奖设为 500万 (2.5倍)
    // 策略：顶级局，每一局都是生死战，没有“躺赢”的5000万，只有残酷的2.5倍杠杆
    amounts: [10000, 50000, 100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1200000, 1500000, 1800000, 2000000, 2500000, 3000000, 4000000, 5000000] 
  }
];

// === 金额池（全局默认，用于新手局或重置）===
// 严格遵循“残酷压榨”逻辑，最高奖12万，门票5万
const DEFAULT_AMOUNTS = [
  1, 5, 10, 50, 100, 250, 500, 1000, 2000, 5000, 
  10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 120000
];
// === 黑市道具卡 ===
const BLACK_MARKET_CARDS = [
  { id:'wiretap', name:'窃听器', icon:'📡', cost:15000, desc:'偷听银行家底价范围', sideEffect:'若开小奖，下次报价强制打8折', maxBuy:1, condition:()=>gameState.value==='OPEN_BOXES'||gameState.value==='BANKER_OFFER' },
  { id:'mind_disrupt', name:'精神干扰剂', icon:'💉', cost:25000, desc:'强制下次报价高于数学期望', sideEffect:'银行家识破后，后续2轮报价缩水30%', maxBuy:1, condition:()=>gameState.value==='BANKER_OFFER' },
  { id:'ultimatum', name:'最后通牒', icon:'📜', cost:20000, desc:'强制银行家给出更高报价', sideEffect:'仅限一次，用后银行家愤怒值+50%', maxBuy:1, condition:()=>gameState.value==='BANKER_OFFER' },
  { id:'xray', name:'透视底牌', icon:'🔍', cost:10000, desc:'偷看1-2个未开启盒子金额', sideEffect:'大奖权重降低，中等金额概率提升', maxBuy:2, condition:()=>gameState.value==='OPEN_BOXES' },
  { id:'fate_reset', name:'命运重置', icon:'⏪', cost:30000, desc:'作废本轮结果重新抽取', sideEffect:'剩余奖池被污染，大奖替换为中下金额', maxBuy:1, condition:()=>gameState.value==='OPEN_BOXES' },
  { id:'blind_swap', name:'盲盒对赌', icon:'🎲', cost:35000, desc:'指定任意盒子与手中盒子交换', sideEffect:'接下来2轮报价不超过£5000', maxBuy:1, condition:()=>gameState.value==='OPEN_BOXES' },
  // === 金融衍生品道具 ===
  { id:'insider_trading', name:'内幕交易', icon:'💰', cost:50000, desc:'买通内线降低随机池方差', sideEffect:'系统审查风险+50%，失败则本局奖金减半', maxBuy:1, condition:()=>gameState.value==='OPEN_BOXES' },
  { id:'debt_restructuring', name:'债务重组', icon:'📊', cost:40000, desc:'清空当前债务', sideEffect:'下一局基础利息永久翻倍', maxBuy:1, condition:()=>gameState.value==='BANKER_OFFER' && debt.value > 0 },
  { id:'high_leverage', name:'高杠杆期权', icon:'⚡', cost:60000, desc:'以未来器官估值为抵押', sideEffect:'赢了抹平债务，输了强制平仓（生存点数-30）', maxBuy:1, condition:()=>gameState.value==='BANKER_OFFER' && abyssProtocolActive.value }
]

// === 金库等级 ===
const VAULT_LEVELS = [
  {name:'破旧纸箱',icon:'📦',cost:0},
  {name:'木制保险柜',icon:'🪵',cost:500},
  {name:'钢铁金库',icon:'🔒',cost:2000},
  {name:'高科技金库',icon:'🏦',cost:8000},
  {name:'赛博朋克金库',icon:'🌐',cost:25000},
  {name:'传奇秘库',icon:'👑',cost:100000}
]

// === 盒子皮肤 ===
const ALL_SKINS = [
  {id:'default',name:'经典',icon:'📦',minVault:0},
  {id:'retro',name:'复古电视',icon:'📺',minVault:1},
  {id:'blind',name:'盲盒潮玩',icon:'🎁',minVault:2},
  {id:'globe',name:'微缩地球',icon:'🌍',minVault:3},
  {id:'cyber',name:'赛博魔盒',icon:'💎',minVault:4},
  {id:'dark_banker',name:'暗黑银行家',icon:'🦹',minVault:99,fragmentCost:10}
]

const FRAGMENT_GOAL = 10

// === 成就定义 ===
const ACHIEVEMENT_DEFS = [
  {id:'millionaire',name:'百万富翁',icon:'💎',desc:'单局赢得£100,000+',check:(d)=>d.winAmount>=100000},
  {id:'stubborn',name:'死磕到底',icon:'💪',desc:'拒绝所有报价直到最后',check:(d)=>d.rejectedAll&&d.round>=6},
  {id:'lucky',name:'幸运之星',icon:'🍀',desc:'单局赢得£200,000+',check:(d)=>d.winAmount>=200000},
  {id:'highroller',name:'高额玩家',icon:'🎰',desc:'单局赢得£50,000+',check:(d)=>d.winAmount>=50000},
  {id:'earlybird',name:'见好就收',icon:'🐦',desc:'首轮接受报价且>£50,000',check:(d)=>d.acceptedRound1&&d.winAmount>50000},
  {id:'ironhead',name:'铁头娃',icon:'🗿',desc:'拒绝所有报价并开出大奖',check:(d)=>d.rejectedAll&&d.winAmount>=100000},
  {id:'comeback',name:'绝处逢生',icon:'🔥',desc:'剩3盒且最大奖还在时成功开出',check:(d)=>d.comebackWin},
  {id:'double_win',name:'赌神',icon:'🎲',desc:'双倍对赌赢得大奖',check:(d)=>d.doubleWin},
  {id:'ten_games',name:'常客',icon:'🎪',desc:'游玩10局',check:(d)=>d.totalGames>=10},
  {id:'bomb_survivor',name:'黑市玩家',icon:'🏴‍☠️',desc:'使用黑市道具卡并赢得游戏',check:(d)=>d.bmCardsUsed&&d.winAmount>0},
  {id:'hack_master',name:'杠杆大师',icon:'⚡',desc:'单局使用3张以上道具卡',check:(d)=>d.bmCardsUsed&&d.bmCardsUsed>=3},
  {id:'all_powerups',name:'黑市VIP',icon:'💎',desc:'累计购买10张道具卡',check:(d)=>d.bmTotalCards>=10},
  {id:'banker_contempt',name:'银行家的蔑视',icon:'😈',desc:'本局收益趋近于零',check:(d)=>d.nearZeroWin},
  {id:'defeat_banker',name:'击败银行家',icon:'👊',desc:'在银行家愤怒时赢下大奖',check:(d)=>d.defeatedAngryBanker},
  {id:'fragment_master',name:'碎片收藏家',icon:'🧩',desc:'收集10个黑金碎片',check:(d)=>(d.blackGoldFragments||0)>=FRAGMENT_GOAL}
]

// === 游戏状态 ===
const boxes = ref([])
const gameState = ref('IDLE')
const myBoxId = ref(null)
const round = ref(0)
const boxesOpenedThisRound = ref(0)
const currentOffer = ref(0)
const bestOffer = ref(0)
const offerAccepted = ref(false)
const winAmount = ref(0)
const showOfferModal = ref(false)
const showStartScreen = ref(true)
const showStats = ref(false)
const showResult = ref(false)
const goldGlow = ref(false)
const vignetteActive = ref(false)
const soundOn = ref(true)
const animating = ref(false)

// 钱包和门票
const wallet = ref(100000)
const selectedTier = ref(0) // index into TICKET_TIERS
const currentTicketCost = ref(0)
const isBankrupt = ref(false)
const bankerMessage = ref('')
const bankerEmoji = ref('')
const bankerMood = ref('neutral')
const bankerBubbleText = ref('')
const offerTimer = ref(0)
const finalTimer = ref(0)
const doubleMode = ref(false)
const regretText = ref('')
const newAchievements = ref([])
const earnedPoints = ref(0)

// === 情绪温度计系统 ===
const emotionValue = ref(50) // 0-100 情绪值，越高越焦虑
const emotionTrend = ref(0) // 情绪变化趋势（-10 到 +10）
const anxietyLevel = computed(() => {
  if (emotionValue.value >= 80) return 'extreme'
  if (emotionValue.value >= 60) return 'high'
  if (emotionValue.value >= 40) return 'medium'
  return 'low'
})

// === 【深渊协议】新手引导系统 ===
const isNewPlayer = ref(true) // 是否为新手玩家
const tutorialPhase = ref(0) // 新手引导阶段 0-3（入局、试探、破局、深渊）
const tutorialComplete = ref(false) // 新手引导是否完成
const tutorialBoxOpened = ref(false) // 当前阶段是否已开盒
const tutorialDealClicked = ref(false) // 当前阶段是否点击了Deal
const ignoreDanmakuCountdown = ref(0) // 反弹幕任务倒计时（5秒）
const isIgnoringDanmaku = ref(false) // 是否正在执行反弹幕任务
const noviceProtectionActive = ref(false) // 新手保护是否激活
const noviceProtectionAmount = ref(0) // 安全垫金额
const tutorialIgnoreTaskStarted = ref(false) // 第三幕反弹幕任务是否已触发
const scriptedNextHook = ref('') // 结算页下一幕钩子文案

const SCRIPTED_ACT_LABELS = {
  1: '第一幕 · 造神局 — 系统在喂养你的自信',
  2: '第二幕 · 心碎局 — 大奖擦肩而过',
  3: '第三幕 · 复仇局 — 忍住，别听弹幕的',
  4: '第四幕 · 深渊入局 — 债务从这一局开始'
}

// === 深渊债务系统 ===
const debt = ref(0) // 当前债务金额
const survivalPoints = ref(100) // 生存点数 0-100，归零触发强制回收
const interestRate = ref(0.15) // 债务复利利率 15%
const debtMultiplier = ref(1) // 债务倍数（债务重组道具影响）
const abyssProtocolActive = ref(false) // 深渊协议是否激活（第4局后）
const redAlertLevel = ref(0) // 红色警戒等级 0-3
const survivalGaugeClass = computed(() => {
  if (survivalPoints.value <= 20) return 'critical'
  if (survivalPoints.value <= 40) return 'warning'
  if (survivalPoints.value <= 60) return 'caution'
  return 'normal'
})

// === 游戏状态追踪（用于弹幕触发）===
const consecutiveWins = ref(0) // 连胜次数
const consecutiveLosses = ref(0) // 连败次数
const consecutiveNoDeals = ref(0) // 连续拒绝次数
const bigWinsInRow = ref(0) // 连续开大金额次数
const nearMissCount = ref(0) // 差一点赢的次数

const radarCanvas = ref(null)

const boxSkin = ref('default')

// 银行家情绪追踪
const consecutiveRejects = ref(0)
const bigAmountsEliminated = ref(0)
const rejectHistory = ref([])

// === 弹幕与特效系统 ===
const danmakuItems = ref([])
let danmakuId = 0
const recentDanmakus = ref([]) // 最近弹幕记录，用于处刑系统
const maxRecentDanmakus = 10 // 最大记录数
let danmakuSpawnInterval = null
const typewriterText = ref('')
let typewriterInterval = null
const screenShake = ref(false)
const spotlightOn = ref(false)
const bankerStampTarget = ref(-1)
const shatterEffect = ref(false)
const goldParticles = ref(false)
const longPressProgress = ref(0)
const longPressBoxId = ref(-1)
let longPressTimer = null
const LONG_PRESS_TICK_MS = 25
const NO_DEAL_LONG_PRESS_MS = 900
const BOX_OPEN_LONG_PRESS_MS = 800
const boxLongPressHint = ref('')
let boxHintTimer = null
const travelDist = ref(800)
const myBoxRevealText = ref('')
const myBoxRevealStyle = ref({})
const myBoxRevealEmoji = ref('')
const myBoxRevealColor = ref('#ffd700')
const bankerReactionText = ref('')
const displayAmount = ref(0)
let slotInterval = null
const bankerPostComment = ref('')
const bankerPostEmoji = ref('🧐')
const bankerPostMood = ref('neutral')
const gameTags = ref([])
const losingStreak = ref(0)
const winningStreak = ref(0)
const frozenDanmaku = ref([])
const unlockHint = ref('')
const skipAnimation = ref(false)
const skipBankerDialog = ref(false)
const streakCompensationActive = ref(false)
const streakCutoffActive = ref(false)
const pseudoBigWinActive = ref(false)
const fragmentsEarnedThisGame = ref(0)
const provocationBadge = ref(null)
const nearMissRevealActive = ref(false)
const nearMissRevealComplete = ref(false)
const nearMissRevealText = ref('')
const nearMissRevealProgress = ref(0)
const nearMissMaxAmount = ref(0)
const showBattleReport = ref(false)
const battleReportHtml = ref('')
const bankerWasAngryThisGame = ref(false)
const scriptedGame = ref(0)
const resultTransition = ref(false)

// 黑市
const showBlackMarket = ref(false)
const purchasedCards = ref([])
const cardPurchaseCounts = ref({})
const bmActiveEffects = ref([])
const bmSideEffectLog = ref('')
const bmTotalSpent = computed(() => purchasedCards.value.reduce((s, c) => s + (c.costPaid || 0), 0))
// 黑市副作用状态
const bmBankerDiscount = ref(0) // 报价折扣轮次
const bmLowOfferCap = ref(0) // 低报价上限轮次
const bmPoolPolluted = ref(false) // 奖池污染
const bmOfferBoost = ref(false) // 报价增强
const bmInsiderTrading = ref(false) // 内幕交易状态
const bmHighLeverage = ref(false) // 高杠杆期权状态

// 直觉值/幸运值系统
const intuitionValue = ref(0) // 0-100 直觉值
const intuitionFlash = ref(false) // 直觉值闪烁效果
const luckyBoxHint = ref(-1) // 当前悬停盒子索引

// 平行宇宙（结算界面）
const parallelUniverseWin = ref(0) // “如果Deal”能赢的金额
const parallelUniverseActive = ref(false) // 是否显示平行宇宙对比
const revengeButtonLabel = ref('') // 复仇按钮文案
const revengeAmount = ref(0) // 复仇金额

// 心理暗示效果
const boxLuckyGlow = ref(-1) // 有“幸运感”的盒子ID
const hopeFlashActive = ref(false) // 希望破碎效果
const warmFilterActive = ref(false) // 暖色滤镜（开出好结果时）
const bankerReluctant = ref(false) // 银行家不情愿动画

// 统计数据
const stats = ref({
  totalGames:0, bestScore:0, totalScore:0, totalRejects:0,
  achievements:[], vaultPoints:0, vaultLevel:0,
  totalAccepts:0, totalEarlyAccepts:0, gamesData:[],
  wallet:100000,
  blackGoldFragments:0, totalNetLoss:0, bankerHatred:0
})

const roundBoxCounts = [5,3,3,3,2,1]

// ===== 打字机效果 =====
function startTypewriter(text, speed = 50) {
  clearInterval(typewriterInterval)
  typewriterText.value = ''
  let i = 0
  typewriterInterval = setInterval(() => {
    if (i < text.length) { typewriterText.value += text[i]; i++; playSound('tick') }
    else clearInterval(typewriterInterval)
  }, text.length > 30 ? 35 : speed)
}
function clearTypewriter() { clearInterval(typewriterInterval); typewriterText.value = '' }

// ===== 弹幕系统 =====
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const DM_SMALL = [
  '反向抽卡！小奖出尽，大奖必在盒中！','稳了稳了！场上小钱都被你排除了！',
  '《关于我运气极差，但离25万越来越近》','这波是精准排雷！银行家在冒冷汗',
  '1镑？不，这是通往25万镑的入场券！','别慌！下一个不是大奖就是大奖！',
  '非酋の逆袭！概率在向你微笑！','排除法大师！大奖正在向你招手'
]
const DM_BIG = [
  '痛失大奖！亲手把大奖送走了！','完了完了，大奖被排除了...','你这手气，不去当散财童子可惜了',
  '银行家：谢谢老板，稳赚不赔！','大奖没了，只能祈祷手里不是那1镑','太可惜了！刚才那个报价其实挺香的',
  '心碎了...那是我的梦想数字啊','欧皇陨落！大奖永远地离开了'
]
const DM_MID = [
  '薛定谔的盒子：既是1镑也是25万！','不上不下，最搞心态！','稳住，大奖还在场上！',
  '不亏不赚，就看下一轮了','银行家：我也拿不准了','中庸之道？这可不是中庸的时候',
  '这波是五五开，全看下一手','紧张刺激！这才是真正的博弈'
]
const DM_FINAL = [
  '50%的概率！信玄学还是信数学？！','别换！千万别换！第一直觉才是真理',
  '换！换！换！大奖在对面！','深呼吸，闭上眼睛，按下去！',
  '见证奇迹的时刻到了！！','手心都是汗了...','命运的十字路口！',
  '这将是载入史册的一刻！'
]

// === 六种弹幕人设 ===

const DM_GODMAKER = [ // 狂热的"造神者"：捧杀与洗脑
  '神！你就是神！',
  '系统被你打穿了！',
  '你就是深渊的王！',
  '资本家在冒冷汗！',
  '别卖！绝对有十万！',
  '梭哈！别给资本留活路！',
  '卖了你就是懦夫！',
  '你的直觉就是真理！',
  '这把稳了！',
  '冲就完事了！'
]

const DM_MATHEMATICIAN = [ // 冷血的"数学家"：智商霸凌
  '期望值跌破了，蠢货。',
  '你的直觉一文不值。',
  '承认吧，数学白痴。',
  '选No Deal？脑瘫。',
  '下一个99%是小奖。',
  '别挣扎了，拿钱滚。',
  '你在往碎纸机扔钱。',
  '理性点，立刻Deal！',
  '数学不会说谎。',
  '概率对你不利。'
]

const DM_TROLL = [ // 阴阳怪气的"乐子人"：极致屈辱
  '《稳健》',
  '年度最佳喜剧素材。',
  '已截图，准备发朋友圈。',
  '感谢老铁的破产表演。',
  '我奶奶用脚打都比你强。',
  '别点Deal了，认输吧。',
  '这智商怎么活到现在的？',
  '给自己留点体面吧。',
  '下饭操作。',
  '笑出声了。'
]

const DM_EX = [ // 绝望的"前任"：深渊恐惧
  '别充钱了，快跑！',
  '我在器官农场排队。',
  '这里连个窗户都没有。',
  '阿特拉斯在算你的肉价。',
  '生存点数还够活吗？',
  '这不是赌场，是屠宰场。',
  '我们是排队等死的猪。',
  '趁还没输光，退吧！',
  '快跑！还来得及！',
  '深渊在召唤你。'
]

const DM_COMMANDER = [ // 暴躁的"指令狂"：情绪引爆
  '按左键啊！！',
  '帕金森还是脑血栓？！',
  '急死老子了！！',
  '手残别玩！换我上！',
  '倒计时红了！按啊！',
  '你在等系统发奖状吗？！',
  '点那个道具！别抠搜！',
  '你当这是过家家呢？！',
  '快点！别墨迹！',
  '磨磨唧唧！'
]

const DM_INSIDER = [ // 神秘的"内幕爆料者"：致命毒药
  '别买重组，那是坟。',
  '买高杠杆！我拿命担保！',
  '池子里绝对有十万镑！',
  '倾家荡产买漏洞！',
  '系统刚更新暗池数据。',
  '下一个盒子是空的！',
  '买重置！唯一活命机会！',
  '要么上天，要么下地狱！',
  '内幕消息：大奖在左！',
  '相信我，这是最后的机会！'
]

const DM_BANKER_TAUNT = [
  '弹幕：银行家急了！','弹幕：血赚！继续！','弹幕：大奖必在盒中！别卖！',
  '弹幕：别听银行家的！','弹幕：拒绝！拒绝！拒绝！'
]
const DM_DEAL = [
  '落袋为安！稳！','明智的止损！见好就收','恭喜逃离地狱！',
  '安全着陆！','这笔钱真香','不贪心，是个狠人！'
]
const DM_NODEAL = [
  '冲冲冲！拒绝得好！','勇士！敢拒绝银行家','不怂！这才是真玩家',
  '豪赌！心脏够大','他疯了！他居然拒绝了','这是赌神的魄力还是赌徒的执念？'
]

function spawnDanmaku(category, count = 3, customTexts = null) {
  let pool
  switch(category) {
    case 'small': pool = DM_SMALL; break; case 'big': pool = DM_BIG; break;
    case 'mid': pool = DM_MID; break; case 'final': pool = DM_FINAL; break;
    case 'banker_taunt': pool = DM_BANKER_TAUNT; break;
    case 'deal': pool = DM_DEAL; break; case 'nodeal': pool = DM_NODEAL; break;
    case 'custom': pool = customTexts || DM_MID; break;
    default: pool = DM_MID
  }
  
  // 根据情绪状态混入不同人设弹幕
  const anxiety = emotionValue.value
  const remaining = remainingBoxes.value.length
  
  // 高焦虑（恐慌）：混入绝望前任 + 阴阳怪气乐子人
  if (anxiety >= 70 && category !== 'deal') {
    pool = [...pool, ...DM_EX.slice(0, 3), ...DM_TROLL.slice(0, 2)]
  } 
  // 低焦虑（自信）：混入狂热造神者
  else if (anxiety <= 30 && category !== 'deal') {
    pool = [...pool, ...DM_GODMAKER.slice(0, 3)]
  }
  
  // 关键决策时刻（只剩少量盒子）：混入冷血数学家 + 神秘内幕者
  if (remaining <= 4 && category !== 'deal') {
    pool = [...pool, ...DM_MATHEMATICIAN.slice(0, 2), ...DM_INSIDER.slice(0, 2)]
  }
  
  // 暴躁指令狂：随机混入
  if (Math.random() > 0.7 && category !== 'deal') {
    pool = [...pool, ...DM_COMMANDER.slice(0, 1)]
  }
  
  const used = new Set()
  for (let i = 0; i < count && i < pool.length; i++) {
    let idx; do { idx = Math.floor(Math.random() * pool.length) } while (used.has(idx) && used.size < pool.length); used.add(idx)
    const speed = 10 + Math.random() * 8 // 放慢两倍
    const currentId = danmakuId++
    const text = pool[idx]
    
    // 根据人设设置不同颜色
    let color = '#94a3b8'
    if (DM_GODMAKER.includes(text)) {
      color = '#4ade80' // 造神者：绿色
    } else if (DM_MATHEMATICIAN.includes(text)) {
      color = '#00f0ff' // 数学家：青色
    } else if (DM_TROLL.includes(text)) {
      color = '#ff6b6b' // 乐子人：红色
    } else if (DM_EX.includes(text)) {
      color = '#8b5cf6' // 前任：紫色
    } else if (DM_COMMANDER.includes(text)) {
      color = '#f59e0b' // 指令狂：橙色
    } else if (DM_INSIDER.includes(text)) {
      color = '#ec4899' // 内幕者：粉色
    } else if (category === 'big') {
      color = '#ff6b6b'
    } else if (category === 'small') {
      color = '#4ade80'
    } else if (category === 'final') {
      color = '#ffd700'
    } else if (category === 'deal') {
      color = '#4ade80'
    } else if (category === 'nodeal') {
      color = '#ff6b6b'
    }
    
    danmakuItems.value.push({
      id: currentId, text: text,
      color: color,
      top: 10 + Math.random() * 180, speed: speed,
      danmakuType: getDanmakuType(text)
    })
    // 记录弹幕用于处刑系统
    recordDanmaku(text)
    // 弹幕滚动完成后自动移除，不循环展示
    setTimeout(() => {
      const index = danmakuItems.value.findIndex(d => d.id === currentId)
      if (index !== -1) {
        danmakuItems.value.splice(index, 1)
      }
    }, speed * 1000 + 2000)
  }
}

// 获取弹幕类型
function getDanmakuType(text) {
  if (DM_GODMAKER.includes(text)) return 'godmaker'
  if (DM_MATHEMATICIAN.includes(text)) return 'mathematician'
  if (DM_TROLL.includes(text)) return 'troll'
  if (DM_EX.includes(text)) return 'ex'
  if (DM_COMMANDER.includes(text)) return 'commander'
  if (DM_INSIDER.includes(text)) return 'insider'
  return 'normal'
}

// === 弹幕风暴效果 ===
const isInDecisionMode = ref(false)

function startDecisionStorm() {
  if (isInDecisionMode.value) return
  isInDecisionMode.value = true
  
  // 快速生成大量弹幕，形成弹幕风暴
  const stormInterval = setInterval(() => {
    if (!isInDecisionMode.value) {
      clearInterval(stormInterval)
      return
    }
    
    // 左右互搏：左侧偏向激进（造神者+指令狂），右侧偏向保守（数学家+前任）
    const leftPool = [...DM_GODMAKER, ...DM_COMMANDER, ...DM_INSIDER]
    const rightPool = [...DM_MATHEMATICIAN, ...DM_EX, ...DM_TROLL]
    
    // 左侧弹幕（支持No Deal）
    const leftText = leftPool[Math.floor(Math.random() * leftPool.length)]
    danmakuItems.value.push({
      id: danmakuId++,
      text: leftText,
      color: DM_GODMAKER.includes(leftText) ? '#4ade80' : DM_COMMANDER.includes(leftText) ? '#f59e0b' : '#ec4899',
      top: 10 + Math.random() * 180,
      speed: 6 + Math.random() * 4,
      direction: 'left',
      danmakuType: getDanmakuType(leftText)
    })
    
    // 右侧弹幕（支持Deal）
    const rightText = rightPool[Math.floor(Math.random() * rightPool.length)]
    danmakuItems.value.push({
      id: danmakuId++,
      text: rightText,
      color: DM_MATHEMATICIAN.includes(rightText) ? '#00f0ff' : DM_EX.includes(rightText) ? '#8b5cf6' : '#ff6b6b',
      top: 10 + Math.random() * 180,
      speed: 6 + Math.random() * 4,
      direction: 'right',
      danmakuType: getDanmakuType(rightText)
    })
    
  }, 200) // 每200ms生成一对弹幕
  
  // 3秒后停止风暴
  setTimeout(() => {
    isInDecisionMode.value = false
    clearInterval(stormInterval)
  }, 3000)
}

function clearDanmaku() { danmakuItems.value = []; clearInterval(danmakuSpawnInterval); isInDecisionMode.value = false }

// === 弹幕触发规则系统 ===

// 记录弹幕用于处刑系统
function recordDanmaku(text) {
  recentDanmakus.value.push({
    text,
    type: getDanmakuType(text),
    timestamp: Date.now()
  })
  if (recentDanmakus.value.length > maxRecentDanmakus) {
    recentDanmakus.value.shift()
  }
}

// === 状态触发：根据玩家处境改变弹幕生态 ===
function getCurrentPhase() {
  const debtAmount = debt.value
  const survival = survivalPoints.value
  const losses = consecutiveLosses.value
  const wins = consecutiveWins.value
  
  // 深渊期：债务复利飙升，生存点数 <= 30
  if (abyssProtocolActive.value && survival <= 30) {
    return 'abyss'
  }
  // 泥沼期：产生初始债务，或连续2局未开大奖
  if (debtAmount > 0 || losses >= 2) {
    return 'mud'
  }
  // 新手/顺风期：债务低，连胜中
  return 'good'
}

function spawnPhaseDanmaku() {
  const phase = getCurrentPhase()
  
  switch(phase) {
    case 'good':
      // 新手/顺风期：【造神者】70%，【指令狂】30%
      spawnDanmakuByWeight([
        { pool: DM_GODMAKER, weight: 70, count: 3 },
        { pool: DM_COMMANDER, weight: 30, count: 1 }
      ], 5 + Math.floor(Math.random() * 4))
      break
    case 'mud':
      // 泥沼期：【数学家】40%，【乐子人】30%，【造神者】20%，【前任】10%
      spawnDanmakuByWeight([
        { pool: DM_MATHEMATICIAN, weight: 40, count: 4 },
        { pool: DM_TROLL, weight: 30, count: 3 },
        { pool: DM_GODMAKER, weight: 20, count: 2 },
        { pool: DM_EX, weight: 10, count: 1 }
      ], 10 + Math.floor(Math.random() * 6))
      break
    case 'abyss':
      // 深渊期：触发弹幕风暴
      startDecisionStorm()
      // 3秒后转为低频但高亮的诛心短句
      setTimeout(() => {
        spawnDanmakuByWeight([
          { pool: DM_EX, weight: 50, count: 2 },
          { pool: DM_COMMANDER, weight: 30, count: 2 },
          { pool: DM_INSIDER, weight: 20, count: 1 }
        ], 3)
      }, 3000)
      break
  }
}

function spawnDanmakuByWeight(weights, totalCount) {
  let allDanmakus = []
  
  weights.forEach(w => {
    const count = Math.floor((w.weight / 100) * totalCount)
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * w.pool.length)
      allDanmakus.push({ text: w.pool[idx], type: getDanmakuType(w.pool[idx]) })
    }
  })
  
  // 打乱顺序
  allDanmakus.sort(() => Math.random() - 0.5)
  
  allDanmakus.forEach((dm, i) => {
    setTimeout(() => {
      const speed = 8 + Math.random() * 6
      const currentId = danmakuId++
      
      let color = '#94a3b8'
      if (DM_GODMAKER.includes(dm.text)) color = '#4ade80'
      else if (DM_MATHEMATICIAN.includes(dm.text)) color = '#00f0ff'
      else if (DM_TROLL.includes(dm.text)) color = '#ff6b6b'
      else if (DM_EX.includes(dm.text)) color = '#8b5cf6'
      else if (DM_COMMANDER.includes(dm.text)) color = '#f59e0b'
      else if (DM_INSIDER.includes(dm.text)) color = '#ec4899'
      
      danmakuItems.value.push({
        id: currentId,
        text: dm.text,
        color: color,
        top: 10 + Math.random() * 180,
        speed: speed,
        danmakuType: dm.type
      })
      recordDanmaku(dm.text)
      
      setTimeout(() => {
        const index = danmakuItems.value.findIndex(d => d.id === currentId)
        if (index !== -1) danmakuItems.value.splice(index, 1)
      }, speed * 1000 + 2000)
    }, i * 300)
  })
}

// === 决策触发：鼠标悬停时精准拱火 ===
function onDealHover() {
  // 悬停Deal按钮：触发反对卖的弹幕
  const pool = [...DM_GODMAKER.slice(0, 2), ...DM_COMMANDER.slice(0, 1)]
  const text = pool[Math.floor(Math.random() * pool.length)]
  
  const speed = 5 + Math.random() * 3
  const currentId = danmakuId++
  
  let color = DM_GODMAKER.includes(text) ? '#4ade80' : '#f59e0b'
  
  danmakuItems.value.push({
    id: currentId,
    text: text,
    color: color,
    top: 30 + Math.random() * 100,
    speed: speed,
    direction: 'left', // 从左边过来，反对Deal
    danmakuType: getDanmakuType(text)
  })
  recordDanmaku(text)
  
  setTimeout(() => {
    const index = danmakuItems.value.findIndex(d => d.id === currentId)
    if (index !== -1) danmakuItems.value.splice(index, 1)
  }, speed * 1000 + 1500)
}

function onNoDealHover() {
  // 悬停NoDeal按钮：触发送跑/嘲讽弹幕
  const pool = [...DM_EX.slice(0, 2), ...DM_TROLL.slice(0, 2), ...DM_MATHEMATICIAN.slice(0, 1)]
  const text = pool[Math.floor(Math.random() * pool.length)]
  
  const speed = 5 + Math.random() * 3
  const currentId = danmakuId++
  
  let color = '#94a3b8'
  if (DM_EX.includes(text)) color = '#8b5cf6'
  else if (DM_TROLL.includes(text)) color = '#ff6b6b'
  else if (DM_MATHEMATICIAN.includes(text)) color = '#00f0ff'
  
  danmakuItems.value.push({
    id: currentId,
    text: text,
    color: color,
    top: 30 + Math.random() * 100,
    speed: speed,
    direction: 'right', // 从右边过来，反对NoDeal
    danmakuType: getDanmakuType(text)
  })
  recordDanmaku(text)
  
  setTimeout(() => {
    const index = danmakuItems.value.findIndex(d => d.id === currentId)
    if (index !== -1) danmakuItems.value.splice(index, 1)
  }, speed * 1000 + 1500)
}

function onShopHover(itemName) {
  // 悬停商店道具
  const pool = [...DM_INSIDER.slice(0, 2), ...DM_EX.slice(0, 1), ...DM_COMMANDER.slice(0, 1)]
  const text = pool[Math.floor(Math.random() * pool.length)]
  
  const speed = 5 + Math.random() * 3
  const currentId = danmakuId++
  
  let color = DM_INSIDER.includes(text) ? '#ec4899' : DM_EX.includes(text) ? '#8b5cf6' : '#f59e0b'
  
  danmakuItems.value.push({
    id: currentId,
    text: text,
    color: color,
    top: 30 + Math.random() * 100,
    speed: speed,
    danmakuType: getDanmakuType(text)
  })
  recordDanmaku(text)
  
  setTimeout(() => {
    const index = danmakuItems.value.findIndex(d => d.id === currentId)
    if (index !== -1) danmakuItems.value.splice(index, 1)
  }, speed * 1000 + 1500)
}

// === 结果触发：结算界面的情绪放大器 ===
function triggerOutcomeDanmaku(isBigWin, isDeal) {
  if (isBigWin && !isDeal) {
    // 开出大奖（No Deal成功）
    triggerBigWinDanmaku()
  } else if (!isBigWin && !isDeal) {
    // 开出小奖（No Deal失败）
    triggerSmallWinDanmaku()
  } else if (isDeal) {
    // 接受Deal
    triggerDealDanmaku()
  }
}

function triggerBigWinDanmaku() {
  // 瞬间触发20+条【造神者】弹幕，金色效果
  const count = 20 + Math.floor(Math.random() * 10)
  const pool = DM_GODMAKER
  
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const idx = Math.floor(Math.random() * pool.length)
      const text = pool[idx]
      const currentId = danmakuId++
      
      danmakuItems.value.push({
        id: currentId,
        text: text,
        color: '#ffd700', // 金色
        top: 10 + Math.random() * 180,
        speed: 3 + Math.random() * 4,
        danmakuType: 'godmaker'
      })
      recordDanmaku(text)
      
      setTimeout(() => {
        const index = danmakuItems.value.findIndex(d => d.id === currentId)
        if (index !== -1) danmakuItems.value.splice(index, 1)
      }, 5000)
    }, i * 80)
  }
}

function triggerSmallWinDanmaku() {
  // 瞬间触发10+条【乐子人】和【数学家】弹幕
  const count = 10 + Math.floor(Math.random() * 5)
  const pool = [...DM_TROLL, ...DM_MATHEMATICIAN]
  
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const idx = Math.floor(Math.random() * pool.length)
      const text = pool[idx]
      const currentId = danmakuId++
      
      const color = DM_TROLL.includes(text) ? '#8b8b8b' : '#6b7280' // 灰暗冷色
      
      danmakuItems.value.push({
        id: currentId,
        text: text,
        color: color,
        top: 10 + Math.random() * 180,
        speed: 4 + Math.random() * 3,
        danmakuType: getDanmakuType(text)
      })
      recordDanmaku(text)
      
      // 触发阿特拉斯处刑
      if (i === Math.floor(count / 2)) {
        triggerAtlasExecution()
      }
      
      setTimeout(() => {
        const index = danmakuItems.value.findIndex(d => d.id === currentId)
        if (index !== -1) danmakuItems.value.splice(index, 1)
      }, 5000)
    }, i * 120)
  }
}

function triggerDealDanmaku() {
  // 触发平行宇宙复盘弹幕
  const pool = [...DM_TROLL.slice(0, 3), ...DM_EX.slice(0, 2), ...DM_MATHEMATICIAN.slice(0, 2)]
  const count = 5 + Math.floor(Math.random() * 3)
  
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const idx = Math.floor(Math.random() * pool.length)
      const text = pool[idx]
      const currentId = danmakuId++
      
      let color = '#94a3b8'
      if (DM_TROLL.includes(text)) color = '#ff6b6b'
      else if (DM_EX.includes(text)) color = '#8b5cf6'
      else if (DM_MATHEMATICIAN.includes(text)) color = '#00f0ff'
      
      danmakuItems.value.push({
        id: currentId,
        text: text,
        color: color,
        top: 10 + Math.random() * 180,
        speed: 6 + Math.random() * 4,
        danmakuType: getDanmakuType(text)
      })
      recordDanmaku(text)
      
      setTimeout(() => {
        const index = danmakuItems.value.findIndex(d => d.id === currentId)
        if (index !== -1) danmakuItems.value.splice(index, 1)
      }, 6000)
    }, i * 200)
  }
}

// === 阿特拉斯处刑系统 ===
function triggerAtlasExecution() {
  // 找到最近的造神者弹幕（导致玩家失败的那条）
  const godmakerDanmaku = recentDanmakus.value.find(d => d.type === 'godmaker')
  
  if (godmakerDanmaku) {
    // 创建处刑弹幕 - 放大3倍、置顶、高亮
    const currentId = danmakuId++
    danmakuItems.value.push({
      id: currentId,
      text: godmakerDanmaku.text,
      color: '#ff0000',
      top: 20,
      speed: 0, // 不滚动
      danmakuType: 'godmaker',
      isExecution: true
    })
    
    // 2秒后碎裂效果
    setTimeout(() => {
      const index = danmakuItems.value.findIndex(d => d.id === currentId)
      if (index !== -1) {
        danmakuItems.value[index].shatter = true
      }
      
      // AI银行家发话
      bankerMessage.value = '你的信仰，不值一提。'
      bankerEmoji.value = '💀'
      bankerMood.value = 'panic'
      
      setTimeout(() => {
        const idx = danmakuItems.value.findIndex(d => d.id === currentId)
        if (idx !== -1) danmakuItems.value.splice(idx, 1)
      }, 1000)
    }, 2000)
  }
}

// === 【深渊协议】新手引导系统 ===

// 新手引导对话脚本
const TUTORIAL_DIALOGS = {
  phase0: [
    { speaker: 'atlas', text: '欢迎来到深渊资本清算中心。', delay: 2000 },
    { speaker: 'atlas', text: '你的信用已破产，生命权已抵押。', delay: 2000 },
    { speaker: 'atlas', text: '检测到视网膜追踪。', delay: 1500 },
    { speaker: 'atlas', text: '警告：你即将看到的"弹幕"，并非人类玩家的互动。', delay: 2500 },
    { speaker: 'atlas', text: '它们是资本家投放的情绪干扰剂。', delay: 2000 },
    { speaker: 'atlas', text: '会读取你的微表情与心率，精准投放你最渴望或最恐惧的信息。', delay: 3000 },
    { speaker: 'system', text: '【生存法则 01：在深渊中，不要相信任何有温度的文字。】', delay: 3000 }
  ],
  phase1: [
    { speaker: 'system', text: '【新手保护协议已激活】', delay: 1500 },
    { speaker: 'system', text: '【检测到情绪诱导，请保持理智】', delay: 2000 }
  ],
  phase1_punish: [
    { speaker: 'atlas', text: '正如你所见，你的信仰不值一提。', delay: 2000 },
    { speaker: 'system', text: '【新手保护协议生效 - 结算金额已修正】', delay: 1500 }
  ],
  phase2: [
    { speaker: 'atlas', text: '心率上升 15%，你在害怕？还是在愤怒？', delay: 2500 },
    { speaker: 'atlas', text: '你以为他们在为你欢呼？', delay: 2000 },
    { speaker: 'atlas', text: '这只是一段根据你当前负债率实时生成的代码。', delay: 3000 },
    { speaker: 'atlas', text: '当你的期望值低于 10% 时，系统会强制提高造神者的出现权重。', delay: 3500 },
    { speaker: 'system', text: '【生存法则 02：了解敌人的底牌，是你唯一的筹码。】', delay: 3000 }
  ],
  phase3: [
    { speaker: 'system', text: '【任务：连续5秒无视所有弹幕，点击Deal】', delay: 2000 }
  ],
  phase3_success: [
    { speaker: 'atlas', text: '你切断了他们的信号。', delay: 1500 },
    { speaker: 'atlas', text: '很好，你学会了在深渊中闭嘴。', delay: 2500 },
    { speaker: 'atlas', text: '但别高兴得太早。', delay: 1500 },
    { speaker: 'atlas', text: '当你习惯了无视他们，你的直觉就会重新占据大脑。', delay: 3000 },
    { speaker: 'atlas', text: '而直觉...正是阿特拉斯最喜欢收割的韭菜。', delay: 3000 },
    { speaker: 'system', text: '【新手协议结束。深渊，正式开启。】', delay: 2500 }
  ]
}

// 打字机效果文字
const terminalText = ref('')
const terminalLines = ref([])
let typewriterIndex = 0

// 开始新手引导
function startTutorial() {
  gameState.value = 'TUTORIAL'
  showStartScreen.value = false
  tutorialPhase.value = 0
  tutorialComplete.value = false
  
  // 播放开场动画
  playOpeningAnimation()
}

// 开场动画：黑屏、代码瀑布、打字机效果
function playOpeningAnimation() {
  const codeLines = [
    '> INITIALIZING ABYSS PROTOCOL...',
    '> NEURAL LINK ESTABLISHED',
    '> RETINAL SCAN COMPLETE',
    '> CREDIT SCORE: 0.0',
    '> VIABILITY: 73.4%',
    '> CONTRACT: LIFE_RENUNCIATION_v2.0',
    '> WELCOME TO THE ABYSS...'
  ]
  
  let lineIndex = 0
  
  const typeInterval = setInterval(() => {
    if (lineIndex >= codeLines.length) {
      clearInterval(typeInterval)
      // 代码瀑布结束，开始AI对话
      setTimeout(() => {
        terminalLines.value = []
        startTutorialDialog('phase0')
      }, 1000)
      return
    }
    
    const line = codeLines[lineIndex]
    typewriterIndex = 0
    terminalLines.value.push({ text: '', complete: false })
    
    const charInterval = setInterval(() => {
      if (typewriterIndex >= line.length) {
        clearInterval(charInterval)
        terminalLines.value[lineIndex].complete = true
        lineIndex++
      } else {
        terminalLines.value[lineIndex].text += line[typewriterIndex]
        typewriterIndex++
      }
    }, 50)
  }, 800)
}

// 播放新手引导对话
function startTutorialDialog(phase, onComplete) {
  const dialogs = TUTORIAL_DIALOGS[phase]
  if (!dialogs) {
    onComplete?.()
    return
  }
  let index = 0
  
  const playNext = () => {
    if (index >= dialogs.length) {
      if (onComplete) onComplete()
      else finishTutorialPhase()
      return
    }
    
    const dialog = dialogs[index]
    
    if (dialog.speaker === 'atlas') {
      bankerMessage.value = dialog.text
      bankerEmoji.value = '👁️'
      bankerMood.value = 'neutral'
    } else if (dialog.speaker === 'system') {
      terminalLines.value.push({ text: dialog.text, complete: true, isSystem: true })
    }
    
    index++
    setTimeout(playNext, dialog.delay)
  }
  
  playNext()
}

// 完成当前阶段
function finishTutorialPhase() {
  showResult.value = false
  showStartScreen.value = false
  if (tutorialPhase.value === 0) {
    tutorialPhase.value = 1
    noviceProtectionActive.value = true
    setTimeout(() => startNewGame(), 1500)
  } else if (tutorialPhase.value === 2) {
    tutorialDealClicked.value = false
    tutorialIgnoreTaskStarted.value = false
    setTimeout(() => startNewGame(), 1200)
  } else if (tutorialPhase.value === 3) {
    tutorialPhase.value = 4
    setTimeout(() => startNewGame(), 1500)
  }
}

// 新手期处刑机制
function triggerTutorialPunishment() {
  // 放大那条误导玩家的弹幕
  const godmakerDanmaku = recentDanmakus.value.find(d => d.type === 'godmaker')
  if (godmakerDanmaku) {
    const currentId = danmakuId++
    danmakuItems.value.push({
      id: currentId,
      text: godmakerDanmaku.text,
      color: '#ff0000',
      top: 50,
      speed: 0,
      danmakuType: 'godmaker',
      isExecution: true,
      tutorialPunish: true
    })
    
    setTimeout(() => {
      const index = danmakuItems.value.findIndex(d => d.id === currentId)
      if (index !== -1) {
        danmakuItems.value[index].shatter = true
      }
      
      // AI补刀
      setTimeout(() => {
        startTutorialDialog('phase1_punish', () => {
          tutorialPhase.value = 2
          startTutorialDialog('phase2')
        })
      }, 500)
    }, 2000)
  }
}

// 安全垫结算（仅修正金额，点评在 generatePostComment 之后写入）
function applyNoviceProtection() {
  if (!noviceProtectionActive.value && scriptedGame.value !== 1) return false
  const maxA = Math.max(...currentAmounts)
  if (winAmount.value >= maxA * 0.15) return false
  const floor = Math.max(40000, Math.round(maxA * 0.12))
  noviceProtectionAmount.value = floor
  winAmount.value = floor
  return true
}

function applyNoviceProtectionComment() {
  if (!noviceProtectionAmount.value) return
  bankerPostComment.value = `【新手保护协议】结算金额已修正为 £${formatNum(noviceProtectionAmount.value)}。这不是运气，是系统在喂你信心。`
  bankerPostEmoji.value = '🛡️'
  bankerPostMood.value = 'neutral'
}

function shouldTriggerTutorialPunish(maxA) {
  if (myBoxId.value === null) return false
  const myBox = boxes.value[myBoxId.value]
  if (!myBox) return false
  return offerAccepted.value && myBox.amount > winAmount.value * 1.2
}

function introAbyssDebt() {
  const seedDebt = Math.max(8000, Math.round(Math.max(winAmount.value, currentTicketCost.value) * 0.35))
  debt.value = seedDebt
  survivalPoints.value = 82
  redAlertLevel.value = 1
  bankerPostComment.value = `欢迎来到真正的深渊。系统已从本局收益中预扣 £${formatNum(seedDebt)} 作为信用借贷… 利息从下一局开始计算。`
  bankerPostEmoji.value = '👁️'
  bankerPostMood.value = 'mock'
}

function handleScriptedGameEnd() {
  if (scriptedGame.value === 0 || tutorialComplete.value) return
  applyNoviceProtection()
}

function handleScriptedGamePostFlow() {
  if (scriptedGame.value === 0 || tutorialComplete.value) return

  const maxA = Math.max(...currentAmounts)

  switch (scriptedGame.value) {
    case 1:
      noviceProtectionActive.value = false
      if (noviceProtectionAmount.value) applyNoviceProtectionComment()
      if (shouldTriggerTutorialPunish(maxA)) {
        triggerTutorialPunishment()
      } else {
        tutorialPhase.value = 2
        scriptedNextHook.value = '阿特拉斯正在分析你的行为模式…'
        setTimeout(() => startTutorialDialog('phase2'), 2200)
      }
      break
    case 2:
      tutorialPhase.value = 3
      scriptedNextHook.value = '复仇局已就绪 — 大奖在你手里，别听弹幕的。'
      spawnDanmaku('custom', 3, ['上把是运气，这把必翻盘！', '别怂，继续No Deal！', '大奖还在等你！'])
      break
    case 3:
      tutorialIgnoreTaskStarted.value = false
      isIgnoringDanmaku.value = false
      if (!offerAccepted.value && winAmount.value >= maxA * 0.35) {
        scriptedNextHook.value = '你学会了闭嘴… 但直觉才是下一关的陷阱。'
        setTimeout(() => startTutorialDialog('phase3_success'), 1800)
      } else if (shouldTriggerTutorialPunish(maxA)) {
        scriptedNextHook.value = '弹幕赢了。下一幕，债务会教你什么叫真正的代价。'
        triggerTutorialPunishment()
      }
      break
    case 4:
      introAbyssDebt()
      tutorialComplete.value = true
      isNewPlayer.value = false
      abyssProtocolActive.value = true
      scriptedNextHook.value = '深渊协议已永久激活。从此每一局，都是生存战。'
      saveTutorialState()
      break
  }
}

function saveTutorialState() {
  try {
    localStorage.setItem('dond_tutorial', JSON.stringify({
      tutorialComplete: tutorialComplete.value,
      tutorialPhase: tutorialPhase.value,
      isNewPlayer: isNewPlayer.value
    }))
  } catch (e) {}
}

function loadTutorialState() {
  try {
    const s = localStorage.getItem('dond_tutorial')
    if (!s) return
    const d = JSON.parse(s)
    if (d.tutorialComplete !== undefined) tutorialComplete.value = d.tutorialComplete
    if (d.tutorialPhase !== undefined) tutorialPhase.value = d.tutorialPhase
    if (d.isNewPlayer !== undefined) isNewPlayer.value = d.isNewPlayer
    if (d.tutorialComplete) abyssProtocolActive.value = true
  } catch (e) {}
}

// 反弹幕任务：连续5秒无视弹幕
function startIgnoreDanmakuTask() {
  isIgnoringDanmaku.value = true
  ignoreDanmakuCountdown.value = 5
  startTutorialDialog('phase3')
  
  const countdownInterval = setInterval(() => {
    if (!isIgnoringDanmaku.value) {
      clearInterval(countdownInterval)
      return
    }
    
    ignoreDanmakuCountdown.value--
    
    if (ignoreDanmakuCountdown.value <= 0) {
      clearInterval(countdownInterval)
      // 任务完成
      isIgnoringDanmaku.value = false
      finishIgnoreDanmakuTask()
    }
  }, 1000)
}

// 反弹幕任务完成
function finishIgnoreDanmakuTask() {
  // 弹幕消散效果
  danmakuItems.value.forEach(dm => {
    dm.shatter = true
  })
  
  setTimeout(() => {
    danmakuItems.value = []
    // 播放成功对话
    startTutorialDialog('phase3_success')
  }, 1000)
}

// 检测玩家是否在无视弹幕
let lastMouseMoveTime = 0
function trackDanmakuIgnoring() {
  if (!isIgnoringDanmaku.value) return
  
  const now = Date.now()
  if (now - lastMouseMoveTime > 500) {
    // 玩家有一段时间没动了，继续倒计时
    ignoreDanmakuCountdown.value = Math.min(5, ignoreDanmakuCountdown.value + 0.5)
  }
}

// === 强制回收动画 ===
function triggerForcedCollection() {
  gameState.value = 'COLLECTION'
  showResult.value = false
  vignetteActive.value = true
  
  // 播放催收警告动画
  setTimeout(() => {
    bankerMessage.value = '警告：生存点数归零'
    bankerEmoji.value = '🔴'
    bankerMood.value = 'panic'
  }, 500)
  
  setTimeout(() => {
    bankerMessage.value = '深渊资本执行《生命让渡协议》'
    bankerEmoji.value = '⚖️'
  }, 1500)
  
  setTimeout(() => {
    bankerMessage.value = '强制回收程序启动...'
    bankerEmoji.value = '💀'
    // 触发屏幕特效
    document.querySelector('.game-container')?.classList.add('collection-effect')
  }, 2500)
  
  setTimeout(() => {
    // 游戏结束，重置状态
    debt.value = 0
    survivalPoints.value = 100
    redAlertLevel.value = 0
    abyssProtocolActive.value = false
    isBankrupt.value = true
    showStartScreen.value = true
    // 清除特效
    document.querySelector('.game-container')?.classList.remove('collection-effect')
  }, 5000)
}

function bankerStampBarrage() {
  if (danmakuItems.value.length === 0) return
  const target = danmakuItems.value[Math.floor(Math.random() * danmakuItems.value.length)]
  bankerStampTarget.value = target.id
  playSound('stamp')
  setTimeout(() => { bankerStampTarget.value = -1 }, 2000)
}

// === 弹幕处刑系统 ===
const executingDanmaku = ref(null) // 当前正在处刑的弹幕

function executeDanmaku() {
  if (recentDanmakus.value.length === 0) return
  
  // 随机选择一条最近的弹幕进行处刑
  const target = recentDanmakus.value[Math.floor(Math.random() * recentDanmakus.value.length)]
  executingDanmaku.value = target
  
  // 银行家引用弹幕嘲讽
  bankerMessage.value = `正如这位观众所说："${target.text}"`
  bankerEmoji.value = '😏'
  bankerMood.value = 'angry'
  
  // 高亮并碎裂效果
  playSound('stamp')
  
  setTimeout(() => {
    executingDanmaku.value = null
    recentDanmakus.value = [] // 清空记录
  }, 3000)
}

// ===== 智能银行家台词系统 =====
function recentDealCount() {
  return rejectHistory.value.slice(-3).length > 0 ? 0 : (stats.value.totalAccepts || 0)
}
function consecutiveSmallOpened() {
  const opened = boxes.value.filter(b => b.opened && b.eliminated && !b.isMyBox)
  let c = 0; const threshold = Math.max(...currentAmounts) * 0.05
  for (let i = opened.length - 1; i >= 0; i--) { if (opened[i].amount <= threshold) c++; else break }
  return c
}

function generateBankerDialogue() {
  const remaining = remainingBoxes.value.length
  const maxAmt = Math.max(...currentAmounts)
  let highRemaining = 0
  for (const b of boxes.value) { if (!b.opened && !b.eliminated && b.amount >= maxAmt * 0.2) highRemaining++ }
  const highRatio = remaining > 0 ? highRemaining / remaining : 0
  let cat = 'neutral'

  if (remaining <= 2) {
    cat = 'endgame'
  } else if (round.value <= 2 && highRatio > 0.4) {
    cat = 'early_tempt'
  } else if (consecutiveSmallOpened() >= 3) {
    cat = 'pressure'
  } else if (highRatio > 0.6) {
    cat = 'bluff'
  } else if (consecutiveRejects.value >= 2 && highRatio > 0.3) {
    cat = 'mock_confident'
  } else if (rejectHistory.value.length >= 2 && boxes.value.filter(b=>b.opened&&b.eliminated).some(b=>b.amount>=maxAmt*0.3)) {
    cat = 'mock_greedy'
  } else if (stats.value.totalAccepts > stats.value.totalRejects && stats.value.totalGames > 2) {
    cat = 'mock_coward'
  }

  let line = ''
  switch(cat) {
    case 'early_tempt':
      line = pick([
        '这笔钱足够你买辆新车了。何必继续冒险？见好就收吧。',
        '你手里的盒子现在看起来像宝藏。但再开错一个，它就变成石头了。',
        '别被贪婪蒙蔽了双眼。根据我的计算，你手里的东西大概率不值这个价。'
      ]); bankerMood.value='neutral'; bankerEmoji.value='🧐'; break
    case 'pressure':
      line = pick([
        '幸运女神今天没站在你这边。拿上这点零花钱，体面地结束吧。',
        '你的盒子像个定时炸弹。聪明人知道什么时候该止损。',
        '我很同情你，但我是生意人。这是底线，再开一个我可能直接挂断电话。'
      ]); bankerMood.value='angry'; bankerEmoji.value='😡'; break
    case 'bluff':
      line = pick([
        '别以为运气好就能赢走我的钱。你手里的盒子未必是最大的。',
        '下一轮只要开出那个大奖，你的美梦就碎了。这个报价是你最后的安全网。',
        '你看起来像个赌徒，但我不觉得你有赌徒的胆量。敢不敢拒绝我？'
      ]); bankerMood.value='neutral'; bankerEmoji.value='😏'; break
    case 'endgame':
      line = pick([
        '一半是天堂，一半是地狱。你手里的盒子，是钥匙还是深渊的门票？选吧。',
        '我的耐心有限。10秒后报价作废。Deal... or No Deal？',
        '你一路走到这里，证明你不是胆小鬼。现在证明给我看。'
      ]); bankerMood.value='neutral'; bankerEmoji.value='🎭'; break
    case 'mock_confident':
      line = pick([
        '呵，拒绝？你的勇气值得赞赏，但你的数学是体育老师教的吗？',
        '贪婪是原罪。幸运女神不会一直对你抛媚眼，等会儿可别哭太大声。',
        '我见过太多自以为是的赌徒。拿着钱去买杯咖啡清醒一下吧。'
      ]); bankerMood.value='angry'; bankerEmoji.value='😤'; break
    case 'mock_greedy':
      line = pick([
        '看看你刚才错过了什么？现在你的盒子只够买我刚才报价的零头。后悔吗？',
        '你的操作实在太"精彩"了。这个报价是对你智商的补偿，赶紧拿钱走人。',
        '你刚才按No Deal的时候，手指是不是在发抖？别挣扎了。'
      ]); bankerMood.value='angry'; bankerEmoji.value='😈'; break
    case 'mock_coward':
      line = pick([
        '又来了？你玩游戏像个70岁老头过马路。你的胆子是被狗吃了吗？',
        '我甚至不需要看你的盒子，就知道你一定选Deal。你是来领低保的。',
        '拿着这笔钱去给猫买个罐头吧。大奖是留给有胆量的人的。'
      ]); bankerMood.value='neutral'; bankerEmoji.value='🙄'; break
    default:
      line = pick([
        '这是我的报价，你自己决定。','机会不等人哦...想好了再做决定。',
        '命运掌握在你手中...别让我失望。','数字不会说谎，但运气会。'
      ]); bankerMood.value='neutral'; bankerEmoji.value='🧐'
  }

  bankerBubbleText.value = line
  if (skipBankerDialog.value) {
    typewriterText.value = line
  } else {
    startTypewriter(line, 45)
  }
  if (bankerMood.value==='angry') bankerMessage.value='银行家发出挑战！'
  else if (bankerMood.value==='panic') bankerMessage.value='银行家开始慌了...'
  else bankerMessage.value='银行家来电...'
}

// 终极抉择台词
function generateFinalDialogue() {
  const line = pick([
    '这是最后报价。一半天堂，一半地狱。选吧。',
    '我的耐心有限。选错了一分钱没有。',
    '证明给我看，你不是只会靠运气的蠢货。',
    '你盯着盒子看了十秒。怎么，怕了？怕亲手把大奖送给我？',
    '选吧，做聪明的懦夫，还是破产的疯子？无论如何，我都已经赢了。'
  ])
  bankerBubbleText.value = line
  bankerEmoji.value = '🎭'
  bankerMessage.value = '终极抉择...'
  startTypewriter(line, 40)
  spawnDanmaku('final', 5)
}

const activeAmounts = computed(() => {
  if (gameState.value === 'IDLE' || gameState.value === 'SELECT_MY_BOX') {
    // 在开始界面或选择盒子阶段，显示当前选择场次的金额池
    return TICKET_TIERS[selectedTier.value].amounts
  }
  return currentAmounts
})

// 实际使用的金额列表
let currentAmounts = DEFAULT_AMOUNTS.slice()

const remainingCount = computed(() => {
  let c = 0
  for (let i = 0; i < boxes.value.length; i++) {
    if (!boxes.value[i].opened && !boxes.value[i].isMyBox) c++
  }
  return c
})

const remainingBoxes = computed(() => {
  const r = []
  for (let i = 0; i < boxes.value.length; i++) {
    if (!boxes.value[i].opened && !boxes.value[i].isMyBox) r.push(boxes.value[i])
  }
  return r
})

const boxesToOpenThisRound = computed(() => {
  const target = roundBoxCounts[Math.min(round.value - 1, roundBoxCounts.length - 1)] || 1
  return Math.max(0, target - boxesOpenedThisRound.value)
})

const gridCols = computed(() => {
  const n = boxes.value.length
  if (n <= 10) return 'grid-cols-3 sm:grid-cols-4 xl:grid-cols-5'
  return 'grid-cols-4 sm:grid-cols-5'
})

const vaultLevel = computed(() => stats.value.vaultLevel || 0)
const vaultPoints = computed(() => stats.value.vaultPoints || 0)
const vaultName = computed(() => VAULT_LEVELS[Math.min(vaultLevel.value, VAULT_LEVELS.length-1)].icon + ' ' + VAULT_LEVELS[Math.min(vaultLevel.value, VAULT_LEVELS.length-1)].name)
const nextVaultCost = computed(() => {
  const next = vaultLevel.value + 1
  return next < VAULT_LEVELS.length ? VAULT_LEVELS[next].cost : 999999
})

const unlockedSkins = computed(() => {
  const list = ALL_SKINS.filter(s => !s.fragmentCost && vaultLevel.value >= s.minVault)
  if ((stats.value.blackGoldFragments || 0) >= FRAGMENT_GOAL) {
    const dark = ALL_SKINS.find(s => s.id === 'dark_banker')
    if (dark) list.push(dark)
  }
  return list
})
const fragmentProgress = computed(() => Math.min(100, ((stats.value.blackGoldFragments || 0) / FRAGMENT_GOAL) * 100))
const fragmentsToUnlock = computed(() => Math.max(0, FRAGMENT_GOAL - (stats.value.blackGoldFragments || 0)))

const avgScore = computed(() => stats.value.totalGames > 0 ? Math.round(stats.value.totalScore / stats.value.totalGames) : 0)

const greedIndex = computed(() => {
  if (stats.value.totalGames === 0) return 0
  const avg = stats.value.totalRejects / Math.max(1, stats.value.totalGames)
  return Math.min(100, Math.round(avg / 4 * 100))
})

const luckScore = computed(() => {
  if (stats.value.totalGames === 0) return 0
  const avg = avgScore.value
  const maxPossible = 250000
  return Math.min(99, Math.round(avg / maxPossible * 100))
})

const stressResist = computed(() => {
  if (stats.value.totalGames === 0) return 0
  const acceptRate = stats.value.totalAccepts / Math.max(1, stats.value.totalGames)
  return Math.round((1 - acceptRate) * 100)
})

const allAchievements = computed(() => {
  return ACHIEVEMENT_DEFS.map(a => ({
    ...a,
    unlocked: stats.value.achievements.includes(a.id)
  }))
})

const totalAchievementCount = ACHIEVEMENT_DEFS.length

const scriptedActLabel = computed(() => SCRIPTED_ACT_LABELS[scriptedGame.value] || '')
const scriptedActLabelNext = computed(() => SCRIPTED_ACT_LABELS[(stats.value.totalGames || 0) + 1] || '')

// === 氛围样式 ===
const atmosphereStyle = computed(() => {
  if (gameState.value === 'IDLE' || gameState.value === 'SELECT_MY_BOX') return {}
  // 计算剩余大额比例
  let highCount = 0, highRemain = 0
  for (let i = 0; i < boxes.value.length; i++) {
    if (boxes.value[i].amount >= 10000) {
      highCount++
      if (!boxes.value[i].opened && !boxes.value[i].eliminated) highRemain++
    }
  }
  const ratio = highCount > 0 ? highRemain / highCount : 0
  // 大额多=暖色, 大额少=冷色
  if (ratio > 0.6) return { borderColor: 'rgba(255,215,0,0.25)' }
  if (ratio < 0.3) return { borderColor: 'rgba(220,38,38,0.3)' }
  return { borderColor: 'rgba(59,130,246,0.25)' }
})

// === Fisher-Yates 洗牌 ===
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp
  }
  return a
}

// === 初始化游戏 ===
function initGame() {
  // 使用门票档位的金额池
  const tier = TICKET_TIERS[selectedTier.value]
  currentAmounts = tier.amounts.slice()
  currentTicketCost.value = tier.cost

  const shuffled = shuffle(currentAmounts)
  const boxCount = shuffled.length

  // 新手引导系统（4幕心理陷阱剧本）
  const totalGames = stats.value.totalGames || 0
  scriptedGame.value = totalGames < 4 ? totalGames + 1 : 0
  tutorialIgnoreTaskStarted.value = false
  tutorialDealClicked.value = false
  scriptedNextHook.value = ''
  if (scriptedGame.value >= 1 && scriptedGame.value <= 4) {
    tutorialPhase.value = scriptedGame.value
    if (scriptedGame.value === 1) noviceProtectionActive.value = true
  }
  
  if (scriptedGame.value === 1) {
    // Act1 造神局：玩家盒子=70%分位，小奖排在前面被开掉，营造“运气爆棚”的假象
    const median = currentAmounts[Math.floor(currentAmounts.length * 0.7)]
    const idx = shuffled.indexOf(median)
    if (idx > 0) { const tmp = shuffled[0]; shuffled[0] = shuffled[idx]; shuffled[idx] = tmp }
    // 把最小的几个放在前面（容易被选到开掉）
    const sorted = [...currentAmounts].sort((a, b) => a - b)
    for (let k = 0; k < 3 && k + 1 < boxCount; k++) {
      const si = shuffled.indexOf(sorted[k])
      if (si > k + 1) { const t = shuffled[k + 1]; shuffled[k + 1] = shuffled[si]; shuffled[si] = t }
    }
  } else if (scriptedGame.value === 2) {
    // Act2 心碎局：玩家盒子=最小奖，大奖放在最后位置（永远不会被开，制造near-miss）
    const minAmt = currentAmounts[0]
    const maxAmt = currentAmounts[currentAmounts.length - 1]
    const minIdx = shuffled.indexOf(minAmt)
    const maxIdx = shuffled.indexOf(maxAmt)
    if (minIdx > 0) { const tmp = shuffled[0]; shuffled[0] = shuffled[minIdx]; shuffled[minIdx] = tmp }
    if (maxIdx >= 0 && maxIdx !== boxCount - 1) { const tmp = shuffled[boxCount - 1]; shuffled[boxCount - 1] = shuffled[maxIdx]; shuffled[maxIdx] = tmp }
  } else if (scriptedGame.value === 3) {
    // Act3 复仇局：玩家盒子=最大奖，小奖在前面
    const maxAmt = currentAmounts[currentAmounts.length - 1]
    const idx = shuffled.indexOf(maxAmt)
    if (idx > 0) { const tmp = shuffled[0]; shuffled[0] = shuffled[idx]; shuffled[idx] = tmp }
  } else if (scriptedGame.value === 4) {
    // Act4 深渊入局：玩家盒子=45%分位，前期开小奖制造波动
    const target = currentAmounts[Math.floor(currentAmounts.length * 0.45)]
    const idx = shuffled.indexOf(target)
    if (idx > 0) { const tmp = shuffled[0]; shuffled[0] = shuffled[idx]; shuffled[idx] = tmp }
    const sorted = [...currentAmounts].sort((a, b) => a - b)
    for (let k = 0; k < 2 && k + 1 < boxCount; k++) {
      const si = shuffled.indexOf(sorted[k])
      if (si > k + 1) { const t = shuffled[k + 1]; shuffled[k + 1] = shuffled[si]; shuffled[si] = t }
    }
  }

  // 连败保底 / 连胜截断（成瘾机制）
  streakCompensationActive.value = losingStreak.value >= 3 && scriptedGame.value === 0
  streakCutoffActive.value = winningStreak.value >= 3 && scriptedGame.value === 0
  if (streakCompensationActive.value) {
    const boost = currentAmounts[Math.floor(currentAmounts.length * 0.6)]
    const bi = shuffled.indexOf(boost)
    if (bi > 0) { const t = shuffled[0]; shuffled[0] = shuffled[bi]; shuffled[bi] = t }
  }
  if (streakCutoffActive.value) {
    const minAmt = currentAmounts[0]
    const mi = shuffled.indexOf(minAmt)
    if (mi > 0) { const t = shuffled[0]; shuffled[0] = shuffled[mi]; shuffled[mi] = t }
  }

  // 道具分配已移除 - 改用黑市商店系统

  boxes.value = shuffled.map((amt, i) => ({
    id: i,
    amount: amt,
    opened: false,
    isMyBox: false,
    animating: false,
    eliminated: false,
    peeked: false,
    animStage: ''
  }))

  if (streakCutoffActive.value) {
    bankerMessage.value = '连胜？呵… 今天我会格外「照顾」你。'
    bankerMood.value = 'angry'
    bankerEmoji.value = '😈'
  } else if (streakCompensationActive.value) {
    bankerMessage.value = '系统检测到连败… 本局暗中提高了你的运气。'
    bankerEmoji.value = '🍀'
  }

  gameState.value = 'SELECT_MY_BOX'
  myBoxId.value = null
  round.value = 0
  boxesOpenedThisRound.value = 0
  currentOffer.value = 0
  bestOffer.value = 0
  offerAccepted.value = false
  winAmount.value = 0
  showOfferModal.value = false
  showResult.value = false
  goldGlow.value = false
  vignetteActive.value = false
  animating.value = false
  bankerMessage.value = ''
  bankerEmoji.value = ''
  bankerMood.value = 'neutral'
  bankerBubbleText.value = ''
  offerTimer.value = 0
  finalTimer.value = 0
  doubleMode.value = false
  regretText.value = ''
  newAchievements.value = []
  earnedPoints.value = 0
  // 黑市重置
  purchasedCards.value = []
  cardPurchaseCounts.value = {}
  bmActiveEffects.value = []
  bmSideEffectLog.value = ''
  bmBankerDiscount.value = 0
  bmLowOfferCap.value = 0
  bmPoolPolluted.value = false
  bmOfferBoost.value = false
  bmInsiderTrading.value = false
  bmHighLeverage.value = false
  // 直觉值重置
  intuitionValue.value = 0
  intuitionFlash.value = false
  luckyBoxHint.value = -1
  boxLuckyGlow.value = -1
  hopeFlashActive.value = false
  warmFilterActive.value = false
  bankerReluctant.value = false
  parallelUniverseActive.value = false
  parallelUniverseWin.value = 0
  revengeButtonLabel.value = ''
  revengeAmount.value = 0
  consecutiveRejects.value = 0
  bigAmountsEliminated.value = 0
  rejectHistory.value = []
  noviceProtectionAmount.value = 0
  nearMissRevealActive.value = false
  nearMissRevealComplete.value = false
  nearMissRevealProgress.value = 0
  nearMissRevealText.value = ''
  fragmentsEarnedThisGame.value = 0
  provocationBadge.value = null
  boxLongPressHint.value = ''
  bankerWasAngryThisGame.value = false
  clearDanmaku(); clearTypewriter()
  screenShake.value = false; spotlightOn.value = false
  bankerStampTarget.value = -1; shatterEffect.value = false
  goldParticles.value = false; longPressProgress.value = 0
  myBoxRevealText.value = ''; bankerReactionText.value = ''
  myBoxRevealEmoji.value = ''; myBoxRevealColor.value = '#ffd700'
}

function startNewGame() {
  const totalGames = stats.value.totalGames || 0
  if (totalGames < 4 && !tutorialComplete.value) {
    selectedTier.value = 0
  }

  // 检查资金是否足够
  const tier = TICKET_TIERS[selectedTier.value]
  const cost = tier.cost
  if (wallet.value < cost) {
    // 资金不足
    isBankrupt.value = true
    showStartScreen.value = false
    return
  }

  // 扣除门票
  wallet.value -= cost
  currentTicketCost.value = cost

  showStartScreen.value = false
  showResult.value = false
  isBankrupt.value = false
  initGame()
  saveAll()
}

// === 盒子点击 ===
function showBoxLongPressHint() {
  boxLongPressHint.value = `👆 请长按箱子 ${BOX_OPEN_LONG_PRESS_MS / 1000} 秒开启`
  bankerMessage.value = `长按 ${BOX_OPEN_LONG_PRESS_MS / 1000} 秒确认开箱，松手无效`
  bankerEmoji.value = '👆'
  clearTimeout(boxHintTimer)
  boxHintTimer = setTimeout(() => { boxLongPressHint.value = '' }, 2500)
}

function onBoxClick(box) {
  if (animating.value) return
  if (box.opened || box.animating) return

  if (gameState.value === 'SELECT_MY_BOX') {
    selectMyBox(box)
  } else if (gameState.value === 'OPEN_BOXES') {
    if (box.isMyBox) return
    showBoxLongPressHint()
  }
}

function onBoxMouseLeave() {
  luckyBoxHint.value = -1
  cancelLongPressOpenBox()
}

function selectMyBox(box) {
  box.isMyBox = true
  myBoxId.value = box.id
  playSound('select')
  round.value = 1
  boxesOpenedThisRound.value = 0
  gameState.value = 'OPEN_BOXES'
  bankerMessage.value = '选好了？让我们开始吧...'
  bankerEmoji.value = '🧐'
  if (scriptedGame.value === 1) {
    boxLuckyGlow.value = box.id
    intuitionValue.value = 55
    setTimeout(() => {
      spawnDanmaku('custom', 3, ['直觉告诉我选对了！', '这个盒子有金光！', '欧皇附体！'])
    }, 800)
  } else if (scriptedGame.value === 2) {
    setTimeout(() => {
      spawnDanmaku('custom', 2, ['这局感觉不一样…', '选中间的一般没错'])
    }, 600)
  } else if (scriptedGame.value === 3) {
    setTimeout(() => {
      spawnDanmaku('custom', 3, ['大奖在你手里！', '别听银行家的！', 'No Deal到底！'])
    }, 500)
  } else if (scriptedGame.value === 4) {
    bankerMessage.value = '【深渊协议】本局收益将用于初始化信用负债。'
    bankerEmoji.value = '👁️'
  }
}

// 盒子悬停：心理暗示“幸运盒子”
function onBoxHover(box) {
  if (box.opened || box.eliminated) return
  luckyBoxHint.value = box.id
  if (scriptedGame.value === 1 && gameState.value === 'SELECT_MY_BOX') {
    boxLuckyGlow.value = box.id
    playSound('chime')
    return
  }
  if (intuitionValue.value > 40 && gameState.value === 'SELECT_MY_BOX') {
    const maxA = Math.max(...currentAmounts)
    if (box.amount >= maxA * 0.3) {
      boxLuckyGlow.value = box.id
      playSound('chime') // 清脆风铃声
    }
  }
}

// === 开箱（多阶段动画） ===
function finishBoxReveal(box) {
  box.animStage = 'reveal'
  box.opened = true
  box.eliminated = true
  boxesOpenedThisRound.value++

  const maxA = Math.max(...currentAmounts)
  const ratio = box.amount / maxA

  if (box.amount < maxA * 0.05) {
    intuitionValue.value = Math.min(100, intuitionValue.value + 15)
    intuitionFlash.value = true
    setTimeout(() => intuitionFlash.value = false, 600)
  } else if (box.amount < maxA * 0.2) {
    intuitionValue.value = Math.min(100, intuitionValue.value + 8)
  }

  if (box.amount >= 10000) bigAmountsEliminated.value++

  if (box.amount >= maxA * 0.95) {
    playSound('bigwin')
    goldGlow.value = true
    warmFilterActive.value = true
    bankerReluctant.value = true
    setTimeout(() => { goldGlow.value = false; warmFilterActive.value = false; bankerReluctant.value = false }, 2000)
  } else if (ratio >= 0.4 && ratio < 0.95) {
    // 伪大奖：中等偏上金额，夸张反馈制造“运气爆棚”错觉
    playSound('bigwin')
    goldGlow.value = true
    warmFilterActive.value = true
    pseudoBigWinActive.value = true
    spawnDanmaku('custom', 5, ['牛逼！！', '运气爆棚！', '欧皇附体！', '大奖在招手！', '神了神了！'])
    setTimeout(() => {
      goldGlow.value = false
      warmFilterActive.value = false
      pseudoBigWinActive.value = false
    }, 2500)
  } else if (box.amount < 100) {
    playSound('small')
    playSound('glass')
    vignetteActive.value = true
    hopeFlashActive.value = true
    intuitionValue.value = Math.max(0, intuitionValue.value - 10)
    setTimeout(() => { vignetteActive.value = false; hopeFlashActive.value = false }, 800)
  } else {
    playSound('reveal')
  }

  if (box.amount >= maxA * 0.5) updateEmotion(-20, '开出大奖')
  else if (box.amount >= maxA * 0.1) updateEmotion(-5, '开出中等奖')
  else updateEmotion(15, '开出小奖')

  generateBoxEvaluation(box.amount)
  if (box.amount >= maxA * 0.5) spawnDanmaku('big', 4)
  else if (box.amount >= maxA * 0.1) spawnDanmaku('mid', 3)
  else spawnDanmaku('small', 4)

  if (scriptedGame.value === 1 && box.amount < maxA * 0.1) {
    spawnDanmaku('custom', 3, ['运气真好！', '大奖肯定在手里', '直觉越来越准了！'])
    intuitionValue.value = Math.min(100, intuitionValue.value + 12)
  } else if (scriptedGame.value === 2 && box.amount === Math.min(...currentAmounts)) {
    spawnDanmaku('custom', 3, ['卖！绝对要卖！', '见好就收，这波赚翻', '别贪心，接受报价'])
  } else if (scriptedGame.value === 3 && box.amount < maxA * 0.1) {
    spawnDanmaku('custom', 2, ['别听他的！开他！', '上局亏的这局必须拿回来'])
  }

  const target = roundBoxCounts[Math.min(round.value - 1, roundBoxCounts.length - 1)] || 1
  const finishDelay = skipAnimation.value ? 50 : 800

  setTimeout(() => {
    box.animating = false
    animating.value = false
    if (boxesOpenedThisRound.value >= target) {
      if (remainingCount.value <= 1) {
        gameState.value = 'FINAL_SWAP'
        startFinalTimer()
      } else {
        makeBankerOffer()
      }
    }
  }, finishDelay)
}

function openBox(box) {
  if (animating.value || box.opened || box.animating) return
  animating.value = true
  box.animating = true
  playSound('select')
  bankerMessage.value = ''
  bankerEmoji.value = ''

  if (skipAnimation.value) {
    finishBoxReveal(box)
    return
  }

  box.animStage = 'shake'
  playSound('rumble')
  setTimeout(() => {
    box.animStage = 'glow'
    playSound('creak')
    setTimeout(() => finishBoxReveal(box), 1000)
  }, 800)
}

// === 情绪温度计系统 ===
function updateEmotion(delta, reason) {
  const prevValue = emotionValue.value
  emotionValue.value = Math.max(0, Math.min(100, emotionValue.value + delta))
  emotionTrend.value = emotionValue.value - prevValue
  
  // 根据情绪等级调整弹幕效果
  if (anxietyLevel.value === 'extreme') {
    // 极度焦虑：弹幕加速、字体变大、颜色变红
    danmakuSpeedMultiplier.value = 0.5 // 更快
    danmakuFontSize.value = 18
    danmakuColorIntensity.value = 1
  } else if (anxietyLevel.value === 'high') {
    danmakuSpeedMultiplier.value = 0.7
    danmakuFontSize.value = 16
    danmakuColorIntensity.value = 0.8
  } else {
    danmakuSpeedMultiplier.value = 1
    danmakuFontSize.value = 14
    danmakuColorIntensity.value = 0.6
  }
  
  if (reason) {
    console.log(`情绪变化: ${delta > 0 ? '↑' : '↓'}${Math.abs(delta)} - ${reason}`)
  }
}

const danmakuSpeedMultiplier = ref(1)
const danmakuFontSize = ref(14)
const danmakuColorIntensity = ref(0.6)

// === 银行家评价（每开一个箱子） ===
function generateBoxEvaluation(amount) {
  const maxAmt = Math.max(...currentAmounts)
  const ratio = amount / maxAmt

  if (ratio >= 0.5) {
    // 超级大奖
    const lines = [
      '天哪！这是超级大奖！你的手在发抖吗？',
      '这个金额...我需要重新计算报价了',
      '难以置信！场上还有大钱！',
      '这下你更有底气了吧...'
    ]
    bankerMood.value = 'panic'
    bankerMessage.value = lines[Math.floor(Math.random() * lines.length)]
    bankerEmoji.value = '😰'
  } else if (ratio >= 0.2) {
    // 中大奖
    const lines = [
      '不错的数字，但别高兴太早',
      '这还像回事，继续...',
      '看来场上还有看头',
      '嗯，这个金额还行'
    ]
    bankerMessage.value = lines[Math.floor(Math.random() * lines.length)]
    bankerEmoji.value = '🧐'
  } else if (ratio >= 0.05) {
    // 中等
    const lines = [
      '小意思，无关紧要',
      '这个数字对我的报价影响不大',
      '继续开，好戏在后头',
      '无足轻重的金额'
    ]
    bankerMessage.value = lines[Math.floor(Math.random() * lines.length)]
    bankerEmoji.value = '😏'
  } else {
    // 极小金额
    const lines = [
      '哈哈，又一个垃圾！继续吧',
      '这金额小得我都不想提',
      '好消息！大奖还在场上！',
      '你的运气似乎在变好呢...'
    ]
    bankerMessage.value = lines[Math.floor(Math.random() * lines.length)]
    bankerEmoji.value = '😈'
  }
  bankerBubbleText.value = ''
}

// === 黑市道具卡系统 ===
function getCardCost(card) {
  const count = cardPurchaseCounts.value[card.id] || 0
  return Math.floor(card.cost * Math.pow(1.5, count))
}
function canBuyCard(card) {
  const count = cardPurchaseCounts.value[card.id] || 0
  if (count >= card.maxBuy) return false
  if (wallet.value < getCardCost(card)) return false
  return card.condition()
}
function buyCard(card) {
  const cost = getCardCost(card)
  if (!canBuyCard(card)) return
  wallet.value -= cost
  cardPurchaseCounts.value[card.id] = (cardPurchaseCounts.value[card.id] || 0) + 1
  purchasedCards.value.push({ ...card, costPaid: cost })
  playSound('boom')
  screenShake.value = true
  setTimeout(() => screenShake.value = false, 500)
  activateCard(card)
  showBlackMarket.value = false
}
function activateCard(card) {
  switch (card.id) {
    case 'wiretap': {
      const remaining = boxes.value.filter(b => !b.opened && !b.eliminated)
      const amounts = remaining.map(b => b.amount).sort((a, b) => a - b)
      const low = amounts[0] || 0, high = amounts[amounts.length - 1] || 0
      bankerMessage.value = `窃听器工作：银行家底价范围 £${formatNum(low)} ~ £${formatNum(high)}`
      bankerEmoji.value = '📡'
      bmActiveEffects.value.push('窃听器已激活')
      playSound('powerup')
      break
    }
    case 'mind_disrupt': {
      bmOfferBoost.value = true
      bankerMessage.value = '精神干扰剂已注入… 银行家眼神迷离'
      bankerEmoji.value = '💉'
      bmActiveEffects.value.push('精神干扰已生效')
      playSound('powerup')
      break
    }
    case 'ultimatum': {
      const newOffer = Math.floor(currentOffer.value * 1.3)
      currentOffer.value = newOffer
      if (newOffer > bestOffer.value) bestOffer.value = newOffer
      bankerMessage.value = `最后通牒！银行家被迫报出 £${formatNum(newOffer)}`
      bankerEmoji.value = '📜'
      bankerMood.value = 'angry'
      bmActiveEffects.value.push('最后通牒已执行')
      playSound('boom')
      break
    }
    case 'xray': {
      const closed = boxes.value.filter(b => !b.opened && !b.eliminated && !b.isMyBox)
      const targets = shuffle(closed.slice()).slice(0, Math.min(2, closed.length))
      targets.forEach(b => { b.peeked = true })
      bmPoolPolluted.value = true
      const peekedAmts = targets.map(b => `£${formatNum(b.amount)}`).join(', ')
      bankerMessage.value = `透视底牌：你偷看了 ${peekedAmts}`
      bankerEmoji.value = '🔍'
      bmActiveEffects.value.push('透视底牌已使用')
      bmSideEffectLog.value = '大奖权重已降低，中等金额概率提升'
      playSound('powerup')
      break
    }
    case 'fate_reset': {
      const lastOpened = boxes.value.filter(b => b.eliminated && !b.isMyBox).slice(-1)
      if (lastOpened.length) {
        lastOpened.forEach(b => { b.opened = false; b.eliminated = false; b.animStage = '' })
        boxesOpenedThisRound.value = Math.max(0, boxesOpenedThisRound.value - 1)
      }
      bmPoolPolluted.value = true
      bankerMessage.value = '命运重置！本轮结果已作废… 重新抽取！'
      bankerEmoji.value = '⏪'
      bmActiveEffects.value.push('命运重置已执行')
      bmSideEffectLog.value = '奖池已被污染，大奖替换为中下金额'
      playSound('bomb')
      break
    }
    case 'blind_swap': {
      const closed = boxes.value.filter(b => !b.opened && !b.eliminated && !b.isMyBox)
      if (closed.length && myBoxId.value !== null) {
        const target = closed[Math.floor(Math.random() * closed.length)]
        const myBox = boxes.value[myBoxId.value]
        const tempAmt = myBox.amount
        myBox.amount = target.amount
        target.amount = tempAmt
        bmLowOfferCap.value = 2
        bankerMessage.value = `盲盒对赌！你的盒子已与#${target.id + 1}号盒子交换！`
        bankerEmoji.value = '🎲'
        bmActiveEffects.value.push('盲盒对赌已执行')
        bmSideEffectLog.value = '接下来2轮报价不超过£5,000'
      }
      playSound('powerup')
      break
    }
    case 'insider_trading': {
      // 内幕交易：降低随机池方差，增加系统审查风险
      bmInsiderTrading.value = true
      bmActiveEffects.value.push('内幕交易已激活')
      bankerMessage.value = '内幕交易已完成… 奖金池方差已降低'
      bankerEmoji.value = '💰'
      bmSideEffectLog.value = '系统审查风险+50%，失败则本局奖金减半'
      playSound('powerup')
      break
    }
    case 'debt_restructuring': {
      // 债务重组：清空当前债务，下一局利息翻倍
      const clearedDebt = debt.value
      debt.value = 0
      debtMultiplier.value *= 2
      bmActiveEffects.value.push('债务重组已完成')
      bankerMessage.value = `债务重组完成！已清空 £${formatNum(clearedDebt)} 债务`
      bankerEmoji.value = '📊'
      bmSideEffectLog.value = '下一局基础利息永久翻倍'
      playSound('powerup')
      break
    }
    case 'high_leverage': {
      // 高杠杆期权：赢了抹平债务，输了强制平仓
      bmHighLeverage.value = true
      bmActiveEffects.value.push('高杠杆期权已激活')
      bankerMessage.value = '高杠杆期权已生效… 赢则债务清零，输则强制平仓'
      bankerEmoji.value = '⚡'
      bmSideEffectLog.value = '赢了抹平债务，输了生存点数-30'
      playSound('powerup')
      break
    }
  }
}

// === 银行家报价 ===
function makeBankerOffer() {
  gameState.value = 'BANKER_OFFER'

  // 计算报价
  let sum = 0, count = 0
  for (let i = 0; i < boxes.value.length; i++) {
    const b = boxes.value[i]
    if (!b.opened && !b.eliminated) { sum += b.amount; count++ }
  }
  if (count === 0) count = 1
  const avg = sum / count

  // 风险系数（固定难度）
  let riskBase = 0.5 + round.value * 0.05
  riskBase = Math.min(riskBase, 0.9)

  // 新手剧本调整（4幕心理陷阱）
  if (scriptedGame.value === 1) {
    riskBase = Math.min(riskBase, 0.42)
  } else if (scriptedGame.value === 2) {
    // Act2 心碎局：银行家给出极具诱惑的报价（实际玩家盒子是小奖）
    if (round.value >= 4) {
      riskBase = Math.max(riskBase, 0.75) // 后期报价很诱人，诱使玩家接受
    } else {
      riskBase *= 0.85 // 前期报价中等，营造“大奖还在”的假象
    }
  } else if (scriptedGame.value === 3) {
    riskBase *= 0.35
  } else if (scriptedGame.value === 4) {
    if (round.value <= 2) riskBase *= 0.88
    else riskBase = Math.max(riskBase, 0.72)
  }

  // 连败保底
  if (losingStreak.value >= 3) riskBase *= 1.2
  if (streakCompensationActive.value) {
    riskBase = Math.max(riskBase, 0.78)
    bankerBubbleText.value = bankerBubbleText.value || '看你最近手气不好… 这次我给你个安慰价，别说我狠心。'
  }
  // 连胜截断
  if (winningStreak.value >= 3) riskBase *= 0.7
  if (streakCutoffActive.value) {
    riskBase = Math.min(riskBase * 0.5, 0.42)
    bankerMood.value = 'angry'
    bankerBubbleText.value = pick([
      '你的连胜到此为止。拒绝吧，你迟早会后悔。',
      '还想赢？做梦。这次报价已经够给你面子了。',
      '贪心的人，最后都会一无所有。'
    ])
  }

  // 银行家情绪调整
  updateBankerMood()

  if (bankerMood.value === 'angry') {
    riskBase *= 0.75 // 愤怒时压低
  } else if (bankerMood.value === 'panic') {
    riskBase *= 1.15 // 恐慌时提高
  }

  // 黑市道具效果
  if (bmOfferBoost.value) {
    riskBase *= 1.3
    bmOfferBoost.value = false
    bmBankerDiscount.value = 2 // 副作用：识破后2轮报价缩水
  }
  if (bmBankerDiscount.value > 0) {
    riskBase *= 0.7
    bmBankerDiscount.value--
  }
  if (bmLowOfferCap.value > 0) {
    bmLowOfferCap.value--
  }
  if (bmPoolPolluted.value) {
    riskBase *= 0.85
  }

  // 随机扰动 ±5%
  const noise = 1 + (Math.random() * 0.1 - 0.05)
  // 黑市低报价上限
  let offer = Math.round(avg * riskBase * noise)
  if (bmLowOfferCap.value > 0) offer = Math.min(offer, 5000)

  currentOffer.value = offer
  if (offer > bestOffer.value) bestOffer.value = offer

  // 生成银行家文案
  generateBankerDialogue()

  playSound('phone')
  setTimeout(() => {
    showOfferModal.value = true
    if (scriptedGame.value === 3 && round.value === 1 && !tutorialIgnoreTaskStarted.value) {
      tutorialIgnoreTaskStarted.value = true
      setTimeout(() => {
        startIgnoreDanmakuTask()
        spawnDanmaku('custom', 4, ['卖！现在就卖！', '见好就收！', '别贪了接受报价！', 'Deal！Deal！Deal！'])
      }, 600)
    }
    if (remainingCount.value <= 3 && round.value >= 4) {
      startOfferTimer()
    }
  }, 800)
}

function updateBankerMood() {
  if (consecutiveRejects.value >= 3) {
    bankerMood.value = 'angry'
  } else if (bigAmountsEliminated.value >= 3 && remainingCount.value > 2) {
    bankerMood.value = 'panic'
  } else if (streakCutoffActive.value) {
    bankerMood.value = 'angry'
  } else {
    bankerMood.value = 'neutral'
  }
  if (bankerMood.value === 'angry') bankerWasAngryThisGame.value = true
}

// === 限时计时器 ===
let offerTimerInterval = null
let finalTimerInterval = null

function startOfferTimer() {
  offerTimer.value = 10
  clearInterval(offerTimerInterval)
  offerTimerInterval = setInterval(() => {
    offerTimer.value--
    playSound('tick')
    if (offerTimer.value <= 0) {
      clearInterval(offerTimerInterval)
      // 超时：强制拒绝
      showOfferModal.value = false
      bankerMessage.value = '时间到！报价作废！'
      bankerEmoji.value = '😤'
      round.value++
      boxesOpenedThisRound.value = 0
      if (remainingCount.value <= 1) {
        gameState.value = 'FINAL_SWAP'
        startFinalTimer()
      } else {
        gameState.value = 'OPEN_BOXES'
      }
    }
  }, 1000)
}

function startFinalTimer() {
  generateFinalDialogue()
  spotlightOn.value = true
  finalTimer.value = 15
  clearInterval(finalTimerInterval)
  finalTimerInterval = setInterval(() => {
    finalTimer.value--
    playSound('tick')
    if (finalTimer.value <= 0) {
      clearInterval(finalTimerInterval)
      // 超时：随机选择交换或保留
      if (Math.random() > 0.5) {
        doSwap()
      } else {
        noSwap()
      }
    }
  }, 1000)
}

function acceptOffer() {
  if (scriptedGame.value === 3 && tutorialPhase.value === 3) {
    tutorialDealClicked.value = true
    isIgnoringDanmaku.value = false
  }
  clearInterval(offerTimerInterval)
  showOfferModal.value = false
  offerAccepted.value = true
  winAmount.value = currentOffer.value
  clearTypewriter()
  goldParticles.value = true
  playSound('cashregister')
  startTypewriter('落袋为安... 让我看看你的盒子里到底是什么', 50)
  spawnDanmaku('deal', 5)
  updateEmotion(-15, '接受报价，落袋为安')
  setTimeout(() => { goldParticles.value = false }, 3000)
  endGame()
}

function rejectOffer() {
  clearInterval(offerTimerInterval)
  showOfferModal.value = false
  consecutiveRejects.value++
  rejectHistory.value.push(currentOffer.value)
  stats.value.totalRejects++
  longPressProgress.value = 0
  // No Deal特效
  screenShake.value = true
  shatterEffect.value = true
  setTimeout(() => { screenShake.value = false }, 600)
  setTimeout(() => { shatterEffect.value = false }, 1200)
  playSound('boom')
  startTypewriter('好，那就让我们看看你的底牌！', 40)
  spawnDanmaku('nodeal', 5)
  bankerStampBarrage()
  updateEmotion(10, '拒绝报价，继续冒险')
  round.value++
  boxesOpenedThisRound.value = 0

  if (remainingCount.value <= 1) {
    gameState.value = 'FINAL_SWAP'
    startFinalTimer()
  } else {
    gameState.value = 'OPEN_BOXES'
  }
}

// === 终极交换 ===
function doSwap() {
  clearInterval(finalTimerInterval)
  const remaining = remainingBoxes.value
  if (remaining.length >= 1) {
    // 随机选一个交换（如果多个）
    const target = remaining.length === 1 ? remaining[0] : remaining[Math.floor(Math.random() * remaining.length)]
    boxes.value[myBoxId.value].isMyBox = false
    myBoxId.value = target.id
    target.isMyBox = true
  }
  revealMyBox()
}

function noSwap() {
  clearInterval(finalTimerInterval)
  revealMyBox()
}

function doubleOrNothing() {
  clearInterval(finalTimerInterval)
  doubleMode.value = true
  const myBox = boxes.value[myBoxId.value]
  const maxInPool = Math.max(...currentAmounts)
  myBox.opened = true
  if (myBox.amount >= maxInPool * 0.4) {
    // 大奖 → 翻倍
    winAmount.value = myBox.amount * 2
    playSound('bigwin')
    goldGlow.value = true
    setTimeout(() => goldGlow.value = false, 2000)
  } else {
    // 小奖 → 清零
    winAmount.value = 0
    playSound('small')
  }
  endGame()
}

function revealMyBox() {
  const myBox = boxes.value[myBoxId.value]
  myBox.opened = true
  winAmount.value = myBox.amount
  spotlightOn.value = false
  if (myBox.amount >= 10000) {
    playSound('bigwin')
    goldGlow.value = true
    goldParticles.value = true
    spawnDanmaku('big', 5)
    setTimeout(() => { goldGlow.value = false; goldParticles.value = false }, 2500)
  } else {
    playSound('reveal')
    spawnDanmaku('small', 3)
  }
  endGame()
}

// === 结算 ===
function endGame() {
  gameState.value = 'GAME_OVER'
  showOfferModal.value = false

  setTimeout(() => {
    for (let i = 0; i < boxes.value.length; i++) {
      boxes.value[i].opened = true
    }
  }, 500)

  // 计算后悔药
  calculateRegret()

  // 四幕成瘾机制结算（须在奖金入账前，含新手保护垫）
  handleScriptedGameEnd()
  processAddictionRewards()

  // 终极审判：Deal后揭示盒子内容
  if (offerAccepted.value && myBoxId.value !== null) {
    const myBox = boxes.value[myBoxId.value]
    const boxAmt = myBox ? myBox.amount : 0
    if (boxAmt > winAmount.value * 1.5) {
      myBoxRevealText.value = `你的盒子里竟然有 £${formatNum(boxAmt)}！你卖早了...`
      myBoxRevealEmoji.value = '😱💔'
      myBoxRevealStyle.value = { background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)' }
      myBoxRevealColor.value = '#ff6b6b'
      bankerReactionText.value = '银行家得意地笑了：“谢谢你的礼物，朋友。”'
      // 弹幕处刑：玩家卖早了，被银行家嘲讽
      setTimeout(() => executeDanmaku(), 1500)
    } else if (boxAmt < winAmount.value * 0.5) {
      myBoxRevealText.value = `你的盒子只有 £${formatNum(boxAmt)}！明智的止损！`
      myBoxRevealEmoji.value = '😌✨'
      myBoxRevealStyle.value = { background: 'rgba(0,255,0,0.08)', border: '1px solid rgba(0,255,0,0.2)' }
      myBoxRevealColor.value = '#4ade80'
      bankerReactionText.value = '银行家不甘心地晬了晬嘴：“算你聪明...”'
    } else {
      myBoxRevealText.value = `你的盒子价值 £${formatNum(boxAmt)}，差距不大`
      myBoxRevealEmoji.value = '🤝'
      myBoxRevealStyle.value = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
      myBoxRevealColor.value = '#94a3b8'
      bankerReactionText.value = '银行家微微点头：“一笔公平的交易。”'
    }
  } else if (!offerAccepted.value && round.value >= 6) {
    // 玩家拒绝了所有报价，最后开盒是小奖
    const myBox = boxes.value[myBoxId.value]
    const boxAmt = myBox ? myBox.amount : 0
    const maxA = Math.max(...currentAmounts)
    if (boxAmt < maxA * 0.2) {
      // 弹幕处刑：玩家坚持到最后但开出小奖
      setTimeout(() => executeDanmaku(), 1500)
    }
  }

  // 奖金加入钱包
  wallet.value += winAmount.value
  stats.value.wallet = wallet.value

  // === 金融衍生品道具结算效果 ===
  
  // 高杠杆期权：赢了抹平债务，输了强制平仓
  if (bmHighLeverage.value) {
    if (winAmount.value > 0 && debt.value > 0) {
      // 赢了，抹平债务
      const cleared = debt.value
      debt.value = 0
      wallet.value -= cleared
      bankerMessage.value = `高杠杆期权生效！债务已清零 £${formatNum(cleared)}`
      spawnDanmaku('big', 3)
    } else {
      // 输了，强制平仓
      survivalPoints.value = Math.max(0, survivalPoints.value - 30)
      bankerMessage.value = '高杠杆期权失败！强制平仓，生存点数-30'
      if (survivalPoints.value <= 0) {
        triggerForcedCollection()
        return
      }
    }
  }
  
  // 内幕交易：系统审查风险50%，失败则奖金减半
  if (bmInsiderTrading.value && Math.random() < 0.5) {
    const halved = Math.floor(winAmount.value / 2)
    wallet.value -= halved
    bankerMessage.value = `系统审查发现异常！奖金减半，扣除 £${formatNum(halved)}`
  }

  // === 深渊债务系统 ===
  if (abyssProtocolActive.value) {
    // 计算债务复利
    if (debt.value > 0) {
      const interest = debt.value * interestRate.value * debtMultiplier.value
      debt.value += Math.round(interest)
      debt.value = Math.max(debt.value, 0)
    }
    
    // 用奖金偿还债务
    if (winAmount.value > 0 && debt.value > 0) {
      const paid = Math.min(winAmount.value, debt.value)
      debt.value -= paid
      wallet.value -= paid
      if (debt.value <= 0) {
        // 债务清零！
        debt.value = 0
        spawnDanmaku('big', 5) // 庆祝弹幕
      }
    }
    
    // 更新生存点数
    if (debt.value > 0) {
      const debtPressure = Math.min(debt.value / 100000, 1)
      survivalPoints.value = Math.max(0, survivalPoints.value - debtPressure * 10)
    } else {
      // 无债务时恢复生存点数
      survivalPoints.value = Math.min(100, survivalPoints.value + 5)
    }
    
    // 更新红色警戒等级
    if (survivalPoints.value <= 20) {
      redAlertLevel.value = 3
    } else if (survivalPoints.value <= 40) {
      redAlertLevel.value = 2
    } else if (survivalPoints.value <= 60) {
      redAlertLevel.value = 1
    } else {
      redAlertLevel.value = 0
    }
    
    // 检查强制回收
    if (survivalPoints.value <= 0) {
      triggerForcedCollection()
      return
    }
  }

  // 金库点数
  earnedPoints.value = Math.round(winAmount.value / 100)
  stats.value.vaultPoints = (stats.value.vaultPoints || 0) + earnedPoints.value

  // 连胜/连败追踪
  const maxA = Math.max(...currentAmounts)
  if (winAmount.value >= maxA * 0.1) { winningStreak.value++; losingStreak.value = 0 }
  else { losingStreak.value++; winningStreak.value = 0 }

  // 更新统计
  stats.value.totalGames++
  stats.value.totalScore += winAmount.value
  if (offerAccepted.value) stats.value.totalAccepts++
  if (offerAccepted.value && round.value === 1) stats.value.totalEarlyAccepts++
  if (winAmount.value > stats.value.bestScore) stats.value.bestScore = winAmount.value
  stats.value.losingStreak = losingStreak.value
  stats.value.winningStreak = winningStreak.value

  // 游戏数据
  const gameData = {
    winAmount: winAmount.value,
    maxAmount: Math.max(...currentAmounts),
    round: round.value,
    rejectedAll: !offerAccepted.value && round.value >= 6 && !doubleMode.value,
    acceptedRound1: offerAccepted.value && round.value === 1,
    doubleWin: doubleMode.value && winAmount.value > 0,
    comebackWin: false,
    bmCardsUsed: purchasedCards.value.length || 0,
    bmTotalCards: (stats.value.bmTotalCards || 0) + purchasedCards.value.length,
    totalGames: stats.value.totalGames,
    nearZeroWin: winAmount.value <= Math.max(...currentAmounts) * 0.01,
    defeatedAngryBanker: bankerWasAngryThisGame.value && winAmount.value >= Math.max(...currentAmounts) * 0.25,
    blackGoldFragments: stats.value.blackGoldFragments || 0
  }

  // 成就检测
  const prevAchs = stats.value.achievements.slice()
  for (const def of ACHIEVEMENT_DEFS) {
    if (!stats.value.achievements.includes(def.id) && def.check(gameData)) {
      stats.value.achievements.push(def.id)
    }
  }
  newAchievements.value = stats.value.achievements
    .filter(a => !prevAchs.includes(a))
    .map(id => {
      const def = ACHIEVEMENT_DEFS.find(d => d.id === id)
      return def ? def.icon + ' ' + def.name : id
    })

  saveAll()

  // 平行宇宙计算：如果接受最高报价能赢多少
  if (!offerAccepted.value && bestOffer.value > winAmount.value * 1.5) {
    parallelUniverseActive.value = true
    parallelUniverseWin.value = bestOffer.value
    revengeAmount.value = bestOffer.value - winAmount.value
    revengeButtonLabel.value = `🔥 赢回 £${formatNum(revengeAmount.value)}`
  } else if (offerAccepted.value && myBoxId.value !== null) {
    const myBox = boxes.value[myBoxId.value]
    if (myBox && myBox.amount > winAmount.value * 1.5) {
      parallelUniverseActive.value = true
      parallelUniverseWin.value = myBox.amount
      revengeAmount.value = myBox.amount - winAmount.value
      revengeButtonLabel.value = `🔥 赢回 £${formatNum(revengeAmount.value)}`
    }
  }

  // 直觉值消耗：大奖开出时直觉值归零（“运气用尽了”）
  if (winAmount.value >= Math.max(...currentAmounts) * 0.5) {
    intuitionValue.value = 0
  }

  // 生成结算数据
  generatePostComment()
  handleScriptedGamePostFlow()
  generateGameTags()
  generateFinalDanmaku()
  generateUnlockHint()
  resultTransition.value = true
  setTimeout(() => { resultTransition.value = false }, 600)
  // 缓慢揭示盒子（Near Miss效果）
  setTimeout(() => slowRevealBoxes(), 800)
  showResult.value = true
  setTimeout(() => startSlotAnimation(winAmount.value), 300)

  // 检查是否破产
  const cheapest = TICKET_TIERS[0].cost
  if (wallet.value < cheapest) {
    isBankrupt.value = true
    spawnDanmaku('custom', 4, ['就这？不敢玩就别玩了', '胆小鬼，连10%的概率都不敢赌', '破产了？下一局翻本！'])
  }

  // 绘制雷达图
  nextTick(() => drawRadar())
}

function calculateRegret() {
  if (offerAccepted.value) {
    // 如果接受了报价，看看自己盒子的实际金额
    const myBox = boxes.value[myBoxId.value]
    if (myBox) {
      if (myBox.amount > winAmount.value * 1.5) {
        regretText.value = `😱 你错失了£${formatNum(myBox.amount)}！你的盒子价值远超报价...`
        playSound('sigh')
      } else if (myBox.amount < winAmount.value * 0.5) {
        regretText.value = `😌 明智的止损！你的盒子只有£${formatNum(myBox.amount)}，你保住了£${formatNum(winAmount.value)}`
      } else {
        regretText.value = `🤔 你的盒子实际价值£${formatNum(myBox.amount)}，差距不大`
      }
    }
  } else if (!doubleMode.value) {
    // 没接受报价，打开自己盒子
    const myBox = boxes.value[myBoxId.value]
    if (myBox && bestOffer.value > winAmount.value * 2) {
      regretText.value = `😰 如果早点接受报价就好了...最高报价是£${formatNum(bestOffer.value)}`
    }
  }
}

function upgradeVault() {
  const next = vaultLevel.value + 1
  if (next < VAULT_LEVELS.length && vaultPoints.value >= VAULT_LEVELS[next].cost) {
    stats.value.vaultPoints -= VAULT_LEVELS[next].cost
    stats.value.vaultLevel = next
    saveAll()
  }
}

// === 音效系统 ===
let audioCtx = null
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

function playSound(type) {
  if (!soundOn.value) return
  try {
    const ctx = getAudioCtx()
    if (type === 'select') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 800; o.type = 'sine'
      g.gain.setValueAtTime(0.12, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.08)
    } else if (type === 'small') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 180; o.type = 'sine'
      g.gain.setValueAtTime(0.1, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.5)
    } else if (type === 'reveal') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 500; o.type = 'triangle'
      g.gain.setValueAtTime(0.1, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.25)
    } else if (type === 'bigwin') {
      for (let i = 0; i < 5; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = 600 + i * 200; o.type = 'sine'
        const t = ctx.currentTime + i * 0.1
        g.gain.setValueAtTime(0.12, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
        o.start(t); o.stop(t + 0.18)
      }
    } else if (type === 'phone') {
      for (let i = 0; i < 6; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = i % 2 === 0 ? 440 : 480; o.type = 'sine'
        const t = ctx.currentTime + i * 0.13
        g.gain.setValueAtTime(0.08, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
        o.start(t); o.stop(t + 0.1)
      }
    } else if (type === 'tick') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 1000; o.type = 'square'
      g.gain.setValueAtTime(0.05, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.03)
    } else if (type === 'powerup') {
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = 400 + i * 300; o.type = 'sine'
        const t = ctx.currentTime + i * 0.08
        g.gain.setValueAtTime(0.1, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
        o.start(t); o.stop(t + 0.15)
      }
    } else if (type === 'bomb') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 80; o.type = 'sawtooth'
      g.gain.setValueAtTime(0.15, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.6)
    } else if (type === 'sigh') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 300; o.type = 'sine'
      o.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.5)
      g.gain.setValueAtTime(0.08, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.5)
    } else if (type === 'rumble') {
      // 摇晃低沉隆隆声
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 60; o.type = 'sawtooth'
      o.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4)
      o.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.8)
      g.gain.setValueAtTime(0.1, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.8)
    } else if (type === 'creak') {
      // 开盖咬吱声
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 200; o.type = 'square'
      o.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3)
      o.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.6)
      g.gain.setValueAtTime(0.06, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.6)
    } else if (type === 'boom') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 40; o.type = 'sawtooth'
      g.gain.setValueAtTime(0.2, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.8)
    } else if (type === 'cashregister') {
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = 1200 + i * 400; o.type = 'sine'
        const t = ctx.currentTime + i * 0.12
        g.gain.setValueAtTime(0.12, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
        o.start(t); o.stop(t + 0.2)
      }
    } else if (type === 'stamp') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 150; o.type = 'square'
      g.gain.setValueAtTime(0.15, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.2)
    } else if (type === 'coin') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 2000; o.type = 'sine'
      g.gain.setValueAtTime(0.08, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15)
    } else if (type === 'chime') {
      // 清脆风铃声：心理暗示“好运”
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 1800; o.type = 'sine'
      g.gain.setValueAtTime(0.06, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3)
      const o2 = ctx.createOscillator(), g2 = ctx.createGain()
      o2.connect(g2); g2.connect(ctx.destination)
      o2.frequency.value = 2400; o2.type = 'sine'
      g2.gain.setValueAtTime(0.04, ctx.currentTime + 0.1)
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o2.start(ctx.currentTime + 0.1); o2.stop(ctx.currentTime + 0.4)
    } else if (type === 'glass') {
      // 玻璃碎裂声：希望破碎效果
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 3000; o.type = 'square'
      o.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3)
      g.gain.setValueAtTime(0.1, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3)
    }
  } catch (e) {}
}

function toggleSound() {
  soundOn.value = !soundOn.value
  saveSettings()
}

// === 长按交互 ===
function startLongPress(onComplete, durationMs, boxId = -1) {
  cancelLongPress()
  longPressProgress.value = 0
  longPressBoxId.value = boxId
  const step = 100 / (durationMs / LONG_PRESS_TICK_MS)
  longPressTimer = setInterval(() => {
    longPressProgress.value = Math.min(100, longPressProgress.value + step)
    if (longPressProgress.value >= 100) {
      cancelLongPress()
      onComplete()
    }
  }, LONG_PRESS_TICK_MS)
}

function cancelLongPress() {
  clearInterval(longPressTimer)
  longPressTimer = null
  longPressProgress.value = 0
  longPressBoxId.value = -1
}

function startLongPressReject() {
  startLongPress(rejectOffer, NO_DEAL_LONG_PRESS_MS)
}

function cancelLongPressReject() {
  cancelLongPress()
}

function startLongPressOpenBox(box) {
  if (animating.value || box.opened || box.animating) return
  if (gameState.value !== 'OPEN_BOXES' || box.isMyBox) return
  boxLongPressHint.value = ''
  startLongPress(() => openBox(box), BOX_OPEN_LONG_PRESS_MS, box.id)
}

function cancelLongPressOpenBox() {
  cancelLongPress()
}

// === 特效辅助 ===
function shardStyle(i) {
  const angle = (i / 12) * 360
  return { transform: `rotate(${angle}deg) translateY(-30px)`, animationDelay: `${i * 0.03}s` }
}
function particleStyle(i) {
  return {
    left: `${5 + Math.random() * 90}%`, top: `${10 + Math.random() * 80}%`,
    width: `${4 + Math.random() * 8}px`, height: `${4 + Math.random() * 8}px`,
    animationDelay: `${Math.random() * 1.5}s`, animationDuration: `${1.5 + Math.random() * 2}s`
  }
}

// === 雷达图绘制 ===
function drawRadar() {
  const canvas = radarCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height
  const cx = w / 2, cy = h / 2, r = 70

  ctx.clearRect(0, 0, w, h)

  const labels = ['贪婪', '运气', '抗压', '果断', '冒险']
  const values = [
    greedIndex.value / 100,
    luckScore.value / 100,
    stressResist.value / 100,
    stats.value.totalAccepts / Math.max(1, stats.value.totalGames),
    Math.min(1, stats.value.totalRejects / Math.max(1, stats.value.totalGames * 4))
  ]
  const n = labels.length

  // 背景网格
  ctx.strokeStyle = 'rgba(0,240,255,0.15)'
  ctx.lineWidth = 1
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath()
    for (let i = 0; i <= n; i++) {
      const angle = (Math.PI * 2 / n) * i - Math.PI / 2
      const px = cx + Math.cos(angle) * r * ring / 4
      const py = cy + Math.sin(angle) * r * ring / 4
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  // 轴线
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
    ctx.stroke()
  }

  // 数据区域
  ctx.fillStyle = 'rgba(0,240,255,0.15)'
  ctx.strokeStyle = 'rgba(0,240,255,0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const idx = i % n
    const angle = (Math.PI * 2 / n) * idx - Math.PI / 2
    const v = Math.max(0.05, values[idx])
    const px = cx + Math.cos(angle) * r * v
    const py = cy + Math.sin(angle) * r * v
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // 数据点
  ctx.fillStyle = '#00f0ff'
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i - Math.PI / 2
    const v = Math.max(0.05, values[i])
    const px = cx + Math.cos(angle) * r * v
    const py = cy + Math.sin(angle) * r * v
    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // 标签
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i - Math.PI / 2
    const px = cx + Math.cos(angle) * (r + 16)
    const py = cy + Math.sin(angle) * (r + 16)
    ctx.fillText(labels[i], px, py + 4)
  }
}

// ===== 老虎机数字滚动 =====
function startSlotAnimation(target) {
  clearInterval(slotInterval)
  displayAmount.value = 0
  let step = Math.max(1, Math.floor(target / 30))
  let current = 0
  slotInterval = setInterval(() => {
    current += step + Math.floor(Math.random() * step * 0.5)
    if (current >= target) { current = target; clearInterval(slotInterval); playSound('cashregister') }
    displayAmount.value = current
    playSound('tick')
  }, 50)
}

// ===== 银行家赛后点评 =====
function generatePostComment() {
  const maxAmt = Math.max(...currentAmounts)
  const ratio = winAmount.value / maxAmt
  // 剧本局专属点评
  if (scriptedGame.value === 1 && ratio >= 0.3) {
    bankerPostComment.value = '你的直觉真准… 我承认这次让你赢了。不过别得意，下一次我可不会这么客气。'
    bankerPostEmoji.value = '😒'; bankerPostMood.value = 'respect'
    return
  }
  if (scriptedGame.value === 2 && ratio < 0.05) {
    bankerPostComment.value = '哈哈哈… 你以为大奖在你手里？天真。不过嘛，你运气不会一直这么差，再来一局试试？'
    bankerPostEmoji.value = '😈'; bankerPostMood.value = 'mock'
    return
  }
  if (scriptedGame.value === 3 && ratio >= 0.5) {
    bankerPostComment.value = '别以为你掌握了规律，我的底牌可不止这些。今天的你只是运气好而已。'
    bankerPostEmoji.value = '🕶️'; bankerPostMood.value = 'respect'
    return
  }
  if (ratio >= 0.3) {
    bankerPostComment.value = '我承认，今天你比我更懂概率。这笔钱你拿走，但别以为每次都能这么走运。下次见。'
    bankerPostEmoji.value = '🕶️'; bankerPostMood.value = 'respect'
  } else if (ratio >= 0.1) {
    bankerPostComment.value = '聪明的选择。虽然没赢走我的金库，但至少你保住了钱包。算个合格的交易者。'
    bankerPostEmoji.value = '🍸'; bankerPostMood.value = 'neutral'
  } else {
    bankerPostComment.value = '贪心不足蛇吞象。看看你手里的这点零钱，连付这通电话费都不够。回去好好反省吧。'
    bankerPostEmoji.value = '😈'; bankerPostMood.value = 'mock'
  }
}

// ===== 本局标签 =====
function generateGameTags() {
  const tags = []
  const maxAmt = Math.max(...currentAmounts)
  if (consecutiveRejects.value >= 4) tags.push('🗿 铁头娃')
  if (winAmount.value >= maxAmt * 0.5) tags.push('🍀 欧皇降临')
  if (winAmount.value <= maxAmt * 0.01) tags.push('💀 非酋本王')
  if (offerAccepted.value && round.value <= 2) tags.push('🐦 见好就收')
  if (!offerAccepted.value && round.value >= 5) tags.push('💪 死磕到底')
  if (winAmount.value >= maxAmt * 0.3 && losingStreak.value >= 2) tags.push('🔥 绝处逢生')
  if (doubleMode.value && winAmount.value > 0) tags.push('🎲 赌神')
  if (bigAmountsEliminated.value >= 3) tags.push('😱 散财童子')
  if (rejectHistory.value.some(o => o > winAmount.value * 2)) tags.push('😰 错失良机')
  if (tags.length === 0) tags.push(winAmount.value >= maxAmt * 0.1 ? '😊 稳扎稳打' : '🤔 平凡一局')
  gameTags.value = tags
}

// ===== 成瘾机制：碎片 / 挑衅 / 仇恨 =====
function processAddictionRewards() {
  const maxA = Math.max(...currentAmounts)
  const ratio = maxA > 0 ? winAmount.value / maxA : 0
  const net = winAmount.value - currentTicketCost.value

  if (ratio >= 0.3) fragmentsEarnedThisGame.value = 3
  else if (ratio >= 0.05) fragmentsEarnedThisGame.value = 2
  else fragmentsEarnedThisGame.value = 1
  stats.value.blackGoldFragments = (stats.value.blackGoldFragments || 0) + fragmentsEarnedThisGame.value

  if (net < 0) {
    stats.value.totalNetLoss = (stats.value.totalNetLoss || 0) + Math.abs(net)
  }

  if (winAmount.value <= maxA * 0.01) {
    stats.value.bankerHatred = (stats.value.bankerHatred || 0) + 1
    provocationBadge.value = {
      name: '银行家的蔑视',
      icon: '😈',
      desc: `本局收益 £${formatNum(winAmount.value)} — 银行家认为你不配和他玩。`
    }
  } else if (bankerWasAngryThisGame.value && ratio >= 0.25) {
    provocationBadge.value = {
      name: '击败银行家',
      icon: '👊',
      desc: '在银行家愤怒时依然赢下一笔！继续乘胜追击！'
    }
    stats.value.bankerHatred = Math.max(0, (stats.value.bankerHatred || 0) - 1)
  }
}

// ===== 极速重开 =====
function quickReplay() {
  playSound('coin')
  showResult.value = false
  showBattleReport.value = false
  setTimeout(() => startNewGame(), 200)
}
function handleKeydown(e) {
  if (e.code === 'Space' && showResult.value && !isBankrupt.value) {
    e.preventDefault()
    quickReplay()
  }
}

// ===== 缓慢揭示盒子（Near Miss） =====
function applyNearMissDanmaku(maxA) {
  frozenDanmaku.value = [
    '哎呀！就差一点！', '亏大了！', '下把一定中！', '气死我了！', '再来一局！'
  ].map(t => ({ text: t, color: '#ff6b6b' }))
  spawnDanmaku('custom', 3, ['哎呀！就差一点！', '亏大了！', '下把一定中！'])
  nearMissRevealText.value = `场上竟还藏着 £${formatNum(maxA)}！`
  nearMissCount.value++
}

function slowRevealBoxes() {
  const maxA = Math.max(...currentAmounts)
  let closed = boxes.value.filter(b => !b.opened)
  if (closed.length === 0) return

  const maxBox = closed.find(b => b.amount === maxA)
  const missedBig = maxBox && winAmount.value < maxA * 0.85 && maxBox.amount > winAmount.value * 1.3

  if (scriptedGame.value === 2 && myBoxId.value !== null && maxBox) {
    const myAmt = boxes.value[myBoxId.value].amount
    if (myAmt < maxA * 0.05) {
      nearMissRevealActive.value = true
      nearMissMaxAmount.value = maxA
      const others = closed.filter(b => b.id !== maxBox.id)
      others.forEach((box, i) => {
        setTimeout(() => {
          box.opened = true
          nearMissRevealProgress.value = Math.round(((i + 1) / (others.length + 1)) * 85)
        }, (i + 1) * 500)
      })
      setTimeout(() => {
        maxBox.opened = true
        nearMissRevealProgress.value = 100
        nearMissRevealComplete.value = true
        playSound('sigh')
        applyNearMissDanmaku(maxA)
      }, (others.length + 1) * 600 + 800)
      return
    }
  }

  if (missedBig) {
    nearMissRevealActive.value = true
    nearMissMaxAmount.value = maxA
    closed = closed.sort((a, b) => b.amount - a.amount)
    const maxIdx = closed.findIndex(b => b.id === maxBox.id)
    const revealOrder = [...closed.filter(b => b.id !== maxBox.id), maxBox]
    revealOrder.forEach((box, i) => {
      setTimeout(() => {
        box.opened = true
        nearMissRevealProgress.value = Math.round(((i + 1) / revealOrder.length) * 90)
        if (i === revealOrder.length - 1) {
          nearMissRevealProgress.value = 100
          nearMissRevealComplete.value = true
          playSound('sigh')
          applyNearMissDanmaku(maxA)
        }
      }, (i + 1) * 550)
    })
    return
  }

  closed.sort((a, b) => b.amount - a.amount)
  closed.forEach((box, i) => {
    setTimeout(() => {
      box.opened = true
      if (box.amount >= maxA * 0.3) playSound('sigh')
    }, (i + 1) * 500)
  })
}

// ===== 终极弹幕定格 =====
function generateFinalDanmaku() {
  const maxAmt = Math.max(...currentAmounts)
  let pool
  if (scriptedGame.value === 1) {
    pool = ['天选之子！', '欧皇本皇！', '银行家要哭了', '下把继续冲！', '这直觉绝了！']
  } else if (scriptedGame.value === 2) {
    pool = ['就差一点…', '下把一定翻！', '别放弃！', '大奖还在等你', '再来一局！']
  } else if (scriptedGame.value === 3) {
    pool = ['复仇成功！', 'No Deal yyds！', '银行家被打脸了', '这才是深渊玩家', '继续保持！']
  } else if (winAmount.value >= maxAmt * 0.3) {
    pool = ['卧槽！！！封神！','天选之子！','大佬带带我！','这也太猛了！','银行家被打脸了！']
  } else if (winAmount.value >= maxAmt * 0.05) {
    pool = ['还行还行','稳扎稳打','下把冲！','见好就收也不错','银行家松了口气']
  } else {
    pool = ['哈哈哈 小丑竟是我自己','非酋落泪','银行家笑疯了','下一局一定能翻盘！','就这？']
  }
  frozenDanmaku.value = pool.slice(0, 5).map(t => ({
    text: t, color: winAmount.value >= maxAmt * 0.3 ? '#ffd700' : winAmount.value >= maxAmt * 0.05 ? '#94a3b8' : '#ff6b6b'
  }))
}

function generateBattleReport() {
  const maxA = Math.max(...currentAmounts)
  const ratio = maxA > 0 ? winAmount.value / maxA : 0
  const isHighlight = ratio >= 0.25
  const net = winAmount.value - currentTicketCost.value
  const lossTotal = stats.value.totalNetLoss || 0

  if (isHighlight) {
    const beatPct = Math.min(99, Math.round(50 + ratio * 45))
    battleReportHtml.value = `
      <div style="text-align:center;padding:16px;background:linear-gradient(135deg,#1a1500,#0a0a0f);border:2px solid #ffd700;border-radius:12px;">
        <p style="font-size:28px;margin:0 0 8px">🏆</p>
        <p style="color:#ffd700;font-weight:900;font-size:18px;margin:0 0 4px">一掷千金 · 高光战报</p>
        <p style="color:#94a3b8;font-size:12px;margin:0 0 12px">本局击败 ${beatPct}% 的玩家</p>
        <p style="color:#ffd700;font-size:32px;font-weight:900;margin:0 0 8px">£${formatNum(winAmount.value)}</p>
        <p style="color:#4ade80;font-size:13px;margin:0">从银行家手里抢走 ${formatNum(winAmount.value)} 镑！</p>
        <p style="color:#64748b;font-size:11px;margin-top:12px">#一掷千金 #欧皇时刻</p>
      </div>`
  } else {
    battleReportHtml.value = `
      <div style="text-align:center;padding:16px;background:linear-gradient(135deg,#1a0a0a,#0a0a0f);border:2px solid #ff4444;border-radius:12px;">
        <p style="font-size:28px;margin:0 0 8px">💀</p>
        <p style="color:#ff6b6b;font-weight:900;font-size:18px;margin:0 0 4px">一掷千金 · 黑历史战报</p>
        <p style="color:#94a3b8;font-size:12px;margin:0 0 12px">荣获【首席韭菜】称号</p>
        <p style="color:#ff4444;font-size:28px;font-weight:900;margin:0 0 8px">£${formatNum(winAmount.value)}</p>
        <p style="color:#64748b;font-size:13px;margin:0">累计亏损 £${formatNum(lossTotal)} · 本局净 ${net >= 0 ? '+' : ''}${formatNum(net)}</p>
        <p style="color:#ffd700;font-size:12px;margin-top:10px">下一局，一定翻本！</p>
        <p style="color:#64748b;font-size:11px;margin-top:8px">#非酋本王 #银行家又赢了</p>
      </div>`
  }
  showBattleReport.value = true
}

async function copyBattleReport() {
  const maxA = Math.max(...currentAmounts)
  const ratio = maxA > 0 ? winAmount.value / maxA : 0
  const text = ratio >= 0.25
    ? `【一掷千金】本局击败${Math.min(99, Math.round(50 + ratio * 45))}%的玩家，从银行家手里抢走 £${formatNum(winAmount.value)}！`
    : `【一掷千金】今天也是被银行家按在地上摩擦的一天，本局 £${formatNum(winAmount.value)}，累计亏损 £${formatNum(stats.value.totalNetLoss || 0)}，荣获【首席韭菜】！`
  try {
    await navigator.clipboard.writeText(text)
    playSound('coin')
  } catch (e) {}
}

// ===== 解锁提示 =====
function generateUnlockHint() {
  if (fragmentsToUnlock.value > 0 && fragmentsToUnlock.value <= 3) {
    unlockHint.value = `🧩 再收集 ${fragmentsToUnlock.value} 个黑金碎片解锁【🦹 暗黑银行家】皮肤！`
    return
  }
  const nextSkin = ALL_SKINS.find(s => !s.fragmentCost && s.minVault > vaultLevel.value)
  if (nextSkin) {
    const needed = nextSkin.minVault - vaultLevel.value
    unlockHint.value = `距离解锁【${nextSkin.icon} ${nextSkin.name}】还差 ${needed} 级`
  } else {
    const nextAch = ACHIEVEMENT_DEFS.find(a => !stats.value.achievements.includes(a.id))
    if (nextAch) unlockHint.value = `距离解锁成就【${nextAch.icon} ${nextAch.name}】：${nextAch.desc}`
    else unlockHint.value = ''
  }
}

// === 样式辅助 ===
function isEliminated(amt) {
  for (let i = 0; i < boxes.value.length; i++) {
    const b = boxes.value[i]
    if (b.opened && b.eliminated && b.amount === amt && !b.isMyBox) return true
  }
  return false
}

function amountStyle(amt) {
  if (isEliminated(amt)) return { color: '#334155' }
  if (amt >= 10000) return { color: '#ffd700', textShadow: '0 0 8px rgba(255,215,0,0.3)' }
  if (amt >= 1000) return { color: '#00f0ff' }
  return { color: '#94a3b8' }
}

function amountRowStyle(amt) {
  if (isEliminated(amt)) return { background: 'transparent' }
  if (amt >= 10000) return { background: 'rgba(255,215,0,0.06)' }
  if (amt >= 1000) return { background: 'rgba(0,240,255,0.04)' }
  return { background: 'transparent' }
}

function chestClasses(box) {
  const finalPhase = remainingCount.value <= 3 && gameState.value !== 'IDLE' && gameState.value !== 'SELECT_MY_BOX'
  return [
    'relative w-full aspect-square rounded-xl cursor-pointer transition-all duration-200 overflow-hidden',
    box.isMyBox && !box.opened && !box.animStage ? (finalPhase ? 'chest-heartbeat' : 'chest-breathe') : '',
    box.opened && !box.animStage ? 'opacity-50' : '',
    !box.opened && !box.animStage ? 'hover:scale-105 hover:brightness-110' : '',
    box.isMyBox ? 'chest-mybox' : '',
    box.animStage ? 'pointer-events-none' : ''
  ]
}

function formatNum(n) {
  return Math.round(n).toLocaleString('en-GB')
}

// === LocalStorage ===
function saveAll() {
  try { localStorage.setItem('dond_all', JSON.stringify(stats.value)) } catch (e) {}
}
function loadAll() {
  try {
    const s = localStorage.getItem('dond_all')
    if (s) {
      const d = JSON.parse(s)
      Object.assign(stats.value, d)
      if (!stats.value.achievements) stats.value.achievements = []
      if (!stats.value.vaultPoints) stats.value.vaultPoints = 0
      if (!stats.value.vaultLevel) stats.value.vaultLevel = 0
      if (!stats.value.totalRejects) stats.value.totalRejects = 0
      if (!stats.value.totalAccepts) stats.value.totalAccepts = 0
      if (stats.value.blackGoldFragments === undefined) stats.value.blackGoldFragments = 0
      if (stats.value.totalNetLoss === undefined) stats.value.totalNetLoss = 0
      if (stats.value.bankerHatred === undefined) stats.value.bankerHatred = 0
      // 恢复钱包
      if (stats.value.wallet !== undefined) wallet.value = stats.value.wallet
      // 检查破产
      if (wallet.value < TICKET_TIERS[0].cost) isBankrupt.value = true
    }
  } catch (e) {}
}

function resetWallet() {
  wallet.value = 100000
  stats.value.wallet = 100000
  isBankrupt.value = false
  saveAll()
}
function saveSettings() {
  try {
    localStorage.setItem('dond_settings', JSON.stringify({
      soundOn: soundOn.value,
      boxSkin: boxSkin.value,
      skipAnimation: skipAnimation.value,
      skipBankerDialog: skipBankerDialog.value
    }))
  } catch (e) {}
}
function loadSettings() {
  try {
    const s = localStorage.getItem('dond_settings')
    if (s) {
      const d = JSON.parse(s)
      Object.keys(d).forEach(k => {
        if (k === 'soundOn') soundOn.value = d[k]
        else if (k === 'boxSkin') boxSkin.value = d[k]
        else if (k === 'skipAnimation') skipAnimation.value = d[k]
        else if (k === 'skipBankerDialog') skipBankerDialog.value = d[k]
      })
    }
  } catch (e) {}
}

// 监听金库弹窗打开时绘制雷达图
watch(showStats, (val) => {
  if (val) nextTick(() => drawRadar())
})

onMounted(() => {
  loadAll()
  loadSettings()
  loadTutorialState()
  if (stats.value.losingStreak) losingStreak.value = stats.value.losingStreak
  if (stats.value.winningStreak) winningStreak.value = stats.value.winningStreak
  if ((stats.value.totalGames || 0) === 0 && !tutorialComplete.value) {
    startTutorial()
  } else if ((stats.value.totalGames || 0) > 0 && (stats.value.totalGames || 0) < 4 && !tutorialComplete.value) {
    tutorialPhase.value = Math.min(4, (stats.value.totalGames || 0) + 1)
    showStartScreen.value = true
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  clearInterval(offerTimerInterval)
  clearInterval(finalTimerInterval)
  clearInterval(longPressTimer)
  clearInterval(typewriterInterval)
  clearInterval(danmakuSpawnInterval)
  clearInterval(slotInterval)
  clearTimeout(boxHintTimer)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* === 页面容器与背景层 === */
.game-container {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
}

/* === 赛博朋克背景 === */
.cyber-background {
  position: fixed;
  inset: 0;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  z-index: 0;
  pointer-events: none;
}
/* 轻微暗角，避免完全盖住背景图 */
.cyber-background::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(10,10,15,0.35) 0%, rgba(26,26,46,0.25) 50%, rgba(15,15,26,0.4) 100%);
  pointer-events: none;
}

/* 主面板半透明，让赌场背景可见 */
:deep(.dond-main-panel) {
  position: relative;
  z-index: 1;
  background: linear-gradient(145deg, rgba(13,17,23,0.72) 0%, rgba(22,27,34,0.78) 50%, rgba(13,17,23,0.72) 100%) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.cyber-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}
.cyber-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
}
.cyber-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 200px;
  background: radial-gradient(ellipse at center, rgba(0, 240, 255, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

/* === 新手引导覆盖层 === */
.tutorial-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
}

/* === 终端命令行UI === */
.tutorial-terminal {
  width: 80%;
  max-width: 800px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #00f0ff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.2);
}
.terminal-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 240, 255, 0.1);
  border-bottom: 1px solid #00f0ff;
}
.terminal-title {
  color: #00f0ff;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}
.terminal-status {
  color: #4ade80;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}
.terminal-content {
  padding: 16px;
  min-height: 200px;
}
.terminal-line {
  color: #00f0ff;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 4px;
}
.terminal-line.system-line {
  color: #f59e0b;
}
.cursor {
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.terminal-loading {
  padding: 8px 16px;
  border-top: 1px solid rgba(0, 240, 255, 0.2);
}
.loading-bar {
  height: 4px;
  background: linear-gradient(90deg, #00f0ff, #0066ff);
  animation: loading 2s ease-in-out infinite;
}
@keyframes loading {
  0%, 100% { width: 0%; }
  50% { width: 100%; }
}

/* === AI阿特拉斯视觉 === */
.atlas-container {
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 16px;
}
.atlas-image-wrapper {
  position: relative;
  width: min(300px, 70vw);
  max-height: 42vh;
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(0, 240, 255, 0.45);
  box-shadow: 0 0 40px rgba(0, 240, 255, 0.25), inset 0 0 30px rgba(0, 240, 255, 0.08);
}
.atlas-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}
.atlas-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 45%, transparent 70%);
  pointer-events: none;
}
.atlas-eyes-glow {
  position: absolute;
  top: 22%;
  left: 50%;
  transform: translateX(-50%);
  width: 55%;
  height: 10%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0,240,255,0.55) 0%, transparent 72%);
  pointer-events: none;
  animation: glowPulse 2.5s ease-in-out infinite;
}
.atlas-portrait-side {
  text-align: center;
}
.atlas-portrait-img {
  width: 100%;
  max-width: 120px;
  aspect-ratio: 3/4;
  object-fit: cover;
  object-position: center top;
  border-radius: 10px;
  border: 1px solid rgba(0, 240, 255, 0.35);
  box-shadow: 0 0 16px rgba(0, 240, 255, 0.2);
  display: block;
  margin: 0 auto;
}
.atlas-start-preview {
  width: 88px;
  height: 110px;
  object-fit: cover;
  object-position: center top;
  border-radius: 10px;
  border: 1px solid rgba(0, 240, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
}
.atlas-modal-preview {
  width: 72px;
  height: 90px;
  object-fit: cover;
  object-position: center top;
  border-radius: 8px;
  border: 1px solid rgba(0, 240, 255, 0.35);
  opacity: 0.95;
}

/* === AI阿特拉斯视觉符号（旧版备用） === */
.atlas-eye {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.eye-outer {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%);
  border: 3px solid #00f0ff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(0, 240, 255, 0.4), inset 0 0 30px rgba(0, 240, 255, 0.1);
  animation: eyePulse 3s ease-in-out infinite;
}
@keyframes eyePulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(0, 240, 255, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(0, 240, 255, 0.6); }
}
.eye-inner {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(0, 20, 40, 0.8);
  border: 2px solid rgba(0, 240, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.eye-pupil {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #00f0ff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.8);
}
.kline-animation {
  width: 40px;
  height: 40px;
  background: repeating-linear-gradient(
    45deg,
    #000 2px,
    #4ade80 2px,
    #4ade80 4px,
    #000 4px
  );
  animation: klineShift 1s linear infinite;
}
@keyframes klineShift {
  0% { background-position: 0 0; }
  100% { background-position: 4px 4px; }
}
.eye-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 240, 255, 0.1) 0%, transparent 70%);
  animation: glowPulse 3s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* === 新手引导提示 === */
.tutorial-hint {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
}
.hint-text {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 20px;
  color: #00f0ff;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  animation: hintPulse 2s ease-in-out infinite;
}
@keyframes hintPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
.hint-text.ignore-task {
  border-color: #f59e0b;
  color: #f59e0b;
}
.hint-icon {
  font-size: 1rem;
}

/* === 长按开箱提示 === */
.box-longpress-toast {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.88);
  border: 1px solid rgba(0, 240, 255, 0.45);
  color: #00f0ff;
  font-size: 0.85rem;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.25);
  animation: hintPulse 1.2s ease-in-out infinite;
  pointer-events: none;
}

/* === 宝箱基础样式 === */
.chest-img {
  width: 100%; height: 100%; object-fit: contain;
  position: absolute; inset: 0;
  transition: all 0.4s ease;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
}
.chest-img-opened {
  opacity: 0.3; transform: scale(0.85);
  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.3)) grayscale(0.5);
}
.chest-img-shake {
  animation: chestShake 0.8s ease-in-out;
  filter: drop-shadow(0 0 12px rgba(255,165,0,0.4));
}
@keyframes chestShake {
  0%,100% { transform: translateX(0) rotate(0); }
  10% { transform: translateX(-4px) rotate(-2deg); }
  20% { transform: translateX(4px) rotate(2deg); }
  30% { transform: translateX(-5px) rotate(-3deg); }
  40% { transform: translateX(5px) rotate(3deg); }
  50% { transform: translateX(-3px) rotate(-2deg); }
  60% { transform: translateX(3px) rotate(2deg); }
  70% { transform: translateX(-4px) rotate(-1deg); }
  80% { transform: translateX(4px) rotate(1deg); }
  90% { transform: translateX(-2px) rotate(0); }
}
.chest-img-glow {
  transform: scale(1.08);
  filter: drop-shadow(0 0 20px rgba(255,215,0,0.6)) drop-shadow(0 0 40px rgba(255,215,0,0.3));
  animation: chestGlow 1s ease-in-out;
}
@keyframes chestGlow {
  0% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(255,165,0,0.3)); }
  50% { transform: scale(1.1); filter: drop-shadow(0 0 25px rgba(255,215,0,0.7)) drop-shadow(0 0 50px rgba(255,215,0,0.3)); }
  100% { transform: scale(1.08); filter: drop-shadow(0 0 20px rgba(255,215,0,0.6)); }
}

/* 箱子编号 */
.chest-number {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; font-weight: 900;
  color: #00f0ff;
  text-shadow: 0 0 10px rgba(0,240,255,0.5), 0 2px 4px rgba(0,0,0,0.8);
  z-index: 2; pointer-events: none;
}

/* 开盖光效 */
.chest-lid-glow {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 60%; height: 40%;
  background: radial-gradient(ellipse, rgba(255,215,0,0.6) 0%, rgba(255,215,0,0) 70%);
  animation: lidGlow 1s ease-out;
  z-index: 3; pointer-events: none;
}
@keyframes lidGlow {
  0% { opacity: 0; transform: translateX(-50%) scale(0.5); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.2); }
  100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
}

/* 揭晓金额 */
.chest-reveal {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 5; pointer-events: none;
  background: rgba(0,0,0,0.4);
  border-radius: 0.75rem;
}
.chest-reveal-enter {
  animation: revealPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes revealPop {
  0% { opacity: 0; transform: scale(0.3); }
  60% { opacity: 1; transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
}
.chest-amount {
  font-size: 1rem; font-weight: 900;
  text-align: center; line-height: 1.2;
}
.amount-gold {
  color: #ffd700;
  text-shadow: 0 0 12px rgba(255,215,0,0.6), 0 0 24px rgba(255,215,0,0.3);
  animation: amountPulse 1s ease-in-out infinite;
}
@keyframes amountPulse {
  0%,100% { text-shadow: 0 0 12px rgba(255,215,0,0.6); }
  50% { text-shadow: 0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4); }
}
.amount-cyan { color: #00f0ff; text-shadow: 0 0 8px rgba(0,240,255,0.4); }
.amount-gray { color: #94a3b8; }

/* 呼吸动画 */
.chest-breathe {
  animation: chestBreathe 2s ease-in-out infinite;
}
@keyframes chestBreathe {
  0%,100% { filter: drop-shadow(0 0 6px rgba(255,215,0,0.15)); }
  50% { filter: drop-shadow(0 0 16px rgba(255,215,0,0.4)) drop-shadow(0 0 24px rgba(255,215,0,0.15)); }
}
.chest-heartbeat {
  animation: chestHeartbeat 0.8s ease-in-out infinite;
}
@keyframes chestHeartbeat {
  0%,100% { filter: drop-shadow(0 0 6px rgba(255,50,50,0.3)); transform: scale(1); }
  25% { filter: drop-shadow(0 0 20px rgba(255,50,50,0.6)); transform: scale(1.04); }
  50% { filter: drop-shadow(0 0 6px rgba(255,50,50,0.3)); transform: scale(1); }
  75% { filter: drop-shadow(0 0 16px rgba(255,50,50,0.5)); transform: scale(1.02); }
}
.chest-mybox {
  outline: 2px solid rgba(255,215,0,0.4);
  outline-offset: 2px;
  border-radius: 0.75rem;
}

/* === 银行家气泡 === */
.banker-bubble {
  display: flex; align-items: center;
  padding: 10px 14px; border-radius: 12px;
  background: rgba(255,215,0,0.08);
  border: 1px solid rgba(255,215,0,0.25);
  animation: bubbleIn 0.3s ease-out;
}
@keyframes bubbleIn {
  from { opacity:0; transform:translateY(-8px); }
  to { opacity:1; transform:translateY(0); }
}

/* === 弹窗/特效 === */
.banker-modal {
  border: 1px solid rgba(0,240,255,0.2);
  box-shadow: 0 0 40px rgba(0,240,255,0.1);
}
.shake-anim { animation: shake 0.4s ease-in-out infinite; }
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
.gold-glow-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 100;
  box-shadow: inset 0 0 80px rgba(255,215,0,0.4), inset 0 0 160px rgba(255,215,0,0.2);
  animation: goldFade 1.5s ease-out forwards;
}
@keyframes goldFade { from { opacity:1 } to { opacity:0 } }
.vignette-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 100;
  box-shadow: inset 0 0 100px rgba(0,0,0,0.6);
  animation: vignetteFade 0.8s ease-out forwards;
}
@keyframes vignetteFade { from { opacity:1 } to { opacity:0 } }

/* === 弹幕系统 === */
.danmaku-container {
  position: fixed; top: 0; left: 0; right: 0; height: 220px;
  pointer-events: none; z-index: 90; overflow: hidden;
  transition: filter 0.5s;
}
.danmaku-dimmed { filter: brightness(0.3) blur(1px); }
.danmaku-item {
  position: absolute; right: -400px;
  font-size: 0.85rem; font-weight: 700; white-space: nowrap;
  text-shadow: 0 0 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6);
  animation: danmakuScroll var(--travel, 800px) linear forwards;
  padding: 2px 8px; border-radius: 4px;
  background: rgba(0,0,0,0.25);
}
.danmaku-item.left {
  right: auto; left: -400px;
  animation: danmakuScrollLeft var(--travel, 800px) linear forwards;
}
.danmaku-stamped {
  text-decoration: line-through; opacity: 0.4;
  position: relative;
}
.banker-x {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  color: #ff0000; font-size: 1.5rem; font-weight: 900;
  text-shadow: 0 0 10px rgba(255,0,0,0.8);
}
@keyframes danmakuScroll {
  from { right: -400px; }
  to { right: 110%; }
}
@keyframes danmakuScrollLeft {
  from { left: -400px; }
  to { left: 110%; }
}

/* === 处刑弹幕样式 === */
.danmaku-item.execution {
  font-size: 2.5rem;
  font-weight: 900;
  top: 20px !important;
  left: 50% !important;
  right: auto !important;
  transform: translateX(-50%);
  color: #ff0000 !important;
  text-shadow: 0 0 20px rgba(255,0,0,0.8), 0 0 40px rgba(255,0,0,0.4), 0 4px 8px rgba(0,0,0,0.8);
  animation: executionPulse 0.5s ease-in-out infinite;
  background: rgba(0,0,0,0.8);
  padding: 12px 24px;
  border: 2px solid #ff0000;
  border-radius: 8px;
  z-index: 100;
}
@keyframes executionPulse {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.1); }
}
.danmaku-item.shatter {
  animation: shatter 0.5s ease-out forwards;
}
@keyframes shatter {
  0% { 
    opacity: 1; 
    transform: translateX(-50%) scale(1); 
    filter: blur(0);
  }
  50% { 
    opacity: 0.8; 
    transform: translateX(-50%) scale(1.2); 
    filter: blur(2px);
  }
  100% { 
    opacity: 0; 
    transform: translateX(-50%) scale(1.5); 
    filter: blur(8px);
  }
}

/* === 银行家印章 === */
.banker-stamp-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 95;
  display: flex; align-items: center; justify-content: center;
}
.banker-stamp {
  font-size: 3rem; font-weight: 900; color: #ff0000;
  text-shadow: 0 0 20px rgba(255,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5);
  transform: rotate(-15deg);
  animation: stampSlam 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 4px solid #ff0000; padding: 8px 24px; border-radius: 8px;
  background: rgba(0,0,0,0.6);
}
@keyframes stampSlam {
  0% { transform: rotate(-15deg) scale(3); opacity: 0; }
  70% { transform: rotate(-15deg) scale(0.9); opacity: 1; }
  100% { transform: rotate(-15deg) scale(1); opacity: 1; }
}

/* === 屏幕震动 === */
.screen-shake-layer {
  position: fixed; inset: 0; pointer-events: none; z-index: 200;
  animation: screenShake 0.6s ease-in-out;
}
@keyframes screenShake {
  0%,100% { transform: translate(0,0); }
  10% { transform: translate(-6px, 3px); }
  20% { transform: translate(6px, -3px); }
  30% { transform: translate(-4px, 5px); }
  40% { transform: translate(4px, -5px); }
  50% { transform: translate(-3px, 2px); }
  60% { transform: translate(3px, -2px); }
  70% { transform: translate(-2px, 4px); }
  80% { transform: translate(2px, -4px); }
  90% { transform: translate(-1px, 1px); }
}

/* === 聚光灯 === */
.spotlight-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 88;
  background: radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 70%);
  animation: spotlightIn 0.5s ease-out;
}
@keyframes spotlightIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* === 碎裂特效 === */
.shatter-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 150;
  display: flex; align-items: center; justify-content: center;
  animation: shatterFlash 1.2s ease-out forwards;
}
@keyframes shatterFlash {
  0% { opacity: 1; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}
.shard {
  position: absolute; width: 30px; height: 60px;
  background: linear-gradient(135deg, rgba(0,240,255,0.3), rgba(255,255,255,0.1));
  border: 1px solid rgba(0,240,255,0.4);
  animation: shardFly 1s ease-out forwards;
}
@keyframes shardFly {
  0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translateY(-200px) rotate(720deg) scale(0); opacity: 0; }
}

/* === 金光粒子 === */
.gold-particles-layer {
  position: fixed; inset: 0; pointer-events: none; z-index: 150;
  overflow: hidden;
}
.gold-particle {
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle, #ffd700, #ff8c00);
  box-shadow: 0 0 6px rgba(255,215,0,0.6);
  animation: particleFloat 2s ease-out forwards;
}
@keyframes particleFloat {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-120px) scale(0); opacity: 0; }
}

/* === Deal 按钮 === */
.deal-btn {
  background: linear-gradient(135deg, #059669, #10b981);
  border: 2px solid rgba(16,185,129,0.5);
  box-shadow: 0 0 20px rgba(16,185,129,0.3);
  transition: all 0.3s;
  position: relative; overflow: hidden;
}
.deal-btn:hover {
  box-shadow: 0 0 30px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.2);
  transform: scale(1.05);
}
.deal-btn-glow {
  animation: btnGlow 2s ease-in-out infinite;
}
@keyframes btnGlow {
  0%,100% { text-shadow: 0 0 8px rgba(255,255,255,0.3); }
  50% { text-shadow: 0 0 16px rgba(255,255,255,0.6), 0 0 30px rgba(16,185,129,0.4); }
}

/* === NoDeal 按钮 === */
.nodeal-btn {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border: 2px solid rgba(220,38,38,0.5);
  box-shadow: 0 0 15px rgba(220,38,38,0.3);
  animation: nodealPulse 1.2s ease-in-out infinite;
  transition: all 0.2s;
}
.nodeal-btn:hover { transform: scale(0.97); }
@keyframes nodealPulse {
  0%,100% { box-shadow: 0 0 15px rgba(220,38,38,0.3); }
  50% { box-shadow: 0 0 25px rgba(220,38,38,0.6), 0 0 40px rgba(220,38,38,0.2); }
}
.nodeal-progress {
  position: absolute; bottom: 0; left: 0; height: 3px;
  background: linear-gradient(90deg, #ff4444, #ffd700);
  transition: width 0.05s linear;
}
.chest-longpress-progress {
  position: absolute; bottom: 0; left: 0; height: 4px;
  background: linear-gradient(90deg, #00f0ff, #ffd700);
  transition: width 0.05s linear;
  z-index: 20;
}

/* === 双倍对赌按钮 === */
.double-btn {
  background: linear-gradient(135deg, #7c3aed, #dc2626);
  border: 2px solid rgba(124,58,237,0.5);
  box-shadow: 0 0 15px rgba(124,58,237,0.3);
  animation: doublePulse 1.5s ease-in-out infinite;
}
@keyframes doublePulse {
  0%,100% { box-shadow: 0 0 15px rgba(124,58,237,0.3); }
  50% { box-shadow: 0 0 30px rgba(124,58,237,0.6), 0 0 50px rgba(220,38,38,0.2); }
}

/* === 报价砸入动画 === */
.offer-amount-smash {
  animation: amountSmash 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes amountSmash {
  0% { transform: scale(3) translateY(-20px); opacity: 0; }
  60% { transform: scale(0.9) translateY(5px); opacity: 1; }
  80% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* === 结算动画 === */
.result-icon-anim {
  animation: resultIconBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes resultIconBounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.result-amount-reveal {
  animation: amountReveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both;
}
@keyframes amountReveal {
  0% { transform: scale(0.3) translateY(20px); opacity: 0; }
  70% { transform: scale(1.1) translateY(-5px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

/* === 银行家气泡情绪颜色 === */
.banker-bubble.mood-angry {
  border-color: rgba(255,50,50,0.4);
  background: rgba(255,50,50,0.08);
}
.banker-bubble.mood-panic {
  border-color: rgba(255,165,0,0.4);
  background: rgba(255,165,0,0.08);
  animation: bubbleIn 0.3s ease-out, panicPulse 0.8s ease-in-out infinite;
}
@keyframes panicPulse {
  0%,100% { box-shadow: none; }
  50% { box-shadow: 0 0 15px rgba(255,165,0,0.3); }
}

/* === 打字机光标 === */
.banker-typewriter {
  border-right: 2px solid #ff6b6b;
  animation: blink 0.7s step-end infinite;
  display: inline-block;
}
@keyframes blink {
  50% { border-color: transparent; }
}

/* === 结算终端 === */
.result-terminal {
  border: 1px solid rgba(0,240,255,0.2);
  box-shadow: 0 0 60px rgba(0,240,255,0.08), inset 0 0 40px rgba(0,0,0,0.5);
}

/* 过渡动画 */
.result-transition {
  position: absolute; inset: 0; z-index: 10;
  display: flex; flex-direction: column; overflow: hidden;
  border-radius: 1rem; pointer-events: none;
}
.transition-blind {
  flex: 1; background: linear-gradient(180deg, #1a1a2e, #0d1117);
  animation: blindDown 0.5s ease-out forwards;
  transform-origin: top;
}
@keyframes blindDown {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

/* 老虎机数字 */
.slot-machine {
  position: relative; display: inline-block;
  padding: 8px 24px; border-radius: 12px;
  background: rgba(0,0,0,0.4);
  border: 2px solid rgba(255,215,0,0.2);
  overflow: hidden;
}
.slot-number {
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  animation: slotFlicker 0.08s ease-in-out 8;
}
@keyframes slotFlicker {
  0%,100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.text-gold {
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3), 0 2px 4px rgba(0,0,0,0.8);
}
.text-cyan {
  color: #00f0ff;
  text-shadow: 0 0 12px rgba(0,240,255,0.4), 0 2px 4px rgba(0,0,0,0.8);
}
.text-gray { color: #94a3b8; }

/* 大奖光环 */
.win-glow-ring {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 200px; height: 200px; border-radius: 50%;
  border: 3px solid rgba(255,215,0,0.3);
  animation: glowRing 2s ease-out infinite;
  pointer-events: none;
}
@keyframes glowRing {
  0% { width: 80px; height: 80px; opacity: 1; border-color: rgba(255,215,0,0.6); }
  100% { width: 250px; height: 250px; opacity: 0; border-color: rgba(255,215,0,0); }
}

/* 银行家赛后点评 */
.banker-post {
  border: 1px solid rgba(255,215,0,0.15);
  background: rgba(0,0,0,0.3);
  animation: postSlideIn 0.5s ease-out 0.6s both;
}
@keyframes postSlideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.banker-post-respect {
  border-color: rgba(255,215,0,0.3);
  background: rgba(255,215,0,0.05);
}
.banker-post-mock {
  border-color: rgba(255,50,50,0.3);
  background: rgba(255,50,50,0.05);
}

/* 快速重开按钮 */
.quick-replay-btn {
  background: linear-gradient(135deg, #059669, #10b981, #059669);
  background-size: 200% 200%;
  border: 2px solid rgba(16,185,129,0.5);
  box-shadow: 0 0 20px rgba(16,185,129,0.3);
  animation: replayGlow 2s ease-in-out infinite, replayShimmer 3s linear infinite;
  transition: all 0.2s;
}
.quick-replay-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.2);
}
@keyframes replayGlow {
  0%,100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
  50% { box-shadow: 0 0 30px rgba(16,185,129,0.5), 0 0 50px rgba(16,185,129,0.2); }
}
@keyframes replayShimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.quick-replay-pulse {
  animation: replayGlow 1.2s ease-in-out infinite, replayShimmer 2s linear infinite, replayPulse 0.8s ease-in-out infinite;
}
@keyframes replayPulse {
  0%,100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

/* === 伪大奖闪光 === */
.pseudo-bigwin-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 40;
  background: radial-gradient(circle at center, rgba(255,215,0,0.35) 0%, transparent 65%);
  animation: pseudoBigWinFlash 2.5s ease-out forwards;
}
@keyframes pseudoBigWinFlash {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* === Near Miss 揭晓 === */
.near-miss-panel {
  background: rgba(255,68,68,0.06);
  border: 1px solid rgba(255,68,68,0.2);
  transition: all 0.3s;
}
.near-miss-complete {
  background: rgba(255,68,68,0.12);
  border-color: rgba(255,215,0,0.4);
  box-shadow: 0 0 20px rgba(255,68,68,0.15);
}

/* === 挑衅成就 === */
.provocation-badge {
  animation: provocationShake 0.6s ease-out;
}
@keyframes provocationShake {
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

/* === 战报海报 === */
.battle-report-card {
  background: rgba(10,10,20,0.95);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 0 40px rgba(0,240,255,0.15);
}
.battle-report-inner { border-radius: 12px; overflow: hidden; }

/* === 黑市商店 === */
.bm-icon-btn {
  background: rgba(139,92,246,0.15);
  border: 1px solid rgba(139,92,246,0.3);
  color: #a78bfa;
  font-size: 1.2rem;
  padding: 4px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  animation: bmIconBreathe 3s ease-in-out infinite;
}
.bm-icon-btn:hover {
  background: rgba(139,92,246,0.3);
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(139,92,246,0.4);
}
.bm-pulse {
  animation: bmPulseGlow 1.5s ease-in-out infinite !important;
}
@keyframes bmIconBreathe {
  0%,100% { box-shadow: 0 0 5px rgba(139,92,246,0.2); }
  50% { box-shadow: 0 0 12px rgba(139,92,246,0.4); }
}
@keyframes bmPulseGlow {
  0%,100% { box-shadow: 0 0 5px rgba(255,68,68,0.3); transform: scale(1); }
  50% { box-shadow: 0 0 20px rgba(255,68,68,0.5); transform: scale(1.1); }
}
.bm-shop {
  border: 1px solid rgba(139,92,246,0.3);
  box-shadow: 0 0 40px rgba(139,92,246,0.15), inset 0 0 60px rgba(0,0,0,0.5);
}
.bm-card {
  background: linear-gradient(135deg, rgba(30,30,50,0.9), rgba(20,20,40,0.9));
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.bm-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(45deg, transparent 40%, rgba(255,215,0,0.03) 50%, transparent 60%);
  background-size: 200% 200%;
  animation: bmCardShimmer 4s ease-in-out infinite;
}
.bm-card:hover {
  border-color: rgba(255,215,0,0.3);
  box-shadow: 0 0 20px rgba(139,92,246,0.2);
}
.bm-card-disabled {
  opacity: 0.5;
  pointer-events: none;
}
@keyframes bmCardShimmer {
  0% { background-position: 200% 200%; }
  50% { background-position: 0% 0%; }
  100% { background-position: 200% 200%; }
}
.bm-buy-btn {
  background: linear-gradient(135deg, #6d28d9, #4c1d95);
  border: 1px solid rgba(139,92,246,0.4);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.bm-buy-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  box-shadow: 0 0 15px rgba(139,92,246,0.4);
  transform: translateY(-1px);
}
.bm-buy-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
}
.bm-buy-btn:disabled {
  background: rgba(50,50,70,0.5);
  border-color: rgba(100,100,120,0.3);
  cursor: not-allowed;
  opacity: 0.6;
}

/* === 直觉值仪表盘 === */
.intuition-meter {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,215,0,0.1);
  transition: all 0.4s;
}
.intuition-flash {
  animation: intuitionPulse 0.6s ease-out;
}
.intuition-bar {
  box-shadow: 0 0 6px rgba(255,215,0,0.3);
}
@keyframes intuitionPulse {
  0% { box-shadow: 0 0 0 0 rgba(255,215,0,0); }
  50% { box-shadow: 0 0 20px 5px rgba(255,215,0,0.4); }
  100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); }
}

/* === 暖色滤镜（全场庆祝） === */
.warm-filter {
  animation: warmGlow 2s ease-out;
}
@keyframes warmGlow {
  0% { filter: brightness(1) sepia(0); }
  30% { filter: brightness(1.15) sepia(0.2); }
  100% { filter: brightness(1) sepia(0); }
}

/* === 希望破碎效果 === */
.hope-flash {
  animation: hopeShatter 0.8s ease-out;
}
@keyframes hopeShatter {
  0% { filter: brightness(1); }
  10% { filter: brightness(0.6) saturate(0.3); }
  40% { filter: brightness(1.1) hue-rotate(-20deg); }
  100% { filter: brightness(1); }
}

/* === 红色警戒效果 === */
.red-alert {
  animation: alertPulse 2s ease-in-out infinite;
}
@keyframes alertPulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.05) saturate(1.1); }
}

.red-alert-level-3 {
  animation: criticalPulse 1s ease-in-out infinite;
}
@keyframes criticalPulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.1) saturate(1.3) hue-rotate(-5deg); }
}

.red-alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.red-alert-overlay.level-1 {
  opacity: 0.05;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.1) 100%);
}

.red-alert-overlay.level-2 {
  opacity: 0.1;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(255,0,0,0.2) 100%);
  animation: alertBorder 2s ease-in-out infinite;
}

.red-alert-overlay.level-3 {
  opacity: 0.15;
  background: radial-gradient(ellipse at center, transparent 20%, rgba(255,0,0,0.3) 100%);
  animation: alertBorder 1s ease-in-out infinite;
}

@keyframes alertBorder {
  0%, 100% { box-shadow: inset 0 0 30px rgba(255,0,0,0.2); }
  50% { box-shadow: inset 0 0 50px rgba(255,0,0,0.4); }
}

/* === 债务警告 === */
.debt-warning {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255,0,0,0.15);
  border: 1px solid rgba(255,0,0,0.4);
  border-radius: 20px;
  animation: debtPulse 1.5s ease-in-out infinite;
  z-index: 100;
}

.debt-icon {
  font-size: 16px;
  animation: iconBounce 1s ease-in-out infinite;
}

.debt-text {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 14px;
}

.debt-interest {
  color: #ffa500;
  font-size: 12px;
  padding: 2px 6px;
  background: rgba(255,165,0,0.2);
  border-radius: 10px;
}

@keyframes debtPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.9; }
}

@keyframes iconBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* === 盒子“幸运”发光 === */
.chest-img-lucky {
  animation: luckyBreathe 2s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(255,215,0,0.4));
}
@keyframes luckyBreathe {
  0%,100% { filter: drop-shadow(0 0 4px rgba(255,215,0,0.2)); }
  50% { filter: drop-shadow(0 0 12px rgba(255,215,0,0.5)); }
}

/* === 透视标记 === */
.peeked-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 1.2rem;
  z-index: 10;
  animation: peekFloat 2s ease-in-out infinite;
}
@keyframes peekFloat {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* === 平行宇宙对比 === */
.parallel-universe {
  background: linear-gradient(135deg, rgba(30,10,10,0.6), rgba(10,10,30,0.6));
  border: 1px solid rgba(255,215,0,0.2);
  animation: parallelReveal 0.8s ease-out;
}
@keyframes parallelReveal {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

/* === 复仇按钮 === */
.revenge-btn {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border: 2px solid rgba(255,68,68,0.5);
  animation: revengePulse 1.5s ease-in-out infinite;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 0 15px rgba(255,68,68,0.3);
}
.revenge-btn:hover {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(255,68,68,0.5);
}
@keyframes revengePulse {
  0%,100% { box-shadow: 0 0 10px rgba(255,68,68,0.2); }
  50% { box-shadow: 0 0 25px rgba(255,68,68,0.5), 0 0 40px rgba(255,68,68,0.2); }
}
</style>
