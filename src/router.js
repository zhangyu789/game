import MinesweeperGame from './views/MinesweeperGame.vue'
import SnakeGame from './views/SnakeGame.vue'
import Game2048 from './views/Game2048.vue'
import TetrisGame from './views/TetrisGame.vue'
import SudokuGame from './views/SudokuGame.vue'
import SokobanGame from './views/SokobanGame.vue'
import GomokuGame from './views/GomokuGame.vue'
import ReversiGame from './views/ReversiGame.vue'
import ChineseChessGame from './views/ChineseChessGame.vue'
import ChessGame from './views/ChessGame.vue'
import DoudizhuGame from './views/DoudizhuGame.vue'
import FlappyBirdGame from './views/FlappyBirdGame.vue'
import BreakoutGame from './views/BreakoutGame.vue'
import TankGame from './views/TankGame.vue'
import PlaneWarGame from './views/PlaneWarGame.vue'
import MemoryCardGame from './views/MemoryCardGame.vue'
import SpiderSolitaireGame from './views/SpiderSolitaireGame.vue'
import BlackjackGame from './views/BlackjackGame.vue'
import GameOfLife from './views/GameOfLife.vue'
import TypingGame from './views/TypingGame.vue'
import TicTacToeGame from './views/TicTacToeGame.vue'
import HuarongGame from './views/HuarongGame.vue'
<<<<<<< HEAD
import PinballBounceGame from './views/PinballBounceGame.vue'
=======
// 新游戏
import PacmanGame from './views/PacmanGame.vue'
import SpaceInvadersGame from './views/SpaceInvadersGame.vue'
import BubbleShooterGame from './views/BubbleShooterGame.vue'
import PinballGame from './views/PinballGame.vue'
import DinoGame from './views/DinoGame.vue'
import WhackAMoleGame from './views/WhackAMoleGame.vue'
import MetalSlugGame from './views/MetalSlugGame.vue'
import Match3Game from './views/Match3Game.vue'
import PuzzleGame from './views/PuzzleGame.vue'
import OneStrokeGame from './views/OneStrokeGame.vue'
import FlowGame from './views/FlowGame.vue'
import NonogramGame from './views/NonogramGame.vue'
import PipeGame from './views/PipeGame.vue'
import HexMinesweeperGame from './views/HexMinesweeperGame.vue'
import LightsOutGame from './views/LightsOutGame.vue'
import ConnectFourGame from './views/ConnectFourGame.vue'
import UnoGame from './views/UnoGame.vue'
import FreeCellGame from './views/FreeCellGame.vue'
import FlightChessGame from './views/FlightChessGame.vue'
import MonopolyGame from './views/MonopolyGame.vue'
import CheckersGame from './views/CheckersGame.vue'
import MilitaryChessGame from './views/MilitaryChessGame.vue'
import RoguelikeGame from './views/RoguelikeGame.vue'
import TowerDefenseGame from './views/TowerDefenseGame.vue'
import SimCityGame from './views/SimCityGame.vue'
import PlagueGame from './views/PlagueGame.vue'
import CivilizationGame from './views/CivilizationGame.vue'
import GuessNumberGame from './views/GuessNumberGame.vue'
import RockPaperScissorsGame from './views/RockPaperScissorsGame.vue'
import IdiomChainGame from './views/IdiomChainGame.vue'
import PianoTilesGame from './views/PianoTilesGame.vue'
import ParkourGame from './views/ParkourGame.vue'
import SnakeIoGame from './views/SnakeIoGame.vue'
import PhysicsLineGame from './views/PhysicsLineGame.vue'
import SolitaireGame from './views/SolitaireGame.vue'
import DealOrNoDealGame from './views/DealOrNoDealGame.vue'
import GreedGambleGame from './views/GreedGambleGame.vue'
>>>>>>> c577bcc92df91e491dfa3ca8e3a2909f87cdbe0c

