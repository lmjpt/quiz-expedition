// 놀이 화면. 규칙은 engine.ts 가 정하고, 여기서는 타이밍(말 이동, 로봇 지연),
// 소리, 키보드, 기록만 맡습니다.

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { GOAL, getBoard, type BoardId } from '../game/board'
import { PLAYER_COLORS, newGame, reduce, type PlayerState } from '../game/engine'
import { isMuted, recentIds, recordAnswer, setMuted } from '../game/storage'
import { answerText, pickQuestion } from '../questions/pick'
import { setSpeechMuted, speak } from '../speech'
import { setSoundMuted, sfx } from '../sound'
import type { Level } from '../types'
import Board from '../components/Board'
import Dice from '../components/Dice'
import QuizModal from '../components/QuizModal'
import PlayerCard from '../components/PlayerCard'
import QuitDialog from '../components/QuitDialog'

interface Props {
  boardId: BoardId
  players: PlayerState[]
  onFinish: (players: PlayerState[], winner: number) => void
  onQuit: () => void
  /** 판 도중 단계를 바꾸면 프로필에도 남깁니다 */
  onChangeLevel: (profileId: string, level: Level) => void
}

const STEP_MS = 320
/** 주사위가 튀어 오르고 도는 시간. index.css 의 dice-bounce, .cube transition 과 맞춰야 합니다 */
const ROLL_MS = 1100
/** 말이 멈춘 뒤 문제 창이 열리기까지 쉬는 시간. 어디에 섰는지 보라고 두는 틈 */
const LAND_PAUSE_MS = 1500
const BOT_THINK_MS = 1800
const BOT_READ_MS = 2400

