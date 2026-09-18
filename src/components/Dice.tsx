// 3D 주사위. CSS 로 정육면체를 만들고, 굴릴 때는 튀어 오르면서 여러 바퀴 돌다가
// 나온 눈이 앞으로 오게 멈춥니다. 회전 각도는 매번 누적해서 늘리기 때문에
// 같은 눈이 연달아 나와도 한 바퀴 이상 돕니다.

interface Props {
  value: number | null
  /** 몇 번째 굴림인지. 굴릴 때마다 1씩 올려 주면 같은 눈이 연달아 나와도 계속 돕니다 */
  spin: number
  rolling: boolean
  disabled: boolean
  onRoll: () => void
}

/** 눈이 앞면(카메라 쪽)에 오게 하는 회전 (x, y). 각 면은 아래 FACES 배치를 따릅니다 */
const ORIENTATION: Record<number, [number, number]> = {
  1: [0, 0],
  6: [0, 180],
  2: [0, -90],
  5: [0, 90],
  3: [-90, 0],
  4: [90, 0],
}

/** 3×3 격자에서 점이 들어갈 자리. 0 왼위 … 4 가운데 … 8 오른아래 */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

/** 면 번호 → 정육면체에서의 위치 */
const FACES: { n: number; transform: string }[] = [
  { n: 1, transform: 'rotateY(0deg) translateZ(var(--half))' },
  { n: 6, transform: 'rotateY(180deg) translateZ(var(--half))' },
  { n: 2, transform: 'rotateY(90deg) translateZ(var(--half))' },
  { n: 5, transform: 'rotateY(-90deg) translateZ(var(--half))' },
  { n: 3, transform: 'rotateX(90deg) translateZ(var(--half))' },
  { n: 4, transform: 'rotateX(-90deg) translateZ(var(--half))' },
]

export default function Dice({ value, spin, rolling, disabled, onRoll }: Props) {
  // 누적 회전. 굴릴 때마다 x 두 바퀴, y 세 바퀴를 더해서 늘 힘차게 돕니다
  const [ox, oy] = ORIENTATION[value ?? 1]
  const rx = ox + spin * 720
  const ry = oy + spin * 1080

  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={disabled}
      className={`group flex flex-col items-center gap-3 rounded-3xl px-6 pt-6 pb-3 transition disabled:cursor-default ${
        disabled ? 'opacity-70' : 'hover:bg-white/60 active:scale-95'
      }`}
      aria-label="주사위 굴리기"
    >
      <div className={`dice-scene ${rolling ? 'dice-bounce' : ''}`}>
        <div className="cube" style={{ transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
          {FACES.map((f) => (
            <div key={f.n} className="face" style={{ transform: f.transform }}>
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className={PIPS[f.n].includes(i) ? `pip ${f.n === 1 ? 'pip-one' : ''}` : ''} />
              ))}
            </div>
          ))}
        </div>
        <div className={`dice-shadow ${rolling ? 'dice-shadow-bounce' : ''}`} />
      </div>
      <span className={`font-display text-xl ${disabled ? 'text-muted' : 'text-brand'}`}>
        {rolling ? '데굴데굴…' : disabled ? '주사위' : '굴리기!'}
      </span>
    </button>
  )
}
