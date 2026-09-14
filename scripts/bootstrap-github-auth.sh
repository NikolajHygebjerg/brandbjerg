#!/usr/bin/env bash
# Konfigurer git/gh til GitHub når token findes (Cursor secrets eller lokal export).
set -euo pipefail

token="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
if [ -z "$token" ]; then
  exit 0
fi

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
git -C "$repo_root" config --local credential.helper "!bash scripts/git-credential-github.sh"

if command -v gh >/dev/null 2>&1; then
  echo "$token" | gh auth login --with-token 2>/dev/null || true
  gh auth setup-git -h github.com 2>/dev/null || true
fi
