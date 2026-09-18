// 상식 문제 은행. 과학, 역사 인물, 과학자, 세상 상식, 넌센스, 지리.
//
// 문제 본문은 단계별로 bank/level1~5.ts 에 있습니다 (사내망에서 GitHub API 로 올리려면
// 파일 하나가 30KB 를 넘으면 안 돼서 나눴습니다). 여기서는 합쳐서 내보내기만 합니다.
//
// 쓰는 규칙 (bank/*.ts 에 문제를 추가할 때):
// - 정답은 항상 첫 번째 보기에 둡니다. 화면에 낼 때 섞습니다 (pick.ts).
// - 한 문장, 짧게. 1~2단계는 6살이 읽을 수 있는 길이로.
// - 역사는 연도·사건이 아니라 '누가 무엇을 했나' 수준으로만.
// - explain 은 한 줄. 틀렸을 때 읽어 주는 말이라 "~예요" 로 부드럽게. 넌센스는 꼭 넣기.
// - 국기 이모지는 쓰지 않습니다 (윈도우에서 글자 두 개로 보임).
// - id 는 프롬프트에서 만들어지므로 문장을 고치면 새 문제로 칩니다.

import type { ChoiceQuestion } from '../types'
import { LEVEL1 } from './bank/level1'
import { LEVEL2 } from './bank/level2'
import { LEVEL3 } from './bank/level3'
import { LEVEL4 } from './bank/level4'
import { LEVEL5 } from './bank/level5'

export const KNOWLEDGE: readonly ChoiceQuestion[] = [...LEVEL1, ...LEVEL2, ...LEVEL3, ...LEVEL4, ...LEVEL5]
