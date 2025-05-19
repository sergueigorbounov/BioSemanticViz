#!/bin/bash

# Exit on error
set -e

# Output formatting
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BioSemanticViz TDD Workflow ===${NC}"

# Parse command line arguments
SPECIFIC_TEST=""
RUN_BACKEND=true
RUN_FRONTEND=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --test=*)
      SPECIFIC_TEST="${1#*=}"
      shift
      ;;
    --no-backend)
      RUN_BACKEND=false
      shift
      ;;
    --no-frontend)
      RUN_FRONTEND=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./tdd.sh [--test=TestName] [--no-backend] [--no-frontend]"
      exit 1
      ;;
  esac
done

# Start backend if requested
if [ "$RUN_BACKEND" = true ]; then
  echo -e "${YELLOW}Starting Python backend...${NC}"
  cd backend
  
  # Check for main.py or FastAPI app.py
  if [ -f "main.py" ]; then
    BACKEND_FILE="main.py"
    
    # Start backend with appropriate method
    if command -v poetry &> /dev/null; then
      echo "Using Poetry to start backend..."
      poetry run python $BACKEND_FILE &
      BACKEND_PID=$!
    else
      echo "Using standard Python..."
      python $BACKEND_FILE &
      BACKEND_PID=$!
    fi
    echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
    
  elif [ -f "app/main.py" ]; then
    # Use uvicorn for FastAPI
    if grep -q "fastapi" "app/main.py"; then
      echo "Detected FastAPI app, using uvicorn..."
      python -m uvicorn app.main:app --reload --port 8003 &
      BACKEND_PID=$!
      echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
    else
      # Regular Python file
      if command -v poetry &> /dev/null; then
        echo "Using Poetry to start backend..."
        poetry run python app/main.py &
        BACKEND_PID=$!
      else
        echo "Using standard Python..."
        python app/main.py &
        BACKEND_PID=$!
      fi
      echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
    fi
  else
    echo -e "${RED}No backend entry point found! Skipping backend startup.${NC}"
  fi
  
  cd ..
else
  echo -e "${YELLOW}Skipping backend startup (--no-backend specified)${NC}"
fi

# Run tests in watch mode in a new terminal
echo -e "${YELLOW}Starting tests in watch mode...${NC}"
cd frontend

# Build test command
TEST_CMD="npm test"
if [ -n "$SPECIFIC_TEST" ]; then
  echo -e "${YELLOW}Testing only: $SPECIFIC_TEST${NC}"
  TEST_CMD="$TEST_CMD -- --testNamePattern=$SPECIFIC_TEST"
fi

# Use xterm or gnome-terminal if available, otherwise run in background
if command -v xterm &> /dev/null; then
  echo "Opening tests in xterm..."
  xterm -title "BioSemanticViz Tests" -e "cd $(pwd) && $TEST_CMD" &
  TESTS_PID=$!
elif command -v gnome-terminal &> /dev/null; then
  echo "Opening tests in gnome-terminal..."
  gnome-terminal -- bash -c "cd $(pwd) && $TEST_CMD" &
  TESTS_PID=$!
else
  echo "No terminal emulator found, running tests in background..."
  $TEST_CMD &
  TESTS_PID=$!
fi

# Start frontend if requested
if [ "$RUN_FRONTEND" = true ]; then
  # Sleep to allow the test terminal to initialize
  sleep 2
  
  echo -e "${YELLOW}Starting frontend development server...${NC}"
  npm start &
  FRONTEND_PID=$!
  echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"
else
  echo -e "${YELLOW}Skipping frontend startup (--no-frontend specified)${NC}"
fi

echo -e "\n${GREEN}=== TDD environment is running ===${NC}"
echo -e "Backend PID: $BACKEND_PID (if started)"
echo -e "Tests PID: $TESTS_PID"
echo -e "Frontend PID: $FRONTEND_PID (if started)"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Handle cleanup on exit
trap "echo -e '${YELLOW}Shutting down services...${NC}'; [ -n \"$FRONTEND_PID\" ] && kill $FRONTEND_PID 2>/dev/null; [ -n \"$TESTS_PID\" ] && kill $TESTS_PID 2>/dev/null; [ -n \"$BACKEND_PID\" ] && kill $BACKEND_PID 2>/dev/null; echo -e '${GREEN}Done!${NC}'" EXIT

# Wait for user interrupt
wait 