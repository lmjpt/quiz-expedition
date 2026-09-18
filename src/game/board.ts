// 말판. 30칸을 6열 × 5줄로 지그재그(뱀 모양)로 놓습니다.
// 0번이 출발, 29번이 도착. 도착 칸을 넘어가도 도착으로 칩니다 — 딱 맞게
// 나와야 들어가는 규칙은 아이들이 싫어합니다.
//
// 말판은 세 장(숲·바다·우주)이고 판마다 돌려 씁니다. 칸 배치와 색, 이름이 다르고
// 규칙은 같습니다. 무작위로 섞지 않고 손으로 그립니다 — 그래야 사다리가 위로만
// 가고, 큰 사다리가 하나만 있는 균형을 지킬 수 있습니다.
//
// 새 말판을 그릴 때 지킬 것:
//   - 올라가는 칸(ladder)은 반드시 윗줄로, 내려가는 칸(slide)은 반드시 아랫줄로.
//     화면에 두 칸을 잇는 그림이 그려지므로 옆으로 가면 이상해 보입니다.
//   - 두 줄을 한 번에 오르는 큰 사다리는 한 장에 하나만.
//   - 미끄럼틀은 4~8칸 뒤로. 그 이상은 6살이 울어요.
//   - 시작·목표 칸이 다른 특수 칸과 겹치지 않게.

export type Tile =
  | { type: 'start' }
  | { type: 'goal' }
  | { type: 'quiz' }
  | { type: 'free'; decor: string }
  | { type: 'ladder'; to: number }
  | { type: 'slide'; to: number }
  | { type: 'swap' }

export type BoardId = 'forest' | 'sea' | 'space'

export interface Connector {
  /** 안내 창과 소리에 쓰는 이름. "사다리! 5칸 올라가요" */
  name: string
  emoji: string
  /** "올라가요" / "앞으로 가요" 같은 서술어 */
  verb: string
  /** 그림 색 (SVG) */
  color: string
  /** 그리는 방식 */
  style: 'ladder' | 'wave' | 'trail' | 'tube' | 'swirl'
}

export interface BoardTheme {
  /** "숲 모험" 처럼 화면 제목에 쓰는 이름 */
  title: string
  /** 목적지 이름. "마법의 성까지 47칸" */
  destination: string
  /** 판 전체 배경 (tailwind 클래스) */
  bg: string
  /** 칸을 잇는 길 색과 길 가장자리 색 */
  road: string
  roadEdge: string
  roadDash: string
  /** 보통 칸(징검돌) 색 (tailwind 클래스) */
  stone: string
  /** 빈 자리에 흩어 놓는 풍경 이모지 */
  decor: string[]
  start: string
  goal: string
  up: Connector
  down: Connector
  swapEmoji: string
}

export interface BoardDef {
  id: BoardId
  name: string
  emoji: string
  theme: BoardTheme
  tiles: readonly Tile[]
}

export const COLS = 8
export const ROWS = 6
export const GOAL = COLS * ROWS - 1 // 47

/** 퀴즈를 맞히면 보너스로 가는 칸 수 */
export const QUIZ_BONUS = 2

/*
  줄 배치 (row 0 이 맨 아래). 처음엔 30칸(6×5)이었는데 한 판이 너무 빨리 끝나서 48칸으로 키웠습니다.
    row5:  47 46 45 44 43 42 41 40
    row4:  32 33 34 35 36 37 38 39
    row3:  31 30 29 28 27 26 25 24
    row2:  16 17 18 19 20 21 22 23
    row1:  15 14 13 12 11 10  9  8
    row0:   0  1  2  3  4  5  6  7

  한 줄 위 같은 열:
    row0→1:  0→15 1→14 2→13 3→12 4→11 5→10 6→9 7→8
    row1→2:  8→23 9→22 10→21 11→20 12→19 13→18 14→17 15→16
    row2→3:  16→31 17→30 18→29 19→28 20→27 21→26 22→25 23→24
    row3→4:  24→39 25→38 26→37 27→36 28→35 29→34 30→33 31→32
    row4→5:  33→46 34→45 35→44 36→43 37→42 38→41 39→40
  두 줄 위 같은 열:  1→17 … 6→22 | 9→25 … 14→30 | 17→33 … 22→38 | 25→41 … 30→46
  왼쪽 열은 한 줄 위가 아주 멀고(0→15) 오른쪽 열은 바로 옆(7→8)입니다. 가운데 열을 쓰세요.
*/

