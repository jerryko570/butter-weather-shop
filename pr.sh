cat > pr.sh << 'EOF'
#!/bin/bash

# 사용법: ./pr.sh "제목" "라벨" "이슈내용" "PR내용"
# 예시: ./pr.sh "GitHub 라벨 구성 추가" "⚙️Chore" "이슈 내용" "PR 내용"

TITLE=$1
LABEL=$2
ISSUE_BODY=${3:-"$TITLE"}
PR_BODY=${4:-"$TITLE"}
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
  --body "$PR_BODY" \
  --base main \
  --head "$BRANCH"

echo "✅ 완료!"
EOF

chmod +x pr.sh