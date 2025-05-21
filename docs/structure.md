# Structure Complète du Projet BioSemanticViz

## 📁 Racine du Projet

- **`README.md`** : Documentation principale du projet, expliquant comment installer, démarrer et tester l'application.
- **`ARCHITECTURE.md`** : Détails sur l'architecture du projet, les choix techniques et les bonnes pratiques.
- **`e2e.sh`** : Script pour exécuter les tests end-to-end avec Cypress.
- **`test.sh`** : Script pour exécuter les tests unitaires et d'intégration.
- **`tdd.sh`** : Script pour démarrer le mode développement piloté par les tests (TDD).
- **`docker-compose.yml`** : Configuration Docker Compose pour lancer l'application en conteneurs.
- **`Dockerfile`** : Instructions pour construire l'image Docker de l'application.
- **`.gitignore`** : Fichiers et dossiers ignorés par Git.
- **`.env`** : Variables d'environnement (non versionné).
- **`jest.config.js`** : Configuration Jest pour les tests frontend.
- **`pytest.ini`** : Configuration Pytest pour les tests backend.

## 📁 Frontend

- **`frontend/`** : Dossier principal du frontend (React + TypeScript).
  - **`package.json`** : Dépendances et scripts du frontend.
  - **`src/`** : Code source du frontend.
    - **`components/`** : Composants React réutilisables.
      - **`Header.tsx`** : En-tête de l'application.
      - **`Footer.tsx`** : Pied de page de l'application.
      - **`PhylogeneticTreeView.tsx`** : Composant pour afficher l'arbre phylogénétique.
    - **`pages/`** : Pages de l'application.
      - **`HomePage.tsx`** : Page d'accueil.
      - **`UploadPage.tsx`** : Page de téléchargement de fichiers.
    - **`api/`** : Clients API pour communiquer avec le backend.
      - **`phyloClient.ts`** : Client pour les requêtes phylogénétiques.
    - **`__tests__/`** : Tests unitaires et d'intégration (Jest, React Testing Library).
      - **`PhylogeneticTreeView.test.tsx`** : Tests pour le composant PhylogeneticTreeView.
    - **`cypress/`** : Tests end-to-end avec Cypress.
      - **`e2e/`** : Tests E2E.
  - **`public/`** : Fichiers statiques (HTML, images, etc.).
  - **`webpack.config.js`** : Configuration Webpack pour le bundling.

## 📁 Backend

- **`backend/`** : Dossier principal du backend (FastAPI + Python).
  - **`requirements.txt`** : Dépendances Python du backend.
  - **`app/`** : Code source du backend.
    - **`main.py`** : Point d'entrée de l'application FastAPI.
    - **`api/`** : Endpoints API.
      - **`phylo.py`** : Endpoints pour la phylogénie.
    - **`models/`** : Modèles de données.
      - **`Species.py`** : Modèle pour les espèces.
      - **`Gene.py`** : Modèle pour les gènes.
    - **`services/`** : Logique métier.
      - **`OrthologueService.py`** : Service pour gérer les orthologues.
  - **`tests/`** : Tests unitaires et d'intégration (Pytest).
    - **`test_models.py`** : Tests pour les modèles biologiques.
    - **`test_fastapi.py`** : Tests pour le serveur FastAPI.

## 📁 Documentation

- **`docs/`** : Documentation détaillée du projet.
  - **`architecture.puml`** : Diagramme PlantUML de l'architecture.
  - **`structure.md`** : Ce fichier, expliquant la structure du projet.

## 📁 Intégration Taxonium

- **`taxonium-integration/`** : Intégration avec le projet Taxonium.
  - **`taxonium/`** : Code source de Taxonium.
    - **`taxonium_website/`** : Site web Taxonium.
    - **`taxonium_backend/`** : Backend Taxonium.
    - **`taxonium_component/`** : Composant React Taxonium.
    - **`taxoniumtools/`** : Outils pour convertir les données.

## 📁 Scripts et Utilitaires

- **`scripts/`** : Scripts utilitaires pour le développement.
  - **`fix-deps.sh`** : Script pour corriger les dépendances.
  - **`dev.sh`** : Script pour démarrer l'environnement de développement.

## 📁 Tests

- **`tests/`** : Tests globaux du projet.
  - **`e2e/`** : Tests end-to-end (Cypress, Playwright).
  - **`unit/`** : Tests unitaires (Jest, Pytest).
  - **`integration/`** : Tests d'intégration.

## 📁 GitHub Actions

- **`.github/workflows/`** : Configurations CI/CD.
  - **`test.yml`** : Workflow pour exécuter les tests.
  - **`e2e.yml`** : Workflow pour exécuter les tests E2E.
  - **`python-tests.yml`** : Workflow pour exécuter les tests Python. 