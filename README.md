# BioSemanticViz

A web application for visualizing and analyzing biological semantic data through interactive visualizations.

## Overview

BioSemanticViz is a full-stack web application designed to transform complex biological data into actionable insights through semantic reasoning and interactive visualization. The application enables users to upload ontological data files (in .ttl, .rdf, or .owl formats), analyze their contents, and visualize the relationships through network graphs and phylogenetic trees.

## Features

- Upload and process RDF/TTL files with ontological information
- Extract meaningful semantic relationships from biological data
- Analyze biological data using hierarchical mapping
- Explore biological structures through interactive visualizations
- Visualize data as network graphs or phylogenetic trees

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for UI components
- React Router for navigation
- Axios for API requests

### Backend
- Flask (Python)
- RESTful API design
- CORS support for cross-origin requests

## Getting Started

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- pip

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sergueigorbounov/BioSemanticViz.git
cd BioSemanticViz
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install flask flask-cors
cd app
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend/app
python flask_app.py
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

3. Access the application at http://localhost:3000

## Usage

1. Upload a biological data file (.ttl, .rdf, or .owl) from the Upload page
2. View the generated visualizations on the Visualization page
3. Analyze data relationships on the Analysis page
4. Switch between different visualization types as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React and Material-UI for frontend development
- Flask for backend API development 