#!/bin/bash

# Start Taxonium micro-frontend
echo "Starting Taxonium micro-frontend on port 3002..."
cd frontend-taxonium
npm start &
TAXONIUM_PID=$!

# Wait a bit for Taxonium to start
sleep 5

# Start main application
echo "Starting main application on port 3001..."
cd ../frontend
npm start &
MAIN_PID=$!

# Setup trap to kill both processes when script is terminated
trap "kill $TAXONIUM_PID $MAIN_PID; exit" SIGINT SIGTERM

# Wait for processes
wait 