export const routes = [
  { path: '/', redirect: '/minesweeper' },
  // 🧩 休闲益智
  { path: '/minesweeper', name: 'minesweeper', component: MinesweeperGame, meta: { title: '扫雷', icon: '💣', group: 'game-puzzle' } },
  { path: '/snake', name: 'snake', component: SnakeGame, meta: { title: '贪吃蛇', icon: '🐍', group: 'game-puzzle' } },
  { path: '/2048', name: '2048', component: Game2048, meta: { title: '2048', icon: '🎮', group: 'game-puzzle' } },
  { path: '/tetris', name: 'tetris', component: TetrisGame, meta: { title: '俄罗斯方块', icon: '🧱', group: 'game-puzzle' } },
  { path: '/sudoku', name: 'sudoku', component: SudokuGame, meta: { title: '数独', icon: '🔢', group: 'game-puzzle' } },
  { path: '/sokoban', name: 'sokoban', component: SokobanGame, meta: { title: '推箱子', icon: '📦', group: 'game-puzzle' } },
  { path: '/match3', name: 'match3', component: Match3Game, meta: { title: '消消乐', icon: '💎', group: 'game-puzzle' } },
  { path: '/puzzle', name: 'puzzle', component: PuzzleGame, meta: { title: '拼图游戏', icon: '🧩', group: 'game-puzzle' } },
  { path: '/one-stroke', name: 'one-stroke', component: OneStrokeGame, meta: { title: '一笔画', icon: '✏️', group: 'game-puzzle' } },
  { path: '/flow', name: 'flow', component: FlowGame, meta: { title: '连线Flow', icon: '🔗', group: 'game-puzzle' } },
  { path: '/nonogram', name: 'nonogram', component: NonogramGame, meta: { title: '数织', icon: '🧵', group: 'game-puzzle' } },
  { path: '/pipe', name: 'pipe', component: PipeGame, meta: { title: '接水管', icon: '🔧', group: 'game-puzzle' } },
  { path: '/hex-minesweeper', name: 'hex-minesweeper', component: HexMinesweeperGame, meta: { title: 'Hex扫雷', icon: '💣', group: 'game-puzzle' } },
  { path: '/lights-out', name: 'lights-out', component: LightsOutGame, meta: { title: '点灯游戏', icon: '💡', group: 'game-puzzle' } },
  // ♟️ 棋牌桌游
  { path: '/gomoku', name: 'gomoku', component: GomokuGame, meta: { title: '五子棋', icon: '⚫', group: 'game-board' } },
  { path: '/reversi', name: 'reversi', component: ReversiGame, meta: { title: '黑白棋', icon: '🔘', group: 'game-board' } },
  { path: '/chinese-chess', name: 'chinese-chess', component: ChineseChessGame, meta: { title: '中国象棋', icon: '🏯', group: 'game-board' } },
  { path: '/chess', name: 'chess', component: ChessGame, meta: { title: '国际象棋', icon: '♟️', group: 'game-board' } },
  { path: '/doudizhu', name: 'doudizhu', component: DoudizhuGame, meta: { title: '斗地主', icon: '🃏', group: 'game-board' } },
  { path: '/connect-four', name: 'connect-four', component: ConnectFourGame, meta: { title: '四子棋', icon: '🔴', group: 'game-board' } },
  { path: '/uno', name: 'uno', component: UnoGame, meta: { title: 'UNO', icon: '🎴', group: 'game-board' } },
  { path: '/freecell', name: 'freecell', component: FreeCellGame, meta: { title: '空当接龙', icon: '🃏', group: 'game-board' } },
  { path: '/flight-chess', name: 'flight-chess', component: FlightChessGame, meta: { title: '飞行棋', icon: '✈️', group: 'game-board' } },
  { path: '/monopoly', name: 'monopoly', component: MonopolyGame, meta: { title: '大富翁', icon: '🏘️', group: 'game-board' } },
  { path: '/checkers', name: 'checkers', component: CheckersGame, meta: { title: '跳棋', icon: '⚫', group: 'game-board' } },
  { path: '/military-chess', name: 'military-chess', component: MilitaryChessGame, meta: { title: '暗棋', icon: '🎖️', group: 'game-board' } },
  // 🕹️ 动作街机
  { path: '/flappy-bird', name: 'flappy-bird', component: FlappyBirdGame, meta: { title: 'Flappy Bird', icon: '🐦', group: 'game-action' } },
  { path: '/breakout', name: 'breakout', component: BreakoutGame, meta: { title: '打砖块', icon: '🧱', group: 'game-action' } },
  { path: '/tank', name: 'tank', component: TankGame, meta: { title: '坦克大战', icon: '🔫', group: 'game-action' } },
  { path: '/plane-war', name: 'plane-war', component: PlaneWarGame, meta: { title: '飞机大战', icon: '✈️', group: 'game-action' } },
<<<<<<< HEAD
  { path: '/pinball-bounce', name: 'pinball-bounce', component: PinballBounceGame, meta: { title: '弹珠弹弹弹', icon: '🎱', group: 'game-action' } },
=======
  { path: '/pacman', name: 'pacman', component: PacmanGame, meta: { title: '吃豆人', icon: '🟡', group: 'game-action' } },
  { path: '/space-invaders', name: 'space-invaders', component: SpaceInvadersGame, meta: { title: '太空侵略者', icon: '👾', group: 'game-action' } },
  { path: '/bubble-shooter', name: 'bubble-shooter', component: BubbleShooterGame, meta: { title: '泡泡龙', icon: '🫧', group: 'game-action' } },
  { path: '/pinball', name: 'pinball', component: PinballGame, meta: { title: '弹珠台', icon: '🎱', group: 'game-action' } },
  { path: '/dino', name: 'dino', component: DinoGame, meta: { title: '恐龙快跑', icon: '🦕', group: 'game-action' } },
  { path: '/whack-a-mole', name: 'whack-a-mole', component: WhackAMoleGame, meta: { title: '打地鼠', icon: '🔨', group: 'game-action' } },
  { path: '/metal-slug', name: 'metal-slug', component: MetalSlugGame, meta: { title: '合金弹头', icon: '🔫', group: 'game-action' } },
>>>>>>> c577bcc92df91e491dfa3ca8e3a2909f87cdbe0c
  // 🃏 卡牌策略
  { path: '/memory-card', name: 'memory-card', component: MemoryCardGame, meta: { title: '记忆翻牌', icon: '🃏', group: 'game-card' } },
  { path: '/spider-solitaire', name: 'spider-solitaire', component: SpiderSolitaireGame, meta: { title: '蜘蛛纸牌', icon: '🕷️', group: 'game-card' } },
  { path: '/blackjack', name: 'blackjack', component: BlackjackGame, meta: { title: '21点', icon: '🎴', group: 'game-card' } },
  { path: '/solitaire', name: 'solitaire', component: SolitaireGame, meta: { title: '纸牌拖拽', icon: '🃏', group: 'game-card' } },
  // 🧠 模拟策略
  { path: '/game-of-life', name: 'game-of-life', component: GameOfLife, meta: { title: '生命游戏', icon: '🧬', group: 'game-sim' } },
  { path: '/typing', name: 'typing', component: TypingGame, meta: { title: '打字游戏', icon: '⌨️', group: 'game-sim' } },
  { path: '/tic-tac-toe', name: 'tic-tac-toe', component: TicTacToeGame, meta: { title: '井字棋', icon: '❌', group: 'game-sim' } },
  { path: '/huarong', name: 'huarong', component: HuarongGame, meta: { title: '华容道', icon: '🧩', group: 'game-sim' } },
  { path: '/roguelike', name: 'roguelike', component: RoguelikeGame, meta: { title: 'Roguelike地牢', icon: '🏰', group: 'game-sim' } },
  { path: '/tower-defense', name: 'tower-defense', component: TowerDefenseGame, meta: { title: '塔防游戏', icon: '🗼', group: 'game-sim' } },
  { path: '/sim-city', name: 'sim-city', component: SimCityGame, meta: { title: '模拟城市', icon: '🏙️', group: 'game-sim' } },
  { path: '/plague', name: 'plague', component: PlagueGame, meta: { title: '瘟疫公司', icon: '🦠', group: 'game-sim' } },
  { path: '/civilization', name: 'civilization', component: CivilizationGame, meta: { title: '文明', icon: '🏛️', group: 'game-sim' } },
  // 🎯 休闲娱乐
  { path: '/guess-number', name: 'guess-number', component: GuessNumberGame, meta: { title: '猜数字', icon: '🔢', group: 'game-casual' } },
  { path: '/rps', name: 'rps', component: RockPaperScissorsGame, meta: { title: '石头剪刀布', icon: '✊', group: 'game-casual' } },
  { path: '/idiom-chain', name: 'idiom-chain', component: IdiomChainGame, meta: { title: '成语接龙', icon: '📝', group: 'game-casual' } },
  { path: '/piano-tiles', name: 'piano-tiles', component: PianoTilesGame, meta: { title: '钢琴块', icon: '🎹', group: 'game-casual' } },
  { path: '/parkour', name: 'parkour', component: ParkourGame, meta: { title: '跑酷游戏', icon: '🏃', group: 'game-casual' } },
  { path: '/snake-io', name: 'snake-io', component: SnakeIoGame, meta: { title: '贪吃蛇大作战', icon: '🐍', group: 'game-casual' } },
  { path: '/physics-line', name: 'physics-line', component: PhysicsLineGame, meta: { title: '物理画线', icon: '✏️', group: 'game-casual' } },
  { path: '/deal-or-no-deal', name: 'deal-or-no-deal', component: DealOrNoDealGame, meta: { title: '一掷千金', icon: '💰', group: 'game-casual' } },
  { path: '/greed-gamble', name: 'greed-gamble', component: GreedGambleGame, meta: { title: '贪婪的筹码', icon: '🎰', group: 'game-casual' } },
]

export const toolGroups = {
  'game-puzzle': { label: '休闲益智', icon: '🧩' },
  'game-board': { label: '棋牌桌游', icon: '♟️' },
  'game-action': { label: '动作街机', icon: '🕹️' },
  'game-card': { label: '卡牌策略', icon: '🃏' },
  'game-sim': { label: '模拟策略', icon: '🧠' },
  'game-casual': { label: '休闲娱乐', icon: '🎯' },
}
