from flask import Blueprint, jsonify, request
import os
import json

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