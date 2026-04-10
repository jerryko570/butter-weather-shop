#!/bin/bash

# 사용법: ./pr.sh <이슈번호> <PR번호> <제목> <라벨> <이슈내용> [PR내용-생략가능]

ISSUE_NUM=$1
PR_NUM=$2
TITLE=$3
LABEL=$4
ISSUE_BODY=${5:-"$TITLE"}
PR_BODY=${6:-"$ISSUE_BODY"}
BRANCH=$(git branch --show-current)

echo "📋 이슈 생성 중..."
gh issue create \
  --title "$LABEL: $TITLE" \
  --assignee "@me" \
  --body "$ISSUE_BODY"

echo "🔀 PR 생성 중..."
gh pr create \
  --title "$LABEL: $TITLE" \
  --assignee "@me" \
  --base main \
  --head "$BRANCH" \
  --body "## 작업 내용
$PR_BODY

## 관련 이슈
close #$ISSUE_NUM"

echo "✅ 완료!"
