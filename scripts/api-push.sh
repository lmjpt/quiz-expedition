#!/usr/bin/env bash
# 회사망에서 git push 가 403 으로 막힐 때, 로컬 HEAD 와 origin/main 의 차이를
# GitHub Git Data API 로 올립니다 (blobs → tree(base_tree) → commit → refs).
#
# 전제: 로컬에 커밋이 하나 있고(origin/main 위에 얹힌 상태), gh 로 로그인돼 있음.
# 파일 하나가 약 30KB 를 넘으면 프록시가 막으니 그 전에 쪼개세요.
# 끝나면 로컬 main 을 원격 커밋으로 맞춥니다 (내용은 같고 sha 만 바뀝니다).
#
# 사용: bash scripts/api-push.sh        (Git Bash 에서. PowerShell 은 한글이 깨집니다)
set -euo pipefail

gh="/c/Program Files/GitHub CLI/gh.exe"
repo=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
tmp=$(mktemp -d)

git fetch -q origin
parent=$(git rev-parse origin/main)
base_tree=$("$gh" api "repos/$repo/git/commits/$parent" --jq .tree.sha)
echo "origin/main: ${parent:0:7} (tree ${base_tree:0:7})"

mapfile -t changed < <(git diff --name-only --diff-filter=ACMR "$parent" HEAD)
mapfile -t deleted < <(git diff --name-only --diff-filter=D "$parent" HEAD)
[[ ${#changed[@]} -eq 0 && ${#deleted[@]} -eq 0 ]] && { echo "올릴 변경이 없습니다."; exit 0; }

entries=()
for f in "${changed[@]}"; do
  size=$(stat -c %s "$f")
  if (( size > 26000 )); then echo "$f 가 ${size}B 라 프록시 한도를 넘습니다. 쪼개세요."; exit 1; fi
  base64 -w0 "$f" > "$tmp/b64"
  printf '{"encoding":"base64","content":"%s"}' "$(cat "$tmp/b64")" > "$tmp/blob.json"
  sha=$("$gh" api -X POST "repos/$repo/git/blobs" --input "$tmp/blob.json" --jq .sha)
  entries+=("{\"path\":\"$f\",\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"$sha\"}")
  echo "  + ${sha:0:7} $f"
done
for f in "${deleted[@]}"; do
  entries+=("{\"path\":\"$f\",\"mode\":\"100644\",\"type\":\"blob\",\"sha\":null}")
  echo "  - $f"
done

printf '{"base_tree":"%s","tree":[%s]}' "$base_tree" "$(IFS=,; echo "${entries[*]}")" > "$tmp/tree.json"
tree=$("$gh" api -X POST "repos/$repo/git/trees" --input "$tmp/tree.json" --jq .sha)

# 커밋 메시지는 로컬 HEAD 것을 그대로 (JSON 문자열로 안전하게 감쌉니다)
git log -1 --pretty=%B | python -c 'import json,sys; print(json.dumps(sys.stdin.read().rstrip("\n"), ensure_ascii=False))' > "$tmp/msg.json" 2>/dev/null \
  || git log -1 --pretty=%B | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.stringify(s.replace(/\n+$/,""))))' > "$tmp/msg.json"
printf '{"message":%s,"tree":"%s","parents":["%s"]}' "$(cat "$tmp/msg.json")" "$tree" "$parent" > "$tmp/commit.json"
commit=$("$gh" api -X POST "repos/$repo/git/commits" --input "$tmp/commit.json" --jq .sha)

printf '{"sha":"%s","force":false}' "$commit" > "$tmp/ref.json"
"$gh" api -X PATCH "repos/$repo/git/refs/heads/main" --input "$tmp/ref.json" --jq '"main -> " + .object.sha[0:7]'

# 로컬을 원격 커밋에 맞춥니다 (작업 트리는 그대로)
git fetch -q origin
git reset -q origin/main
echo "완료. 배포 워크플로가 자동으로 시작됩니다: https://github.com/$repo/actions"
rm -rf "$tmp"
