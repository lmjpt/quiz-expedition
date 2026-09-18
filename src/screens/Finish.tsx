// 도착 화면. 이긴 사람을 크게, 둘 다 몇 문제 맞혔는지 함께 보여 줍니다.
// 진 쪽도 "n개 맞혔어요" 가 보여야 다음 판을 하고 싶어져요.

import type { PlayerState } from '../game/engine'

interface Props {
  players: PlayerState[]
  winner: number
  /** 어디에 도착했는지. "마법의 성에 도착!" */
  destination: string
  goalEmoji: string
  onAgain: () => void
  onHome: () => void
}

const PIECES = ['🎉', '⭐', '🎊', '✨', '🌟', '🎈']

export default function Finish({ players, winner, destination, goalEmoji, onAgain, onHome }: Props) {
  const w = players[winner]

  return (
    <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${(i * 37) % 100}%`,
            animationDuration: `${2.5 + (i % 5) * 0.5}s`,
            animationDelay: `${(i % 7) * 0.2}s`,
          }}
        >
          {PIECES[i % PIECES.length]}
        </span>
      ))}

      <div className="pop">
        <p className="text-8xl">
          {w.emoji}
          <span className="ml-2 twinkle inline-block">{goalEmoji}</span>
        </p>
        <h1 className="font-display mt-4 text-5xl">
          {w.name}, {destination}에 도착!
        </h1>
        <p className="mt-2 text-2xl text-muted">🏆 이겼어요</p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-4">
        {players.map((p, i) => (
          <div key={p.profileId} className={`rounded-3xl border p-5 ${i === winner ? 'border-praise bg-praise-soft' : 'border-line bg-white'}`}>
            <p className="text-4xl">{p.emoji}</p>
            <p className="text-xl font-bold">{p.name}</p>
            <p className="mt-1 text-lg text-muted">
              퀴즈 {p.answered}개 중 <span className="font-black text-ink">{p.correct}개</span> 맞혔어요
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onAgain}
          className="rounded-3xl bg-brand px-8 py-5 text-2xl font-black text-white shadow-lg transition hover:brightness-105 active:scale-95"
        >
          🔁 한 판 더
        </button>
        <button
          type="button"
          onClick={onHome}
          className="rounded-3xl border border-line bg-white px-8 py-5 text-2xl font-bold transition hover:bg-cream active:scale-95"
        >
          처음으로
        </button>
      </div>
    </main>
  )
}
