#!/bin/bash

# Start the backend server
echo "Starting FastAPI backend..."
cd backend
python -m uvicorn app.main:app --reload --port 8003 &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 3

# Start the frontend
echo "Starting React frontend..."
cd ../frontend
npm run dev

# Cleanup when script is terminated
trap 'kill $BACKEND_PID; echo "Shutting down..."; exit' INT TERM 