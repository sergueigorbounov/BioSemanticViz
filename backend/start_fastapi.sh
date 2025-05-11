#!/bin/bash

# Script to start the FastAPI backend server

# Check if port is in use
is_port_in_use() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    return 0
  else
    return 1
  fi
}

# Default port
PORT=${1:-8002}

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "uvicorn|python.*fastapi" || true
sleep 2

# Check if virtual environment exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Export Python path
export PYTHONPATH=$PWD

# Start the FastAPI server
echo "Starting FastAPI server on port $PORT..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload

# Wait for server to start
echo "Waiting for server to start..."
for i in {1..10}; do
  sleep 1
  if is_port_in_use $PORT; then
    echo "✅ FastAPI server is running on http://localhost:$PORT"
    echo "API documentation available at http://localhost:$PORT/docs"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "❌ Failed to start FastAPI server"
    exit 1
  fi
done
