#!/bin/bash

# Script to start both frontend and backend services

# Function to check if a port is in use
is_port_in_use() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    return 0
  else
    return 1
  fi
}

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "flask|python|react-scripts" || true
sleep 2

# Set up and start backend with minimal dependencies
echo "Starting backend server with minimal dependencies..."
cd backend
# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python -m venv venv
fi
source venv/bin/activate
echo "Installing essential packages only..."
pip install --upgrade pip
pip install flask flask-cors pandas numpy

# Export the Python path
export PYTHONPATH=$PWD

# Create a simple starter app if it doesn't exist
MAIN_APP_DIR="app"
MAIN_APP_FILE="$MAIN_APP_DIR/flask_app.py"
mkdir -p "$MAIN_APP_DIR"

if [ ! -f "$MAIN_APP_FILE" ]; then
  echo "Creating a minimal Flask app..."
  cat > "$MAIN_APP_FILE" <<EOF
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/status')
def status():
    return jsonify({"status": "running"})

@app.route('/api/examples')
def examples():
    return jsonify({"examples": ["example1", "example2"]})

if __name__ == '__main__':
    app.run(debug=True, port=8002)
EOF
fi

# Start backend
cd app
python flask_app.py --port=8002 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
for i in {1..10}; do
  sleep 3
  if is_port_in_use 8002; then
    echo "Backend server started on port 8002"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "Failed to start backend server"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
  fi
  echo "Waiting for backend... ($i/10)"
done

# Start frontend
echo "Starting frontend server..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
echo "Waiting for frontend to start..."
for i in {1..10}; do
  sleep 3
  if is_port_in_use 3000; then
    echo "Frontend server started on port 3000"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "Failed to start frontend server"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
  fi
  echo "Waiting for frontend... ($i/10)"
done

echo "✨ BioSemanticViz application is now running with minimal functionality ✨"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8002/api"
echo "Note: This is a simplified version using Flask instead of FastAPI"
echo "Press Ctrl+C to stop all services"

# Keep script running until manually stopped
wait $BACKEND_PID $FRONTEND_PID 