#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}"
echo "╔════════════════════════════════════╗"
echo "║   KrishiSaathi — Start Backend     ║"
echo "╚════════════════════════════════════╝"
echo -e "${NC}"

# Kill existing processes
echo -e "${YELLOW}► Killing existing Node processes...${NC}"
taskkill //F //IM node.exe 2>/dev/null || true
sleep 1

# Check ports
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}⚠ Port $port is busy${NC}"
    return 1
  fi
  return 0
}

echo -e "${YELLOW}► Checking ports...${NC}"
check_port 3000 && echo -e "${GREEN}✓ Port 3000 free${NC}"
check_port 5001 && echo -e "${GREEN}✓ Port 5001 free${NC}"
check_port 5002 && echo -e "${GREEN}✓ Port 5002 free${NC}"
check_port 5000 && echo -e "${GREEN}✓ Port 5000 free${NC}"

echo ""
echo -e "${YELLOW}► Starting all servers...${NC}"
echo ""

# Start servers in background
node src/backend/server.js &
MAIN_PID=$!
echo -e "${GREEN}✓ MAIN server started (PID: $MAIN_PID) → port 3000${NC}"
sleep 0.5

node src/backend/ordersServer.js &
ORDERS_PID=$!
echo -e "${GREEN}✓ ORDERS server started (PID: $ORDERS_PID) → port 5001${NC}"
sleep 0.5

node src/backend/userserver.js &
USERS_PID=$!
echo -e "${GREEN}✓ USERS server started (PID: $USERS_PID) → port 5002${NC}"
sleep 0.5

node src/backend/payment.js &
PAYMENT_PID=$!
echo -e "${GREEN}✓ PAYMENT server started (PID: $PAYMENT_PID) → port 5000${NC}"
sleep 0.5

echo ""
echo -e "${CYAN}${BOLD}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All servers running!"
echo "  Main:    http://localhost:3000"
echo "  Orders:  http://localhost:5001"
echo "  Users:   http://localhost:5002"
echo "  Payment: http://localhost:5000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo "Press Ctrl+C to stop all servers"

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${RED}► Stopping all servers...${NC}"
  kill $MAIN_PID $ORDERS_PID \
       $USERS_PID $PAYMENT_PID \
       2>/dev/null
  echo -e "${GREEN}✓ All servers stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
