// 기기(localStorage)에 남기는 것 전부. 서버는 없습니다.
//
// - 아이 프로필(이름, 얼굴, 단계, 판 수, 이긴 수)
// - 최근에 나온 상식 문제 id (같은 문제가 바로 또 나오지 않게)
// - 틀린 문제 id (나중에 부모가 볼 '자주 틀린 문제' 용)
// - 소리 끔 여부

import type { Level, Profile } from '../types'
import type { BoardId } from './board'

const KEY = 'quiz-board:v1'
const RECENT_LIMIT = 60

interface Saved {
  profiles: Profile[]
  recent: Record<string, string[]>
  missed: Record<string, string[]>
  muted: boolean
  /** 마지막으로 놀았던 말판. 다음 판은 그 다음 말판으로 */
  lastBoard: BoardId | null
}

export const EMOJIS = ['🐰', '🐣', '🐻', '🐼', '🦊', '🐨', '🐯', '🐸', '🐧', '🦉', '🐿️', '🐳'] as const

function defaults(): Saved {
  return {
    profiles: [
      { id: 'p1', name: '첫째', emoji: '🐰', level: 3, games: 0, wins: 0 },
      { id: 'p2', name: '둘째', emoji: '🐣', level: 2, games: 0, wins: 0 },
    ],
    recent: {},
    missed: {},
    muted: false,
    lastBoard: null,
  }
}

function isBoardId(v: unknown): v is BoardId {
  return v === 'forest' || v === 'sea' || v === 'space'
}

export function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults()
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return defaults()
    const d = defaults()
    const s = parsed as Partial<Saved>
    return {
      profiles: Array.isArray(s.profiles) && s.profiles.length > 0 ? s.profiles : d.profiles,
      recent: s.recent ?? {},
      missed: s.missed ?? {},
      muted: s.muted ?? false,
      lastBoard: isBoardId(s.lastBoard) ? s.lastBoard : null,
    }
  } catch {
    return defaults()
  }
}

function save(s: Saved): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function saveProfiles(profiles: Profile[]): void {
  const s = load()
  s.profiles = profiles
  save(s)
}

export function recentIds(profileId: string): string[] {
  return load().recent[profileId] ?? []
}

/** 상식 문제를 풀었을 때 기록. 자동 생성 문제(gen:)는 기록하지 않습니다 */
export function recordAnswer(profileId: string, questionId: string, correct: boolean): void {
  if (questionId.startsWith('gen:')) return
  const s = load()
  const recent = (s.recent[profileId] ?? []).filter((id) => id !== questionId)
  recent.push(questionId)
  s.recent[profileId] = recent.slice(-RECENT_LIMIT)
  if (!correct) {
    const missed = s.missed[profileId] ?? []
    if (!missed.includes(questionId)) missed.push(questionId)
    s.missed[profileId] = missed
  }
  save(s)
}

export function recordGame(profileIds: string[], winnerId: string | null): void {
  const s = load()
  s.profiles = s.profiles.map((p) =>
    profileIds.includes(p.id)
      ? { ...p, games: p.games + 1, wins: p.wins + (p.id === winnerId ? 1 : 0) }
      : p,
  )
  save(s)
}

export function lastBoard(): BoardId | null {
  return load().lastBoard
}

export function saveLastBoard(id: BoardId): void {
  const s = load()
  s.lastBoard = id
  save(s)
}

export function isMuted(): boolean {
  return load().muted
}

export function setMuted(muted: boolean): void {
  const s = load()
  s.muted = muted
  save(s)
}

export function isLevel(n: number): n is Level {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5
}
