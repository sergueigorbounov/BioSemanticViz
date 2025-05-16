#!/bin/bash
# save as fix-deps.sh

# Stop on error
set -e

echo "Cleaning up node_modules..."
rm -rf node_modules
rm -f package-lock.json

echo "Creating temporary package.json with compatible dependencies..."
cat > package.json.new << EOL
{
  "name": "bio-semantic-viz",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.11.16",
    "@mui/material": "^5.13.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.4.3",
    "@types/d3": "^7.4.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^18.15.3",
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "axios": "^1.3.4",
    "d3": "^7.8.2",
    "http-proxy-middleware": "^2.0.6",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.9.0",
    "react-scripts": "5.0.1",
    "react-split": "^2.0.14",
    "react-split-pane": "^0.1.92",
    "recharts": "^2.5.0",
    "typescript": "^4.9.5",
    "web-vitals": "^3.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOL

echo "Backing up original package.json..."
mv package.json package.json.bak
mv package.json.new package.json

echo "Installing compatible dependencies..."
npm install --legacy-peer-deps

echo "Setting up legacy SSL provider in .env..."
echo "NODE_OPTIONS=--openssl-legacy-provider" > .env.local

echo "Done! Try running 'npm start' now."