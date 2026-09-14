#!/usr/bin/env bash
# Standard remotes: origin = GitHub (Vercel). Valgfri cursor = Cursor-mirror.
set -euo pipefail

cd "$(dirname "$0")/.."
GITHUB_REPO="${GITHUB_REPOSITORY:-NikolajHygebjerg/brandbjerg}"
GITHUB_URL="https://github.com/${GITHUB_REPO}.git"

current_origin=""
if git remote get-url origin >/dev/null 2>&1; then
  current_origin="$(git remote get-url origin)"
fi

if [[ "$current_origin" == *"origin.cursor.com"* ]]; then
  if ! git remote get-url cursor >/dev/null 2>&1; then
    git remote add cursor "$current_origin"
    echo "✓ Gemte Cursor-mirror som remote «cursor»"
  fi
  git remote set-url origin "$GITHUB_URL"
  echo "✓ origin → $GITHUB_URL"
elif [[ -z "$current_origin" ]]; then
  git remote add origin "$GITHUB_URL"
  echo "✓ Tilføjede origin → $GITHUB_URL"
elif [[ "$current_origin" != "$GITHUB_URL" && "$current_origin" != "https://github.com/${GITHUB_REPO}" ]]; then
  git remote set-url origin "$GITHUB_URL"
  echo "✓ Opdaterede origin → $GITHUB_URL"
fi

# Behold «github» som alias hvis ældre scripts forventer det
if git remote get-url github >/dev/null 2>&1; then
  gh_url="$(git remote get-url github)"
  if [[ "$gh_url" != "$GITHUB_URL" ]]; then
    git remote set-url github "$GITHUB_URL"
  fi
else
  git remote add github "$GITHUB_URL"
fi

bash scripts/bootstrap-github-auth.sh
