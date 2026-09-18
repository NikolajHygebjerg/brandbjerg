#!/usr/bin/env bash
# Commit + push til GitHub (origin) — som normalt git workflow. Vercel følger GitHub main.
set -euo pipefail

MSG="${1:-Update mockup}"

cd "$(dirname "$0")/.."
BRANCH="$(git branch --show-current)"

bash scripts/setup-git-remotes.sh
bash scripts/bootstrap-github-auth.sh

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add -A
  git commit -m "$MSG"
  echo "✓ Committed: $MSG"
else
  echo "✓ Ingen nye ændringer at committe"
fi

token="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

github_ok=0
echo "→ Pusher til origin (GitHub ${BRANCH})…"
if [ -n "$token" ]; then
  if git push "https://x-access-token:${token}@github.com/NikolajHygebjerg/brandbjerg.git" "${BRANCH}:refs/heads/${BRANCH}"; then
    github_ok=1
  fi
elif git push -u origin "$BRANCH"; then
  github_ok=1
fi

if [ "$github_ok" -eq 1 ]; then
  echo "✓ Pushed til GitHub — Vercel deployer ved push til main"
else
  echo "✗ Push til GitHub fejlede." >&2
  echo "  Sæt GH_TOKEN i Cursor Cloud Agents → Secrets, eller kør lokalt:" >&2
  echo "    gh auth login && gh auth setup-git && git push origin ${BRANCH}" >&2
fi

if git remote get-url cursor >/dev/null 2>&1; then
  if git push cursor "$BRANCH" 2>/dev/null; then
    echo "✓ Pushed til cursor (mirror)"
  fi
fi

if [ "$github_ok" -ne 1 ]; then
  exit 1
fi

if npm run deploy; then
  echo "✓ Deploy færdig (Vercel CLI)"
else
  echo "⚠ Vercel CLI fejlede — GitHub-push udløser normalt automatisk deploy"
  echo "  Live: https://brandbjerg-kurser.vercel.app"
fi
