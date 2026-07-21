#!/usr/bin/env bash
set -euo pipefail

LAUNCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$LAUNCH_DIR"
if [ "${NODE_ENV:-}" = test ] && [ -n "${RUNTIME_PROJECT_SOURCE:-}" ] && [ -d "$RUNTIME_PROJECT_SOURCE" ]; then ROOT_DIR="$(cd "$RUNTIME_PROJECT_SOURCE" && pwd)"; fi
ENV_FILE="$LAUNCH_DIR/.env"; API_DIR="$ROOT_DIR/backend"; UI_DIR="$ROOT_DIR/frontend"; MIGRATION_DIR="$API_DIR/migrations"
read_env() { awk -F= -v key="$1" '$0 !~ /^[[:space:]]*#/ && $1 == key { value=substr($0,index($0,"=")+1); gsub(/^[[:space:]]+|[[:space:]]+$/, "", value); gsub(/^["\047]|["\047]$/, "", value); print value; exit }' "$ENV_FILE"; }
load_env_key() { local key="$1" parsed; [ -n "${!key-}" ] && return 0; [ -f "$ENV_FILE" ] || return 0; parsed="$(read_env "$key")"; [ -z "$parsed" ] || export "$key=$parsed"; }
for key in DATABASE_URL JWT_SECRET GOVERNANCE_TENANT_ID ENABLE_GENERATED_FEATURES ALLOW_SCHEMA_MIGRATION BACKEND_PORT FRONTEND_PORT; do load_env_key "$key"; done
BACKEND_PORT="${BACKEND_PORT:-3001}"; FRONTEND_PORT="${FRONTEND_PORT:-5173}"
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }
check_config() { local jwt_secret="${JWT_SECRET:-}"; command -v node >/dev/null || fail "node is required"; command -v npm >/dev/null || fail "npm is required"; [ -n "${DATABASE_URL:-}" ] || fail "DATABASE_URL is required"; [ -n "${GOVERNANCE_TENANT_ID:-}" ] || fail "GOVERNANCE_TENANT_ID is required"; [ "${#jwt_secret}" -ge 32 ] || fail "JWT_SECRET must contain at least 32 characters"; case "$DATABASE_URL" in *example*|*changeme*|*password@*) fail "DATABASE_URL contains a placeholder" ;; esac; printf 'configuration valid for tenant %s\n' "$GOVERNANCE_TENANT_ID"; }
migrate() { check_config; [ "${ALLOW_SCHEMA_MIGRATION:-0}" = "1" ] || fail "set ALLOW_SCHEMA_MIGRATION=1 for the explicit migration command"; command -v psql >/dev/null || fail "psql is required for migrations"; local found=0; for migration in "$MIGRATION_DIR"/*.sql; do [ -f "$migration" ] || continue; found=1; psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"; done; [ "$found" = "1" ] || fail "no migrations found"; }
start_services() {
  check_config
  [ -d "$API_DIR/node_modules" ] || fail "backend dependencies are missing; install them explicitly"
  if [ "${NODE_ENV:-}" != test ]; then [ -d "$UI_DIR/node_modules" ] || fail "frontend dependencies are missing; install them explicitly"; fi
  for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    if command -v lsof >/dev/null && lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then fail "port $port is already in use"; fi
  done
  api_pid=""; ui_pid=""
  cleanup_services() { [ -n "$api_pid" ] && kill "$api_pid" 2>/dev/null || true; [ -n "$ui_pid" ] && kill "$ui_pid" 2>/dev/null || true; }
  trap cleanup_services INT TERM EXIT
  (cd "$API_DIR" && PORT="$BACKEND_PORT" CLIENT_URL="${CLIENT_URL:-http://127.0.0.1:$FRONTEND_PORT}" node server.js) & api_pid=$!
  if [ "${NODE_ENV:-}" = test ]; then wait "$api_pid"; return; fi
  (cd "$UI_DIR" && VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://127.0.0.1:$BACKEND_PORT/api}" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort) & ui_pid=$!
  while kill -0 "$api_pid" 2>/dev/null && kill -0 "$ui_pid" 2>/dev/null; do sleep 1; done
}
case "${1:-check}" in check) check_config ;; migrate) migrate ;; start) start_services ;; *) fail "usage: $0 {check|migrate|start}" ;; esac
