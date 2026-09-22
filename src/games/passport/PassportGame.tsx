// 세계 여행 여권 놀이.
//
//   지도에서 나라를 고른다 → ✈️ 날아간다 → 그 나라 문제 2개 + 내 단계 상식 1개
//   → 3개 중 2개 맞히면 도장 → (둘이면) 다음 아이 차례 → 다시 지도
//
// 이기고 지는 게 없습니다. 도장은 기기에 남아서 판이 끝나도 여권에 쌓입니다.

import { useEffect, useState } from 'react'
import type { Profile, Question } from '../../types'
import { addStamp, recentIds, recordAnswer, stamps } from '../../game/storage'
import { pickKnowledge, withShuffledChoices } from '../../questions/pick'
import QuizModal from '../../components/QuizModal'
import { sfx } from '../../sound'
import { speak } from '../../speech'
import { type Country } from './countries'
import WorldMap from './WorldMap'
import PassportBook from './PassportBook'
import StampResult from './StampResult'
import TravelerPick from './TravelerPick'

interface Props {
  profiles: Profile[]
  onHome: () => void
}

type Phase =
  | { kind: 'pick' }
  | { kind: 'map' }
  | { kind: 'flying'; to: Country }
  | { kind: 'quiz'; country: Country; questions: Question[]; index: number; results: boolean[]; showResult: boolean }
  | { kind: 'stamp'; country: Country; correct: number; stamped: boolean; alreadyHad: boolean; fact: string }

const FLY_MS = 1600
/** 도장을 받으려면 세 문제 중 몇 개를 맞혀야 하나 */
const NEED_CORRECT = 2

