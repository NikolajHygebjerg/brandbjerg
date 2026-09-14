#!/usr/bin/env bash
# Commit, push til GitHub (Vercel) og Cursor-origin — kør efter hver rettelse
set -euo pipefail

MSG="${1:-Update mockup}"

cd "$(dirname "$0")/.."
BRANCH="$(git branch --show-current)"
GITHUB_REPO="${GITHUB_REPOSITORY:-NikolajHygebjerg/brandbjerg}"

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add -A
  git commit -m "$MSG"
  echo "✓ Committed: $MSG"
else
  echo "✓ Ingen nye ændringer at committe"
fi

bash scripts/ensure-github-remote.sh

push_to_github() {
  local token="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
  local ref="refs/heads/${BRANCH}"

  if [ -n "$token" ]; then
    git push "https://x-access-token:${token}@github.com/${GITHUB_REPO}.git" "${BRANCH}:${ref}"
    return $?
  fi

  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    gh auth setup-git -h github.com 2>/dev/null || true
    git push github "${BRANCH}"
    return $?
  fi

  echo "✗ GitHub-push fejlede: ingen GH_TOKEN/GITHUB_TOKEN og gh er ikke logget ind." >&2
  echo "  Vercel deployer kun ved push til https://github.com/${GITHUB_REPO}" >&2
  echo "  Tilføj GH_TOKEN (repo scope) i Cloud Agent environment secrets, eller kør lokalt:" >&2
  echo "    git push github ${BRANCH}" >&2
  return 1
}

push_to_origin() {
  if git remote get-url origin >/dev/null 2>&1; then
    if git push -u origin "$BRANCH"; then
      echo "✓ Pushed til origin/$BRANCH"
    else
      echo "⚠ Push til origin fejlede (Cursor-mirror)" >&2
    fi
  fi
}

echo "→ Pusher til GitHub (${GITHUB_REPO})…"
if push_to_github; then
  echo "✓ Pushed til github/$BRANCH — Vercel Git-integration deployer typisk inden for få minutter"
else
  exit 1
fi

push_to_origin

if npm run deploy; then
  echo "✓ Deploy færdig (Vercel CLI)"
else
  echo "⚠ Vercel CLI fejlede — GitHub-push udløser normalt automatisk deploy"
  echo "  Live: https://brandbjerg-kurser.vercel.app"
fi
