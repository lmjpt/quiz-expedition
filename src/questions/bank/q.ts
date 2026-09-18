// 상식 문제 한 줄을 만드는 도우미. 단계별 파일(level1~5.ts)이 함께 씁니다.
// 정답은 항상 첫 번째 보기. 화면에 낼 때 섞습니다 (pick.ts).
// id 는 문장에서 만들어지므로 문장을 고치면 새 문제로 칩니다.

import type { ChoiceQuestion, Level, Subject } from '../../types'

export function q(
  level: Level,
  subject: Subject,
  prompt: string,
  choices: [string, string, string, string] | [string, string, string],
  explain?: string,
): ChoiceQuestion {
  return {
    id: `k:${level}:${subject}:${prompt}`,
    kind: 'choice',
    level,
    subject,
    prompt,
    choices: [...choices],
    answerIndex: 0,
    explain,
  }
}
