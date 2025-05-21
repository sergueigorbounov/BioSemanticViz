#!/bin/bash

# Output formatting
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BioSemanticViz Docker Development Startup ===${NC}"

# Function to install Docker
install_docker() {
  echo -e "${YELLOW}Installing Docker...${NC}"
  
  sudo apt-get update
  
  # Install prerequisites
  sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
    
  # Add Docker's official GPG key
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  
  # Set up the stable repository
  echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  
  # Install Docker Engine
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io
  
  # Add current user to the docker group to avoid using sudo
  sudo usermod -aG docker $USER
  
  echo -e "${GREEN}Docker has been installed!${NC}"
  echo -e "${YELLOW}NOTE: You may need to log out and back in for group changes to take effect.${NC}"
  
  # Install Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose has been installed!${NC}"
  fi
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Docker is not installed.${NC}"
  read -p "Would you like to install Docker? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    install_docker
    
    echo -e "${YELLOW}Starting Docker service...${NC}"
    sudo systemctl start docker
    
    # Wait for Docker to be fully started
    echo -e "${YELLOW}Waiting for Docker daemon to be ready...${NC}"
    for i in {1..10}; do
      if docker info > /dev/null 2>&1; then
        echo -e "${GREEN}Docker daemon is now running!${NC}"
        break
      fi
      if [ $i -eq 10 ]; then
        echo -e "${RED}Timed out waiting for Docker daemon to start.${NC}"
        echo -e "${YELLOW}Please try starting Docker manually with: sudo systemctl start docker${NC}"
        echo -e "${YELLOW}Or you might need to log out and log back in for group permissions to take effect.${NC}"
        exit 1
      fi
      sleep 1
      echo -n "."
    done
  else
    echo -e "${YELLOW}Docker installation skipped. Exiting.${NC}"
    echo -e "${YELLOW}You can run the application without Docker using:${NC}"
    echo -e "   ${GREEN}./dev.sh${NC}   or   ${GREEN}./fastapi_start.sh${NC}"
    exit 1
  fi
elif ! docker info > /dev/null 2>&1; then
  echo -e "${YELLOW}Docker is installed but not running. Attempting to start Docker...${NC}"
  
  # Check if we can use systemctl (systemd)
  if command -v systemctl > /dev/null 2>&1; then
    # Try without sudo first
    if systemctl start docker > /dev/null 2>&1; then
      echo -e "${GREEN}Successfully started Docker daemon.${NC}"
    else
      # If failed, try with sudo
      echo -e "${YELLOW}Requires elevated privileges to start Docker daemon...${NC}"
      if sudo systemctl start docker > /dev/null 2>&1; then
        echo -e "${GREEN}Successfully started Docker daemon with sudo.${NC}"
      else
        echo -e "${RED}Failed to start Docker daemon.${NC}"
        echo -e "${YELLOW}Docker might not be properly installed. Would you like to reinstall Docker? (y/n)${NC}"
        read -p "" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
          install_docker
          sudo systemctl start docker
        else
          echo -e "${RED}Exiting without Docker. You can run the application without Docker using:${NC}"
          echo -e "   ${GREEN}./dev.sh${NC}   or   ${GREEN}./fastapi_start.sh${NC}"
          exit 1
        fi
      fi
    fi
  # Check if we can use service command
  elif command -v service > /dev/null 2>&1; then
    # Try without sudo first
    if service docker start > /dev/null 2>&1; then
      echo -e "${GREEN}Successfully started Docker daemon.${NC}"
    else
      # If failed, try with sudo
      echo -e "${YELLOW}Requires elevated privileges to start Docker daemon...${NC}"
      if sudo service docker start > /dev/null 2>&1; then
        echo -e "${GREEN}Successfully started Docker daemon with sudo.${NC}"
      else
        echo -e "${RED}Failed to start Docker daemon.${NC}"
        echo -e "${YELLOW}Docker might not be properly installed. Would you like to reinstall Docker? (y/n)${NC}"
        read -p "" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
          install_docker
          sudo service docker start
        else
          echo -e "${RED}Exiting without Docker. You can run the application without Docker using:${NC}"
          echo -e "   ${GREEN}./dev.sh${NC}   or   ${GREEN}./fastapi_start.sh${NC}"
          exit 1
        fi
      fi
    fi
  else
    echo -e "${RED}Could not find systemctl or service commands. Please install Docker manually.${NC}"
    exit 1
  fi
  
  # Wait for Docker to be fully started
  echo -e "${YELLOW}Waiting for Docker daemon to be ready...${NC}"
  for i in {1..10}; do
    if docker info > /dev/null 2>&1; then
      echo -e "${GREEN}Docker daemon is now running!${NC}"
      break
    fi
    if [ $i -eq 10 ]; then
      echo -e "${RED}Timed out waiting for Docker daemon to start.${NC}"
      exit 1
    fi
    sleep 1
    echo -n "."
  done
fi

# Check if docker-compose is installed
if ! command -v docker-compose > /dev/null 2>&1; then
  echo -e "${YELLOW}Docker Compose is not installed. Installing...${NC}"
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  echo -e "${GREEN}Docker Compose has been installed!${NC}"
fi

# Create directories if they don't exist
echo -e "${YELLOW}Setting up required directories...${NC}"
mkdir -p nginx
mkdir -p backend/app/uploads
# Stop and remove any existing containers first
echo -e "${YELLOW}Stopping and removing any existing containers...${NC}"
# Force remove any existing containers with these names
echo -e "${YELLOW}Force removing any existing containers with conflicting names...${NC}"
docker rm -f biosemantic-backend biosemantic-frontend biosemantic-nginx 2>/dev/null || true
docker-compose down --remove-orphans
# Build and start containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose up --build

# The script will continue running until docker-compose is stopped with Ctrl+C 