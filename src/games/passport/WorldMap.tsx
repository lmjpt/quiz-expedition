// 만화풍 세계 지도. 그림 파일 없이 SVG 로 대륙 덩어리를 그리고, 나라는 이모지 핀으로 세웁니다.
// 좌표계는 countries.ts 와 같은 1000 × 540. 핀은 퍼센트 위치로 얹어서 화면 크기에 따라 같이 늘어납니다.
//
// 돋보기: 유럽에 나라가 몰려 있어서 "🔍 유럽 확대" 버튼으로 유럽만 크게 볼 수 있습니다.
// SVG viewBox 를 유럽 영역으로 바꾸고 핀 위치도 그 영역 기준으로 다시 계산합니다 (핀 크기는 그대로).

import { useEffect, useRef, useState } from 'react'
import { COUNTRIES, HOME, type Country } from './countries'

interface Props {
  /** 지금 여행자가 이미 도장을 받은 나라 id */
  stamped: Record<string, string>
  /** 비행기가 있는 곳 (나라 id 또는 'home') */
  planeAt: string
  /** 날아가는 중이면 true — 핀을 누를 수 없고 비행기가 천천히 이동 */
  flying: boolean
  onPick: (country: Country) => void
}

const W = 1000
const H = 540

type View = { x: number; y: number; w: number; h: number }
const FULL: View = { x: 0, y: 0, w: W, h: H }
/** 유럽 확대 영역. 가로세로 비율은 전체 지도(1000:540)와 같아야 찌그러지지 않습니다 */
const EUROPE: View = { x: 400, y: 40, w: 320, h: 172.8 }

/** 대륙 모양. 정확하지 않아도 됩니다 — 아이가 "여기가 아프리카" 하고 알아볼 정도면 충분 */
const LAND: { id: string; d: string }[] = [
  { id: 'north-america', d: 'M 70 90 Q 120 40 230 55 Q 330 60 370 110 Q 340 160 300 190 Q 250 210 210 250 Q 180 272 160 240 Q 120 220 90 170 Q 60 130 70 90 Z' },
  { id: 'south-america', d: 'M 240 300 Q 300 280 350 320 Q 380 380 340 440 Q 310 500 290 505 Q 270 480 255 420 Q 230 360 240 300 Z' },
  { id: 'europe', d: 'M 432 92 Q 470 48 545 58 Q 612 66 636 116 Q 616 172 570 194 Q 522 208 476 196 Q 440 165 432 92 Z' },
  { id: 'africa', d: 'M 460 200 Q 530 185 600 210 Q 640 260 620 330 Q 600 400 560 440 Q 520 450 500 400 Q 470 330 455 270 Q 445 230 460 200 Z' },
  { id: 'asia', d: 'M 620 70 Q 720 40 830 60 Q 940 80 950 150 Q 930 210 880 230 Q 840 262 790 282 Q 740 272 700 242 Q 650 200 630 150 Q 610 110 620 70 Z' },
  { id: 'oceania', d: 'M 800 360 Q 860 335 910 360 Q 940 400 910 440 Q 860 460 815 440 Q 785 400 800 360 Z' },
  { id: 'antarctica', d: 'M 380 500 Q 500 470 620 500 Q 620 530 500 535 Q 380 530 380 500 Z' },
]

const ISLANDS: { cx: number; cy: number; rx: number; ry: number }[] = [
  { cx: 446, cy: 84, rx: 13, ry: 17 }, // 영국
  { cx: 908, cy: 190, rx: 12, ry: 24 }, // 일본
  { cx: 945, cy: 458, rx: 14, ry: 16 }, // 뉴질랜드
  { cx: 858, cy: 186, rx: 9, ry: 15 }, // 우리나라
  { cx: 812, cy: 318, rx: 18, ry: 7 }, // 인도네시아
  { cx: 845, cy: 326, rx: 20, ry: 7 },
  { cx: 876, cy: 316, rx: 12, ry: 6 },
]

const OCEAN_DECOR = ['🐳', '⛵', '🐬', '🌊', '🐠', '🌊', '⛵', '🐙']

/** 두 시야 사이를 0.4초 동안 부드럽게 옮깁니다 (SVG viewBox 는 CSS 로 애니메이션이 안 돼서 직접).
 *  requestAnimationFrame 은 화면이 안 보일 때 멈춰서 setInterval 로 돕니다. 끝나면 목표값을 정확히 맞춥니다 */
function useTweenedView(target: View): View {
  const [view, setView] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    const from = fromRef.current
    const start = Date.now()
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 400)
      const e = 1 - Math.pow(1 - t, 3)
      const cur =
        t >= 1
          ? target
          : {
              x: from.x + (target.x - from.x) * e,
              y: from.y + (target.y - from.y) * e,
              w: from.w + (target.w - from.w) * e,
              h: from.h + (target.h - from.h) * e,
            }
      setView(cur)
      fromRef.current = cur
      if (t >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return view
}

