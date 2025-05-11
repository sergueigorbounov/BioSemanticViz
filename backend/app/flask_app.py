from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import uuid
import json
import pandas as pd
import numpy as np
from routes.biological_data import bio_bp
from routes.dashboard_data import dashboard_bp
import argparse
import sys

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the biological routes
from api.biological_routes import router as bio_router

app = Flask(__name__)
# Configure CORS to allow requests from any origin
CORS(app, resources={r"/*": {"origins": "*"}})

# Create a temporary directory for uploads if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Register blueprints
app.register_blueprint(bio_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp)

# Create a route mapper for FastAPI routes
def fastapi_route_to_flask(fastapi_router):
    """Convert FastAPI routes to Flask routes"""
    for route in fastapi_router.routes:
        endpoint = route.endpoint
        path = route.path
        methods = route.methods

        # Convert path parameters from FastAPI format {param} to Flask format <param>
        flask_path = path
        for param in route.param_convertors:
            flask_path = flask_path.replace(f"{{{param}}}", f"<{param}>")

        # Register the route with Flask
        app.add_url_rule(
            flask_path, 
            endpoint=endpoint.__name__, 
            view_func=lambda *args, **kwargs: endpoint(*args, **kwargs), 
            methods=methods
        )

# Map FastAPI routes to Flask routes
try:
    fastapi_route_to_flask(bio_router)
except Exception as e:
    print(f"Failed to map FastAPI routes: {e}")

# Add routes without /api prefix to match incoming requests
@app.route('/status')
@app.route('/api/status')  # Keep original route for compatibility
def status():
    return jsonify({"status": "running"})

@app.route('/examples')
@app.route('/api/examples')  # Keep original route for compatibility
def examples():
    return jsonify({"examples": ["example1", "example2"]})

@app.route('/upload', methods=['POST'])
@app.route('/api/upload', methods=['POST'])  # Keep original route for compatibility
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Check file extension
    if not (file.filename.endswith('.ttl') or file.filename.endswith('.rdf') or file.filename.endswith('.owl')):
        return jsonify({"error": "Invalid file format. Please upload .ttl, .rdf, or .owl files."}), 400
    
    # Generate a unique ID for the uploaded data
    data_id = str(uuid.uuid4())
    
    # Save the file
    file_path = os.path.join(UPLOAD_FOLDER, f"{data_id}_{file.filename}")
    file.save(file_path)
    
    # Create a minimal response with dummy data
    response_data = {
        "id": data_id,
        "nodes": [
            {"id": "node1", "label": "Node 1", "type": "entity", "properties": {}},
            {"id": "node2", "label": "Node 2", "type": "entity", "properties": {}}
        ],
        "edges": [
            {"source": "node1", "target": "node2", "type": "relation", "label": "related_to"}
        ],
        "metadata": {
            "filename": file.filename,
            "filesize": os.path.getsize(file_path),
            "upload_time": str(os.path.getctime(file_path))
        },
        "statistics": {
            "node_count": 2,
            "edge_count": 1
        }
    }
    
    # Save the response data as a JSON file for future reference
    with open(os.path.join(UPLOAD_FOLDER, f"{data_id}_data.json"), 'w') as f:
        json.dump(response_data, f)
    
    return jsonify(response_data)

@app.route('/visualize', methods=['POST'])
@app.route('/api/visualize', methods=['POST'])
def visualize():
    # Extract data from the request
    data = request.json
    data_id = data.get('dataId')
    visualization_type = data.get('visualizationType', 'network')
    
    # For demo purposes, return dummy visualization data
    visualization_data = {
        "id": data_id,
        "type": visualization_type,
        "data": {
            "nodes": [
                {"id": "node1", "label": "Node 1", "type": "entity"},
                {"id": "node2", "label": "Node 2", "type": "entity"},
                {"id": "node3", "label": "Node 3", "type": "entity"}
            ],
            "edges": [
                {"source": "node1", "target": "node2", "label": "related_to"},
                {"source": "node2", "target": "node3", "label": "contains"}
            ]
        },
        "metadata": {
            "nodeCount": 3,
            "edgeCount": 2,
            "visualizationType": visualization_type
        }
    }
    
    return jsonify(visualization_data)

@app.route('/analyze', methods=['POST'])
@app.route('/api/analyze', methods=['POST'])
def analyze():
    # Extract data from the request
    data = request.json
    data_id = data.get('dataId')
    analysis_type = data.get('analysisType', 'basic')
    
    # For demo purposes, return dummy analysis data
    analysis_results = {
        "id": data_id,
        "type": analysis_type,
        "results": {
            "summary": {
                "totalEntities": 25,
                "totalRelations": 40,
                "uniqueEntityTypes": 5,
                "uniqueRelationTypes": 8
            },
            "metrics": {
                "density": 0.75,
                "centrality": {
                    "node1": 0.8,
                    "node2": 0.6,
                    "node3": 0.4
                },
                "clustering": 0.65
            },
            "patterns": [
                {"name": "Pattern 1", "frequency": 5, "significance": 0.8},
                {"name": "Pattern 2", "frequency": 3, "significance": 0.6}
            ]
        }
    }
    
    return jsonify(analysis_results)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the Flask app')
    parser.add_argument('--port', type=int, default=8001, help='Port to run the server on')
    args = parser.parse_args()
    
    # Host='0.0.0.0' makes the server accessible from any IP
    app.run(debug=True, port=args.port, host='0.0.0.0')
