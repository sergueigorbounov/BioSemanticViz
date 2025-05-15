#!/bin/bash

# =============================================
# BioSemanticViz Development Environment Setup
# Consolidated script for modern development
# =============================================

# Color codes for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurable ports
BACKEND_PORT=8002
FRONTEND_PORT=3000
TAXONIUM_PORT=3002

# Print section header
section() {
  echo -e "\n${GREEN}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}\n"
}

# Print step info
step() {
  echo -e "${YELLOW}➤ $1${NC}"
}

# Print error and exit
error() {
  echo -e "${RED}ERROR: $1${NC}"
  exit 1
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if port is in use and kill process if needed
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    step "Port $1 is in use. Killing existing process..."
    lsof -ti :$1 | xargs kill -9 || true
    sleep 1
  fi
}

# Setup signal handling
cleanup() {
  section "Shutting Down All Services"
  kill $(jobs -p) 2>/dev/null || true
  step "All services have been stopped."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Check dependencies
section "Checking Dependencies"

# Check for pnpm (preferred) or npm
if command_exists pnpm; then
  PACKAGE_MANAGER="pnpm"
  step "Using pnpm for package management"
elif command_exists npm; then
  PACKAGE_MANAGER="npm"
  step "Using npm for package management (consider switching to pnpm)"
else
  error "Neither pnpm nor npm is installed. Please install pnpm: https://pnpm.io/installation"
fi

# Check for conda (preferred) or python
if command_exists conda; then
  step "Using conda for Python environment management"
  PYTHON_MANAGER="conda"
elif command_exists python3; then
  step "Using venv for Python environment management (consider switching to conda)"
  PYTHON_MANAGER="venv"
else
  error "Neither conda nor python3 is found. Please install miniconda: https://docs.conda.io/en/latest/miniconda.html"
fi

# Check for ports in use
section "Checking Ports"
check_port $BACKEND_PORT
check_port $FRONTEND_PORT
check_port $TAXONIUM_PORT

# Set up Python environment
section "Setting Up Python Environment"

if [ "$PYTHON_MANAGER" == "conda" ]; then
  # Setup using conda
  if ! conda env list | grep -q "bio-semantic-viz"; then
    step "Creating conda environment 'bio-semantic-viz'..."
    conda create -y -n bio-semantic-viz python=3.10
  fi
  
  step "Activating conda environment..."
  source "$(conda info --base)/etc/profile.d/conda.sh"
  conda activate bio-semantic-viz || error "Failed to activate conda environment"
  
  step "Installing Python dependencies..."
  pip install -r requirements.txt || error "Failed to install Python dependencies"
else
  # Setup using venv
  if [ ! -d "venv" ]; then
    step "Creating Python virtual environment..."
    python3 -m venv venv || error "Failed to create virtual environment"
  fi
  
  step "Activating virtual environment..."
  source venv/bin/activate || error "Failed to activate virtual environment"
  
  step "Installing Python dependencies..."
  pip install --upgrade pip
  pip install -r requirements.txt || error "Failed to install Python dependencies"
fi

# Create required directories
step "Creating required directories..."
mkdir -p backend/app/uploads
mkdir -p logs

# Start backend
section "Starting Backend Server"

step "Starting FastAPI backend on port $BACKEND_PORT..."
cd backend
export PYTHONPATH=$PWD
uvicorn app.fastapi_main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
cd ..

# Wait for backend to start
step "Waiting for backend to start..."
for i in {1..10}; do
  sleep 2
  if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null; then
    step "Backend server started successfully!"
    break
  fi
  echo -n "."
  if [ $i -eq 10 ]; then
    error "Failed to start backend server after 20 seconds"
  fi
done

# Start frontend
section "Starting Frontend Applications"

# Install and start main frontend
step "Setting up main frontend..."
cd frontend
if [ "$PACKAGE_MANAGER" == "pnpm" ]; then
  step "Installing frontend dependencies using pnpm..."
  pnpm install
  
  step "Starting frontend development server..."
  VITE_BACKEND_URL=http://localhost:$BACKEND_PORT pnpm dev --port $FRONTEND_PORT &
else
  step "Installing frontend dependencies using npm..."
  npm install
  
  step "Starting frontend development server..."
  REACT_APP_BACKEND_URL=http://localhost:$BACKEND_PORT npm start &
fi
cd ..

# Optional: Start Taxonium frontend if it exists
if [ -d "frontend-taxonium" ]; then
  step "Setting up Taxonium frontend..."
  cd frontend-taxonium
  if [ "$PACKAGE_MANAGER" == "pnpm" ]; then
    pnpm install
    pnpm dev --port $TAXONIUM_PORT &
  else
    npm install
    npm start &
  fi
  cd ..
fi

# Display startup message
section "BioSemanticViz Development Environment Running"
echo -e "${GREEN}▶ Main Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${GREEN}▶ Backend API:${NC} http://localhost:$BACKEND_PORT"
echo -e "${GREEN}▶ API Documentation:${NC} http://localhost:$BACKEND_PORT/docs"

if [ -d "frontend-taxonium" ]; then
  echo -e "${GREEN}▶ Taxonium Frontend:${NC} http://localhost:$TAXONIUM_PORT"
fi

echo -e "\n${BLUE}Press Ctrl+C to stop all services${NC}"

# Wait for all background processes
wait 