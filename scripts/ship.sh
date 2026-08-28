#!/usr/bin/env bash
# Commit, push og deploy til Vercel — kør efter hver rettelse
set -euo pipefail

MSG="${1:-Update mockup}"

cd "$(dirname "$0")/.."
BRANCH="$(git branch --show-current)"

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add -A
  git commit -m "$MSG"
  echo "✓ Committed: $MSG"
else
  echo "✓ Ingen nye ændringer at committe"
fi

push_remote() {
  local remote="$1"
  if git remote get-url "$remote" >/dev/null 2>&1; then
    git push -u "$remote" "$BRANCH"
    echo "✓ Pushed til $remote/$BRANCH"
  fi
}

#!/usr/bin/env bash
# Commit, push og deploy til Vercel — kør efter hver rettelse
set -euo pipefail

MSG="${1:-Update mockup}"

cd "$(dirname "$0")/.."
BRANCH="$(git branch --show-current)"

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add -A
  git commit -m "$MSG"
  echo "✓ Committed: $MSG"
else
  echo "✓ Ingen nye ændringer at committe"
fi

push_remote() {
  local remote="$1"
  if git remote get-url "$remote" >/dev/null 2>&1; then
    if git push -u "$remote" "$BRANCH"; then
      echo "✓ Pushed til $remote/$BRANCH"
    else
      echo "✗ Push fejlede til $remote/$BRANCH" >&2
      return 1
    fi
  fi
}

# GitHub først — Vercel deployer automatisk ved push til main
push_remote github
push_remote origin

if npm run deploy; then
  echo "✓ Deploy færdig (Vercel CLI)"
else
  echo "⚠ Vercel CLI fejlede — GitHub-push udløser normalt automatisk deploy"
  echo "  Live: https://temporary-agile-boron-nfvvr9v.vercel.app"
fi
