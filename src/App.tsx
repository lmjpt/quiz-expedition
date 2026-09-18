import { useState } from 'react'
import type { Profile } from './types'
import type { PlayerState } from './game/engine'
import { getBoard, nextBoardId, type BoardId } from './game/board'
import { lastBoard, load, recordGame, saveLastBoard, saveProfiles } from './game/storage'
import Start from './screens/Start'
import Play from './screens/Play'
import Finish from './screens/Finish'

type Screen =
  | { kind: 'start' }
  | { kind: 'play'; players: PlayerState[]; key: number }
  | { kind: 'finish'; players: PlayerState[]; winner: number; playedBoard: BoardId }

function toPlayer(p: Profile, isBot = false): PlayerState {
  return {
    profileId: p.id,
    name: p.name,
    emoji: p.emoji,
    level: p.level,
    pos: 0,
    answered: 0,
    correct: 0,
    isBot,
  }
}

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>(() => load().profiles)
  const [screen, setScreen] = useState<Screen>({ kind: 'start' })
  // 말판은 판마다 돌려 씁니다. 시작 화면에서 바꿀 수도 있습니다
  const [boardId, setBoardId] = useState<BoardId>(() => nextBoardId(lastBoard()))

  function updateProfiles(next: Profile[]) {
    setProfiles(next)
    saveProfiles(next)
  }

  function begin(players: PlayerState[]) {
    saveLastBoard(boardId)
    setScreen({ kind: 'play', players, key: Date.now() })
  }

  function startSolo(profile: Profile) {
    const bot: PlayerState = {
      profileId: 'bot',
      name: '로봇',
      emoji: '🤖',
      level: profile.level,
      pos: 0,
      answered: 0,
      correct: 0,
      isBot: true,
    }
    begin([toPlayer(profile), bot])
  }

  function startDuo(a: Profile, b: Profile) {
    begin([toPlayer(a), toPlayer(b)])
  }

  function finish(players: PlayerState[], winner: number) {
    const ids = players.filter((p) => !p.isBot).map((p) => p.profileId)
    const winnerId = players[winner].isBot ? null : players[winner].profileId
    recordGame(ids, winnerId)
    setProfiles(load().profiles)
    setBoardId(nextBoardId(boardId))
    setScreen({ kind: 'finish', players, winner, playedBoard: boardId })
  }

  switch (screen.kind) {
    case 'start':
      return (
        <Start
          profiles={profiles}
          boardId={boardId}
          onChangeBoard={setBoardId}
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
          onFinish={finish}
          onQuit={() => setScreen({ kind: 'start' })}
          onChangeLevel={(id, level) => updateProfiles(profiles.map((p) => (p.id === id ? { ...p, level } : p)))}
        />
      )
    case 'finish':
      return (
        <Finish
          players={screen.players}
          winner={screen.winner}
          destination={getBoard(screen.playedBoard).theme.destination}
          goalEmoji={getBoard(screen.playedBoard).theme.goal}
          onAgain={() => begin(screen.players.map((p) => ({ ...p, pos: 0, answered: 0, correct: 0 })))}
          onHome={() => setScreen({ kind: 'start' })}
        />
      )
  }
}
