from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import uuid
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create a temporary directory for uploads if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/status')
def status():
    return jsonify({"status": "running"})

@app.route('/api/examples')
def examples():
    return jsonify({"examples": ["example1", "example2"]})

@app.route('/api/upload', methods=['POST'])
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

if __name__ == '__main__':
    app.run(debug=True, port=8001) 