#!/usr/bin/env bash
# Sikrer at remote "github" peger på NikolajHygebjerg/brandbjerg (Vercel Git-integration).
set -euo pipefail

GITHUB_REPO="${GITHUB_REPOSITORY:-NikolajHygebjerg/brandbjerg}"
GITHUB_URL="https://github.com/${GITHUB_REPO}.git"

if git remote get-url github >/dev/null 2>&1; then
  current="$(git remote get-url github)"
  if [[ "$current" != "$GITHUB_URL" && "$current" != "https://github.com/${GITHUB_REPO}" ]]; then
    git remote set-url github "$GITHUB_URL"
    echo "✓ Opdaterede github remote → $GITHUB_URL"
  fi
else
  git remote add github "$GITHUB_URL"
  echo "✓ Tilføjede github remote → $GITHUB_URL"
fi
