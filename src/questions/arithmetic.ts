// 연산 문제는 손으로 쓰지 않고 규칙으로 만들어 냅니다.
// 단계별로 '어떤 계산까지 나오는가' 만 여기서 정합니다.
//
// 전부 숫자를 직접 넣는 문제입니다. 보기 고르기는 찍어도 넷에 하나가 맞아서 연습이 안 됩니다.
// 처음엔 그림 세기(씨앗) 단계와 "n 다음 수는?" 문제가 있었는데 6살에게도 너무 쉬워서 뺐습니다.

import type { Level, NumberQuestion, Question } from '../types'

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

function typed(level: Level, prompt: string, answer: number, visual?: string): NumberQuestion {
  return { id: nextId(), kind: 'number', level, subject: 'math', prompt, answer, visual }
}

// ── 1단계(새싹): 20 안의 더하기 빼기 (받아올림·받아내림 포함), 10 만들기 ───────
// 넷 중 하나는 그림을 함께 보여 줘서 손가락 대신 그림을 세며 풀 수 있게 합니다.
function level1(): Question {
  const kind = rand(1, 4)
  if (kind === 1) {
    const a = rand(2, 12)
    const b = rand(1, 20 - a)
    return typed(1, `${a} + ${b} = ?`, a + b)
  }
  if (kind === 2) {
    const a = rand(5, 20)
    const b = rand(1, a - 1)
    return typed(1, `${a} - ${b} = ?`, a - b)
  }
  if (kind === 3) {
    const a = rand(1, 9)
    return typed(1, `${a} + □ = 10   □ 는?`, 10 - a)
  }
  const emoji = pick(COUNT_EMOJIS)
  const a = rand(2, 6)
  const b = rand(2, 12 - a)
  return typed(1, `${a} + ${b} = ?`, a + b, `${emoji.repeat(a)} + ${emoji.repeat(b)}`)
}

// ── 2단계(나무): 두 자리 계산, 구구단 2~5단 ─────────────────────────────
function level2(): Question {
  const kind = rand(1, 3)
  if (kind === 1) {
    const a = rand(11, 60)
    const b = rand(11, 99 - a)
    return typed(2, `${a} + ${b} = ?`, a + b)
  }
  if (kind === 2) {
    const a = rand(20, 99)
    const b = rand(1, a - 10)
    return typed(2, `${a} - ${b} = ?`, a - b)
  }
  const a = rand(2, 5)
  const b = rand(1, 9)
  return typed(2, `${a} × ${b} = ?`, a * b)
}

// ── 3단계(숲): 구구단 전체, 세 수, 100 넘는 더하기, 나눗셈 ────────────────
function level3(): Question {
  const kind = rand(1, 4)
  if (kind === 1) {
    const a = rand(2, 9)
    const b = rand(2, 9)
    return typed(3, `${a} × ${b} = ?`, a * b)
  }
  if (kind === 2) {
    const a = rand(10, 60)
    const b = rand(10, 60)
    const c = rand(1, 30)
    return typed(3, `${a} + ${b} - ${c} = ?`, a + b - c)
  }
  if (kind === 3) {
    const a = rand(2, 9)
    const b = rand(2, 9)
    return typed(3, `${a * b} ÷ ${a} = ?`, b)
  }
  const a = rand(100, 500)
  const b = rand(100, 499)
  return typed(3, `${a} + ${b} = ?`, a + b)
}

// ── 4단계(산): 두 자리 × 한 자리, 세 자리 더하기 빼기, 두 자리 나눗셈, 빈칸 채우기 ──
function level4(): Question {
  const kind = rand(1, 5)
  if (kind === 1) {
    const a = rand(12, 49)
    const b = rand(2, 9)
    return typed(4, `${a} × ${b} = ?`, a * b)
  }
  if (kind === 2) {
    const a = rand(100, 600)
    const b = rand(100, 999 - a)
    return typed(4, `${a} + ${b} = ?`, a + b)
  }
  if (kind === 3) {
    const a = rand(300, 999)
    const b = rand(100, a - 100)
    return typed(4, `${a} - ${b} = ?`, a - b)
  }
  if (kind === 4) {
    const b = rand(2, 9)
    const q = rand(3, 12)
    return typed(4, `${b * q} ÷ ${b} = ?`, q)
  }
  const a = rand(10, 60)
  const c = rand(a + 10, 99)
  return typed(4, `${a} + □ = ${c}   □ 는?`, c - a)
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

// ── 5단계(별): 두 자리 × 두 자리, 세 자리 × 한 자리, 나머지 나눗셈, 괄호 혼합 계산, 약수·배수, 네 자리 수 ──
function level5(): Question {
  const kind = rand(1, 7)
  if (kind === 1) {
    const a = rand(12, 45)
    const b = rand(11, 25)
    return typed(5, `${a} × ${b} = ?`, a * b)
  }
  if (kind === 2) {
    const a = rand(120, 480)
    const b = rand(3, 9)
    return typed(5, `${a} × ${b} = ?`, a * b)
  }
  if (kind === 3) {
    const b = rand(3, 9)
    const a = rand(20, 99)
    if (a % b === 0) return typed(5, `${a} ÷ ${b} = ?`, a / b)
    return typed(5, `${a} ÷ ${b} 의 나머지는?`, a % b)
  }
  if (kind === 4) {
    const a = rand(5, 30)
    const b = rand(2, 20)
    const c = rand(2, 9)
    return Math.random() < 0.5
      ? typed(5, `(${a} + ${b}) × ${c} = ?`, (a + b) * c)
      : typed(5, `${a} × ${c} - ${b} = ?`, a * c - b)
  }
  if (kind === 5) {
    const g = rand(2, 9)
    const a = g * rand(2, 6)
    let b = g * rand(2, 6)
    if (b === a) b += g
    return typed(5, `${a} 와 ${b} 의 최대공약수는?`, gcd(a, b))
  }
  if (kind === 6) {
    const a = rand(2, 9)
    let b = rand(2, 9)
    if (b === a) b = a + 1
    return typed(5, `${a} 와 ${b} 의 최소공배수는?`, (a * b) / gcd(a, b))
  }
  const a = rand(1000, 6000)
  const b = rand(1000, 3999)
  return Math.random() < 0.5 ? typed(5, `${a} + ${b} = ?`, a + b) : typed(5, `${a + b} - ${b} = ?`, a)
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
