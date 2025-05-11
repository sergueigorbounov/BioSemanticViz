from flask import Blueprint, jsonify
import os
import json

dashboard_bp = Blueprint('dashboard_data', __name__)

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

@dashboard_bp.route('/api/dashboard/stats')
def get_dashboard_stats():
    """
    Return analytics data for the dashboard
    """
    try:
        # Load all needed data
        species_data = load_mock_data('species.json')
        orthogroup_data = load_mock_data('orthogroups.json')
        gene_data = load_mock_data('genes.json')
        
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
        
        return jsonify({
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
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to generate dashboard stats: {str(e)}",
            "data": {}
        }), 500 