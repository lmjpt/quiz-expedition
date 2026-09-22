// 여권 펼쳐 보기. 아이마다 한 쪽씩, 나라 22곳이 격자로 있고 받은 도장은 색이 칠해집니다.

import type { Profile } from '../../types'
import { COUNTRIES } from './countries'

interface Props {
  travelers: Profile[]
  stampsOf: (profileId: string) => Record<string, string>
  onClose: () => void
}

export default function PassportBook({ travelers, stampsOf, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="pop flex max-h-[90vh] w-full max-w-4xl flex-col gap-4 overflow-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">📖 여권</h2>
          <button type="button" onClick={onClose} className="rounded-xl bg-cream px-4 py-2 text-lg hover:bg-brand-soft">
            닫기
          </button>
        </div>

        <div className={`grid gap-4 ${travelers.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {travelers.map((t) => {
            const mine = stampsOf(t.id)
            const count = Object.keys(mine).length
            return (
              <section key={t.id} className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-4xl">{t.emoji}</span>
                  <div>
                    <p className="font-display text-2xl leading-tight">{t.name}의 여권</p>
                    <p className="text-sm text-muted">
                      {count} / {COUNTRIES.length} 나라 · {count === COUNTRIES.length ? '세계 일주 완성! 🌍' : `${COUNTRIES.length - count}곳 남았어요`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {COUNTRIES.map((c) => {
                    const date = mine[c.id]
                    return (
                      <div
                        key={c.id}
                        title={date ? `${c.name} · ${date}` : c.name}
                        className={`flex flex-col items-center rounded-2xl border-2 p-2 ${
                          date ? 'stamp-in border-praise bg-white' : 'border-dashed border-amber-200 bg-white/40 opacity-60'
                        }`}
                      >
                        <span className={`text-2xl ${date ? '' : 'grayscale'}`}>{c.emoji}</span>
                        <span className="font-display text-xs">{c.name}</span>
                        <span className="text-[10px] text-muted">{date ? date.slice(5).replace('-', '/') : '　'}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
