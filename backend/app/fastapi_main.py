from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

import os
import json
import uuid
from typing import Optional, List, Dict, Any

# Import models
try:
    from .models.biological_models import (
        Species, OrthoGroup, Gene, SpeciesTreeNode,
        SpeciesResponse, OrthoGroupResponse, GeneResponse, GeneDetailResponse,
        DashboardResponse, DashboardData, NameValuePair, GeneByOrthogroup
    )
    from .api.phylo import router as phylo_router
    from .api.orthologue import router as orthologue_router
except ImportError:
    # For direct module execution
    from app.models.biological_models import (
        Species, OrthoGroup, Gene, SpeciesTreeNode,
        SpeciesResponse, OrthoGroupResponse, GeneResponse, GeneDetailResponse,
        DashboardResponse, DashboardData, NameValuePair, GeneByOrthogroup
    )
    from app.api.phylo import router as phylo_router
    from app.api.orthologue import router as orthologue_router

# Create FastAPI app
app = FastAPI(
    title="BioSemanticViz API",
    description="API for biological data visualization and semantic reasoning",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to load mock data
def load_mock_data(filename: str) -> Dict[str, Any]:
    try:
        mock_data_dir = os.path.join(os.path.dirname(__file__), 'mock_data')
        file_path = os.path.join(mock_data_dir, filename)
        print(f"Loading mock data from: {file_path}")
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading mock data: {e}")
        return {}

# Create a temporary directory for uploads if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Mount static files
if os.path.exists(UPLOAD_FOLDER):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to BioSemanticViz API",
        "documentation": "/docs",
        "version": "0.1.0"
    }

# Status endpoint
@app.get("/status")
@app.get("/api/status")
async def status():
    """Check if the API is running"""
    return {"status": "running"}

# Examples endpoint
@app.get("/examples")
@app.get("/api/examples")
async def examples():
    """Get example datasets"""
    return {"examples": ["example1", "example2"]}

# Biological data endpoints
@app.get("/api/species-tree")
async def get_species_tree():
    """Get species tree for visualization"""
    try:
        data = load_mock_data("species_tree.json")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load species tree: {str(e)}")

@app.get("/api/species", response_model=SpeciesResponse)
async def get_species():
    """Get all species"""
    try:
        data = load_mock_data("species.json")
        species_list = [Species(**item) for item in data.get("species", [])]
        
        return {
            "success": True,
            "data": species_list
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load species data: {str(e)}",
            "data": []
        }

@app.get("/api/species/{species_id}", response_model=SpeciesResponse)
async def get_species_by_id(species_id: str):
    """Get species by ID"""
    try:
        data = load_mock_data("species.json")
        species_list = [Species(**item) for item in data.get("species", [])]
        
        # Filter by ID
        filtered_species = [species for species in species_list if species.id == species_id]
        
        if not filtered_species:
            return {
                "success": False,
                "message": f"Species with ID {species_id} not found",
                "data": []
            }
            
        return {
            "success": True,
            "data": filtered_species
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load species data: {str(e)}",
            "data": []
        }

@app.get("/api/species/{species_id}/orthogroups", response_model=OrthoGroupResponse)
async def get_species_orthogroups(species_id: str):
    """Get orthogroups for a specific species"""
    try:
        data = load_mock_data("orthogroups.json")
        all_orthogroups = [OrthoGroup(**item) for item in data.get("orthogroups", [])]
        
        # Filter orthogroups that contain the specified species
        filtered_orthogroups = [og for og in all_orthogroups if species_id in og.species]
        
        return {
            "success": True,
            "data": filtered_orthogroups,
            "species_id": species_id
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load orthogroup data: {str(e)}",
            "data": [],
            "species_id": species_id
        }

@app.get("/api/orthogroup/{og_id}", response_model=OrthoGroupResponse)
async def get_orthogroup_by_id(og_id: str):
    """Get orthogroup by ID"""
    try:
        data = load_mock_data("orthogroups.json")
        all_orthogroups = [OrthoGroup(**item) for item in data.get("orthogroups", [])]
        
        # Filter by ID
        filtered_orthogroups = [og for og in all_orthogroups if og.id == og_id]
        
        if not filtered_orthogroups:
            return {
                "success": False,
                "message": f"Orthogroup with ID {og_id} not found",
                "data": []
            }
            
        return {
            "success": True,
            "data": filtered_orthogroups
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load orthogroup data: {str(e)}",
            "data": []
        }

