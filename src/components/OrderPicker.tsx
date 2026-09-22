// 판 시작 전 "누가 먼저?" — 둘이 주사위를 한 번씩 굴려 높은 눈이 먼저 합니다.
// 같으면 다시 굴립니다. 매번 첫째가 먼저 시작해서 둘째가 서운하다는 말에 만들었습니다.

import { useEffect, useRef, useState } from 'react'
import type { PlayerState } from '../game/engine'
import { sfx } from '../sound'
import { speak } from '../speech'

interface Props {
  players: PlayerState[]
  onDecided: (first: number) => void
}

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'] as const

export default function OrderPicker({ players, onDecided }: Props) {
  const [rolls, setRolls] = useState<(number | null)[]>(() => players.map(() => null))
  const [round, setRound] = useState(1)
  const [winner, setWinner] = useState<number | null>(null)
  // onDecided 는 부모가 매 렌더마다 새로 만들어 넘기므로 ref 로 붙잡습니다.
  // 그렇지 않으면 아래 효과가 다시 돌면서 타이머를 지워 버려 게임이 시작되지 않습니다.
  const decidedRef = useRef(onDecided)
  decidedRef.current = onDecided

  const allRolled = rolls.every((r) => r !== null)

  function roll(i: number) {
    if (rolls[i] !== null || winner !== null) return
    sfx.dice()
    setRolls((prev) => prev.map((r, k) => (k === i ? 1 + Math.floor(Math.random() * 6) : r)))
  }

  // 둘 다 굴렸으면 판정. 같으면 잠깐 보여 주고 다시
  useEffect(() => {
    if (!allRolled || winner !== null) return
    const values = rolls as number[]
    const max = Math.max(...values)
    const tops = values.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0)
    if (tops.length > 1) {
      speak('같은 눈! 다시 굴려요')
      const t = setTimeout(() => {
        setRolls(players.map(() => null))
        setRound((r) => r + 1)
      }, 1400)
      return () => clearTimeout(t)
    }
    const first = tops[0]
    setWinner(first)
    sfx.correct()
    speak(`${players[first].name} 먼저!`)
  }, [allRolled, rolls, winner, players])

  // 이긴 사람을 잠깐 보여 주고 시작
  useEffect(() => {
    if (winner === null) return
    const t = setTimeout(() => decidedRef.current(winner), 1600)
    return () => clearTimeout(t)
  }, [winner])

  // 로봇은 알아서 굴립니다
  useEffect(() => {
    const bots = players.map((p, i) => (p.isBot && rolls[i] === null ? i : -1)).filter((i) => i >= 0)
    if (bots.length === 0 || winner !== null) return
    const t = setTimeout(() => bots.forEach(roll), 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolls, winner, players])

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
      <div className="pop flex w-full max-w-2xl flex-col items-center gap-6 rounded-3xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <h2 className="font-display text-4xl">누가 먼저 할까요?</h2>
          <p className="mt-1 text-lg text-muted">
            {winner !== null
              ? `${players[winner].emoji} ${players[winner].name} 먼저 출발!`
              : allRolled
                ? '같은 눈이에요! 다시 굴려요'
                : round > 1
                  ? `${round}번째 도전! 주사위를 눌러요`
                  : '주사위를 눌러요. 높은 눈이 먼저!'}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-6">
          {players.map((p, i) => {
            const rolled = rolls[i]
            const isWinner = winner === i
            return (
              <button
                key={p.profileId}
                type="button"
                onClick={() => roll(i)}
                disabled={rolled !== null || p.isBot}
                className={`flex flex-col items-center gap-3 rounded-3xl border-4 bg-cream p-6 transition disabled:cursor-default ${
                  isWinner ? 'scale-105 shadow-xl' : rolled === null && !p.isBot ? 'hover:shadow-lg active:scale-95' : 'opacity-90'
                }`}
                style={{ borderColor: p.color }}
              >
                <span className="text-5xl">{p.emoji}</span>
                <span className="font-display text-2xl">{p.name}</span>
                <span className={`text-7xl leading-none ${rolled === null ? 'opacity-40' : 'pop'}`}>
                  {rolled === null ? '🎲' : FACES[rolled - 1]}
                </span>
                <span className="font-display text-xl" style={{ color: p.color }}>
                  {isWinner ? '먼저!' : rolled === null ? (p.isBot ? '굴리는 중…' : '눌러서 굴리기') : `${rolled} 나왔어요`}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
