// 게임 전체가 함께 쓰는 타입.

/** 문제 난이도. 아이마다 하나씩 고릅니다. 나이가 아니라 '지금 풀 수 있는 것' 기준입니다. */
export type Level = 1 | 2 | 3 | 4 | 5 | 6

export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5, 6]

export const LEVEL_INFO: Record<Level, { name: string; emoji: string; hint: string }> = {
  1: { name: '씨앗', emoji: '🌱', hint: '한 자리 더하기 빼기, 그림 상식 (5~6살)' },
  2: { name: '새싹', emoji: '🌿', hint: '20까지 더하기 빼기, 10 만들기 (6~7살)' },
  3: { name: '나무', emoji: '🌳', hint: '두 자리 계산, 구구단 2~5단 (1~2학년)' },
  4: { name: '숲', emoji: '🌲', hint: '구구단 전체, 세 수 계산 (2~3학년)' },
  5: { name: '산', emoji: '🏔️', hint: '세 자리 계산, 두 자리 곱셈, 나눗셈 (3~4학년)' },
  6: { name: '별', emoji: '⭐', hint: '두 자리끼리 곱셈, 나머지, 괄호 계산, 약수·배수 (4~5학년)' },
}

export type Subject = 'math' | 'science' | 'history' | 'scientist' | 'world' | 'riddle' | 'geo' | 'english'

export const SUBJECT_INFO: Record<Subject, { name: string; emoji: string }> = {
  math: { name: '수학', emoji: '🔢' },
  science: { name: '과학', emoji: '🔬' },
  history: { name: '역사 인물', emoji: '🏯' },
  scientist: { name: '과학자', emoji: '🧪' },
  world: { name: '세상 상식', emoji: '🌏' },
  riddle: { name: '넌센스', emoji: '🤪' },
  geo: { name: '지리', emoji: '🗺️' },
  english: { name: '영어', emoji: '📚' },
}

interface QuestionBase {
  /** 은행 문제는 고정 id, 자동 생성 문제는 'gen:' 으로 시작 */
  id: string
  level: Level
  subject: Subject
  /** 화면에 보이고 소리로도 읽어 주는 문장 */
  prompt: string
  /** 문장 위에 크게 보여 줄 그림(이모지). 세기 문제 등 */
  visual?: string
  /** 답을 보여 준 뒤 한 줄 설명. 소리로도 읽습니다 */
  explain?: string
}

/** 보기에서 고르는 문제. 보기는 3~4개 */
export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice'
  choices: string[]
  answerIndex: number
}

/** 숫자를 직접 넣는 문제 */
export interface NumberQuestion extends QuestionBase {
  kind: 'number'
  answer: number
}

export type Question = ChoiceQuestion | NumberQuestion

/** 기기에 저장되는 아이 정보 */
export interface Profile {
  id: string
  name: string
  emoji: string
  level: Level
  games: number
  wins: number
}
