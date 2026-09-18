// 효과음. 파일 없이 Web Audio 로 소리를 직접 만듭니다.
//
// 원칙: 틀렸을 때 소리는 부드럽게 (버저 금지). 맞았을 때와 도착이 가장 화려해야 합니다.
// 브라우저 정책상 AudioContext 는 사용자가 뭔가 누른 뒤에만 켜집니다 — 첫 소리는
// 항상 주사위 클릭이라 문제없습니다.

let ctx: AudioContext | null = null
let muted = false

export function setSoundMuted(value: boolean): void {
  muted = value
}

function ac(): AudioContext | null {
  if (muted) return null
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface ToneOptions {
  /** 시작 시각 (초, 지금부터) */
  at?: number
  dur?: number
  type?: OscillatorType
  gain?: number
  /** 끝날 때 주파수. 주면 미끄러지듯 바뀝니다 */
  to?: number
}

function tone(freq: number, { at = 0, dur = 0.15, type = 'sine', gain = 0.18, to }: ToneOptions = {}): void {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + at
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/** 짧은 잡음 한 조각. 주사위가 굴러가는 소리에 씁니다 */
function noise(at: number, dur: number, freq: number, gain = 0.12): void {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + at
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = 1.2
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(g).connect(c.destination)
  src.start(t0)
  src.stop(t0 + dur)
}

export const sfx = {
  /** 주사위: 데굴데굴 굴러가다가 탁 하고 멈춤 (튀어 오르는 1초짜리 애니메이션에 맞춤) */
  dice(): void {
    const hits = [0, 0.08, 0.17, 0.27, 0.38, 0.5, 0.63, 0.77]
    hits.forEach((at, i) => noise(at, 0.05, 1400 + Math.random() * 1400, 0.11 - i * 0.006))
    tone(190, { at: 0.98, dur: 0.1, type: 'square', gain: 0.09 })
    noise(0.98, 0.06, 900, 0.1)
  },

  /** 한 칸 콩 */
  step(): void {
    tone(480, { dur: 0.09, to: 720, gain: 0.12 })
  },

  /** 문제 창, 안내 창이 뜰 때 */
  pop(): void {
    tone(880, { dur: 0.07, gain: 0.1 })
  },

  /** 딩동댕 */
  correct(): void {
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => tone(f, { at: i * 0.09, dur: 0.22, type: 'triangle', gain: 0.16 }))
    tone(1047, { at: 0.36, dur: 0.4, type: 'sine', gain: 0.1 })
  },

  /** 아쉬워요 — 부드럽게 두 음만 */
  wrong(): void {
    tone(330, { dur: 0.18, type: 'sine', gain: 0.12 })
    tone(262, { at: 0.16, dur: 0.28, type: 'sine', gain: 0.1 })
  },

  /** 사다리·보너스로 올라갈 때 */
  rise(): void {
    tone(300, { dur: 0.7, to: 1000, type: 'triangle', gain: 0.12 })
    tone(600, { at: 0.05, dur: 0.65, to: 2000, type: 'sine', gain: 0.05 })
  },

  /** 미끄럼틀로 내려갈 때 */
  fall(): void {
    tone(900, { dur: 0.7, to: 280, type: 'triangle', gain: 0.12 })
  },

  /** 자리 바꾸기: 두 소리가 엇갈림 */
  swap(): void {
    tone(400, { dur: 0.45, to: 900, type: 'sine', gain: 0.1 })
    tone(900, { dur: 0.45, to: 400, type: 'sine', gain: 0.1 })
  },

  /** 도착 팡파르 */
  win(): void {
    const seq: [number, number][] = [
      [523, 0],
      [523, 0.15],
      [523, 0.3],
      [659, 0.45],
      [784, 0.7],
      [659, 0.9],
      [784, 1.05],
    ]
    seq.forEach(([f, at]) => tone(f, { at, dur: 0.2, type: 'triangle', gain: 0.16 }))
    tone(1047, { at: 1.3, dur: 0.9, type: 'triangle', gain: 0.18 })
    tone(784, { at: 1.3, dur: 0.9, type: 'sine', gain: 0.08 })
  },
}
