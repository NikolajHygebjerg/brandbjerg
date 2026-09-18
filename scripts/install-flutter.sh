#!/usr/bin/env bash
# Installer Flutter SDK (stable) til $HOME/flutter — idempotent.
set -euo pipefail

FLUTTER_ROOT="${FLUTTER_ROOT:-$HOME/flutter}"

if [ -x "$FLUTTER_ROOT/bin/flutter" ]; then
  echo "Flutter findes allerede: $FLUTTER_ROOT/bin/flutter"
  "$FLUTTER_ROOT/bin/flutter" --version
  exit 0
fi

echo "Henter Flutter stable til $FLUTTER_ROOT …"
rm -rf "$FLUTTER_ROOT"
git clone https://github.com/flutter/flutter.git -b stable --depth 1 "$FLUTTER_ROOT"

export PATH="$FLUTTER_ROOT/bin:$PATH"
flutter config --no-analytics
flutter precache --web
flutter --version

echo ""
echo "Tilføj til din shell ( ~/.bashrc eller ~/.zshrc ):"
echo "  export PATH=\"$FLUTTER_ROOT/bin:\$PATH\""