export default function Play({ boardId, players, onFinish, onQuit, onChangeLevel }: Props) {
  const [state, dispatch] = useReducer(reduce, undefined, () => newGame(players, boardId))
  const board = getBoard(state.boardId)
  const [displayPos, setDisplayPos] = useState(() => players.map((p) => p.pos))
  const displayRef = useRef(displayPos)
  displayRef.current = displayPos
  const [glide, setGlide] = useState(false)
  /** 말판 위에 잠깐 뜨는 안내. "새봄, 12번 칸 도착!" — 문제 창이 열리면 사라집니다 */
  const [announce, setAnnounce] = useState<string | null>(null)
  const [dice, setDice] = useState<number | null>(null)
  const [rollCount, setRollCount] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [muted, setMutedState] = useState(isMuted)
  const [quitting, setQuitting] = useState(false)

  const { phase, current } = state
  const me = state.players[current]

  useEffect(() => {
    setSpeechMuted(muted)
    setSoundMuted(muted)
    setMuted(muted)
  }, [muted])

  // 주사위 굴리기: 흔들리는 동안 기다렸다가 규칙에 넘깁니다
  const roll = useCallback(() => {
    if (phase.kind !== 'idle' || rolling) return
    const d = 1 + Math.floor(Math.random() * 6)
    sfx.dice()
    setDice(d)
    setRollCount((c) => c + 1)
    setRolling(true)
    setTimeout(() => {
      setRolling(false)
      dispatch({ type: 'roll', dice: d })
    }, ROLL_MS)
  }, [phase.kind, rolling])

  // 규칙이 문제를 달라고 하면 그 사람 수준의 문제를 골라 넘겨 줍니다.
  // 바로 열지 않고 잠깐 쉽니다 — 말이 어디에 섰는지 볼 시간을 주기 위해서입니다.
  //   첫 차례: 짧게 / 보너스 문제(퀴즈 칸 도착): 한 템포 / 다음 사람 차례: 한 템포,
  //   사다리·보너스로 날아간 직후면 날아가는 1초까지 기다립니다.
  useEffect(() => {
    if (phase.kind !== 'needQuestion') return
    const delay =
      state.turn === 1 && phase.stage === 'turn' ? 600 : phase.stage === 'tile' ? LAND_PAUSE_MS : glide ? LAND_PAUSE_MS + 1000 : LAND_PAUSE_MS
    const t = setTimeout(() => {
      setAnnounce(null)
      dispatch({ type: 'ask', question: pickQuestion(me.level, recentIds(me.profileId)) })
    }, delay)
    return () => clearTimeout(t)
    // glide 는 시작 시점 값만 쓰면 됩니다. 도중에 바뀌어도 기다리는 시간을 다시 재지 않습니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, me.level, me.profileId, state.turn])

  // 말이 한 칸씩 뛰어가고, 다 가면 칸을 확인합니다
  useEffect(() => {
    if (phase.kind !== 'rolled') return
    const { from, to } = phase
    const idx = current
    let pos = from
    let cancelled = false
    let landTimer: ReturnType<typeof setTimeout> | undefined
    const stepTimer = setInterval(() => {
      pos += 1
      sfx.step()
      setDisplayPos((prev) => prev.map((p, i) => (i === idx ? pos : p)))
      if (pos >= to) {
        clearInterval(stepTimer)
        setAnnounce(`${state.players[idx].emoji} ${state.players[idx].name}, ${to}번 칸 도착!`)
        landTimer = setTimeout(() => {
          if (!cancelled) dispatch({ type: 'land' })
        }, STEP_MS)
      }
    }, STEP_MS)
    return () => {
      cancelled = true
      clearInterval(stepTimer)
      if (landTimer) clearTimeout(landTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current])

  // 사다리·보너스 등으로 자리가 바뀌면 화면 위치도 따라갑니다.
  // 두 칸 넘게 한 번에 움직이면 '날아가는' 느린 이동으로 보여 줍니다
  useEffect(() => {
    if (phase.kind === 'rolled') return
    const next = state.players.map((p) => p.pos)
    const prev = displayRef.current
    const far = next.some((p, i) => Math.abs(p - prev[i]) > 1)
    setDisplayPos(next)
    if (!far) return
    const movedCount = next.filter((p, i) => p !== prev[i]).length
    const movedUp = next.some((p, i) => p > prev[i])
    if (movedCount > 1) sfx.swap()
    else if (movedUp) sfx.rise()
    else sfx.fall()
    setAnnounce(
      state.players
        .filter((p, i) => p.pos !== prev[i])
        .map((p) => `${p.emoji} ${p.name}, ${p.pos}번 칸으로!`)
        .join('  '),
    )
    setGlide(true)
    const t = setTimeout(() => setGlide(false), 1000)
    return () => clearTimeout(t)
  }, [state.players, phase.kind])

  // 효과음 + 읽어 주기. 효과음이 먼저, 말은 살짝 뒤에
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    switch (phase.kind) {
      case 'quiz':
        sfx.pop()
        speak(phase.stage === 'turn' ? `${me.name}. ${phase.question.prompt}` : `보너스 문제! ${phase.question.prompt}`)
        break
      case 'quizResult': {
        if (phase.correct) sfx.correct()
        else sfx.wrong()
        const line = phase.correct
          ? phase.stage === 'turn'
            ? '딩동댕! 맞았어요. 주사위를 굴려요!'
            : '딩동댕! 맞았어요. 2칸 더 가요'
          : `아쉬워요. 정답은 ${answerText(phase.question)}. ${phase.question.explain ?? ''}`
        t = setTimeout(() => speak(line), 500)
        break
      }
      case 'tileEvent':
        sfx.pop()
        speak(phase.text)
        break
      case 'finished':
        sfx.win()
        t = setTimeout(() => speak(`${state.players[phase.winner].name} 도착! 이겼어요`), 600)
        break
    }
    return () => {
      if (t) clearTimeout(t)
    }
  }, [phase, me.name, state.players])

  // 도착하면 잠깐 보여 주고 결과 화면으로
  useEffect(() => {
    if (phase.kind !== 'finished') return
    const t = setTimeout(() => onFinish(state.players, phase.winner), 1400)
    return () => clearTimeout(t)
  }, [phase, state.players, onFinish])

  // 로봇 차례는 알아서 진행합니다
  useEffect(() => {
    if (!me.isBot) return
    let t: ReturnType<typeof setTimeout> | undefined
    if (phase.kind === 'idle') t = setTimeout(roll, 1000)
    else if (phase.kind === 'quiz')
      t = setTimeout(() => dispatch({ type: 'answer', correct: Math.random() < 0.55 }), BOT_THINK_MS)
    else if (phase.kind === 'quizResult' || phase.kind === 'tileEvent')
      t = setTimeout(() => dispatch({ type: 'continue' }), BOT_READ_MS)
    return () => {
      if (t) clearTimeout(t)
    }
  }, [phase, me.isBot, roll])

  // 키보드: Space / Enter 로 굴리기와 계속. 보기 고르기와 숫자 입력은 문제 창이 맡습니다
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== ' ' && e.key !== 'Enter') return
      if (me.isBot || quitting) return
      if (phase.kind === 'idle') {
        e.preventDefault()
        roll()
      } else if (phase.kind === 'quizResult' || phase.kind === 'tileEvent') {
        e.preventDefault()
        dispatch({ type: 'continue' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase.kind, me.isBot, roll, quitting])

  function answer(correct: boolean) {
    if (phase.kind !== 'quiz') return
    if (!me.isBot) recordAnswer(me.profileId, phase.question.id, correct)
    dispatch({ type: 'answer', correct })
  }


  const message = (() => {
    switch (phase.kind) {
      case 'idle':
        return me.isBot ? '로봇이 굴려요…' : `${me.name}, 주사위를 굴려요!`
      case 'rolled':
        return `${phase.dice} 나왔어요!`
      case 'needQuestion':
      case 'quiz':
      case 'quizResult':
        return `${me.name} 차례`
      case 'finished':
        return `${state.players[phase.winner].name} 도착! 🏆`
      default:
        return ''
    }
  })()

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-6 py-5">
      <header className="flex items-center justify-between">
        <button type="button" onClick={() => setQuitting(true)} className="rounded-xl px-3 py-2 text-lg text-muted hover:bg-white">
          ← 처음으로
        </button>
        <div className="text-center">
          <h1 className="font-display text-3xl leading-tight">
            {board.emoji} {board.theme.title}
          </h1>
          <p className="text-sm text-muted">
            {board.theme.start} 출발 → {board.theme.goal} {board.theme.destination}까지 {GOAL}칸
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMutedState((m) => !m)}
          className="rounded-xl px-3 py-2 text-2xl hover:bg-white"
          aria-label={muted ? '소리 켜기' : '소리 끄기'}
          title={muted ? '소리 켜기' : '소리 끄기'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="relative">
          <Board board={board} players={state.players} displayPos={displayPos} current={current} glide={glide} />
          {announce && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <span className="pop font-display rounded-full border-2 border-white bg-ink/85 px-5 py-2 text-xl text-white shadow-lg">
                {announce}
              </span>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          {state.players.map((p, i) => (
            <PlayerCard
              key={p.profileId}
              player={p}
              color={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              active={i === current}
              onChangeLevel={(level) => {
                dispatch({ type: 'setLevel', player: i, level })
                onChangeLevel(p.profileId, level)
              }}
            />
          ))}

          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 shadow-sm">
            <Dice value={dice} spin={rollCount} rolling={rolling} disabled={phase.kind !== 'idle' || me.isBot || rolling} onRoll={roll} />
            <p className="font-display min-h-14 text-center text-2xl">{message}</p>
            {phase.kind === 'idle' && !me.isBot && <p className="text-sm text-muted">Space 를 눌러도 돼요</p>}
          </div>
        </aside>
      </div>

      {(phase.kind === 'quiz' || phase.kind === 'quizResult') && (
        <QuizModal
          key={phase.question.id}
          question={phase.question}
          stage={phase.stage}
          player={me}
          result={phase.kind === 'quizResult' ? { correct: phase.correct } : null}
          onAnswer={answer}
          onContinue={() => dispatch({ type: 'continue' })}
        />
      )}

      {quitting && <QuitDialog onQuit={onQuit} onStay={() => setQuitting(false)} />}

      {phase.kind === 'tileEvent' && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
          <div className="pop flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-2xl">
            <p className="text-7xl">{phase.emoji}</p>
            <p className="text-3xl font-black">{phase.text}</p>
            {!me.isBot && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'continue' })}
                className="mt-2 rounded-2xl bg-brand px-10 py-4 text-2xl font-black text-white transition hover:brightness-105 active:scale-95"
              >
                계속 (Space)
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
