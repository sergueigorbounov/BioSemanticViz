# BioSemanticViz

BioSemanticViz est une plateforme complète pour la visualisation et l'analyse de données biologiques, avec un accent particulier sur les orthologues et les relations phylogénétiques. Elle s'appuie sur des technologies modernes (React, FastAPI, Docker) et intègre la bibliothèque ETE Toolkit (sous licence GPLv3) pour la manipulation et la visualisation d'arbres phylogénétiques.

## Démarrage rapide avec Docker

La manière la plus simple d'utiliser BioSemanticViz est via Docker :

1. Assurez-vous d'avoir Docker et Docker Compose installés
2. Clonez ce dépôt
3. Lancez le script principal :

```bash
./docker-start.sh
```

4. Ouvrez votre navigateur sur http://localhost

---

##  Architecture & Stack technique

### Vue d'ensemble
L'architecture de BioSemanticViz repose sur une approche microservices orchestrée par Docker :

```
+-------------------+        +-------------------+        +-------------------+
|   Frontend (React)| <----> |    Nginx Proxy    | <----> |  Backend (FastAPI)|
+-------------------+        +-------------------+        +-------------------+
        |                        |                        |
        |                        |                        |
        +------------------------+------------------------+
                                 |
                        +-------------------+
                        |   Data/Volumes    |
                        +-------------------+
```

### Composants principaux
- **Frontend** :  React + TypeScript, MUI, D3.js, Axios, React Router, Jest, React Testing Library, Cypress (E2E)  
  **Licence** : MIT
- **Backend** :  FastAPI (Python), Pandas, ETE Toolkit (phylogénie), Biopython, Pytest  
  **Licence** : GPLv3 (à cause d'ETE Toolkit)
- **Reverse Proxy** :  Nginx (pour servir le frontend et router les requêtes API)  
  **Licence** : 2-clause BSD
- **Orchestration** :  Docker & Docker Compose  
  **Licence** : Apache 2.0
- **Données** :  Fichiers Orthogroups, arbres Newick, mapping espèces, etc.

### Licences des principaux composants
| Composant         | Licence   | Lien                                      |
|-------------------|-----------|-------------------------------------------|
| BioSemanticViz    | GPLv3     | (ce projet, voir LICENSE)                 |
| ETE Toolkit       | GPLv3     | http://etetoolkit.org/                    |
| FastAPI           | MIT       | https://github.com/tiangolo/fastapi       |
| React             | MIT       | https://react.dev/                        |
| D3.js             | BSD-3     | https://d3js.org/                         |
| Nginx             | BSD-2     | https://nginx.org/                        |
| Docker            | Apache 2  | https://www.docker.com/                   |
| Pandas            | BSD-3     | https://pandas.pydata.org/                |
| Biopython         | MIT       | https://biopython.org/                    |

> **Remarque** : L'utilisation d'ETE Toolkit (GPLv3) impose que tout le projet soit distribué sous GPLv3.

---

## Installation manuelle

Si vous préférez ne pas utiliser Docker, vous pouvez installer l'application manuellement :

### Installation du backend 

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

### Installation du frontend

```bash
cd frontend
npm install
npm start
```

## Développement
Pour le développement, vous pouvez utiliser le script de développement :

```bash
./dev.sh
```

Cela démarrera le frontend et le backend en mode développement avec rechargement à chaud.

## Tests

Nous utilisons une approche de développement piloté par les tests (TDD). Pour exécuter les tests :

```bash
# Exécuter tous les tests
./run-all-tests.sh

# Exécuter uniquement les tests frontend
cd frontend && npm test

# Exécuter uniquement les tests backend
./python-tests.sh

# Exécuter les tests end-to-end
./e2e.sh

# Démarrer le mode développement TDD (tests en mode watch)
./tdd.sh
```