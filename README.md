# BioSemanticViz

BioSemanticViz is a web application for visualizing and exploring biological data with semantic reasoning capabilities.

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