// 문제 창. 보기 고르기(마우스 또는 숫자키 1~4)와 숫자 입력(키보드 또는 화면 키패드) 두 가지.
// 틀렸을 때도 색은 부드럽게, 정답을 알려 주고 끝냅니다.

import { useEffect, useState } from 'react'
import type { Question } from '../types'
import { SUBJECT_INFO } from '../types'
import type { PlayerState, QuizStage } from '../game/engine'
import { answerText } from '../questions/pick'
import { speak } from '../speech'

interface Props {
  question: Question
  /** 차례 문제(맞히면 주사위 +2)인지 퀴즈 칸 보너스 문제(맞히면 2칸 더)인지 */
  stage: QuizStage
  player: PlayerState
  result: { correct: boolean } | null
  onAnswer: (correct: boolean) => void
  onContinue: () => void
}

export default function QuizModal({ question, stage, player, result, onAnswer, onContinue }: Props) {
  const subject = SUBJECT_INFO[question.subject]

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
      <div className={`pop w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl ${stage === 'tile' ? 'ring-8 ring-praise/60' : ''}`}>
        {stage === 'tile' && <p className="-mt-2 mb-2 text-center text-xl font-black text-praise">🎁 보너스 문제!</p>}
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-cream px-4 py-1 text-lg font-bold text-muted">
            {subject.emoji} {subject.name}
          </span>
          <span className="text-2xl font-bold">
            {player.emoji} {player.name}
          </span>
          <button
            type="button"
            onClick={() => speak(question.prompt)}
            className="rounded-full bg-cream px-3 py-1 text-xl hover:bg-brand-soft"
            aria-label="다시 읽어 주기"
            title="다시 읽어 주기"
          >
            🔊
          </button>
        </div>

        {question.visual && <p className="mb-3 text-center text-5xl leading-relaxed break-words">{question.visual}</p>}
        <h2 className="mb-6 text-center text-4xl leading-snug tracking-wide">{question.prompt}</h2>

        {result === null ? (
          question.kind === 'choice' ? (
            <Choices question={question} onAnswer={onAnswer} />
          ) : (
            <NumberInput answer={question.answer} onAnswer={onAnswer} />
          )
        ) : (
          <Result question={question} stage={stage} correct={result.correct} isBot={player.isBot} onContinue={onContinue} />
        )}
      </div>
    </div>
  )
}

function Choices({ question, onAnswer }: { question: Extract<Question, { kind: 'choice' }>; onAnswer: (c: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null)

  function pick(i: number) {
    if (picked !== null) return
    setPicked(i)
    onAnswer(i === question.answerIndex)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const n = Number(e.key)
      if (n >= 1 && n <= question.choices.length) pick(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, picked])

  const big = question.choices.every((c) => c.length <= 2)

  return (
    <div className="grid grid-cols-2 gap-3">
      {question.choices.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => pick(i)}
          className={`flex items-center gap-3 rounded-2xl border-2 border-line bg-cream px-5 py-5 text-left font-bold transition hover:border-brand hover:bg-brand-soft active:scale-95 ${
            big ? 'justify-center text-5xl' : 'text-3xl'
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base text-muted">{i + 1}</span>
          <span>{c}</span>
        </button>
      ))}
    </div>
  )
}

function NumberInput({ answer, onAnswer }: { answer: number; onAnswer: (c: boolean) => void }) {
  const [value, setValue] = useState('')

  function submit() {
    if (value === '') return
    onAnswer(Number(value) === answer)
  }

  function press(k: string) {
    if (k === '⌫') setValue((v) => v.slice(0, -1))
    else if (value.length < 4) setValue((v) => v + k)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('⌫')
      else if (e.key === 'Enter') submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex h-20 w-56 items-center justify-center rounded-2xl border-2 border-line bg-cream text-5xl font-black tracking-widest">
        {value || <span className="text-line">?</span>}
      </div>
      <div className="grid w-64 grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className="rounded-2xl bg-cream py-3 text-2xl font-bold transition hover:bg-brand-soft active:scale-95"
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          onClick={submit}
          disabled={value === ''}
          className="rounded-2xl bg-brand py-3 text-xl font-black text-white transition hover:brightness-105 active:scale-95 disabled:opacity-40"
        >
          확인
        </button>
      </div>
      <p className="text-sm text-muted">숫자를 치고 Enter 를 눌러도 돼요</p>
    </div>
  )
}

function Result({
  question,
  stage,
  correct,
  isBot,
  onContinue,
}: {
  question: Question
  stage: QuizStage
  correct: boolean
  isBot: boolean
  onContinue: () => void
}) {
  const who = isBot ? '로봇이' : ''
  return (
    <div className="pop flex flex-col items-center gap-4 text-center">
      {correct ? (
        <>
          <p className="text-6xl">🎉</p>
          <p className="text-3xl font-black text-praise">{who} 딩동댕! 맞았어요</p>
          <p className="text-xl text-muted">{stage === 'turn' ? '🎲 주사위를 굴려요!' : '2칸 더 가요!'}</p>
        </>
      ) : (
        <>
          <p className="text-6xl">🤔</p>
          <p className="text-3xl font-black">{who} 아쉬워요, 다음엔 맞힐 거예요</p>
          {stage === 'turn' && <p className="text-lg text-muted">이번엔 주사위를 쉬고 다음 차례에 다시!</p>}
          <p className="text-2xl">
            정답은 <span className="rounded-xl bg-praise-soft px-3 py-1 font-black">{answerText(question)}</span>
          </p>
        </>
      )}
      {question.explain && <p className="max-w-md text-lg text-muted">{question.explain}</p>}
      {!isBot && (
        <button
          type="button"
          onClick={onContinue}
          className="mt-2 rounded-2xl bg-brand px-10 py-4 text-2xl font-black text-white transition hover:brightness-105 active:scale-95"
        >
          {stage === 'turn' && correct ? '주사위 굴리러 가기 (Space)' : '계속 (Space)'}
        </button>
      )}
    </div>
  )
}
