#!/bin/bash

# Start the Taxonium wrapper on port 3002
cd "$(dirname "$0")" || exit
echo "Starting Taxonium wrapper on port 3002..."
npm start 