@app.get("/api/orthogroup/{og_id}/genes", response_model=GeneResponse)
async def get_orthogroup_genes(og_id: str):
    """Get genes for a specific orthogroup"""
    try:
        # First get the orthogroup to check if it exists
        orthogroup_data = load_mock_data("orthogroups.json")
        all_orthogroups = [OrthoGroup(**item) for item in orthogroup_data.get("orthogroups", [])]
        
        # Find the specified orthogroup
        orthogroup = next((og for og in all_orthogroups if og.id == og_id), None)
        
        if not orthogroup:
            return {
                "success": False,
                "message": f"Orthogroup with ID {og_id} not found",
                "data": [],
                "orthogroup_id": og_id
            }
        
        # Now get all genes
        gene_data = load_mock_data("genes.json")
        all_genes = [Gene(**item) for item in gene_data.get("genes", [])]
        
        # Filter genes that belong to the specified orthogroup
        filtered_genes = [gene for gene in all_genes if gene.orthogroup_id == og_id]
        
        return {
            "success": True,
            "data": filtered_genes,
            "orthogroup_id": og_id
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load gene data: {str(e)}",
            "data": [],
            "orthogroup_id": og_id
        }

@app.get("/api/gene/{gene_id}", response_model=GeneDetailResponse)
async def get_gene_by_id(gene_id: str):
    """Get gene details by ID"""
    try:
        gene_data = load_mock_data("genes.json")
        all_genes = [Gene(**item) for item in gene_data.get("genes", [])]
        
        # Find the gene with the specified ID
        gene = next((g for g in all_genes if g.id == gene_id), None)
        
        if not gene:
            return {
                "success": False,
                "message": f"Gene with ID {gene_id} not found",
                "data": None
            }
        
        return {
            "success": True,
            "data": gene
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load gene data: {str(e)}",
            "data": None
        }

@app.get("/api/gene/{gene_id}/go_terms")
async def get_gene_go_terms(gene_id: str):
    """Get GO terms for a specific gene"""
    try:
        gene_data = load_mock_data("genes.json")
        all_genes = [Gene(**item) for item in gene_data.get("genes", [])]
        
        # Find the gene with the specified ID
        gene = next((g for g in all_genes if g.id == gene_id), None)
        
        if not gene or not gene.go_terms:
            return {
                "success": False,
                "message": f"GO terms for gene {gene_id} not found",
                "terms": []
            }
        
        return {
            "success": True,
            "terms": gene.go_terms,
            "gene_id": gene_id
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load GO term data: {str(e)}",
            "terms": [],
            "gene_id": gene_id
        }

