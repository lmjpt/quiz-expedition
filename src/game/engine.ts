// 게임 진행 규칙. 화면과 타이밍(애니메이션, 로봇 지연)은 모르고,
// '이 상태에서 이 일이 생기면 다음 상태는 무엇인가' 만 답합니다.
//
// 한 차례의 흐름:
//   문제(차례 문제) → 맞히면 주사위를 굴림 / 틀리면 굴리지 못하고 다음 사람
//   → 이동 → 칸 확인
//     퀴즈 칸이면 보너스 문제 하나 더 (맞히면 2칸 더)
//     사다리·미끄럼틀·자리 바꾸기면 안내 뒤 적용
//   → 다음 사람
//
// 지켜야 할 것: 틀렸다고 뒤로 가는 일은 없습니다. 뒤로 가는 건 미끄럼틀 칸(운)만.
// (처음엔 틀려도 굴리고 맞히면 주사위에 +2 였는데, "맞혀야 굴린다" 가 더 명확해서 바꿨습니다)

import type { Level, Question } from '../types'
import { GOAL, QUIZ_BONUS, clampPos, getBoard, type BoardId } from './board'

/** 매 차례 시작에 나오는 문제인지, 퀴즈 칸에 떨어져 나온 보너스 문제인지 */
export type QuizStage = 'turn' | 'tile'

/** 첫째 말, 둘째 말 색. 말 테두리와 지나온 길에 씁니다 */
export const PLAYER_COLORS = ['#e8795a', '#3f9d8a'] as const

export interface PlayerState {
  profileId: string
  name: string
  emoji: string
  level: Level
  pos: number
  answered: number
  correct: number
  isBot: boolean
}

export type Phase =
  /** 문제가 필요함. 화면이 문제를 골라 'ask' 로 넘겨 줍니다 (규칙은 문제 은행을 모릅니다) */
  | { kind: 'needQuestion'; stage: QuizStage }
  /** 문제를 풀고 있음 */
  | { kind: 'quiz'; stage: QuizStage; question: Question }
  /** 정답 여부를 보여 주는 중. 계속 누르면 다음으로 */
  | { kind: 'quizResult'; stage: QuizStage; question: Question; correct: boolean; bonusTo: number | null }
  /** 주사위를 기다림 */
  | { kind: 'idle' }
  /** 주사위가 나왔고 말이 이동 중 */
  | { kind: 'rolled'; dice: number; from: number; to: number }
  /** 사다리·미끄럼틀·자리 바꾸기 안내. 계속 누르면 적용 */
  | { kind: 'tileEvent'; text: string; emoji: string; moves: { player: number; to: number }[] }
  | { kind: 'finished'; winner: number }

export interface GameState {
  boardId: BoardId
  players: PlayerState[]
  current: number
  phase: Phase
  turn: number
}

export type Action =
  | { type: 'ask'; question: Question }
  | { type: 'roll'; dice: number }
  | { type: 'land' }
  | { type: 'answer'; correct: boolean }
  | { type: 'continue' }
  /** 판 도중에 단계를 바꿈. 다음 문제부터 적용 */
  | { type: 'setLevel'; player: number; level: Level }

export function newGame(players: PlayerState[], boardId: BoardId): GameState {
  return { boardId, players, current: 0, phase: { kind: 'needQuestion', stage: 'turn' }, turn: 1 }
}

function nextTurn(state: GameState): GameState {
  return {
    ...state,
    current: (state.current + 1) % state.players.length,
    phase: { kind: 'needQuestion', stage: 'turn' },
    turn: state.turn + 1,
  }
}

function withPos(state: GameState, index: number, pos: number): GameState {
  const players = state.players.map((p, i) => (i === index ? { ...p, pos: clampPos(pos) } : p))
  return { ...state, players }
}

function finished(state: GameState): GameState {
  return { ...state, phase: { kind: 'finished', winner: state.current } }
}

