#!/usr/bin/env bash
# Git credential helper — bruger GH_TOKEN / GITHUB_TOKEN (Cursor Runtime Secret).
set -euo pipefail

token="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

while IFS= read -r line; do
  [ -z "$line" ] && break
done

if [ "$1" = get ] && [ -n "$token" ]; then
  echo "username=x-access-token"
  echo "password=$token"
fi
