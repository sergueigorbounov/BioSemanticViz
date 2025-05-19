#!/bin/bash

# Output formatting
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BioSemanticViz Docker Development Startup (sudo mode) ===${NC}"
echo -e "${YELLOW}Using sudo to run Docker commands until you log out and back in${NC}"

# Create directories if they don't exist
echo -e "${YELLOW}Setting up required directories...${NC}"
mkdir -p nginx
mkdir -p backend/app/uploads

# Build and start containers with sudo
echo -e "${YELLOW}Building and starting containers...${NC}"
sudo docker-compose up --build

# The script will continue running until docker-compose is stopped with Ctrl+C 