export function reduce(state: GameState, action: Action): GameState {
  const me = state.players[state.current]

  switch (action.type) {
    case 'setLevel': {
      const players = state.players.map((p, i) => (i === action.player ? { ...p, level: action.level } : p))
      return { ...state, players }
    }

    case 'ask': {
      if (state.phase.kind !== 'needQuestion') return state
      return { ...state, phase: { kind: 'quiz', stage: state.phase.stage, question: action.question } }
    }

    case 'answer': {
      if (state.phase.kind !== 'quiz') return state
      const players = state.players.map((p, i) =>
        i === state.current
          ? { ...p, answered: p.answered + 1, correct: p.correct + (action.correct ? 1 : 0) }
          : p,
      )
      const { stage, question } = state.phase
      // 차례 문제는 주사위를 굴릴 자격만 정합니다. 보너스 문제는 맞히면 2칸 더
      const bonusTo = stage === 'tile' && action.correct ? clampPos(me.pos + QUIZ_BONUS) : null
      return { ...state, players, phase: { kind: 'quizResult', stage, question, correct: action.correct, bonusTo } }
    }

    case 'roll': {
      if (state.phase.kind !== 'idle') return state
      const to = clampPos(me.pos + action.dice)
      return { ...state, phase: { kind: 'rolled', dice: action.dice, from: me.pos, to } }
    }

    case 'land': {
      if (state.phase.kind !== 'rolled') return state
      const to = state.phase.to
      const moved = withPos(state, state.current, to)
      if (to >= GOAL) return finished(moved)

      const board = getBoard(state.boardId)
      const tile = board.tiles[to]
      switch (tile.type) {
        case 'quiz':
          return { ...moved, phase: { kind: 'needQuestion', stage: 'tile' } }
        case 'ladder': {
          const c = board.theme.up
          return {
            ...moved,
            phase: {
              kind: 'tileEvent',
              emoji: c.emoji,
              text: `${c.name}! ${tile.to - to}칸 ${c.verb}`,
              moves: [{ player: state.current, to: clampPos(tile.to) }],
            },
          }
        }
        case 'slide': {
          const c = board.theme.down
          return {
            ...moved,
            phase: {
              kind: 'tileEvent',
              emoji: c.emoji,
              text: `${c.name}! ${to - tile.to}칸 ${c.verb}`,
              moves: [{ player: state.current, to: clampPos(tile.to) }],
            },
          }
        }
        case 'swap': {
          const other = (state.current + 1) % state.players.length
          const otherPos = state.players[other].pos
          if (other === state.current || otherPos === to) return nextTurn(moved)
          return {
            ...moved,
            phase: {
              kind: 'tileEvent',
              emoji: board.theme.swapEmoji,
              text: `자리 바꾸기! ${state.players[other].name}와 자리를 바꿔요`,
              moves: [
                { player: state.current, to: otherPos },
                { player: other, to },
              ],
            },
          }
        }
        case 'free':
        case 'start':
        case 'goal':
          return nextTurn(moved)
      }
      return nextTurn(moved)
    }

    case 'continue': {
      if (state.phase.kind === 'quizResult') {
        // 차례 문제: 맞혔으면 주사위, 틀렸으면 다음 사람. 보너스 문제 뒤에는 보너스 이동하고 다음 사람
        if (state.phase.stage === 'turn') return state.phase.correct ? { ...state, phase: { kind: 'idle' } } : nextTurn(state)
        if (state.phase.bonusTo === null) return nextTurn(state)
        const moved = withPos(state, state.current, state.phase.bonusTo)
        if (state.phase.bonusTo >= GOAL) return finished(moved)
        return nextTurn(moved)
      }
      if (state.phase.kind === 'tileEvent') {
        let next = state
        for (const m of state.phase.moves) next = withPos(next, m.player, m.to)
        if (next.players[state.current].pos >= GOAL) return finished(next)
        return nextTurn(next)
      }
      return state
    }
  }
}
