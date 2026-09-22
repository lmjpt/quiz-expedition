// 말판 위 SVG 그림들: 구불구불한 길, 지나온 길(사람마다 색), 올라가는·내려가는 연결.
// 좌표계는 칸 하나가 100 × 100.

import { COLS, ROWS, tileCenter, type BoardDef, type Connector } from '../game/board'

export const VW = COLS * 100
export const VH = ROWS * 100

export type Pt = { x: number; y: number }

export function pt(index: number): Pt {
  const c = tileCenter(index)
  return { x: (c.x / 100) * VW, y: (c.y / 100) * VH }
}

/** 점들을 지나는 부드러운 곡선 (Catmull-Rom → 베지어). 격자 느낌을 지우는 핵심 */
export function smoothPath(points: Pt[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`
  }
  return d
}

/** 길. 가장자리 → 바닥 → 점선 발자국 순으로 겹칩니다 */
export function Road({ board }: { board: BoardDef }) {
  const points = board.tiles.map((_, i) => pt(i))
  const d = smoothPath(points)
  const t = board.theme
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={t.roadEdge} strokeWidth={50} strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
      <path d={d} fill="none" stroke={t.road} strokeWidth={40} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={t.roadDash} strokeWidth={5} strokeDasharray="3 16" strokeLinecap="round" />
    </svg>
  )
}

/** 각 사람이 지나온 길. 말 색으로 얇게 칠해서 경주 느낌을 냅니다 */
export function Progress({ board, positions, colors }: { board: BoardDef; positions: number[]; colors: string[] }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden>
      {positions.map((pos, i) => {
        if (pos <= 0) return null
        const points = board.tiles.slice(0, pos + 1).map((_, k) => pt(k))
        const offset = i === 0 ? -9 : 9
        const shifted = points.map((p) => ({ x: p.x, y: p.y + offset }))
        return (
          <path
            key={i}
            d={smoothPath(shifted)}
            fill="none"
            stroke={colors[i]}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
            style={{ transition: 'd 0.4s' }}
          />
        )
      })}
    </svg>
  )
}

export function Connectors({ board }: { board: BoardDef }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden>
      {board.tiles.map((tile, i) => {
        if (tile.type === 'ladder') return <Link key={i} from={pt(i)} to={pt(tile.to)} c={board.theme.up} />
        if (tile.type === 'slide') return <Link key={i} from={pt(i)} to={pt(tile.to)} c={board.theme.down} />
        return null
      })}
    </svg>
  )
}

function Link({ from, to, c }: { from: Pt; to: Pt; c: Connector }) {
  switch (c.style) {
    case 'ladder':
      return <Ladder from={from} to={to} color={c.color} />
    case 'wave':
      return <Wave from={from} to={to} color={c.color} />
    case 'trail':
      return <Trail from={from} to={to} color={c.color} />
    case 'tube':
      return <Tube from={from} to={to} color={c.color} />
    case 'swirl':
      return <Swirl from={from} to={to} color={c.color} />
  }
}

type LinkProps = { from: Pt; to: Pt; color: string }

function axes(from: Pt, to: Pt) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  return { len, ux: dx / len, uy: dy / len, px: -dy / len, py: dx / len }
}

function curve(from: Pt, to: Pt, bulge: number): string {
  const { px, py } = axes(from, to)
  const c = { x: (from.x + to.x) / 2 + px * bulge, y: (from.y + to.y) / 2 + py * bulge }
  return `M ${from.x} ${from.y} Q ${c.x} ${c.y} ${to.x} ${to.y}`
}

/** 숲: 레일 두 줄 + 가로 발판 */
function Ladder({ from, to, color }: LinkProps) {
  const { ux, uy, px, py } = axes(from, to)
  const half = 15
  const trim = 14
  const a = { x: from.x + ux * trim, y: from.y + uy * trim }
  const b = { x: to.x - ux * trim, y: to.y - uy * trim }
  const inner = Math.hypot(b.x - a.x, b.y - a.y)
  const rungCount = Math.max(3, Math.floor(inner / 18))
  const rungs = Array.from({ length: rungCount }, (_, k) => {
    const t = (k + 0.5) / rungCount
    const cx = a.x + (b.x - a.x) * t
    const cy = a.y + (b.y - a.y) * t
    return { x1: cx + px * half, y1: cy + py * half, x2: cx - px * half, y2: cy - py * half }
  })
  const rails = [-half, half].map((o) => ({ x1: a.x + px * o, y1: a.y + py * o, x2: b.x + px * o, y2: b.y + py * o }))
  return (
    <g strokeLinecap="round">
      <g stroke="#ffffff" strokeWidth={11} opacity={0.9}>
        {rails.map((l, i) => (
          <line key={`o${i}`} {...l} />
        ))}
      </g>
      <g stroke={color} strokeWidth={6}>
        {rails.map((l, i) => (
          <line key={`r${i}`} {...l} />
        ))}
        {rungs.map((l, i) => (
          <line key={`s${i}`} {...l} strokeWidth={5} />
        ))}
      </g>
    </g>
  )
}

/** 바다: 큰 파도 한 줄 */
function Wave({ from, to, color }: LinkProps) {
  const d = curve(from, to, -45)
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="#ffffff" strokeWidth={26} opacity={0.85} />
      <path d={d} stroke={color} strokeWidth={16} />
      <path d={d} stroke="#ffffff" strokeWidth={4} strokeDasharray="4 16" />
      <circle cx={to.x} cy={to.y} r={12} fill="#ffffff" stroke={color} strokeWidth={4} />
    </g>
  )
}

/** 우주: 점점이 이어지는 불꽃 꼬리 */
function Trail({ from, to, color }: LinkProps) {
  const d = curve(from, to, 30)
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={color} strokeWidth={22} opacity={0.25} />
      <path d={d} stroke={color} strokeWidth={8} strokeDasharray="2 18" />
      <path d={d} stroke="#ffffff" strokeWidth={3} strokeDasharray="2 18" strokeDashoffset={-8} opacity={0.9} />
      <circle cx={to.x} cy={to.y} r={14} fill={color} stroke="#ffffff" strokeWidth={4} />
    </g>
  )
}

/** 숲: 파란 미끄럼틀 관 */
function Tube({ from, to, color }: LinkProps) {
  const d = curve(from, to, 55)
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="#ffffff" strokeWidth={28} opacity={0.9} />
      <path d={d} stroke={color} strokeWidth={18} />
      <path d={d} stroke="#ffffff" strokeWidth={3} strokeDasharray="8 12" opacity={0.9} />
      <circle cx={to.x} cy={to.y} r={13} fill={color} stroke="#ffffff" strokeWidth={4} />
    </g>
  )
}

/** 바다·우주: 빙글빙글 감기는 소용돌이 */
function Swirl({ from, to, color }: LinkProps) {
  const d = curve(from, to, 50)
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="#ffffff" strokeWidth={22} opacity={0.7} />
      <path d={d} stroke={color} strokeWidth={12} strokeDasharray="14 10" />
      <circle cx={to.x} cy={to.y} r={22} stroke={color} strokeWidth={4} opacity={0.5} />
      <circle cx={to.x} cy={to.y} r={14} stroke={color} strokeWidth={4} opacity={0.8} />
      <circle cx={to.x} cy={to.y} r={6} fill={color} />
    </g>
  )
}
