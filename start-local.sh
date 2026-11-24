#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

NODE_BIN="${NODE_BIN:-node}"
if ! command -v "$NODE_BIN" >/dev/null 2>&1; then
  printf 'Node.js is missing. Install Node.js 18 or newer, then run this script again.\n' >&2
  exit 1
fi

NODE_MAJOR="$("$NODE_BIN" -p 'Number(process.versions.node.split(".")[0])')"
if (( NODE_MAJOR < 18 )); then
  printf 'Node.js 18 or newer is required (found %s).\n' "$("$NODE_BIN" --version)" >&2
  exit 1
fi

if [[ ! -d node_modules/express ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    printf 'npm is missing; install Node.js with npm and run this script again.\n' >&2
    exit 1
  fi
  printf 'Installing project dependencies…\n'
  if [[ -f package-lock.json ]]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
fi

export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-3400}"
OSINT_DIR="${SCAFFOLD_OSINT_DIR:-$PROJECT_DIR/../scaffold-osint-clone}"
OSINT_PORT="3017"
OSINT_PID=""
APP_PID=""

osint_ready() {
  "$NODE_BIN" -e "fetch('http://127.0.0.1:${OSINT_PORT}/api/credentials').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))" >/dev/null 2>&1
}

if [[ -f "$OSINT_DIR/server.js" ]] && ! osint_ready; then
  printf 'Starting Markkina- ja hankintavahti service at http://127.0.0.1:%s/\n' "$OSINT_PORT"
  PORT="$OSINT_PORT" HOST=127.0.0.1 "$NODE_BIN" "$OSINT_DIR/server.js" &
  OSINT_PID=$!
  for _ in {1..24}; do
    if osint_ready; then break; fi
    if ! kill -0 "$OSINT_PID" 2>/dev/null; then
      printf 'Markkina- ja hankintavahti service failed to start. Check whether port %s is already in use.\n' "$OSINT_PORT" >&2
      exit 1
    fi
    sleep 0.25
  done
  if ! osint_ready; then
    printf 'Markkina- ja hankintavahti did not become ready at http://127.0.0.1:%s/.\n' "$OSINT_PORT" >&2
    kill "$OSINT_PID" 2>/dev/null || true
    exit 1
  fi
elif [[ ! -f "$OSINT_DIR/server.js" ]]; then
  printf 'Markkina- ja hankintavahti module not found at %s; set SCAFFOLD_OSINT_DIR to its folder.\n' "$OSINT_DIR" >&2
fi

APP_URL="http://${HOST}:${PORT}/"

printf 'Starting Helsinki Map Embed locally at %s\n' "$APP_URL"
printf 'Press Ctrl+C to stop the server.\n'

if [[ "${OPEN_BROWSER:-1}" == "1" ]] && command -v xdg-open >/dev/null 2>&1; then
  (sleep 2; xdg-open "$APP_URL" >/dev/null 2>&1 || true) &
fi

"$NODE_BIN" server.js &
APP_PID=$!
cleanup() {
  if [[ -n "$APP_PID" ]]; then kill "$APP_PID" 2>/dev/null || true; fi
  if [[ -n "$OSINT_PID" ]]; then kill "$OSINT_PID" 2>/dev/null || true; fi
  wait "$APP_PID" 2>/dev/null || true
  if [[ -n "$OSINT_PID" ]]; then wait "$OSINT_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM
wait "$APP_PID"
