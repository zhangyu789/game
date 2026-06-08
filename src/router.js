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

export const routes = [
  { path: '/', redirect: '/minesweeper' },
  // 🎮 休闲益智
  { path: '/minesweeper', name: 'minesweeper', component: MinesweeperGame, meta: { title: '扫雷', icon: '💣', group: 'game-puzzle' } },
  { path: '/snake', name: 'snake', component: SnakeGame, meta: { title: '贪吃蛇', icon: '🐍', group: 'game-puzzle' } },
  { path: '/2048', name: '2048', component: Game2048, meta: { title: '2048', icon: '🎮', group: 'game-puzzle' } },
  { path: '/tetris', name: 'tetris', component: TetrisGame, meta: { title: '俄罗斯方块', icon: '🧱', group: 'game-puzzle' } },
  { path: '/sudoku', name: 'sudoku', component: SudokuGame, meta: { title: '数独', icon: '🔢', group: 'game-puzzle' } },
  { path: '/sokoban', name: 'sokoban', component: SokobanGame, meta: { title: '推箱子', icon: '📦', group: 'game-puzzle' } },
  // ♟️ 棋牌桌游
  { path: '/gomoku', name: 'gomoku', component: GomokuGame, meta: { title: '五子棋', icon: '⚫', group: 'game-board' } },
  { path: '/reversi', name: 'reversi', component: ReversiGame, meta: { title: '黑白棋', icon: '🔘', group: 'game-board' } },
  { path: '/chinese-chess', name: 'chinese-chess', component: ChineseChessGame, meta: { title: '中国象棋', icon: '🏯', group: 'game-board' } },
  { path: '/chess', name: 'chess', component: ChessGame, meta: { title: '国际象棋', icon: '♟️', group: 'game-board' } },
  { path: '/doudizhu', name: 'doudizhu', component: DoudizhuGame, meta: { title: '斗地主', icon: '🃏', group: 'game-board' } },
  // 🕹️ 动作街机
  { path: '/flappy-bird', name: 'flappy-bird', component: FlappyBirdGame, meta: { title: 'Flappy Bird', icon: '🐦', group: 'game-action' } },
  { path: '/breakout', name: 'breakout', component: BreakoutGame, meta: { title: '打砖块', icon: '🧱', group: 'game-action' } },
  { path: '/tank', name: 'tank', component: TankGame, meta: { title: '坦克大战', icon: '🔫', group: 'game-action' } },
  { path: '/plane-war', name: 'plane-war', component: PlaneWarGame, meta: { title: '飞机大战', icon: '✈️', group: 'game-action' } },
  // 🃏 卡牌策略
  { path: '/memory-card', name: 'memory-card', component: MemoryCardGame, meta: { title: '记忆翻牌', icon: '🃏', group: 'game-card' } },
  { path: '/spider-solitaire', name: 'spider-solitaire', component: SpiderSolitaireGame, meta: { title: '蜘蛛纸牌', icon: '🕷️', group: 'game-card' } },
  { path: '/blackjack', name: 'blackjack', component: BlackjackGame, meta: { title: '21点', icon: '🎴', group: 'game-card' } },
  // 🧠 文字模拟
  { path: '/game-of-life', name: 'game-of-life', component: GameOfLife, meta: { title: '生命游戏', icon: '🧬', group: 'game-sim' } },
  { path: '/typing', name: 'typing', component: TypingGame, meta: { title: '打字游戏', icon: '⌨️', group: 'game-sim' } },
  { path: '/tic-tac-toe', name: 'tic-tac-toe', component: TicTacToeGame, meta: { title: '井字棋', icon: '❌', group: 'game-sim' } },
  { path: '/huarong', name: 'huarong', component: HuarongGame, meta: { title: '华容道', icon: '🧩', group: 'game-sim' } },
]

export const toolGroups = {
  'game-puzzle': { label: '休闲益智', icon: '🧩' },
  'game-board': { label: '棋牌桌游', icon: '♟️' },
  'game-action': { label: '动作街机', icon: '🕹️' },
  'game-card': { label: '卡牌策略', icon: '🃏' },
  'game-sim': { label: '文字模拟', icon: '🧠' },
}