export default function PassportGame({ profiles, onHome }: Props) {
  const [travelers, setTravelers] = useState<Profile[]>([])
  const [turn, setTurn] = useState(0)
  const [planeAt, setPlaneAt] = useState('home')
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' })
  const [bookOpen, setBookOpen] = useState(false)
  // 도장은 storage 가 진짜 원본. 화면은 이 사본을 그리고, 바뀔 때마다 다시 읽습니다
  const [stampBook, setStampBook] = useState<Record<string, Record<string, string>>>({})

  const me = travelers[turn]

  function refreshStamps(list: Profile[]) {
    setStampBook(Object.fromEntries(list.map((t) => [t.id, stamps(t.id)])))
  }

  function start(list: Profile[]) {
    setTravelers(list)
    refreshStamps(list)
    setTurn(0)
    setPhase({ kind: 'map' })
    speak(`${list[0].name}, 어디로 여행 갈까요?`)
  }

  function fly(country: Country) {
    if (phase.kind !== 'map') return
    sfx.rise()
    speak(`${country.name}로 출발!`)
    setPhase({ kind: 'flying', to: country })
    setPlaneAt(country.id)
  }

  // 도착하면 문제를 준비합니다. 낮은 단계는 쉬운 것+보통, 높은 단계는 보통+수도. 가운데에 내 단계 상식 하나
  useEffect(() => {
    if (phase.kind !== 'flying' || !me) return
    const country = phase.to
    const t = setTimeout(() => {
      const [easy, mid, capital] = country.quiz
      const own = me.level <= 2 ? [easy, mid] : [mid, capital]
      const questions: Question[] = [withShuffledChoices(own[0]), pickKnowledge(me.level, recentIds(me.id)), withShuffledChoices(own[1])]
      sfx.pop()
      speak(`${country.name} 도착! 문제를 풀어 봐요`)
      setPhase({ kind: 'quiz', country, questions, index: 0, results: [], showResult: false })
    }, FLY_MS)
    return () => clearTimeout(t)
  }, [phase, me])

  function answer(correct: boolean) {
    if (phase.kind !== 'quiz' || phase.showResult || !me) return
    const q = phase.questions[phase.index]
    if (!q.id.startsWith('passport:')) recordAnswer(me.id, q.id, correct)
    if (correct) sfx.correct()
    else sfx.wrong()
    setPhase({ ...phase, results: [...phase.results, correct], showResult: true })
  }

  function next() {
    if (phase.kind !== 'quiz' || !me) return
    if (phase.index + 1 < phase.questions.length) {
      const index = phase.index + 1
      setPhase({ ...phase, index, showResult: false })
      return
    }
    const correct = phase.results.filter(Boolean).length
    const stamped = correct >= NEED_CORRECT
    const alreadyHad = !!stampBook[me.id]?.[phase.country.id]
    if (stamped && !alreadyHad) addStamp(me.id, phase.country.id)
    refreshStamps(travelers)
    const fact = phase.country.facts[Math.floor(Math.random() * phase.country.facts.length)]
    if (stamped) sfx.win()
    speak(stamped ? `도장 쾅! ${fact}` : `다음에 다시 와요. ${fact}`)
    setPhase({ kind: 'stamp', country: phase.country, correct, stamped, alreadyHad, fact })
  }

  function backToMap() {
    const nextTurn = travelers.length > 1 ? (turn + 1) % travelers.length : turn
    setTurn(nextTurn)
    setPhase({ kind: 'map' })
    speak(`${travelers[nextTurn].name}, 다음은 어디로 갈까요?`)
  }

  useEffect(() => {
    if (phase.kind === 'quiz' && !phase.showResult) speak(phase.questions[phase.index].prompt)
  }, [phase])

  if (phase.kind === 'pick') return <TravelerPick profiles={profiles} onPick={start} onBack={onHome} />

  const myStamps = me ? (stampBook[me.id] ?? {}) : {}

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-6 py-5">
      <header className="flex items-center justify-between">
        <button type="button" onClick={onHome} className="rounded-xl px-3 py-2 text-lg text-muted hover:bg-white">
          ← 처음으로
        </button>
        <div className="text-center">
          <h1 className="font-display text-3xl leading-tight">✈️ 세계 여행 여권</h1>
          <p className="text-sm text-muted">나라를 골라 날아가서 문제를 맞히면 도장을 받아요</p>
        </div>
        <button type="button" onClick={() => setBookOpen(true)} className="font-display rounded-xl bg-amber-100 px-4 py-2 text-lg hover:bg-amber-200">
          📖 여권 보기
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <WorldMap stamped={myStamps} planeAt={planeAt} flying={phase.kind === 'flying'} onPick={fly} />

        <aside className="flex flex-col gap-4">
          {travelers.map((t, i) => {
            const count = Object.keys(stampBook[t.id] ?? {}).length
            const active = i === turn
            return (
              <div
                key={t.id}
                className={`flex items-center gap-4 rounded-3xl border-2 bg-white p-4 transition ${active ? 'border-brand shadow-lg' : 'border-line opacity-80'}`}
              >
                <span className="text-4xl">{t.emoji}</span>
                <div className="flex-1">
                  <p className="font-display text-2xl leading-tight">{t.name}</p>
                  <p className="text-base text-muted">도장 {count}개</p>
                </div>
                {active && <span className="text-2xl">👈</span>}
              </div>
            )
          })}
          <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 text-center">
            <p className="font-display text-2xl">
              {phase.kind === 'map' && me ? `${me.name}, 어디로 갈까요?` : phase.kind === 'flying' ? `${phase.to.name}로 가는 중… ✈️` : '문제 푸는 중'}
            </p>
            <p className="mt-1 text-sm text-muted">지도의 나라를 눌러요. 3문제 중 2개를 맞히면 도장!</p>
          </div>
        </aside>
      </div>

      {phase.kind === 'quiz' && me && (
        <QuizModal
          key={phase.questions[phase.index].id}
          question={phase.questions[phase.index]}
          stage="trip"
          progress={`${phase.index + 1}/${phase.questions.length}`}
          player={{ name: me.name, emoji: me.emoji, isBot: false }}
          result={phase.showResult ? { correct: phase.results[phase.index] } : null}
          onAnswer={answer}
          onContinue={next}
        />
      )}

      {phase.kind === 'stamp' && me && (
        <StampResult
          traveler={me}
          country={phase.country}
          correct={phase.correct}
          total={3}
          stamped={phase.stamped}
          alreadyHad={phase.alreadyHad}
          fact={phase.fact}
          onContinue={backToMap}
        />
      )}

      {bookOpen && <PassportBook travelers={travelers} stampsOf={(id) => stampBook[id] ?? {}} onClose={() => setBookOpen(false)} />}
    </main>
  )
}
