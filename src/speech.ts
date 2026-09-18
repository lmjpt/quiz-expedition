// 문제를 소리로 읽어 줍니다. 브라우저 내장 음성(Web Speech API)만 씁니다.
// 6살은 글을 더듬더듬 읽으니, 소리가 없으면 매 문제마다 게임이 멈춥니다.

let muted = false

export function setSpeechMuted(value: boolean): void {
  muted = value
  if (muted) stop()
}

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function koreanVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  return voices.find((v) => v.lang.startsWith('ko')) ?? null
}

export function speak(text: string): void {
  if (muted || !speechAvailable()) return
  const clean = text.replace(/[^\p{L}\p{N}\s.,?!+\-×÷=]/gu, ' ').trim()
  if (!clean) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(clean)
  u.lang = 'ko-KR'
  u.rate = 0.95
  const voice = koreanVoice()
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}

export function stop(): void {
  if (speechAvailable()) window.speechSynthesis.cancel()
}
