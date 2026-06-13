#!/usr/bin/env bash
# Copy legacy Laravel game CSS into public/assets/games/css and rewrite asset URLs
# for Vite dev server / static hosting.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/../game/public/css/student"
DST="$ROOT/public/assets/games/css"

mkdir -p "$DST"

for f in style.css styleNew.css normalize.css all.min.css hack.css gold_quest.css; do
  if [[ ! -f "$SRC/$f" ]]; then
    echo "missing source: $SRC/$f" >&2
    exit 1
  fi
  sed -E \
    -e "s#url\\(['\"]?\\.\\./\\.\\./assets/images/#url('/assets/games/images/#g" \
    -e "s#url\\(['\"]?\\.\\./\\.\\./assets/icons/#url('/assets/games/icons/#g" \
    "$SRC/$f" > "$DST/$f"
done

echo "Wrote CSS to $DST"
