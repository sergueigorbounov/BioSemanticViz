from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
import uuid
import os

from ..services.data_ingestion import DataIngestionService
from ..services.semantic_reasoning import SemanticReasoningService
from ..services.visualization import VisualizationService
from ..models.schemas import ProcessedDataResponse, AnalysisRequest, VisualizationRequest
from .biological_routes import router as biological_router
from .phylo import router as phylo_router
from .orthologue import router as orthologue_router

router = APIRouter()

# Include the other routers
router.include_router(biological_router)
router.include_router(phylo_router)
router.include_router(orthologue_router)

@router.post("/upload", response_model=ProcessedDataResponse)
async def upload_data(
    file: UploadFile = File(...),
    data_service: DataIngestionService = Depends()
):
    """Upload and process biological data file"""
    try:
        # Check if file is provided
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file extension
        if not (file.filename.endswith('.ttl') or file.filename.endswith('.rdf') or file.filename.endswith('.owl')):
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {file.filename}. Please upload .ttl, .rdf, or .owl files."
            )
        
        # Handle processing
        try:
            result = await data_service.process_file(file)
            return result
        except Exception as e:
            # If the data_ingestion service fails, return a simplified response
            # This is a fallback in case there are issues with the service
            dataset_id = str(uuid.uuid4())
            return {
                "id": dataset_id,
                "nodes": [],
                "edges": [],
                "metadata": {"filename": file.filename, "error": str(e)},
                "statistics": {"error": "Processing failed, returning empty dataset"}
            }
            
    except HTTPException as he:
        raise he  # Re-raise HTTP exceptions
    except Exception as e:
        # Catch any other exceptions
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/analyze", response_model=dict)
async def analyze_data(
    request: AnalysisRequest,
    reasoning_service: SemanticReasoningService = Depends()
):
    """Analyze biological data using semantic reasoning"""
    try:
        result = reasoning_service.analyze(request.data, request.parameters)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Analysis error: {str(e)}")

@router.post("/visualize", response_model=dict)
async def visualize_data(
    request: VisualizationRequest,
    viz_service: VisualizationService = Depends()
):
    """Generate visualization for biological data"""
    try:
        result = viz_service.generate_visualization(request.data, request.viz_type, request.parameters)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Visualization error: {str(e)}")

@router.get("/examples", response_model=List[str])
async def get_example_datasets():
    """Get list of available example datasets"""
    try:
        # Check for actual example files in the examples directory
        example_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "examples")
        if os.path.exists(example_dir):
            examples = [f for f in os.listdir(example_dir) 
                      if f.endswith('.ttl') or f.endswith('.rdf') or f.endswith('.owl')]
            return examples
        
        # Fallback to hardcoded examples
        examples = ["human_go_annotations.ttl", "gene_ontology_subset.ttl", "protein_interactions.ttl"]
        return examples
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving examples: {str(e)}") 