const Q: Tile = { type: 'quiz' }
const S: Tile = { type: 'swap' }
const free = (decor: string): Tile => ({ type: 'free', decor })
const up = (to: number): Tile => ({ type: 'ladder', to })
const down = (to: number): Tile => ({ type: 'slide', to })

// 사다리: 4→11, 12→28(큰 것), 13→18, 20→27, 26→37, 34→45
// 미끄럼틀: 9→5, 17→14, 25→21, 33→30, 43→36   자리 바꾸기: 7, 23, 39
const FOREST: BoardDef = {
  id: 'forest',
  name: '숲',
  emoji: '🌳',
  theme: {
    title: '숲 모험',
    destination: '마법의 성',
    bg: 'bg-gradient-to-b from-sky-300 via-lime-100 to-green-300',
    road: '#f6e7c4',
    roadEdge: '#c9a86a',
    roadDash: '#b89562',
    stone: 'bg-amber-50 border-amber-200',
    decor: ['🌳', '🌲', '🌳', '⛰️', '☁️', '🌲', '🌼', '🍄', '🐿️', '🦋', '🌳', '🪨'],
    start: '🏠',
    goal: '🏰',
    up: { name: '사다리', emoji: '🪜', verb: '올라가요', color: '#b9772f', style: 'ladder' },
    down: { name: '미끄럼틀', emoji: '🛝', verb: '내려가요', color: '#79c3f2', style: 'tube' },
    swapEmoji: '🔄',
  },
  tiles: [
    // row0: 0~7
    { type: 'start' }, Q, free('🌳'), Q, up(11), Q, Q, S,
    // row1: 8~15
    Q, down(5), Q, Q, up(28), up(18), Q, Q,
    // row2: 16~23
    free('🌷'), down(14), Q, Q, up(27), Q, Q, S,
    // row3: 24~31
    Q, down(21), up(37), Q, Q, Q, Q, free('🍄'),
    // row4: 32~39
    Q, down(30), up(45), Q, Q, Q, free('🪵'), S,
    // row5: 40~47
    Q, free('🌲'), Q, down(36), Q, Q, Q, { type: 'goal' },
  ],
}

// 파도: 2→13, 11→20, 18→29, 21→37(큰 것), 27→36, 35→44
// 소용돌이: 10→4, 19→12, 26→22, 33→30, 41→38   자리 바꾸기: 7, 24, 39
const SEA: BoardDef = {
  id: 'sea',
  name: '바다',
  emoji: '🌊',
  theme: {
    title: '바다 모험',
    destination: '보물섬',
    bg: 'bg-gradient-to-b from-sky-200 via-cyan-300 to-blue-500',
    road: '#fbf3dc',
    roadEdge: '#e2cf9a',
    roadDash: '#8cc9e6',
    stone: 'bg-yellow-50 border-yellow-200',
    decor: ['🐟', '🌊', '🐬', '🐚', '🌊', '🐠', '⛵', '🐙', '🌊', '🦀', '☁️', '🐡'],
    start: '⛵',
    goal: '🏝️',
    up: { name: '파도타기', emoji: '🌊', verb: '앞으로 가요', color: '#17a2a0', style: 'wave' },
    down: { name: '소용돌이', emoji: '🌀', verb: '뒤로 가요', color: '#5b6fd6', style: 'swirl' },
    swapEmoji: '🐙',
  },
  tiles: [
    // row0: 0~7
    { type: 'start' }, Q, up(13), Q, Q, free('🐚'), Q, S,
    // row1: 8~15
    Q, Q, down(4), up(20), Q, Q, Q, Q,
    // row2: 16~23
    free('🐠'), Q, up(29), down(12), Q, up(37), Q, Q,
    // row3: 24~31
    S, Q, down(22), up(36), Q, Q, Q, free('🦀'),
    // row4: 32~39
    Q, down(30), free('🐬'), up(44), Q, Q, Q, S,
    // row5: 40~47
    Q, down(38), Q, Q, Q, Q, free('⛱️'), { type: 'goal' },
  ],
}

