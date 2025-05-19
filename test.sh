#!/bin/bash

# Exit on error
set -e

# Output formatting
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BioSemanticViz Test Runner ===${NC}"

# Parse command line arguments
COVERAGE=false
WATCH=true
SPECIFIC_TEST=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage)
      COVERAGE=true
      shift
      ;;
    --no-watch)
      WATCH=false
      shift
      ;;
    --test=*)
      SPECIFIC_TEST="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./test.sh [--coverage] [--no-watch] [--test=TestName]"
      exit 1
      ;;
  esac
done

# Navigate to frontend
cd frontend

# Build the test command
TEST_CMD="npm test"

if [ "$COVERAGE" = true ]; then
  echo -e "${YELLOW}Running tests with coverage report...${NC}"
  TEST_CMD="npm run test:coverage"
elif [ "$WATCH" = false ]; then
  echo -e "${YELLOW}Running tests once without watch mode...${NC}"
  TEST_CMD="npm test -- --watchAll=false"
else
  echo -e "${YELLOW}Running tests in watch mode...${NC}"
fi

# Add specific test pattern if provided
if [ -n "$SPECIFIC_TEST" ]; then
  echo -e "${YELLOW}Testing only: $SPECIFIC_TEST${NC}"
  TEST_CMD="$TEST_CMD -- --testNamePattern=$SPECIFIC_TEST"
fi

# Run the tests
echo -e "${GREEN}Executing: $TEST_CMD${NC}"
$TEST_CMD

echo -e "\n${GREEN}Test run complete!${NC}" 