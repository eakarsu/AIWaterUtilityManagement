#!/bin/bash

# ============================================================
# AI Water Utility Management System - Start Script
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=3001
FRONTEND_PORT=5173

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║       AI Water Utility Management System            ║"
echo "║              AquaFlow AI v1.0                       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Step 1: Clean up used ports ----
echo -e "${YELLOW}[1/6] Cleaning up ports ${BACKEND_PORT} and ${FRONTEND_PORT}...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${RED}Killing processes on port ${port}: ${pids}${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  ${GREEN}Port ${port} is free${NC}"
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ---- Step 2: Check for .env file ----
echo -e "${YELLOW}[2/6] Checking environment configuration...${NC}"

if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo -e "  ${RED}ERROR: .env file not found at $PROJECT_DIR/.env${NC}"
  echo "  Please create a .env file with the following variables:"
  echo "    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/water_utility"
  echo "    OPENROUTER_API_KEY=your_openrouter_api_key_here"
  echo "    OPENROUTER_MODEL=anthropic/claude-haiku-4.5"
  echo "    JWT_SECRET=water_utility_jwt_secret_2024"
  echo "    BACKEND_PORT=3001"
  echo "    FRONTEND_PORT=5173"
  exit 1
fi

# Load env vars
set -a
source "$PROJECT_DIR/.env"
set +a
echo -e "  ${GREEN}Environment loaded${NC}"

# ---- Step 3: Check PostgreSQL ----
echo -e "${YELLOW}[3/6] Setting up PostgreSQL database...${NC}"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
  echo -e "  ${RED}ERROR: psql not found. Please install PostgreSQL.${NC}"
  exit 1
fi

# Try to connect to PostgreSQL
if ! psql -h localhost -U postgres -c "SELECT 1;" &>/dev/null; then
  echo -e "  ${YELLOW}Attempting to start PostgreSQL...${NC}"
  if command -v brew &> /dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    sleep 2
  fi
fi

# Create database if it doesn't exist
echo -e "  Creating database 'water_utility' if not exists..."
psql -h localhost -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'water_utility'" 2>/dev/null | grep -q 1 || \
  psql -h localhost -U postgres -c "CREATE DATABASE water_utility;" 2>/dev/null || \
  echo -e "  ${YELLOW}Database may already exist or using different auth - continuing...${NC}"

# ---- Step 4: Run schema and seed ----
echo -e "${YELLOW}[4/6] Running database schema and seed data...${NC}"

# Extract DB connection parts from DATABASE_URL
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/water_utility}"

echo -e "  Applying schema..."
psql "$DB_URL" -f "$PROJECT_DIR/backend/db/schema.sql" 2>&1 | tail -3 || {
  echo -e "  ${YELLOW}Schema application had issues, trying alternative connection...${NC}"
  psql -h localhost -U postgres -d water_utility -f "$PROJECT_DIR/backend/db/schema.sql" 2>&1 | tail -3 || true
}

echo -e "  Seeding data..."
psql "$DB_URL" -f "$PROJECT_DIR/backend/db/seed.sql" 2>&1 | tail -3 || {
  echo -e "  ${YELLOW}Seed had issues (data may already exist), continuing...${NC}"
  psql -h localhost -U postgres -d water_utility -f "$PROJECT_DIR/backend/db/seed.sql" 2>&1 | tail -3 || true
}

echo -e "  ${GREEN}Database setup complete${NC}"

# ---- Step 5: Install dependencies ----
echo -e "${YELLOW}[5/6] Installing dependencies...${NC}"

echo -e "  Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm install --silent 2>&1 | tail -2

echo -e "  Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install --silent 2>&1 | tail -2

echo -e "  ${GREEN}Dependencies installed${NC}"

# ---- Step 6: Start services with hot reload ----
echo -e "${YELLOW}[6/6] Starting services with hot reload...${NC}"

# Function to clean up on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  kill $(jobs -p) 2>/dev/null || true
  echo -e "${GREEN}All services stopped. Goodbye!${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start backend with nodemon (hot reload)
echo -e "  ${BLUE}Starting backend on port ${BACKEND_PORT} (with nodemon hot reload)...${NC}"
cd "$PROJECT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start frontend with Vite (hot reload built-in)
echo -e "  ${BLUE}Starting frontend on port ${FRONTEND_PORT} (with Vite HMR)...${NC}"
cd "$PROJECT_DIR/frontend"
npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!

# Wait for frontend to be ready
sleep 3

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          All services are running!                  ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend:  ${CYAN}http://localhost:${FRONTEND_PORT}${GREEN}                  ║${NC}"
echo -e "${GREEN}║  Backend:   ${CYAN}http://localhost:${BACKEND_PORT}${GREEN}                   ║${NC}"
echo -e "${GREEN}║  API Health: ${CYAN}http://localhost:${BACKEND_PORT}/api/health${GREEN}       ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Login: ${CYAN}admin@waterutility.com / admin123${GREEN}          ║${NC}"
echo -e "${GREEN}║  Or use the 'Quick Login' button${GREEN}                  ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  ${YELLOW}Hot Reload: Code changes auto-refresh!${GREEN}            ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop all services${GREEN}                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for any process to exit
wait
