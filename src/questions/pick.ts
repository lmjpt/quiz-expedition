// 다음 문제를 고르는 규칙.
//
// - 연산 문제는 열에 셋. 처음엔 반반이었는데 산수가 너무 자주 나온다는 말을 들었습니다.
// - 상식 문제는 최근에 나온 것을 피합니다. 다 나왔으면 처음부터 다시 돕니다.
// - 보기 순서는 매번 섞습니다 (은행에는 정답이 0번에 있어도 됩니다).

import type { ChoiceQuestion, Level, Question } from '../types'
import { generateMath } from './arithmetic'
import { KNOWLEDGE } from './knowledge'

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function shuffleChoices(q: ChoiceQuestion): ChoiceQuestion {
  const order = shuffle(q.choices.map((_, i) => i))
  return {
    ...q,
    choices: order.map((i) => q.choices[i]),
    answerIndex: order.indexOf(q.answerIndex),
  }
}

/** 연산 문제가 나오는 비율 */
export const MATH_SHARE = 0.3

export function pickQuestion(level: Level, recentIds: readonly string[]): Question {
  if (Math.random() < MATH_SHARE) return generateMath(level)

  const pool = KNOWLEDGE.filter((q) => q.level === level)
  if (pool.length === 0) return generateMath(level)

  const recent = new Set(recentIds)
  const fresh = pool.filter((q) => !recent.has(q.id))
  const from = fresh.length > 0 ? fresh : pool
  const q = from[Math.floor(Math.random() * from.length)]
  return q.kind === 'choice' ? shuffleChoices(q) : q
}

/** 연산 없이 상식 문제만 하나. 여권 놀이처럼 산수가 어울리지 않는 곳에서 씁니다 */
export function pickKnowledge(level: Level, recentIds: readonly string[]): Question {
  const pool = KNOWLEDGE.filter((q) => q.level === level)
  if (pool.length === 0) return generateMath(level)
  const recent = new Set(recentIds)
  const fresh = pool.filter((q) => !recent.has(q.id))
  const from = fresh.length > 0 ? fresh : pool
  return shuffleChoices(from[Math.floor(Math.random() * from.length)])
}

/** 보기를 섞어서 냅니다. 은행에는 정답이 0번에 있습니다 */
export function withShuffledChoices(q: ChoiceQuestion): ChoiceQuestion {
  return shuffleChoices(q)
}

/** 정답을 문장으로. 소리로 읽어 줄 때 씁니다 */
export function answerText(q: Question): string {
  return q.kind === 'choice' ? q.choices[q.answerIndex] : String(q.answer)
}
