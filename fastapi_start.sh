#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
function is_port_in_use() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    return 0
  else
    return 1
  fi
}

echo -e "${GREEN}Starting BioSemanticViz FastAPI backend...${NC}"

# Check if backend port is already in use
if is_port_in_use 8002; then
  echo -e "${YELLOW}Port 8002 is already in use. Killing existing process...${NC}"
  lsof -ti :8002 | xargs kill -9
  sleep 1
fi

# Check if frontend port is already in use
if is_port_in_use 3000; then
  echo -e "${YELLOW}Port 3000 is already in use. Killing existing process...${NC}"
  lsof -ti :3000 | xargs kill -9
  sleep 1
fi

# Create directories if they don't exist
mkdir -p backend/app/uploads

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  echo -e "${GREEN}Activating virtual environment...${NC}"
  source venv/bin/activate
fi

# Install requirements if needed
if [ -f "requirements.txt" ]; then
  echo -e "${GREEN}Installing requirements...${NC}"
  pip install -r requirements.txt
fi

# Start backend server
echo -e "${GREEN}Starting FastAPI backend server on port 8002...${NC}"
cd backend
uvicorn app.fastapi_main:app --host 0.0.0.0 --port 8002 --reload &

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 3

# Start frontend server
echo -e "${GREEN}Starting React frontend on port 3000...${NC}"
cd ../frontend
npm start

# This will keep the script running until the frontend server is stopped
# The backend server runs in the background 