// "처음으로" 를 눌렀을 때 뜨는 확인 창.
// 브라우저 기본 confirm() 은 앱 안 브라우저에서 막히고, 아이 화면에 시스템 팝업이
// 뜨는 것도 어울리지 않아서 직접 그립니다.

interface Props {
  onQuit: () => void
  onStay: () => void
}

export default function QuitDialog({ onQuit, onStay }: Props) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4">
      <div className="pop flex w-full max-w-md flex-col items-center gap-5 rounded-3xl bg-white p-8 text-center shadow-2xl">
        <p className="text-3xl font-black">그만하고 처음으로 갈까요?</p>
        <p className="text-lg text-muted">지금 판은 저장되지 않아요</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onQuit}
            className="rounded-2xl bg-brand px-8 py-4 text-2xl font-black text-white transition hover:brightness-105 active:scale-95"
          >
            처음으로
          </button>
          <button
            type="button"
            onClick={onStay}
            className="rounded-2xl border border-line bg-cream px-8 py-4 text-2xl font-bold transition hover:bg-white active:scale-95"
          >
            계속 놀기
          </button>
        </div>
      </div>
    </div>
  )
}
