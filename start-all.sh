#!/bin/bash

# Navigate to the project root directory
cd "$(dirname "$0")" || exit

# Start the backend server
echo "Starting backend server..."
(cd backend && python -m uvicorn app.main:app --reload --port 8003) &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 2

# Start the frontend server
echo "Starting frontend server..."
(cd frontend && npm start) &
FRONTEND_PID=$!

# Start the Taxonium wrapper
echo "Starting Taxonium wrapper..."
(cd taxonium-wrapper && npm start) &
TAXONIUM_PID=$!

# Function to handle shutdown
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID $TAXONIUM_PID
    exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Keep script running
echo "All servers started. Press Ctrl+C to stop all."
wait 