@app.get("/api/dashboard/stats", response_model=DashboardResponse)
async def get_dashboard_stats():
    """
    Return analytics data for the dashboard
    """
    try:
        # Load all needed data
        species_data = load_mock_data("species.json")
        orthogroup_data = load_mock_data("orthogroups.json")
        gene_data = load_mock_data("genes.json")
        
        species_list = species_data.get("species", [])
        orthogroups_list = orthogroup_data.get("orthogroups", [])
        genes_list = gene_data.get("genes", [])
        
        # Calculate stats
        species_count = len(species_list)
        orthogroup_count = len(orthogroups_list)
        gene_count = len(genes_list)
        
        # Calculate species with most genes
        species_gene_counts = {}
        species_names = {s.get("id"): s.get("name", s.get("id")) for s in species_list}
        
        for gene in genes_list:
            species_id = gene.get("species_id")
            if species_id:
                if species_id not in species_gene_counts:
                    species_gene_counts[species_id] = 0
                species_gene_counts[species_id] += 1
        
        species_distribution = [
            {"name": species_names.get(sp_id, sp_id), "value": count}
            for sp_id, count in sorted(species_gene_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        
        # Calculate genes by orthogroup
        orthogroup_gene_counts = {}
        orthogroup_names = {og.get("id"): og.get("name", og.get("id")) for og in orthogroups_list}
        
        for gene in genes_list:
            for og_id in gene.get("orthogroups", []):
                if og_id not in orthogroup_gene_counts:
                    orthogroup_gene_counts[og_id] = 0
                orthogroup_gene_counts[og_id] += 1
        
        genes_by_orthogroup = [
            {"name": orthogroup_names.get(og_id, og_id), "genes": count}
            for og_id, count in sorted(orthogroup_gene_counts.items(), key=lambda x: x[1], reverse=True)[:8]
        ]
        
        # Calculate orthogroup connectivity (how many species an orthogroup spans)
        orthogroup_species = {}
        for gene in genes_list:
            species_id = gene.get("species_id")
            if species_id:
                for og_id in gene.get("orthogroups", []):
                    if og_id not in orthogroup_species:
                        orthogroup_species[og_id] = set()
                    orthogroup_species[og_id].add(species_id)
        
        orthogroup_connectivity = [
            {"name": orthogroup_names.get(og_id, og_id), "value": len(species)}
            for og_id, species in sorted(orthogroup_species.items(), key=lambda x: len(x[1]), reverse=True)[:5]
        ]
        
        # Count GO terms by category
        go_term_counts = {"Molecular Function": 0, "Biological Process": 0, "Cellular Component": 0}
        for gene in genes_list:
            for go_term in gene.get("go_terms", []):
                category = go_term.get("category")
                if category in go_term_counts:
                    go_term_counts[category] += 1
        
        return {
            "success": True,
            "data": {
                "speciesCount": species_count,
                "orthogroupCount": orthogroup_count,
                "geneCount": gene_count,
                "annotationCount": sum(go_term_counts.values()),
                "speciesDistribution": species_distribution,
                "genesByOrthogroup": genes_by_orthogroup,
                "orthogroupConnectivity": orthogroup_connectivity,
                "taxonomyDistribution": [
                    {"name": "Plant", "value": 35},
                    {"name": "Fungi", "value": 25},
                    {"name": "Bacteria", "value": 20},
                    {"name": "Animal", "value": 15},
                    {"name": "Other", "value": 5}
                ],
                "goTermDistribution": go_term_counts
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to generate dashboard stats: {str(e)}",
            "data": {}
        }

@app.get("/api/orthogroups", response_model=OrthoGroupResponse)
async def get_orthogroups():
    """Get all orthogroups"""
    try:
        data = load_mock_data("orthogroups.json")
        orthogroup_list = [OrthoGroup(**item) for item in data.get("orthogroups", [])]
        
        return {
            "success": True,
            "data": orthogroup_list
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load orthogroup data: {str(e)}",
            "data": []
        }

@app.get("/api/genes", response_model=GeneResponse)
async def get_genes():
    """Get all genes"""
    try:
        data = load_mock_data("genes.json")
        gene_list = [Gene(**item) for item in data.get("genes", [])]
        
        return {
            "success": True,
            "data": gene_list
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load gene data: {str(e)}",
            "data": []
        }

# File upload endpoint
@app.post("/upload")
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a biological data file"""
    if not file:
        return JSONResponse(content={"error": "No file part"}, status_code=400)
    
    if file.filename == '':
        return JSONResponse(content={"error": "No selected file"}, status_code=400)
    
    # Check file extension
    if not (file.filename.endswith('.ttl') or file.filename.endswith('.rdf') or file.filename.endswith('.owl')):
        return JSONResponse(content={"error": "Invalid file format. Please upload .ttl, .rdf, or .owl files."}, status_code=400)
    
    # Generate a unique ID for the uploaded data
    data_id = str(uuid.uuid4())
    
    # Save the file
    file_path = os.path.join(UPLOAD_FOLDER, f"{data_id}_{file.filename}")
    with open(file_path, "wb") as f:
        contents = await file.read()
        f.write(contents)
    
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
    
    return response_data

# Visualization endpoint
@app.post("/visualize")
@app.post("/api/visualize")
async def visualize(data: Dict[str, Any]):
    """Create a visualization for the uploaded data"""
    # Extract data from the request
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
    
    return visualization_data

# Analysis endpoint
@app.post("/analyze")
@app.post("/api/analyze")
async def analyze(data: Dict[str, Any]):
    """Analyze the uploaded data"""
    # Extract data from the request
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
    
    return analysis_results

# Include routers
app.include_router(phylo_router)
app.include_router(orthologue_router)

# Run the app with uvicorn if this file is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 