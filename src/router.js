import JsonTool from './views/JsonTool.vue'
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
import Base64Tool from './views/Base64Tool.vue'
import CodeFormatTool from './views/CodeFormatTool.vue'
import RegexTool from './views/RegexTool.vue'
import TimestampTool from './views/TimestampTool.vue'
import QrcodeTool from './views/QrcodeTool.vue'
import PasswordTool from './views/PasswordTool.vue'
import PostmanTool from './views/PostmanTool.vue'
import ImageTool from './views/ImageTool.vue'
import A11yTool from './views/A11yTool.vue'
import ColorConvertTool from './views/ColorConvertTool.vue'
import ColorPaletteTool from './views/ColorPaletteTool.vue'
import GradientTool from './views/GradientTool.vue'
import TraditionalColorsTool from './views/TraditionalColorsTool.vue'
import ZhConvertTool from './views/ZhConvertTool.vue'
import PinyinTool from './views/PinyinTool.vue'
import AmountTool from './views/AmountTool.vue'
import CaseConvertTool from './views/CaseConvertTool.vue'
import MarkdownTool from './views/MarkdownTool.vue'
import BaseConvertTool from './views/BaseConvertTool.vue'
import UuidTool from './views/UuidTool.vue'
import NginxTool from './views/NginxTool.vue'
import BgRemoverTool from './views/BgRemoverTool.vue'
import VideoGifTool from './views/VideoGifTool.vue'
import FileCompressTool from './views/FileCompressTool.vue'
import UrlTool from './views/UrlTool.vue'
import HashTool from './views/HashTool.vue'
import JwtTool from './views/JwtTool.vue'
import DiffTool from './views/DiffTool.vue'
import CronTool from './views/CronTool.vue'
import HtmlEntityTool from './views/HtmlEntityTool.vue'
import SqliteTool from './views/SqliteTool.vue'
import SqlFormatTool from './views/SqlFormatTool.vue'
import CssShadowTool from './views/CssShadowTool.vue'
import CssRadiusTool from './views/CssRadiusTool.vue'
import CssAnimationTool from './views/CssAnimationTool.vue'
import TextStatsTool from './views/TextStatsTool.vue'
import FullwidthTool from './views/FullwidthTool.vue'
import DateCalcTool from './views/DateCalcTool.vue'
import CountdownTool from './views/CountdownTool.vue'
import NumChineseTool from './views/NumChineseTool.vue'
import CssFlexTool from './views/CssFlexTool.vue'
import TextSortTool from './views/TextSortTool.vue'
import CsvJsonTool from './views/CsvJsonTool.vue'
import IpCalcTool from './views/IpCalcTool.vue'
import BarcodeTool from './views/BarcodeTool.vue'
import HttpStatusTool from './views/HttpStatusTool.vue'
import KeyCodeTool from './views/KeyCodeTool.vue'
import EncryptTool from './views/EncryptTool.vue'
import SvgTool from './views/SvgTool.vue'
import CssUnitTool from './views/CssUnitTool.vue'
import CodeShotTool from './views/CodeShotTool.vue'
import GitCheatTool from './views/GitCheatTool.vue'
import ImgConvertTool from './views/ImgConvertTool.vue'
import MorseTool from './views/MorseTool.vue'
import RandomTool from './views/RandomTool.vue'