// 로켓: 5→10, 11→20, 14→17, 19→35(큰 것), 29→34, 37→42
// 블랙홀: 12→6, 18→13, 27→21, 36→28, 43→38   자리 바꾸기: 7, 24, 40
const SPACE: BoardDef = {
  id: 'space',
  name: '우주',
  emoji: '🚀',
  theme: {
    title: '우주 모험',
    destination: '토성',
    bg: 'bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-950',
    road: '#3b3a7a',
    roadEdge: '#6e6cc4',
    roadDash: '#c7c3ff',
    stone: 'bg-slate-100 border-indigo-300',
    decor: ['⭐', '✨', '🌟', '⭐', '☄️', '✨', '🛸', '⭐', '🌙', '✨', '⭐', '👾'],
    start: '🌍',
    goal: '🪐',
    up: { name: '로켓', emoji: '🚀', verb: '날아가요', color: '#ffd166', style: 'trail' },
    down: { name: '블랙홀', emoji: '🕳️', verb: '빨려가요', color: '#8b5cf6', style: 'swirl' },
    swapEmoji: '🛸',
  },
  tiles: [
    // row0: 0~7
    { type: 'start' }, Q, free('⭐'), Q, Q, up(10), Q, S,
    // row1: 8~15
    Q, Q, Q, up(20), down(6), Q, up(17), Q,
    // row2: 16~23
    free('🛸'), Q, down(13), up(35), Q, Q, Q, Q,
    // row3: 24~31
    S, Q, free('🌟'), down(21), Q, up(34), Q, free('☄️'),
    // row4: 32~39
    Q, Q, Q, Q, down(28), up(42), Q, free('🌙'),
    // row5: 40~47
    S, Q, Q, down(38), Q, Q, Q, { type: 'goal' },
  ],
}

export const BOARDS: readonly BoardDef[] = [FOREST, SEA, SPACE]

export function getBoard(id: BoardId): BoardDef {
  return BOARDS.find((b) => b.id === id) ?? FOREST
}

/** 판이 끝나면 다음 말판으로. 마지막 뒤에는 처음으로 */
export function nextBoardId(id: BoardId | null): BoardId {
  if (id === null) return BOARDS[0].id
  const i = BOARDS.findIndex((b) => b.id === id)
  return BOARDS[(i + 1) % BOARDS.length].id
}

/** 칸 종류별 돌판 색. 배경이 밝든 어둡든 보이게 밝은 색만 씁니다 */
export const TILE_BG: Record<Tile['type'], string> = {
  start: 'bg-amber-100 border-amber-300',
  goal: 'bg-yellow-200 border-yellow-400',
  quiz: 'bg-white border-sky-300',
  free: 'bg-lime-50 border-lime-300',
  ladder: 'bg-orange-50 border-orange-300',
  slide: 'bg-violet-50 border-violet-300',
  swap: 'bg-pink-50 border-pink-300',
}

export const TILE_NAME: Record<Tile['type'], string> = {
  start: '출발',
  goal: '도착',
  quiz: '보너스 문제',
  free: '쉬는 칸',
  ladder: '올라가는 칸',
  slide: '내려가는 칸',
  swap: '자리 바꾸기',
}

/** 칸 번호 → 격자 위치. row 0 이 맨 아래 줄 */
export function tileGrid(index: number): { row: number; col: number } {
  const row = Math.floor(index / COLS)
  const inRow = index % COLS
  const col = row % 2 === 0 ? inRow : COLS - 1 - inRow
  return { row, col }
}

/** 칸 번호 → 칸 가운데 좌표 (0~100, 왼쪽 위가 원점). 말과 그림 그릴 때 씁니다 */
export function tileCenter(index: number): { x: number; y: number } {
  const { row, col } = tileGrid(index)
  return { x: ((col + 0.5) / COLS) * 100, y: ((ROWS - 1 - row + 0.5) / ROWS) * 100 }
}

export function clampPos(pos: number): number {
  return Math.max(0, Math.min(GOAL, pos))
}
