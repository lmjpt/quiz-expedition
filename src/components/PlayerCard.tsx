// 놀이 화면 옆의 아이 카드. 누르면 단계를 바꾸는 창이 뜹니다.
// 판 도중에 "너무 쉽다/어렵다" 싶을 때 나가지 않고 바로 고치기 위한 것입니다.

import { useState } from 'react'
import type { PlayerState } from '../game/engine'
import type { Level } from '../types'
import { LEVELS, LEVEL_INFO } from '../types'
import { GOAL } from '../game/board'

interface Props {
  player: PlayerState
  /** 말 테두리·지나온 길과 같은 색 */
  color: string
  active: boolean
  onChangeLevel: (level: Level) => void
}

export default function PlayerCard({ player, color, active, onChangeLevel }: Props) {
  const [picking, setPicking] = useState(false)
  const lv = LEVEL_INFO[player.level]
  const left = GOAL - player.pos

  return (
    <>
      <button
        type="button"
        onClick={() => !player.isBot && setPicking(true)}
        disabled={player.isBot}
        title={player.isBot ? undefined : '누르면 단계를 바꿀 수 있어요'}
        className={`flex w-full items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left transition ${
          active ? 'shadow-lg' : 'border-line opacity-90'
        } ${player.isBot ? 'cursor-default' : 'hover:shadow-md active:scale-[0.98]'}`}
        style={active ? { borderColor: color, boxShadow: `0 8px 24px -8px ${color}` } : undefined}
      >
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 bg-white text-4xl"
          style={{ borderColor: color }}
        >
          {player.emoji}
        </span>
        <div className="flex-1">
          <p className="font-display text-2xl leading-tight">
            {player.name}
            <span className="ml-2 text-sm text-muted">
              {lv.emoji} {lv.name}
            </span>
          </p>
          <p className="text-base text-muted">
            {left > 0 ? `도착까지 ${left}칸` : '도착!'} · 퀴즈 {player.correct}/{player.answered}
          </p>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(player.pos / GOAL) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
        {active && <span className="text-2xl">👈</span>}
      </button>

      {picking && (
        <LevelPicker
          player={player}
          onPick={(level) => {
            onChangeLevel(level)
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}

function LevelPicker({ player, onPick, onClose }: { player: PlayerState; onPick: (l: Level) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="pop flex w-full max-w-lg flex-col gap-5 rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-3xl font-black">
          {player.emoji} {player.name} 문제 단계
        </p>
        <p className="-mt-3 text-center text-base text-muted">다음 문제부터 바뀌어요</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LEVELS.map((level) => {
            const info = LEVEL_INFO[level]
            const on = player.level === level
            return (
              <button
                key={level}
                type="button"
                onClick={() => onPick(level)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-4 py-4 transition active:scale-95 ${
                  on ? 'border-brand bg-brand-soft' : 'border-line bg-cream hover:border-brand'
                }`}
              >
                <span className="text-4xl">{info.emoji}</span>
                <span className="text-xl font-bold">{info.name}</span>
                <span className="text-sm text-muted">{info.hint}</span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-line bg-cream px-6 py-3 text-xl font-bold transition hover:bg-white active:scale-95"
        >
          그대로 두기
        </button>
      </div>
    </div>
  )
}
