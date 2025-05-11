from flask import Blueprint, jsonify
import json
import os
from pathlib import Path

# Create a blueprint for biological data routes
bio_bp = Blueprint('bio', __name__)

# Helper function to get mock data path
def get_mock_data_path():
    # Get the directory of the current file
    current_dir = Path(__file__).parent
    # Navigate to the mock_data directory
    mock_data_dir = current_dir.parent / 'mock_data'
    # Create directory if it doesn't exist
    os.makedirs(mock_data_dir, exist_ok=True)
    return mock_data_dir

# Helper to load or create mock data
def load_or_create_mock_data(filename, default_data):
    file_path = get_mock_data_path() / filename
    
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                pass
    
    # File doesn't exist or is invalid, create it with default data
    with open(file_path, 'w') as f:
        json.dump(default_data, f, indent=2)
    
    return default_data

# Mock data for species tree
default_species_tree = {
    "species": [
        {
            "id": "root",
            "name": "Eukaryota",
            "children": [
                {
                    "id": "plants",
                    "name": "Plantae",
                    "children": [
                        {
                            "id": "arabidopsis",
                            "name": "Arabidopsis thaliana",
                            "orthogroups": ["OG0001", "OG0002"]
                        },
                        {
                            "id": "rice",
                            "name": "Oryza sativa",
                            "orthogroups": ["OG0001", "OG0003"]
                        }
                    ]
                },
                {
                    "id": "animals",
                    "name": "Metazoa",
                    "children": [
                        {
                            "id": "human",
                            "name": "Homo sapiens",
                            "orthogroups": ["OG0002", "OG0004"]
                        },
                        {
                            "id": "mouse",
                            "name": "Mus musculus",
                            "orthogroups": ["OG0002", "OG0004"]
                        }
                    ]
                }
            ]
        }
    ],
    "orthogroups": {
        "OG0001": ["plant_gene1", "plant_gene2", "rice_gene1"],
        "OG0002": ["plant_gene3", "human_gene1", "mouse_gene1"],
        "OG0003": ["rice_gene2", "rice_gene3"],
        "OG0004": ["human_gene2", "mouse_gene2", "human_gene3"]
    }
}

# Mock data for genes
default_genes = {
    "plant_gene1": {
        "id": "plant_gene1",
        "name": "AtPHT1",
        "species": "Arabidopsis thaliana",
        "orthogroup": "OG0001",
        "function": "Phosphate transporter",
        "sequenceLength": 500,
        "proteinDomains": [
            {
                "name": "PHT1",
                "start": 50,
                "end": 200,
                "function": "Phosphate transport"
            },
            {
                "name": "MFS",
                "start": 210,
                "end": 450,
                "function": "Membrane transport"
            }
        ],
        "expressionData": {
            "Leaf": 100,
            "Root": 250,
            "Stem": 50,
            "Flower": 25,
            "Seed": 10
        }
    },
    "human_gene1": {
        "id": "human_gene1",
        "name": "BRCA1",
        "species": "Homo sapiens",
        "orthogroup": "OG0002",
        "function": "DNA repair and tumor suppression",
        "sequenceLength": 1863,
        "proteinDomains": [
            {
                "name": "RING",
                "start": 8,
                "end": 96,
                "function": "E3 ubiquitin-protein ligase activity"
            },
            {
                "name": "BRCT",
                "start": 1642,
                "end": 1736,
                "function": "Phosphopeptide binding"
            },
            {
                "name": "BRCT",
                "start": 1756,
                "end": 1855,
                "function": "Phosphopeptide binding"
            }
        ],
        "expressionData": {
            "Breast": 150,
            "Ovary": 120,
            "Brain": 20,
            "Liver": 15,
            "Blood": 40
        }
    }
}

# Routes
@bio_bp.route('/species-tree')
def get_species_tree():
    # Return a simple tree structure for demonstration
    tree_data = {
        "id": "root",
        "name": "Biological Hierarchy",
        "type": "species",
        "children": [
            {
                "id": "mammals",
                "name": "Mammals",
                "type": "species",
                "children": [
                    {
                        "id": "human",
                        "name": "Homo sapiens",
                        "type": "species"
                    },
                    {
                        "id": "mouse",
                        "name": "Mus musculus",
                        "type": "species"
                    },
                    {
                        "id": "orthogroup_1",
                        "name": "Orthogroup OG0001",
                        "type": "orthogroup"
                    }
                ]
            },
            {
                "id": "plants",
                "name": "Plants",
                "type": "species",
                "children": [
                    {
                        "id": "arabidopsis",
                        "name": "Arabidopsis thaliana",
                        "type": "species"
                    },
                    {
                        "id": "rice",
                        "name": "Oryza sativa",
                        "type": "species"
                    },
                    {
                        "id": "orthogroup_2",
                        "name": "Orthogroup OG0002",
                        "type": "orthogroup"
                    }
                ]
            }
        ]
    }
    
    return jsonify(tree_data)

@bio_bp.route('/gene/<gene_id>')
def get_gene_details(gene_id):
    # Return dummy gene data for demonstration
    gene_data = {
        "id": gene_id,
        "name": f"Gene {gene_id}",
        "symbol": f"G{gene_id}",
        "species": "Homo sapiens",
        "description": "This is a sample gene description.",
        "sequence": "ATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC",
        "functions": [
            "DNA binding",
            "Transcription regulation",
            "Signal transduction"
        ],
        "goTerms": [
            {
                "id": "GO:0003677",
                "name": "DNA binding",
                "category": "molecular_function"
            },
            {
                "id": "GO:0006355",
                "name": "regulation of transcription",
                "category": "biological_process"
            }
        ],
        "orthogroups": [
            {
                "id": "OG0001",
                "species_count": 5,
                "gene_count": 12
            }
        ]
    }
    
    return jsonify(gene_data)

@bio_bp.route('/orthogroup/<orthogroup_id>')
def get_orthogroup_genes(orthogroup_id):
    # Return dummy orthogroup data for demonstration
    genes = [
        {
            "id": f"{orthogroup_id}_gene1",
            "name": f"Gene 1 in {orthogroup_id}",
            "symbol": "G1",
            "species": "Homo sapiens"
        },
        {
            "id": f"{orthogroup_id}_gene2",
            "name": f"Gene 2 in {orthogroup_id}",
            "symbol": "G2",
            "species": "Mus musculus"
        }
    ]
    
    return jsonify(genes) 