// 연산 문제는 손으로 쓰지 않고 규칙으로 만들어 냅니다.
// 단계별로 '어떤 계산까지 나오는가' 만 여기서 정합니다.

import type { ChoiceQuestion, Level, NumberQuestion, Question } from '../types'

function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

const COUNT_EMOJIS = ['🍎', '🍓', '🐟', '⭐', '🐥', '🍪', '🎈', '🐞'] as const

let seq = 0
function nextId(): string {
  seq += 1
  return `gen:${Date.now()}:${seq}`
}

/** 정답 근처의 틀린 숫자 3개를 만들어 보기 4개를 작은 수부터 늘어놓습니다. 0 미만은 안 나옵니다. */
function numberChoices(answer: number, spread = 3): { choices: string[]; answerIndex: number } {
  const wrong = new Set<number>()
  let guard = 0
  while (wrong.size < 3 && guard < 50) {
    guard += 1
    const d = rand(-spread, spread)
    const n = answer + d
    if (d !== 0 && n >= 0) wrong.add(n)
  }
  // 정답이 0이나 1이면 근처 수가 부족할 수 있어 위로 채웁니다
  let extra = answer + spread + 1
  while (wrong.size < 3) {
    wrong.add(extra)
    extra += 1
  }
  const all = [answer, ...wrong].sort((a, b) => a - b)
  return { choices: all.map(String), answerIndex: all.indexOf(answer) }
}

function choice(level: Level, prompt: string, answer: number, visual?: string, spread?: number): ChoiceQuestion {
  const c = numberChoices(answer, spread)
  return {
    id: nextId(),
    kind: 'choice',
    level,
    subject: 'math',
    prompt,
    visual,
    choices: c.choices,
    answerIndex: c.answerIndex,
  }
}

function typed(level: Level, prompt: string, answer: number): NumberQuestion {
  return { id: nextId(), kind: 'number', level, subject: 'math', prompt, answer }
}

// ── 1단계: 한 자리 더하기 빼기 연습 ──────────────────────────────────
// 6살이 한 자리 수 더하기 빼기를 연습하는 단계. 찍어서 맞히지 못하게 숫자를 직접 넣습니다.
// 넷 중 하나는 그림을 함께 보여 줘서 손가락 대신 그림을 세며 풀 수 있게 합니다.
function level1(): Question {
  const kind = rand(1, 4)
  if (kind === 1) {
    // 합이 10 안
    const a = rand(1, 8)
    const b = rand(1, 9 - a)
    return typed(1, `${a} + ${b} = ?`, a + b)
  }
  if (kind === 2) {
    // 합이 10을 넘는 한 자리 더하기 (받아올림)
    const a = rand(2, 9)
    const b = rand(11 - a, 9)
    return typed(1, `${a} + ${b} = ?`, a + b)
  }
  if (kind === 3) {
    const a = rand(2, 9)
    const b = rand(1, a - 1)
    return typed(1, `${a} - ${b} = ?`, a - b)
  }
  const emoji = pick(COUNT_EMOJIS)
  const a = rand(1, 5)
  const b = rand(1, 9 - a)
  return { ...typed(1, `${a} + ${b} = ?`, a + b), visual: `${emoji.repeat(a)} + ${emoji.repeat(b)}` }
}

// ── 2단계: 20 안의 더하기 빼기 (받아올림·받아내림 포함) ─────────────────
function level2(): Question {
  const kind = rand(1, 4)
  if (kind === 1) {
    const a = rand(2, 12)
    const b = rand(1, 20 - a)
    return typed(2, `${a} + ${b} = ?`, a + b)
  }
  if (kind === 2) {
    const a = rand(5, 20)
    const b = rand(1, a - 1)
    return typed(2, `${a} - ${b} = ?`, a - b)
  }
  if (kind === 3) {
    // 10 만들기: 7 + □ = 10
    const a = rand(1, 9)
    return typed(2, `${a} + □ = 10   □ 는?`, 10 - a)
  }
  const a = rand(1, 18)
  return choice(2, `${a} 다음 수는 무엇일까요?`, a + 1, undefined, 2)
}

// ── 3단계: 두 자리 계산, 구구단 2~5단 ─────────────────────────────────
function level3(): Question {
  const kind = rand(1, 3)
  if (kind === 1) {
    const a = rand(11, 60)
    const b = rand(11, 99 - a)
    return typed(3, `${a} + ${b} = ?`, a + b)
  }
  if (kind === 2) {
    const a = rand(20, 99)
    const b = rand(1, a - 10)
    return typed(3, `${a} - ${b} = ?`, a - b)
  }
  const a = rand(2, 5)
  const b = rand(1, 9)
  return typed(3, `${a} × ${b} = ?`, a * b)
}

// ── 4단계: 구구단 전체, 세 수, 100 넘는 더하기, 나눗셈 ───────────────
function level4(): Question {
  const kind = rand(1, 4)
  if (kind === 1) {
    const a = rand(2, 9)
    const b = rand(2, 9)
    return typed(4, `${a} × ${b} = ?`, a * b)
  }
  if (kind === 2) {
    const a = rand(10, 60)
    const b = rand(10, 60)
    const c = rand(1, 30)
    return typed(4, `${a} + ${b} - ${c} = ?`, a + b - c)
  }
  if (kind === 3) {
    const a = rand(2, 9)
    const b = rand(2, 9)
    return typed(4, `${a * b} ÷ ${a} = ?`, b)
  }
  const a = rand(100, 500)
  const b = rand(100, 499)
  return typed(4, `${a} + ${b} = ?`, a + b)
}

// ── 5단계: 두 자리 × 한 자리, 세 자리 더하기 빼기, 두 자리 나눗셈, 빈칸 채우기 ──
function level5(): Question {
  const kind = rand(1, 5)
  if (kind === 1) {
    const a = rand(12, 49)
    const b = rand(2, 9)
    return typed(5, `${a} × ${b} = ?`, a * b)
  }
  if (kind === 2) {
    const a = rand(100, 600)
    const b = rand(100, 999 - a)
    return typed(5, `${a} + ${b} = ?`, a + b)
  }
  if (kind === 3) {
    const a = rand(300, 999)
    const b = rand(100, a - 100)
    return typed(5, `${a} - ${b} = ?`, a - b)
  }
  if (kind === 4) {
    const b = rand(2, 9)
    const q = rand(3, 12)
    return typed(5, `${b * q} ÷ ${b} = ?`, q)
  }
  const a = rand(10, 60)
  const c = rand(a + 10, 99)
  return typed(5, `${a} + □ = ${c}   □ 는?`, c - a)
}

export function generateMath(level: Level): Question {
  switch (level) {
    case 1:
      return level1()
    case 2:
      return level2()
    case 3:
      return level3()
    case 4:
      return level4()
    case 5:
      return level5()
  }
}
