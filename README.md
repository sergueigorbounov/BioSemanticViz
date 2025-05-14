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

## Taxonium Integration

To solve React compatibility issues with Taxonium (which requires React 17), a micro-frontend approach has been implemented. The `taxonium-wrapper` directory contains a separate React 17 application that runs on port 3002 and communicates with the main application through the postMessage API.

### Running the Taxonium Wrapper

1. Navigate to the taxonium-wrapper directory:
```
cd taxonium-wrapper
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm start
```

Or simply use the start script:
```
./start.sh
```

The Taxonium wrapper will run on port 3002 and can be accessed by the main application through an iframe.

### Architecture

This approach solves the compatibility issues between Taxonium (which requires React 17) and the main application (which uses React 18) by:

1. Isolating Taxonium in its own React 17 environment
2. Using iframe for DOM isolation
3. Communicating between the applications through the postMessage API

This avoids conflicts between different React versions running in the same DOM.

## Scientific Visualization Components

### Taxonium Integration

BioSemanticViz now includes a robust integration with Taxonium for advanced phylogenetic tree visualization. 
This integration provides:

- Reliable iframe-based integration that avoids React version conflicts
- Full communication between components via the postMessage API
- Error handling and graceful fallbacks
- Multiple visualization modes for different use cases

The Taxonium visualization is available in the Phylogenetic Analysis section of the application.

#### Usage

The integration offers three visualization modes:
- **D3 Basic**: Simple D3-based tree visualization
- **Taxonium Iframe**: Standard iframe integration 
- **Professional**: Enhanced iframe integration with improved UI and error handling

#### Technical Details

The Taxonium integration uses a micro-frontend architecture pattern to solve React version compatibility issues:
1. A separate lightweight React application runs in an isolated iframe
2. Communication happens via the postMessage API
3. UI consistency is maintained with shared styling
4. Error boundaries prevent visualization issues from affecting the main application

## License

MIT 