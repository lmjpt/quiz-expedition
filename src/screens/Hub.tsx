// 첫 화면: 무슨 놀이를 할지 고릅니다. 프로필·단계·문제·소리는 놀이끼리 공유합니다.

interface Props {
  onBoard: () => void
  onPassport: () => void
}

export default function Hub({ onBoard, onPassport }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-10 px-6 py-10">
      <header className="text-center">
        <h1 className="font-display text-6xl tracking-tight">🧭 퀴즈 탐험대</h1>
        <p className="mt-2 text-xl text-muted">오늘은 무슨 놀이를 할까요?</p>
      </header>

      <div className="grid w-full gap-6 md:grid-cols-2">
        <button
          type="button"
          onClick={onBoard}
          className="flex flex-col items-center gap-3 rounded-[2rem] border-4 border-white bg-gradient-to-b from-sky-200 via-lime-100 to-green-300 p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl active:scale-95"
        >
          <span className="text-7xl drop-shadow">🎲</span>
          <span className="font-display rounded-full bg-white/90 px-5 py-1 text-3xl text-ink">말판 모험</span>
          <span className="rounded-2xl bg-white/80 px-4 py-2 text-base text-ink">문제를 맞히면 주사위! 숲·바다·우주 지도를 달려 목적지에 먼저 닿기</span>
        </button>
        <button
          type="button"
          onClick={onPassport}
          className="flex flex-col items-center gap-3 rounded-[2rem] border-4 border-white bg-gradient-to-b from-sky-200 via-cyan-200 to-blue-400 p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl active:scale-95"
        >
          <span className="text-7xl drop-shadow">✈️</span>
          <span className="font-display rounded-full bg-white/90 px-5 py-1 text-3xl text-ink">세계 여행 여권</span>
          <span className="rounded-2xl bg-white/80 px-4 py-2 text-base text-ink">나라를 골라 날아가 문제를 맞히고 여권에 도장 모으기</span>
        </button>
      </div>
    </main>
  )
}
