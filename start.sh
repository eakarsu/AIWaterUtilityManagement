#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$ROOT_DIR/.env" ]] || { echo 'Missing .env runtime configuration.' >&2; exit 1; }
set -a
# shellcheck disable=SC1091
source "$ROOT_DIR/.env"
set +a

API_DIR="$ROOT_DIR/backend"
UI_DIR="$ROOT_DIR/frontend"
BACKEND_PORT="${BACKEND_PORT:?BACKEND_PORT is required}"
FRONTEND_PORT="${FRONTEND_PORT:?FRONTEND_PORT is required}"
[[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]] || { echo 'Backend and frontend ports must be different; no process was changed.' >&2; exit 1; }
[[ -d "$API_DIR/node_modules" && -d "$UI_DIR/node_modules" ]] || { echo 'Missing dependencies; install them explicitly before starting.' >&2; exit 1; }
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${GOVERNANCE_TENANT_ID:?GOVERNANCE_TENANT_ID is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"
: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
: "${OPENROUTER_BASE_URL:?OPENROUTER_BASE_URL is required}"
[[ ${#JWT_SECRET} -ge 32 ]] || { echo 'JWT_SECRET must contain at least 32 characters.' >&2; exit 1; }
[[ "${ALLOW_SCHEMA_MIGRATION:-}" == "true" || "${ALLOW_SCHEMA_MIGRATION:-}" == "1" ]] || { echo 'ALLOW_SCHEMA_MIGRATION=true is required.' >&2; exit 1; }

for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is occupied; no process was changed." >&2
    exit 1
  fi
done

(cd "$API_DIR" && node scripts/prepareRuntime.js)

api_pid=""
ui_pid=""
cleanup() {
  [[ -z "$api_pid" ]] || kill "$api_pid" 2>/dev/null || true
  [[ -z "$ui_pid" ]] || kill "$ui_pid" 2>/dev/null || true
  wait "$api_pid" "$ui_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

(cd "$API_DIR" && PORT="$BACKEND_PORT" CLIENT_URL="http://127.0.0.1:$FRONTEND_PORT" node server.js) &
api_pid=$!
(cd "$UI_DIR" && BACKEND_URL="http://127.0.0.1:$BACKEND_PORT" VITE_API_BASE_URL="" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort) &
ui_pid=$!
wait "$api_pid" "$ui_pid"
