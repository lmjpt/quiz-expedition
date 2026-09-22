import { useState } from 'react'
import type { Profile } from './types'
import { BOT_COLOR, PLAYER_COLORS, type PlayerState } from './game/engine'
import { getBoard, nextBoardId, type BoardId } from './game/board'
import {
  lastBoard,
  load,
  orderSettings,
  recordGame,
  saveLastBoard,
  saveLastFirst,
  saveOrderMode,
  saveProfiles,
  type OrderMode,
} from './game/storage'
import Start from './screens/Start'
import Play from './screens/Play'
import Finish from './screens/Finish'

type Screen =
  | { kind: 'start' }
  /** first: 먼저 시작하는 사람의 index. null 이면 주사위로 정합니다 */
  | { kind: 'play'; players: PlayerState[]; first: number | null; key: number }
  | { kind: 'finish'; players: PlayerState[]; winner: number; playedBoard: BoardId }

/** 말 색은 프로필 순서(첫째·둘째)에 고정. 누가 먼저 하든 색은 그대로입니다 */
function toPlayer(p: Profile, colorIndex: number): PlayerState {
  return {
    profileId: p.id,
    name: p.name,
    emoji: p.emoji,
    color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
    level: p.level,
    pos: 0,
    answered: 0,
    correct: 0,
    isBot: false,
  }
}

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>(() => load().profiles)
  const [screen, setScreen] = useState<Screen>({ kind: 'start' })
  // 말판은 판마다 돌려 씁니다. 시작 화면에서 바꿀 수도 있습니다
  const [boardId, setBoardId] = useState<BoardId>(() => nextBoardId(lastBoard()))
  // 순서: 주사위로 정하기 / 번갈아. 번갈아면 지난 판에 먼저 한 아이의 반대편
  const [orderMode, setOrderMode] = useState<OrderMode>(() => orderSettings().orderMode)
  const [firstId, setFirstId] = useState<string>(() => {
    const { lastFirst } = orderSettings()
    const ps = load().profiles
    return ps.find((p) => p.id !== lastFirst)?.id ?? ps[0].id
  })

  function updateProfiles(next: Profile[]) {
    setProfiles(next)
    saveProfiles(next)
  }

  function changeOrderMode(mode: OrderMode) {
    setOrderMode(mode)
    saveOrderMode(mode)
  }

  function begin(players: PlayerState[], first: number | null) {
    saveLastBoard(boardId)
    if (first !== null) saveLastFirst(players[first].profileId)
    setScreen({ kind: 'play', players, first, key: Date.now() })
  }

  function startSolo(profile: Profile) {
    const colorIndex = Math.max(0, profiles.findIndex((p) => p.id === profile.id))
    const bot: PlayerState = {
      profileId: 'bot',
      name: '로봇',
      emoji: '🤖',
      color: BOT_COLOR,
      level: profile.level,
      pos: 0,
      answered: 0,
      correct: 0,
      isBot: true,
    }
    // 혼자 할 때는 주사위 모드면 로봇과 순서를 정하고, 아니면 아이가 먼저
    begin([toPlayer(profile, colorIndex), bot], orderMode === 'dice' ? null : 0)
  }

  function startDuo() {
    const players = profiles.slice(0, 2).map((p, i) => toPlayer(p, i))
    if (orderMode === 'dice') return begin(players, null)
    const first = Math.max(0, players.findIndex((p) => p.profileId === firstId))
    begin(players, first)
  }

  function finish(players: PlayerState[], winner: number) {
    const ids = players.filter((p) => !p.isBot).map((p) => p.profileId)
    const winnerId = players[winner].isBot ? null : players[winner].profileId
    recordGame(ids, winnerId)
    setProfiles(load().profiles)
    setBoardId(nextBoardId(boardId))
    // 번갈아 모드: 다음 판은 이번에 먼저 안 한 아이가 먼저
    const { lastFirst } = orderSettings()
    setFirstId(profiles.find((p) => p.id !== lastFirst)?.id ?? profiles[0].id)
    setScreen({ kind: 'finish', players, winner, playedBoard: boardId })
  }

  switch (screen.kind) {
    case 'start':
      return (
        <Start
          profiles={profiles}
          boardId={boardId}
          onChangeBoard={setBoardId}
          orderMode={orderMode}
          onChangeOrderMode={changeOrderMode}
          firstId={firstId}
          onSwapFirst={() => setFirstId(profiles.find((p) => p.id !== firstId)?.id ?? firstId)}
          onChangeProfiles={updateProfiles}
          onStartSolo={startSolo}
          onStartDuo={startDuo}
        />
      )
    case 'play':
      return (
        <Play
          key={screen.key}
          boardId={boardId}
          players={screen.players}
          first={screen.first}
          onOrderDecided={(profileId) => saveLastFirst(profileId)}
          onFinish={finish}
          onQuit={() => setScreen({ kind: 'start' })}
          onChangeLevel={(id, level) => updateProfiles(profiles.map((p) => (p.id === id ? { ...p, level } : p)))}
        />
      )
    case 'finish': {
      const again = screen.players.map((p) => ({ ...p, pos: 0, answered: 0, correct: 0 }))
      const { lastFirst } = orderSettings()
      const nextFirst = Math.max(0, again.findIndex((p) => p.profileId !== lastFirst))
      return (
        <Finish
          players={screen.players}
          winner={screen.winner}
          destination={getBoard(screen.playedBoard).theme.destination}
          goalEmoji={getBoard(screen.playedBoard).theme.goal}
          onAgain={() => begin(again, orderMode === 'dice' ? null : nextFirst)}
          onHome={() => setScreen({ kind: 'start' })}
        />
      )
    }
  }
}
