 #!/bin/bash

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if required commands exist
if ! command_exists python3; then
  echo "Error: python3 is not installed. Please install python3 first."
  exit 1
fi

if ! command_exists npm; then
  echo "Error: npm is not installed. Please install Node.js and npm first."
  exit 1
fi

# Function to handle cleanup on exit
cleanup() {
  echo "Shutting down services..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit 0
}

# Set up trap to handle Ctrl+C and other signals
trap cleanup SIGINT SIGTERM

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display banner
echo -e "${GREEN}"
echo "========================================"
echo "  Starting BioSemanticViz Platform"
echo "========================================"
echo -e "${NC}"

# Start Backend
echo -e "${BLUE}Starting backend server...${NC}"
cd backend || { echo "Error: backend directory not found"; exit 1; }

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate || { echo "Error: Failed to activate virtual environment"; exit 1; }

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Start backend server
echo "Starting FastAPI server..."
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 2

# Start Frontend
echo -e "${BLUE}Starting frontend server...${NC}"
cd ../frontend || { echo "Error: frontend directory not found"; exit 1; }

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Start React development server
echo "Starting React development server..."
npm start &
FRONTEND_PID=$!

# Display startup message
echo -e "${GREEN}"
echo "========================================"
echo "  BioSemanticViz Platform is running"
echo "========================================"
echo "  Backend server: http://localhost:8000"
echo "  Frontend app: http://localhost:3000"
echo -e "${NC}"
echo "Press Ctrl+C to stop all services"

# Wait for processes to finish
wait 