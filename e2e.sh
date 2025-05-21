#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== BioSemanticViz E2E Test Runner ===${NC}"

# Vérifier si Cypress est installé
if ! command -v cypress &> /dev/null; then
    echo -e "${YELLOW}Cypress n'est pas installé. Installation en cours...${NC}"
    npm install -g cypress
fi

# Vérifier si Selenium est installé
if ! command -v selenium-server &> /dev/null; then
    echo -e "${YELLOW}Selenium n'est pas installé. Installation en cours...${NC}"
    npm install -g selenium-standalone
    selenium-standalone install
fi

# Démarrer le backend en arrière-plan
echo -e "${YELLOW}Démarrage du backend...${NC}"
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Démarrer le frontend en arrière-plan
echo -e "${YELLOW}Démarrage du frontend...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Attendre que le frontend et le backend soient prêts
echo -e "${YELLOW}Attente du démarrage des services...${NC}"
sleep 10

# Démarrer Selenium en arrière-plan
echo -e "${YELLOW}Démarrage de Selenium...${NC}"
selenium-standalone start &
SELENIUM_PID=$!

# Attendre que Selenium soit prêt
echo -e "${YELLOW}Attente du démarrage de Selenium...${NC}"
sleep 5

# Exécuter les tests Cypress
echo -e "${GREEN}Exécution des tests E2E avec Cypress...${NC}"
cypress run

# Exécuter les tests Selenium
echo -e "${GREEN}Exécution des tests E2E avec Selenium...${NC}"
cd frontend
npm run test:selenium
cd ..

# Arrêter Selenium, le frontend et le backend
echo -e "${YELLOW}Arrêt des services...${NC}"
kill $SELENIUM_PID
kill $FRONTEND_PID
kill $BACKEND_PID

echo -e "${GREEN}Tests E2E terminés !${NC}" 