// 말판 = 모험 지도.
//
// 겹치는 순서 (아래부터):
//   배경 그라데이션 → 풍경 이모지 → 길 → 지나온 길(사람 색) → 징검돌(칸) → 사다리·미끄럼틀 → 말
// 격자 상자는 그리지 않습니다. 칸은 길 위에 놓인 둥근 돌이고, 특수 칸만 크게 세웁니다.

import { COLS, ROWS, TILE_BG, TILE_NAME, tileCenter, tileGrid, type BoardDef, type Tile } from '../game/board'
import { PLAYER_COLORS, type PlayerState } from '../game/engine'
import { Connectors, Progress, Road } from './BoardPath'

interface Props {
  board: BoardDef
  players: PlayerState[]
  /** 화면에 보여 줄 위치. 이동 애니메이션 중에는 실제 상태보다 뒤에 있을 수 있음 */
  displayPos: number[]
  current: number
  /** 사다리·미끄럼틀·보너스처럼 여러 칸을 한 번에 갈 때 true — 천천히 날아감 */
  glide: boolean
}

export default function Board({ board, players, displayPos, current, glide }: Props) {
  const { tiles, theme } = board

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[2rem] border-[6px] border-white/80 shadow-xl ${theme.bg}`}
      style={{ aspectRatio: `${COLS} / ${ROWS}` }}
    >
      <Scenery decor={theme.decor} />
      <Road board={board} />
      <Progress board={board} positions={displayPos} />

      {/* 칸 */}
      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
      >
        {tiles.map((tile, i) => {
          const { row, col } = tileGrid(i)
          return (
            <div key={i} className="relative" style={{ gridRow: ROWS - row, gridColumn: col + 1 }} title={TILE_NAME[tile.type]}>
              <Stone tile={tile} index={i} board={board} />
            </div>
          )
        })}
      </div>

      <Connectors board={board} />

      {/* 말 */}
      {players.map((p, i) => {
        const c = tileCenter(displayPos[i])
        const offset = i === 0 ? -16 : 16
        const color = PLAYER_COLORS[i % PLAYER_COLORS.length]
        return (
          <div
            key={p.profileId}
            className={`absolute flex items-center justify-center ${glide ? 'token-glide' : 'token'}`}
            style={{
              left: `calc(${c.x}% + ${offset}px)`,
              top: `calc(${c.y}% + 6px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span
              className={`rounded-full border-4 bg-white px-1 shadow-lg ${i === current ? 'breathe' : ''}`}
              style={{ borderColor: color }}
            >
              <span key={displayPos[i]} className={`block text-3xl md:text-4xl ${glide ? 'fly' : 'hop'}`}>
                {p.emoji}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** 빈 자리(격자 교차점)에 풍경을 흩어 놓습니다. 위치는 늘 같아서 지도가 매번 같아 보입니다 */
function Scenery({ decor }: { decor: string[] }) {
  const items: { x: number; y: number; emoji: string; size: string }[] = []
  for (let c = 0; c <= COLS; c += 1) {
    for (let r = 0; r <= ROWS; r += 1) {
      const h = (c * 7 + r * 13) % 5
      if (h !== 0 && h !== 3) continue
      const emoji = decor[(c * 3 + r * 5) % decor.length]
      items.push({ x: (c / COLS) * 100, y: (r / ROWS) * 100, emoji, size: h === 0 ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl' })
    }
  }
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((it, i) => (
        <span
          key={i}
          className={`absolute ${it.size} opacity-80 drop-shadow`}
          style={{ left: `${it.x}%`, top: `${it.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  )
}

function Stone({ tile, index, board }: { tile: Tile; index: number; board: BoardDef }) {
  const { theme } = board

  if (tile.type === 'start' || tile.type === 'goal') {
    const isGoal = tile.type === 'goal'
    return (
      <div className="absolute inset-[4%] flex flex-col items-center justify-center">
        <span className={`text-4xl leading-none drop-shadow-lg md:text-6xl ${isGoal ? 'twinkle' : ''}`}>
          {isGoal ? theme.goal : theme.start}
        </span>
        <span className="font-display mt-0.5 rounded-full bg-white/90 px-2 text-[11px] leading-4 text-ink shadow md:text-xs">
          {isGoal ? theme.destination : '출발'}
        </span>
      </div>
    )
  }

  const special = tile.type === 'ladder' || tile.type === 'slide' || tile.type === 'swap'
  const emoji =
    tile.type === 'free'
      ? tile.decor
      : tile.type === 'ladder'
        ? theme.up.emoji
        : tile.type === 'slide'
          ? theme.down.emoji
          : tile.type === 'swap'
            ? theme.swapEmoji
            : ''
  const bg = tile.type === 'quiz' || tile.type === 'free' ? theme.stone : TILE_BG[tile.type]
  const inset = special ? 'inset-[10%]' : 'inset-[18%]'
  const label = tile.type === 'ladder' || tile.type === 'slide' ? `${tile.to}번으로` : tile.type === 'swap' ? '자리 바꿈' : ''

  return (
    <div className={`absolute ${inset} flex flex-col items-center justify-center rounded-full border-2 shadow-md ${bg}`}>
      <span className="font-display absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] text-ink shadow md:h-6 md:w-6 md:text-xs">
        {index}
      </span>
      {tile.type === 'quiz' ? (
        <span className="text-xl leading-none md:text-2xl">❓</span>
      ) : (
        <span className={`leading-none ${special ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>{emoji}</span>
      )}
      {label && (
        <span className="font-display absolute -bottom-2 rounded-full bg-white/95 px-1.5 text-[9px] leading-3.5 text-ink shadow md:text-[10px]">
          {label}
        </span>
      )}
    </div>
  )
}