export const routes = [
  { path: '/', redirect: '/json' },
  // 文本与代码
  { path: '/json', name: 'json', component: JsonTool, meta: { title: 'JSON 格式化', icon: '📐', group: 'text' } },
  { path: '/base64', name: 'base64', component: Base64Tool, meta: { title: 'Base64 编解码', icon: '🔐', group: 'text' } },
  { path: '/code-format', name: 'code-format', component: CodeFormatTool, meta: { title: '代码美化压缩', icon: '🎨', group: 'text' } },
  { path: '/regex', name: 'regex', component: RegexTool, meta: { title: '正则测试器', icon: '🔍', group: 'text' } },
  { path: '/url', name: 'url', component: UrlTool, meta: { title: 'URL编解码', icon: '🔗', group: 'text' } },
  { path: '/html-entity', name: 'html-entity', component: HtmlEntityTool, meta: { title: 'HTML实体编解码', icon: '📄', group: 'text' } },
  { path: '/sql-format', name: 'sql-format', component: SqlFormatTool, meta: { title: 'SQL格式化', icon: '🗃️', group: 'text' } },
  { path: '/csv-json', name: 'csv-json', component: CsvJsonTool, meta: { title: 'CSV/JSON互转', icon: '📊', group: 'text' } },
  // 时间与数据
  { path: '/timestamp', name: 'timestamp', component: TimestampTool, meta: { title: '时间戳转换', icon: '🕐', group: 'time' } },
  { path: '/qrcode', name: 'qrcode', component: QrcodeTool, meta: { title: '二维码生成', icon: '📱', group: 'time' } },
  { path: '/password', name: 'password', component: PasswordTool, meta: { title: '密码生成器', icon: '🔑', group: 'time' } },
  { path: '/date-calc', name: 'date-calc', component: DateCalcTool, meta: { title: '日期计算器', icon: '📅', group: 'time' } },
  { path: '/countdown', name: 'countdown', component: CountdownTool, meta: { title: '倒计时工具', icon: '⏳', group: 'time' } },
  { path: '/barcode', name: 'barcode', component: BarcodeTool, meta: { title: '条形码生成', icon: '🏷️', group: 'time' } },
  { path: '/random', name: 'random', component: RandomTool, meta: { title: '随机决策器', icon: '🎲', group: 'time' } },
  // 颜色与视觉
  { path: '/color-convert', name: 'color-convert', component: ColorConvertTool, meta: { title: '颜色格式转换', icon: '🎨', group: 'color' } },
  { path: '/color-palette', name: 'color-palette', component: ColorPaletteTool, meta: { title: '配色方案生成', icon: '🎯', group: 'color' } },
  { path: '/gradient', name: 'gradient', component: GradientTool, meta: { title: '渐变生成器', icon: '🌈', group: 'color' } },
  { path: '/traditional-colors', name: 'traditional-colors', component: TraditionalColorsTool, meta: { title: '传统色彩库', icon: '🏮', group: 'color' } },
  { path: '/css-shadow', name: 'css-shadow', component: CssShadowTool, meta: { title: 'CSS阴影生成器', icon: '🖼️', group: 'color' } },
  { path: '/css-radius', name: 'css-radius', component: CssRadiusTool, meta: { title: 'CSS圆角生成器', icon: '⬜', group: 'color' } },
  { path: '/css-animation', name: 'css-animation', component: CssAnimationTool, meta: { title: 'CSS动画生成器', icon: '🎭', group: 'color' } },
  { path: '/css-flex', name: 'css-flex', component: CssFlexTool, meta: { title: 'CSS Flexbox生成器', icon: '🧩', group: 'color' } },
  { path: '/css-unit', name: 'css-unit', component: CssUnitTool, meta: { title: 'CSS单位转换', icon: '📐', group: 'color' } },
  // 文本与字符
  { path: '/zh-convert', name: 'zh-convert', component: ZhConvertTool, meta: { title: '繁简转换', icon: '字', group: 'char' } },
  { path: '/pinyin', name: 'pinyin', component: PinyinTool, meta: { title: '汉字转拼音', icon: '🔤', group: 'char' } },
  { path: '/amount', name: 'amount', component: AmountTool, meta: { title: '金额大写', icon: '💰', group: 'char' } },
  { path: '/case-convert', name: 'case-convert', component: CaseConvertTool, meta: { title: '大小写转换', icon: 'Aa', group: 'char' } },
  { path: '/markdown', name: 'markdown', component: MarkdownTool, meta: { title: 'Markdown排版', icon: '📝', group: 'char' } },
  { path: '/text-stats', name: 'text-stats', component: TextStatsTool, meta: { title: '文本字数统计', icon: '📏', group: 'char' } },
  { path: '/fullwidth', name: 'fullwidth', component: FullwidthTool, meta: { title: '全角/半角转换', icon: '🔄', group: 'char' } },
  { path: '/num-chinese', name: 'num-chinese', component: NumChineseTool, meta: { title: '数字大小写转换', icon: '🔢', group: 'char' } },
  { path: '/text-sort', name: 'text-sort', component: TextSortTool, meta: { title: '文本去重排序', icon: '📑', group: 'char' } },
  { path: '/morse', name: 'morse', component: MorseTool, meta: { title: '摩尔斯电码', icon: '📡', group: 'char' } },
  // 开发者辅助
  { path: '/base-convert', name: 'base-convert', component: BaseConvertTool, meta: { title: '进制转换', icon: '🔢', group: 'dev' } },
  { path: '/uuid', name: 'uuid', component: UuidTool, meta: { title: 'UUID/随机数', icon: '🆔', group: 'dev' } },
  { path: '/nginx', name: 'nginx', component: NginxTool, meta: { title: 'Nginx配置', icon: '⚙️', group: 'dev' } },
  { path: '/hash', name: 'hash', component: HashTool, meta: { title: 'Hash计算', icon: '🧮', group: 'dev' } },
  { path: '/jwt', name: 'jwt', component: JwtTool, meta: { title: 'JWT解码', icon: '🔑', group: 'dev' } },
  { path: '/diff', name: 'diff', component: DiffTool, meta: { title: '文本差异对比', icon: '📊', group: 'dev' } },
  { path: '/cron', name: 'cron', component: CronTool, meta: { title: 'Cron表达式', icon: '⏱️', group: 'dev' } },
  { path: '/ip-calc', name: 'ip-calc', component: IpCalcTool, meta: { title: 'IP子网计算器', icon: '🌐', group: 'dev' } },
  { path: '/http-status', name: 'http-status', component: HttpStatusTool, meta: { title: 'HTTP状态码速查', icon: '📋', group: 'dev' } },
  { path: '/key-code', name: 'key-code', component: KeyCodeTool, meta: { title: '键盘键码查询', icon: '⌨️', group: 'dev' } },
  { path: '/encrypt', name: 'encrypt', component: EncryptTool, meta: { title: '文本加密解密', icon: '🔒', group: 'dev' } },
  { path: '/git-cheat', name: 'git-cheat', component: GitCheatTool, meta: { title: 'Git命令速查', icon: '📦', group: 'dev' } },
  // 进阶与多媒体
  { path: '/postman', name: 'postman', component: PostmanTool, meta: { title: '接口调试', icon: '🚀', group: 'advanced' } },
  { path: '/image', name: 'image', component: ImageTool, meta: { title: '图片处理', icon: '🖼️', group: 'advanced' } },
  { path: '/a11y', name: 'a11y', component: A11yTool, meta: { title: '无障碍辅助', icon: '♿', group: 'advanced' } },
  { path: '/svg', name: 'svg', component: SvgTool, meta: { title: 'SVG预览编辑', icon: '🖼️', group: 'advanced' } },
  { path: '/code-shot', name: 'code-shot', component: CodeShotTool, meta: { title: '代码截图', icon: '📸', group: 'advanced' } },
  { path: '/bg-remover', name: 'bg-remover', component: BgRemoverTool, meta: { title: '在线抠图', icon: '✂️', group: 'media' } },
  { path: '/video-gif', name: 'video-gif', component: VideoGifTool, meta: { title: '视频转GIF', icon: '🎬', group: 'media' } },
  { path: '/file-compress', name: 'file-compress', component: FileCompressTool, meta: { title: '文件压缩', icon: '📦', group: 'media' } },
  { path: '/img-convert', name: 'img-convert', component: ImgConvertTool, meta: { title: '图片格式转换', icon: '🔄', group: 'media' } },
  { path: '/sqlite', name: 'sqlite', component: SqliteTool, meta: { title: 'SQLite查看', icon: '🗄️', group: 'dev' } },
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
  text: { label: '文本与代码', icon: '📝' },
  time: { label: '时间与数据', icon: '⏰' },
  color: { label: '颜色与视觉', icon: '🎨' },
  char: { label: '文本与字符', icon: '📖' },
  dev: { label: '开发者辅助', icon: '💻' },
  advanced: { label: '进阶工具', icon: '⚡' },
  media: { label: '多媒体处理', icon: '🎞️' },
  'game-puzzle': { label: '休闲益智', icon: '🧩' },
  'game-board': { label: '棋牌桌游', icon: '♟️' },
  'game-action': { label: '动作街机', icon: '🕹️' },
  'game-card': { label: '卡牌策略', icon: '🃏' },
  'game-sim': { label: '文字模拟', icon: '🧠' },
}
