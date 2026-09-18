// 시작 화면. 누가 놀지, 몇 단계 문제를 받을지 고르고 1인/2인을 선택합니다.

import { useState } from 'react'
import type { Profile } from '../types'
import { LEVELS, LEVEL_INFO } from '../types'
import { EMOJIS } from '../game/storage'
import { BOARDS, type BoardId } from '../game/board'

interface Props {
  profiles: Profile[]
  boardId: BoardId
  onChangeBoard: (id: BoardId) => void
  onChangeProfiles: (next: Profile[]) => void
  onStartSolo: (p: Profile) => void
  onStartDuo: (a: Profile, b: Profile) => void
}

export default function Start({ profiles, boardId, onChangeBoard, onChangeProfiles, onStartSolo, onStartDuo }: Props) {
  const [soloPick, setSoloPick] = useState<string | null>(null)

  function update(id: string, patch: Partial<Profile>) {
    onChangeProfiles(profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const [a, b] = profiles

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="font-display text-6xl tracking-tight">🧭 퀴즈 탐험대</h1>
        <p className="mt-2 text-lg text-muted">문제를 풀고 주사위를 굴려 목적지까지 모험을 떠나요!</p>
      </header>

      <section className="grid w-full gap-6 md:grid-cols-2">
        {profiles.map((p) => (
          <ProfileCard key={p.id} profile={p} onChange={(patch) => update(p.id, patch)} />
        ))}
      </section>

      <section className="flex w-full flex-col items-center gap-4">
        <div className="w-full">
          <p className="font-display mb-2 text-center text-xl text-muted">오늘 탐험대는 어디로 떠날까요?</p>
          <div className="grid grid-cols-3 gap-3">
            {BOARDS.map((board) => {
              const on = board.id === boardId
              return (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => onChangeBoard(board.id)}
                  className={`flex flex-col items-center gap-1 rounded-3xl border-4 px-3 py-4 transition active:scale-95 ${board.theme.bg} ${
                    on ? 'border-brand shadow-lg' : 'border-white/70 opacity-75 hover:opacity-100'
                  }`}
                >
                  <span className="text-4xl drop-shadow">{board.theme.start} → {board.theme.goal}</span>
                  <span className="font-display rounded-full bg-white/90 px-3 py-0.5 text-xl text-ink">{board.theme.title}</span>
                  <span className="rounded-full bg-white/80 px-2 text-xs text-ink">{board.theme.destination}까지</span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStartDuo(a, b)}
          className="font-display w-full max-w-md rounded-3xl bg-brand px-8 py-6 text-4xl text-white shadow-lg transition hover:brightness-105 active:scale-95"
        >
          👫 탐험대 출발!
        </button>

        <div className="flex w-full max-w-md flex-col gap-2 rounded-3xl border border-line bg-white p-4">
          <p className="text-center text-lg font-bold text-muted">🤖 로봇과 혼자 하기</p>
          <div className="grid grid-cols-2 gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSoloPick(p.id)
                  onStartSolo(p)
                }}
                className={`rounded-2xl px-4 py-4 text-xl font-bold transition active:scale-95 ${
                  soloPick === p.id ? 'bg-brand-soft' : 'bg-cream hover:bg-brand-soft'
                }`}
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <p className="text-sm text-muted">
        문제를 맞히면 주사위를 굴려요. 틀려도 뒤로 가지는 않아요. 목적지에 먼저 가면 이겨요!
      </p>
    </main>
  )
}

function ProfileCard({ profile, onChange }: { profile: Profile; onChange: (patch: Partial<Profile>) => void }) {
  const [pickingEmoji, setPickingEmoji] = useState(false)

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPickingEmoji((v) => !v)}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-cream text-5xl transition hover:scale-105"
          aria-label="얼굴 바꾸기"
        >
          {profile.emoji}
        </button>
        <div className="flex-1">
          <input
            value={profile.name}
            onChange={(e) => onChange({ name: e.target.value.slice(0, 8) })}
            className="w-full rounded-xl border border-line bg-cream px-4 py-2 text-2xl font-bold"
            aria-label="이름"
          />
          <p className="mt-1 text-sm text-muted">
            {profile.games}판 놀았고 {profile.wins}번 이겼어요
          </p>
        </div>
      </div>

      {pickingEmoji && (
        <div className="pop grid grid-cols-6 gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onChange({ emoji: e })
                setPickingEmoji(false)
              }}
              className={`rounded-xl py-2 text-3xl transition hover:bg-cream ${e === profile.emoji ? 'bg-brand-soft' : ''}`}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-bold text-muted">문제 단계</p>
        <div className="grid grid-cols-6 gap-1.5">
          {LEVELS.map((lv) => {
            const info = LEVEL_INFO[lv]
            const on = profile.level === lv
            return (
              <button
                key={lv}
                type="button"
                onClick={() => onChange({ level: lv })}
                title={info.hint}
                className={`flex flex-col items-center rounded-2xl border px-2 py-3 transition active:scale-95 ${
                  on ? 'border-brand bg-brand-soft' : 'border-line bg-cream hover:border-brand'
                }`}
              >
                <span className="text-3xl">{info.emoji}</span>
                <span className="text-base font-bold">{info.name}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-sm text-muted">{LEVEL_INFO[profile.level].hint}</p>
      </div>
    </div>
  )
}
