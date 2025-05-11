from fastapi import APIRouter, HTTPException, Path
from typing import List, Dict, Any
import os
import json

from models.biological_models import (
    Species, OrthoGroup, Gene, 
    SpeciesResponse, OrthoGroupResponse, GeneResponse, GeneDetailResponse
)

# Create router
router = APIRouter(
    prefix="/api",
    tags=["biology"],
    responses={404: {"description": "Not found"}},
)

# Mock data path - in a real application this would come from a database
MOCK_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_data")

# Helper function to load mock data
def load_mock_data(filename: str) -> Dict[str, Any]:
    try:
        file_path = os.path.join(MOCK_DATA_DIR, filename)
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading mock data: {e}")
        return {}

# Routes
@router.get("/species", response_model=SpeciesResponse)
async def get_species():
    """Get all species"""
    try:
        # Load mock data
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

@router.get("/species-tree")
async def get_species_tree():
    """Get species tree for visualization"""
    try:
        data = load_mock_data("species_tree.json")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load species tree: {str(e)}")

@router.get("/species/{species_id}", response_model=SpeciesResponse)
async def get_species_by_id(species_id: str = Path(..., title="Species ID")):
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

@router.get("/species/{species_id}/orthogroups", response_model=OrthoGroupResponse)
async def get_species_orthogroups(species_id: str = Path(..., title="Species ID")):
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

@router.get("/orthogroup/{og_id}", response_model=OrthoGroupResponse)
async def get_orthogroup_by_id(og_id: str = Path(..., title="Orthogroup ID")):
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

@router.get("/orthogroup/{og_id}/genes", response_model=GeneResponse)
async def get_orthogroup_genes(og_id: str = Path(..., title="Orthogroup ID")):
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

@router.get("/gene/{gene_id}", response_model=GeneDetailResponse)
async def get_gene_by_id(gene_id: str = Path(..., title="Gene ID")):
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

@router.get("/gene/{gene_id}/go_terms")
async def get_gene_go_terms(gene_id: str = Path(..., title="Gene ID")):
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