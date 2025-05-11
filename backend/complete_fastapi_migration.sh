#!/bin/bash

# Script to finalize migration from Flask to FastAPI
# This script sets up symlinks and configurations to use FastAPI as the primary backend

echo "====== FastAPI Migration Helper ======"
echo "This script will help finalize the transition from Flask to FastAPI"

# Step 1: Check dependencies
echo -e "\n[Step 1/5] Checking dependencies..."
python -m pip install fastapi uvicorn pydantic --quiet
if [ $? -eq 0 ]; then
    echo "✅ Dependencies are installed"
else
    echo "❌ Failed to install dependencies"
    echo "Please run: pip install fastapi uvicorn pydantic"
    exit 1
fi

# Step 2: Create a soft link for the main app entry point
echo -e "\n[Step 2/5] Setting up main entry point..."
if [ -f "app/main.py" ]; then
    mv app/main.py app/main.py.flask.bak
    echo "✅ Backed up existing main.py to main.py.flask.bak"
fi

# Create a symlink to fastapi_main.py
ln -sf app/fastapi_main.py app/main.py
if [ $? -eq 0 ]; then
    echo "✅ Set up main.py to point to FastAPI implementation"
else
    echo "❌ Failed to create main entry point"
    exit 1
fi

# Step 3: Update start script
echo -e "\n[Step 3/5] Creating FastAPI start script..."
cat > start_fastapi.sh << 'EOF'
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
EOF

chmod +x start_fastapi.sh
echo "✅ Created start_fastapi.sh script"

# Step 4: Create a Docker configuration
echo -e "\n[Step 4/5] Creating Docker configuration..."
if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'EOF'
FROM python:3.9-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the port
EXPOSE 8002

# Set environment variables
ENV PYTHONPATH=/app

# Start the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
EOF

    cat > requirements.txt << 'EOF'
fastapi>=0.68.0
uvicorn>=0.15.0
pydantic>=1.8.0
python-multipart>=0.0.5
EOF

    echo "✅ Created Dockerfile and requirements.txt"
else
    echo "ℹ️ Dockerfile already exists, skipping"
fi

# Step 5: Complete the migration
echo -e "\n[Step 5/5] Finalizing migration..."
echo "# FastAPI Migration" > MIGRATION.md
echo "" >> MIGRATION.md
echo "This project has been migrated from Flask to FastAPI." >> MIGRATION.md
echo "" >> MIGRATION.md
echo "## API Documentation" >> MIGRATION.md
echo "" >> MIGRATION.md
echo "- API documentation is available at http://localhost:8002/docs" >> MIGRATION.md
echo "- JSON Schema is available at http://localhost:8002/openapi.json" >> MIGRATION.md
echo "" >> MIGRATION.md
echo "## Starting the Server" >> MIGRATION.md
echo "" >> MIGRATION.md
echo "Run \`./start_fastapi.sh\` to start the server" >> MIGRATION.md
echo "✅ Created migration documentation"

echo -e "\n====== Migration Setup Complete ======"
echo "To start your FastAPI server, run:"
echo "./start_fastapi.sh"
echo ""
echo "API documentation will be available at:"
echo "http://localhost:8002/docs"
echo ""
echo "For more information, see MIGRATION.md" 