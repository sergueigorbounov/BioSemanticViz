from flask import Blueprint, jsonify, request
import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Union, Any

bio_bp = Blueprint('biological_data', __name__)

# Helper function to load mock data
def load_mock_data(filename):
    """Load mock data from JSON file"""
    try:
        mock_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'mock_data')
        file_path = os.path.join(mock_data_dir, filename)
        with open(file_path, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading mock data {filename}: {e}")
        return {}

@bio_bp.route('/species-tree')
def get_species_tree():
    """Get species tree for visualization"""
    try:
        data = load_mock_data('species_tree.json')
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Failed to load species tree: {str(e)}"}), 500

@bio_bp.route('/species')
def get_species():
    """Get all species"""
    try:
        data = load_mock_data('species.json')
        return jsonify({"success": True, "data": data.get("species", [])})
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to load species data: {str(e)}", "data": []}), 500

@bio_bp.route('/species/<string:species_id>')
def get_species_by_id(species_id):
    """Get species by ID"""
    try:
        data = load_mock_data('species.json')
        species_list = data.get("species", [])
        
        # Filter by ID
        filtered_species = [species for species in species_list if species.get("id") == species_id]
        
        if not filtered_species:
            return jsonify({"success": False, "message": f"Species with ID {species_id} not found", "data": []}), 404
            
        return jsonify({"success": True, "data": filtered_species})
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to load species data: {str(e)}", "data": []}), 500

@bio_bp.route('/species/<string:species_id>/orthogroups')
def get_species_orthogroups(species_id):
    """Get orthogroups for a specific species"""
    try:
        data = load_mock_data('orthogroups.json')
        all_orthogroups = data.get("orthogroups", [])
        
        # Filter orthogroups that contain the specified species
        filtered_orthogroups = [og for og in all_orthogroups if species_id in og.get("species", [])]
        
        return jsonify({
            "success": True,
            "data": filtered_orthogroups,
            "species_id": species_id
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to load orthogroup data: {str(e)}",
            "data": [],
            "species_id": species_id
        }), 500

@bio_bp.route('/orthogroup/<string:og_id>')
def get_orthogroup_by_id(og_id):
    """Get orthogroup by ID"""
    try:
        data = load_mock_data('orthogroups.json')
        all_orthogroups = data.get("orthogroups", [])
        
        # Filter by ID
        filtered_orthogroups = [og for og in all_orthogroups if og.get("id") == og_id]
        
        if not filtered_orthogroups:
            return jsonify({"success": False, "message": f"Orthogroup with ID {og_id} not found", "data": []}), 404
            
        return jsonify({"success": True, "data": filtered_orthogroups})
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to load orthogroup data: {str(e)}", "data": []}), 500

@bio_bp.route('/orthogroup/<string:og_id>/genes')
def get_orthogroup_genes(og_id):
    """Get genes for a specific orthogroup"""
    try:
        # First get the orthogroup to check if it exists
        orthogroup_data = load_mock_data('orthogroups.json')
        all_orthogroups = orthogroup_data.get("orthogroups", [])
        
        # Find the specified orthogroup
        orthogroup = next((og for og in all_orthogroups if og.get("id") == og_id), None)
        
        if not orthogroup:
            return jsonify({
                "success": False,
                "message": f"Orthogroup with ID {og_id} not found",
                "data": [],
                "orthogroup_id": og_id
            }), 404
        
        # Now get all genes
        gene_data = load_mock_data('genes.json')
        all_genes = gene_data.get("genes", [])
        
        # Filter genes that belong to the specified orthogroup
        filtered_genes = [gene for gene in all_genes if gene.get("orthogroup_id") == og_id]
        
        return jsonify({
            "success": True,
            "data": filtered_genes,
            "orthogroup_id": og_id
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to load gene data: {str(e)}",
            "data": [],
            "orthogroup_id": og_id
        }), 500

@bio_bp.route('/gene/<string:gene_id>')
def get_gene_by_id(gene_id):
    """Get gene details by ID"""
    try:
        gene_data = load_mock_data('genes.json')
        all_genes = gene_data.get("genes", [])
        
        # Find the gene with the specified ID
        gene = next((g for g in all_genes if g.get("id") == gene_id), None)
        
        if not gene:
            return jsonify({
                "success": False,
                "message": f"Gene with ID {gene_id} not found",
                "data": None
            }), 404
        
        return jsonify({
            "success": True,
            "data": gene
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to load gene data: {str(e)}",
            "data": None
        }), 500

@bio_bp.route('/gene/<string:gene_id>/go_terms')
def get_gene_go_terms(gene_id):
    """Get GO terms for a specific gene"""
    try:
        gene_data = load_mock_data('genes.json')
        all_genes = gene_data.get("genes", [])
        
        # Find the gene with the specified ID
        gene = next((g for g in all_genes if g.get("id") == gene_id), None)
        
        if not gene or not gene.get("go_terms"):
            return jsonify({
                "success": False,
                "message": f"GO terms for gene {gene_id} not found",
                "terms": []
            }), 404
        
        return jsonify({
            "success": True,
            "terms": gene.get("go_terms", []),
            "gene_id": gene_id
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to load GO term data: {str(e)}",
            "terms": [],
            "gene_id": gene_id
        }), 500

router = APIRouter()

# Load mock data
try:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    mock_dir = os.path.join(base_dir, "mock_data")
    
    with open(os.path.join(mock_dir, "species_tree.json"), "r") as f:
        species_data = json.load(f)
    
    with open(os.path.join(mock_dir, "orthogroups.json"), "r") as f:
        orthogroup_data = json.load(f)
    
    with open(os.path.join(mock_dir, "genes.json"), "r") as f:
        gene_data = json.load(f)
    
except Exception as e:
    print(f"Error loading mock data: {e}")
    species_data = {"data": []}
    orthogroup_data = {"data": []}
    gene_data = {"data": []}

@router.get("/api/species")
def get_species():
    return species_data

@router.get("/api/species/{species_id}")
def get_species_by_id(species_id: str):
    for species in species_data.get("data", []):
        if species.get("id") == species_id:
            return {"data": species}
    raise HTTPException(status_code=404, detail="Species not found")

@router.get("/api/orthogroups")
def get_orthogroups():
    return orthogroup_data

@router.get("/api/orthogroups/{orthogroup_id}")
def get_orthogroup_by_id(orthogroup_id: str):
    for og in orthogroup_data.get("data", []):
        if og.get("id") == orthogroup_id:
            return {"data": og}
    raise HTTPException(status_code=404, detail="Orthogroup not found")

@router.get("/api/genes")
def get_genes():
    return gene_data

@router.get("/api/genes/{gene_id}")
def get_gene_by_id(gene_id: str):
    for gene in gene_data.get("data", []):
        if gene.get("id") == gene_id:
            return {"data": gene}
    raise HTTPException(status_code=404, detail="Gene not found")

@router.get("/api/dashboard/stats")
def get_dashboard_stats():
    """
    Return analytics data for the dashboard
    """
    species_list = species_data.get("data", [])
    orthogroups_list = orthogroup_data.get("data", [])
    genes_list = gene_data.get("data", [])
    
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