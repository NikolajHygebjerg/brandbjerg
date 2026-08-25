#!/usr/bin/env bash
# Commit, push og deploy til Vercel — kør efter hver rettelse
set -euo pipefail

MSG="${1:-Update mockup}"

cd "$(dirname "$0")/.."

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add -A
  git commit -m "$MSG"
  echo "✓ Committed: $MSG"
else
  echo "✓ Ingen nye ændringer at committe"
fi

git push -u origin "$(git branch --show-current)"
echo "✓ Pushed til origin"

npm run deploy
echo "✓ Deploy færdig"
