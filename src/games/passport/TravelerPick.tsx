// 여권 놀이 시작: 누가 여행할지 고릅니다. 혼자 또는 둘이 번갈아.

import type { Profile } from '../../types'
import { COUNTRIES } from './countries'
import { stamps } from '../../game/storage'

interface Props {
  profiles: Profile[]
  onPick: (travelers: Profile[]) => void
  onBack: () => void
}

export default function TravelerPick({ profiles, onPick, onBack }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-8 px-6 py-10">
      <button type="button" onClick={onBack} className="self-start rounded-xl px-3 py-2 text-lg text-muted hover:bg-white">
        ← 놀이 고르기
      </button>
      <header className="text-center">
        <h1 className="font-display text-5xl">✈️ 세계 여행 여권</h1>
        <p className="mt-2 text-lg text-muted">나라를 골라 날아가서 문제를 맞히면 여권에 도장이 찍혀요. 도장은 계속 모여요!</p>
      </header>

      <section className="w-full">
        <p className="font-display mb-3 text-center text-2xl">누가 여행할까요?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {profiles.slice(0, 2).map((p) => {
            const count = Object.keys(stamps(p.id)).length
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick([p])}
                className="flex items-center gap-4 rounded-3xl border-2 border-line bg-white p-5 text-left transition hover:border-brand hover:shadow-md active:scale-[0.98]"
              >
                <span className="text-5xl">{p.emoji}</span>
                <div>
                  <p className="font-display text-2xl">{p.name} 혼자</p>
                  <p className="text-sm text-muted">
                    도장 {count} / {COUNTRIES.length}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
        {profiles.length >= 2 && (
          <button
            type="button"
            onClick={() => onPick(profiles.slice(0, 2))}
            className="font-display mt-3 w-full rounded-3xl bg-brand px-8 py-6 text-3xl text-white shadow-lg transition hover:brightness-105 active:scale-95"
          >
            👫 둘이 번갈아 여행하기
          </button>
        )}
      </section>
    </main>
  )
}