export default function WorldMap({ stamped, planeAt, flying, onPick }: Props) {
  const [zoomed, setZoomed] = useState(false)
  const view = useTweenedView(zoomed ? EUROPE : FULL)
  const spots = [HOME, ...COUNTRIES]
  const at = spots.find((s) => s.id === planeAt) ?? HOME

  /** 지도 좌표 → 지금 시야 안에서의 퍼센트 위치 */
  const px = (x: number) => ((x - view.x) / view.w) * 100
  const py = (y: number) => ((y - view.y) / view.h) * 100
  const inView = (x: number, y: number) => x >= view.x - 20 && x <= view.x + view.w + 20 && y >= view.y - 20 && y <= view.y + view.h + 20

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border-[6px] border-white/80 shadow-xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fd3f4" />
            <stop offset="1" stopColor="#4aa3df" />
          </linearGradient>
        </defs>
        <rect x={-50} y={-50} width={W + 100} height={H + 100} fill="url(#ocean)" />
        {/* 위도·경도 느낌의 옅은 선 */}
        {[1, 2, 3, 4].map((i) => (
          <line key={`h${i}`} x1={0} y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke="#ffffff" strokeOpacity={0.18} strokeDasharray="6 10" />
        ))}
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={`v${i}`} x1={(W / 8) * i} y1={0} x2={(W / 8) * i} y2={H} stroke="#ffffff" strokeOpacity={0.18} strokeDasharray="6 10" />
        ))}
        <g stroke="#6f9a4a" strokeWidth={zoomed ? 2.5 : 5} strokeLinejoin="round">
          {LAND.map((l) => (
            <path key={l.id} d={l.d} fill={l.id === 'antarctica' ? '#f3f8ff' : '#c9e6a3'} stroke={l.id === 'antarctica' ? '#b8d3ee' : undefined} />
          ))}
          {ISLANDS.map((i, k) => (
            <ellipse key={k} cx={i.cx} cy={i.cy} rx={i.rx} ry={i.ry} fill="#c9e6a3" />
          ))}
        </g>
      </svg>

      {/* 바다 장식 (세계 지도일 때만) */}
      {!zoomed && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {OCEAN_DECOR.map((e, i) => {
            const x = 8 + ((i * 37) % 84)
            const y = 15 + ((i * 53) % 70)
            return (
              <span key={i} className="absolute text-xl opacity-70 md:text-2xl" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                {e}
              </span>
            )
          })}
        </div>
      )}

      {/* 출발지 */}
      {inView(HOME.x, HOME.y) && (
        <div className="pointer-events-none absolute flex flex-col items-center" style={{ left: `${px(HOME.x)}%`, top: `${py(HOME.y)}%`, transform: 'translate(-50%, -60%)' }}>
          <span className="text-2xl drop-shadow md:text-3xl">{HOME.emoji}</span>
          <span className="font-display rounded-full bg-white/90 px-1.5 text-[10px] leading-4 text-ink shadow">{HOME.name}</span>
        </div>
      )}

      {/* 나라 핀 */}
      {COUNTRIES.filter((c) => inView(c.x, c.y)).map((c) => {
        const done = !!stamped[c.id]
        return (
          <button
            key={c.id}
            type="button"
            disabled={flying}
            onClick={() => onPick(c)}
            title={c.name}
            className={`absolute flex flex-col items-center transition ${flying ? 'cursor-default' : 'hover:scale-110 active:scale-95'}`}
            style={{ left: `${px(c.x)}%`, top: `${py(c.y)}%`, transform: 'translate(-50%, -60%)' }}
          >
            <span
              className={`relative flex items-center justify-center rounded-full border-2 shadow-md ${
                zoomed ? 'h-14 w-14 text-3xl md:h-16 md:w-16 md:text-4xl' : 'h-9 w-9 text-xl md:h-11 md:w-11 md:text-2xl'
              } ${done ? 'border-praise bg-praise-soft' : 'border-white bg-white/95'}`}
            >
              {c.emoji}
              {done && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-praise px-1 text-[10px] text-white shadow">✓</span>}
            </span>
            <span className={`font-display mt-0.5 rounded-full bg-white/90 px-1.5 leading-4 text-ink shadow ${zoomed ? 'text-sm md:text-base' : 'text-[10px] md:text-xs'}`}>
              {c.name}
            </span>
          </button>
        )
      })}

      {/* 비행기 */}
      {inView(at.x, at.y) && (
        <div
          className={`pointer-events-none absolute text-3xl drop-shadow-lg md:text-4xl ${flying ? 'plane-fly' : 'plane'}`}
          style={{ left: `${px(at.x)}%`, top: `${py(at.y)}%`, transform: 'translate(-50%, -110%)' }}
          aria-hidden
        >
          ✈️
        </div>
      )}

      {/* 돋보기 */}
      <button
        type="button"
        onClick={() => setZoomed((z) => !z)}
        className="font-display absolute top-3 left-3 rounded-full border-2 border-white bg-white/90 px-4 py-1.5 text-base text-ink shadow-md transition hover:bg-white active:scale-95"
        aria-pressed={zoomed}
      >
        {zoomed ? '🌍 세계 지도' : '🔍 유럽 확대'}
      </button>
    </div>
  )
}
