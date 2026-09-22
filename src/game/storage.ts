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
/** 저장 형식 버전. 2: 씨앗 단계를 빼서 단계 번호가 하나씩 내려감 */
const VERSION = 2

interface Saved {
  version: number
  profiles: Profile[]
  recent: Record<string, string[]>
  missed: Record<string, string[]>
  muted: boolean
  /** 마지막으로 놀았던 말판. 다음 판은 그 다음 말판으로 */
  lastBoard: BoardId | null
  /** 지난 판에 먼저 시작한 아이. '번갈아' 모드에서 다음 판은 반대편이 먼저 */
  lastFirst: string | null
  /** 순서 정하는 방식. dice: 주사위로 / alternate: 번갈아 */
  orderMode: OrderMode
  /** 세계 여행 여권 도장: 아이 id → 나라 id → 찍은 날(YYYY-MM-DD) */
  passport: Record<string, Record<string, string>>
}

export type OrderMode = 'dice' | 'alternate'

export const EMOJIS = ['🐰', '🐣', '🐻', '🐼', '🦊', '🐨', '🐯', '🐸', '🐧', '🦉', '🐿️', '🐳'] as const

function defaults(): Saved {
  return {
    version: VERSION,
    profiles: [
      { id: 'p1', name: '첫째', emoji: '🐰', level: 2, games: 0, wins: 0 },
      { id: 'p2', name: '둘째', emoji: '🐣', level: 1, games: 0, wins: 0 },
    ],
    recent: {},
    missed: {},
    muted: false,
    lastBoard: null,
    lastFirst: null,
    orderMode: 'dice',
    passport: {},
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
    const loaded: Saved = {
      version: typeof s.version === 'number' ? s.version : 1,
      profiles: Array.isArray(s.profiles) && s.profiles.length > 0 ? s.profiles : d.profiles,
      recent: s.recent ?? {},
      missed: s.missed ?? {},
      muted: s.muted ?? false,
      lastBoard: isBoardId(s.lastBoard) ? s.lastBoard : null,
      lastFirst: typeof s.lastFirst === 'string' ? s.lastFirst : null,
      orderMode: s.orderMode === 'alternate' ? 'alternate' : 'dice',
      passport: typeof s.passport === 'object' && s.passport !== null ? s.passport : {},
    }
    return migrate(loaded)
  } catch {
    return defaults()
  }
}

/** 옛 저장 형식을 지금 형식으로. 한 번 옮기면 저장해서 다시 하지 않습니다 */
function migrate(s: Saved): Saved {
  if (s.version >= VERSION) return s
  // v1 → v2: 씨앗(1) 을 빼서 단계가 하나씩 내려감. 씨앗이던 아이는 새싹(1) 으로.
  // 문제 id 에 단계 번호가 들어 있어서 '최근 나온 문제' 기록은 비웁니다 (한 판만 겹칠 수 있음).
  const next: Saved = {
    ...s,
    version: VERSION,
    profiles: s.profiles.map((p) => ({ ...p, level: clampLevel(p.level - 1) })),
    recent: {},
    missed: {},
  }
  save(next)
  return next
}

function clampLevel(n: number): Level {
  return isLevel(n) ? n : n < 1 ? 1 : 5
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

export function orderSettings(): { lastFirst: string | null; orderMode: OrderMode } {
  const s = load()
  return { lastFirst: s.lastFirst, orderMode: s.orderMode }
}

export function saveOrderMode(mode: OrderMode): void {
  const s = load()
  s.orderMode = mode
  save(s)
}

export function saveLastFirst(profileId: string): void {
  const s = load()
  s.lastFirst = profileId
  save(s)
}

/** 아이가 받은 도장. 나라 id → 찍은 날 */
export function stamps(profileId: string): Record<string, string> {
  return load().passport[profileId] ?? {}
}

export function addStamp(profileId: string, countryId: string): void {
  const s = load()
  const mine = s.passport[profileId] ?? {}
  if (!mine[countryId]) {
    const d = new Date()
    mine[countryId] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  s.passport[profileId] = mine
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
