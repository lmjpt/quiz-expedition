// 한 나라 여행이 끝났을 때. 2개 이상 맞혔으면 도장 쾅, 아니면 "다음에 다시 와요".
// 어느 쪽이든 그 나라 이야기 한 줄을 들려줍니다 — 못 받아도 배우는 게 있게.

import type { Profile } from '../../types'
import type { Country } from './countries'

interface Props {
  traveler: Profile
  country: Country
  correct: number
  total: number
  stamped: boolean
  /** 이미 전에 받은 도장이면 true (도장은 한 나라에 하나) */
  alreadyHad: boolean
  fact: string
  onContinue: () => void
}

export default function StampResult({ traveler, country, correct, total, stamped, alreadyHad, fact, onContinue }: Props) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
      <div className="pop flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-2xl">
        <p className="text-7xl">{country.emoji}</p>
        <h2 className="font-display text-3xl">
          {traveler.emoji} {traveler.name}, {country.name} 여행 끝!
        </h2>
        <p className="text-xl text-muted">
          문제 {total}개 중 {correct}개 맞혔어요
        </p>

        {stamped ? (
          <div className="stamp-in flex flex-col items-center gap-1 rounded-3xl border-4 border-praise bg-praise-soft px-8 py-4">
            <span className="text-5xl">🛂</span>
            <span className="font-display text-3xl text-praise">{alreadyHad ? '이미 받은 도장이에요' : '도장 쾅!'}</span>
            <span className="text-base text-muted">{alreadyHad ? '여권에 그대로 있어요' : `${country.name} 도장이 여권에 찍혔어요`}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 rounded-3xl border-2 border-line bg-cream px-8 py-4">
            <span className="text-4xl">🧳</span>
            <span className="font-display text-2xl">다음에 다시 와요!</span>
            <span className="text-base text-muted">2개 이상 맞히면 도장을 받아요</span>
          </div>
        )}

        <p className="max-w-md rounded-2xl bg-cream px-4 py-3 text-lg leading-snug">💡 {fact}</p>

        <button
          type="button"
          onClick={onContinue}
          className="font-display mt-1 rounded-2xl bg-brand px-10 py-4 text-2xl text-white transition hover:brightness-105 active:scale-95"
        >
          지도로 돌아가기
        </button>
      </div>
    </div>
  )
}
