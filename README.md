# BioSemanticViz

BioSemanticViz est une plateforme complète pour la visualisation et l'analyse de données biologiques, avec un accent particulier sur les orthologues et les relations phylogénétiques. Elle s'appuie sur des technologies modernes (React, FastAPI, Docker) et intègre la bibliothèque ETE Toolkit (sous licence GPLv3) pour la manipulation et la visualisation d'arbres phylogénétiques.

## Démarrage rapide avec Docker

La manière la plus simple d'utiliser BioSemanticViz est via Docker :

1. Assurez-vous d'avoir Docker et Docker Compose installés
2. Clonez ce dépôt
3. Lancez le script principal :

```bash
./start-docker.sh
```

4. Ouvrez votre navigateur sur http://localhost

---

## 🏛️ Architecture & Stack technique

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

## Manual Setup

If you prefer not to use Docker, you can set up the application manually:

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Development

For development purposes, you can use the development script:

```bash
./dev.sh
```

This will start both frontend and backend in development mode with hot reloading.

## Testing

We use a test-driven development (TDD) approach. To run tests:

```bash
# Run all tests
./run-all-tests.sh

# Run frontend tests only
cd frontend && npm test

# Run backend tests only
./python-tests.sh

# Run end-to-end tests
./e2e.sh

# Start TDD development mode (tests in watch mode)
./tdd.sh
```

For more information about our testing approach, see:
- [TDD Workflow](docs/TDD_WORKFLOW.md)
- [Testing Strategy](docs/TESTING_STRATEGY.md)

## Configuration

Configuration is handled through environment variables. See the docker-compose.yml file for available options.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Features

- Interactive visualization of species relationships
- Exploration of orthologous gene groups
- Detailed gene information with GO terms and functional annotations
- Upload and analyze biological data files
- Semantic reasoning for biological knowledge discovery

## Backend Options

### Flask Backend (Original)

The application includes a Flask backend for handling API requests. To start the application with the Flask backend:

```bash
./better_start.sh
```

### FastAPI Backend (New)

A new FastAPI backend has been implemented, offering improved performance, automatic documentation, and better type validation. To start the application with the FastAPI backend:

```bash
./fastapi_start.sh
```

## API Documentation

The FastAPI backend includes automatic API documentation:

- Swagger UI: http://localhost:8002/docs
- ReDoc: http://localhost:8002/redoc

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── models/               # Data models
│   │   ├── mock_data/            # Sample data files
│   │   ├── routes/               # API route definitions
│   │   ├── flask_app.py          # Flask application
│   │   └── fastapi_main.py       # FastAPI application
│   └── test_fastapi.py           # FastAPI test script
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/                # Utility functions
│   │   └── App.tsx               # Main application component
│   └── package.json              # Frontend dependencies
├── better_start.sh               # Flask startup script
├── fastapi_start.sh              # FastAPI startup script
└── requirements.txt              # Python dependencies
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/BioSemanticViz.git
   cd BioSemanticViz
   ```

2. Install backend dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
```

3. Install frontend dependencies:
   ```bash
cd frontend
npm install
   ```

## Development

1. Start the backend and frontend:
   ```bash
   # For Flask backend
   ./better_start.sh
   
   # For FastAPI backend
   ./fastapi_start.sh
```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Migrating from Flask to FastAPI

If you're involved in development, here are the key differences when using the FastAPI backend:

1. **Type Validation**: FastAPI uses Pydantic models for request/response validation
2. **Documentation**: Automatic OpenAPI documentation at `/docs` and `/redoc`
3. **Performance**: FastAPI is built on Starlette and Uvicorn for high-performance async requests
4. **Dependency Injection**: FastAPI provides a clean way to inject dependencies into routes

To convert a Flask route to FastAPI:
- Replace Flask decorators with FastAPI equivalents
- Add appropriate response_model annotations
- Use Pydantic models for request/response data

## License

MIT 