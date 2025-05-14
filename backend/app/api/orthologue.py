from fastapi import APIRouter, HTTPException, Path, Query
from typing import List, Dict, Any, Optional
import os
import pandas as pd
import logging
from collections import defaultdict
from ..models.phylo import OrthologueSearchRequest, OrthologueSearchResponse, OrthologueData, OrthoSpeciesCount
from ete3 import Tree

# Create router
router = APIRouter(
    prefix="/api/orthologue",
    tags=["orthologue"],
    responses={404: {"description": "Not found"}},
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.environ.get("ORTHOFINDER_DATA_DIR", os.path.join(BASE_DIR, "data/orthofinder"))
TREE_FILE = os.path.join(DATA_DIR, "SpeciesTree_nameSp_completeGenome110124.tree")
ORTHOGROUPS_FILE = os.path.join(DATA_DIR, "Orthogroups_clean_121124.txt")
SPECIES_MAPPING_FILE = os.path.join(DATA_DIR, "Table_S1_Metadata_angiosperm_species.csv")

# Cache for the data to avoid reloading
_orthogroups_data = None
_species_mapping = None
_species_tree = None

def load_orthogroups_data():
    """Load orthogroups data from CSV file"""
    global _orthogroups_data
    if _orthogroups_data is None:
        try:
            logger.info(f"Loading orthogroups data from {ORTHOGROUPS_FILE}")
            _orthogroups_data = pd.read_csv(ORTHOGROUPS_FILE, sep='\t')
            logger.info(f"Loaded orthogroups data with shape: {_orthogroups_data.shape}")
        except Exception as e:
            logger.error(f"Failed to load orthogroups data: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to load orthogroups data: {str(e)}")
    return _orthogroups_data

def load_species_mapping():
    """Load species mapping data from CSV file"""
    global _species_mapping
    if _species_mapping is None:
        try:
            logger.info(f"Loading species mapping from {SPECIES_MAPPING_FILE}")
            
            # Try to read the file as plain text first
            with open(SPECIES_MAPPING_FILE, 'r') as f:
                lines = f.readlines()
                
            logger.info(f"Read {len(lines)} lines from species mapping file")
            
            # Create a basic mapping structure - we'll skip header lines
            species_data = []
            for line in lines:
                # Skip empty lines and header lines
                if not line.strip() or line.startswith('Table') or ':' in line[:15]:
                    continue
                    
                # Try to split the line by common delimiters
                parts = None
                for delimiter in ['\t', ',', ';', '|']:
                    if delimiter in line:
                        parts = line.strip().split(delimiter)
                        if len(parts) >= 2:
                            break
                
                # If no delimiter worked, try splitting by multiple spaces
                if not parts or len(parts) < 2:
                    parts = [p for p in line.strip().split() if p]
                
                if parts and len(parts) >= 2:
                    # Use first part as abbreviation/id and second as name
                    species_data.append({
                        'species_abbreviation': parts[0].strip(),
                        'species_name': parts[1].strip(),
                        'species_id': parts[0].strip()
                    })
            
            # Create a DataFrame from our parsed data
            mapping_df = pd.DataFrame(species_data)
            
            # Log what we found
            logger.info(f"Parsed {len(species_data)} species entries")
            if len(species_data) > 0:
                logger.info(f"First entry: {species_data[0]}")
            
            # Use standard column names
            species_abbr_col = 'species_abbreviation'
            species_name_col = 'species_name'
            species_id_col = 'species_id'
            
            # Create mapping dictionaries
            _species_mapping = {
                'newick_to_full': dict(zip(mapping_df[species_abbr_col], mapping_df[species_name_col])),
                'full_to_newick': dict(zip(mapping_df[species_name_col], mapping_df[species_abbr_col])),
                'id_to_full': dict(zip(mapping_df[species_id_col], mapping_df[species_name_col])),
                'full_to_id': dict(zip(mapping_df[species_name_col], mapping_df[species_id_col]))
            }
            
            logger.info(f"Loaded species mapping with {len(_species_mapping['newick_to_full'])} entries")
            
            # If we couldn't extract any mappings, create a minimal fallback
            if len(_species_mapping['newick_to_full']) == 0:
                logger.warning("No species mappings found, creating minimal fallback")
                # Create a dummy mapping that just uses the same value for abbreviation and name
                # This will at least allow the code to continue running
                _species_mapping = {
                    'newick_to_full': {'dummy': 'dummy'},
                    'full_to_newick': {'dummy': 'dummy'},
                    'id_to_full': {'dummy': 'dummy'},
                    'full_to_id': {'dummy': 'dummy'}
                }
                
        except Exception as e:
            logger.error(f"Failed to load species mapping: {str(e)}")
            # Create a minimal fallback mapping
            _species_mapping = {
                'newick_to_full': {'dummy': 'dummy'},
                'full_to_newick': {'dummy': 'dummy'},
                'id_to_full': {'dummy': 'dummy'},
                'full_to_id': {'dummy': 'dummy'}
            }
    return _species_mapping

def load_species_tree():
    """Load species tree from Newick file"""
    global _species_tree
    if _species_tree is None:
        try:
            logger.info(f"Loading species tree from {TREE_FILE}")
            with open(TREE_FILE, 'r') as f:
                _species_tree = f.read().strip()
            logger.info(f"Loaded species tree with length: {len(_species_tree)}")
        except Exception as e:
            logger.error(f"Failed to load species tree: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to load species tree: {str(e)}")
    return _species_tree

def find_gene_orthogroup(gene_id: str) -> Optional[str]:
    """Find the orthogroup ID for a given gene ID"""
    df = load_orthogroups_data()
    
    # Search for the gene ID in all columns
    for col in df.columns:
        # Skip the orthogroup ID column (assuming it's the first column)
        if col == df.columns[0]:
            continue
            
        # Check if gene ID is in this column (species)
        # Each cell might contain multiple genes separated by comma
        mask = df[col].apply(lambda x: isinstance(x, str) and gene_id in x.split(','))
        if mask.any():
            # Return the orthogroup ID for the matching row
            return df.loc[mask, df.columns[0]].iloc[0]
    
    return None

def get_orthogroup_genes(orthogroup_id: str) -> Dict[str, List[str]]:
    """Get all genes in an orthogroup, organized by species"""
    df = load_orthogroups_data()
    
    # Find the row with this orthogroup ID
    orthogroup_row = df[df[df.columns[0]] == orthogroup_id]
    
    if orthogroup_row.empty:
        return {}
    
    # Extract genes by species
    genes_by_species = {}
    for col in df.columns[1:]:  # Skip the orthogroup ID column
        cell_value = orthogroup_row[col].iloc[0]
        if isinstance(cell_value, str) and cell_value.strip():
            genes = [gene.strip() for gene in cell_value.split(',')]
            genes_by_species[col] = genes
    
    return genes_by_species

@router.post("/search", response_model=OrthologueSearchResponse)
async def search_orthologues(request: OrthologueSearchRequest):
    """Search for orthologues of a given gene ID"""
    gene_id = request.gene_id.strip()
    
    # Find which orthogroup the gene belongs to
    orthogroup_id = find_gene_orthogroup(gene_id)
    
    if not orthogroup_id:
        return OrthologueSearchResponse(
            success=False,
            gene_id=gene_id,
            message=f"Gene {gene_id} not found in any orthogroup"
        )
    
    # Get all genes in the orthogroup
    genes_by_species = get_orthogroup_genes(orthogroup_id)
    
    # Load species mapping for name conversion
    species_mapping = load_species_mapping()
    
    # Prepare response
    orthologues = []
    counts_by_species = []
    
    for species, genes in genes_by_species.items():
        # Map species column name to full name and ID
        species_full_name = species
        species_id = species_mapping.get('full_to_id', {}).get(species_full_name, species)
        
        # Count genes for this species
        gene_count = len(genes)
        counts_by_species.append(
            OrthoSpeciesCount(
                species_id=species_id,
                species_name=species_full_name,
                count=gene_count
            )
        )
        
        # Add individual orthologues
        for gene in genes:
            orthologues.append(
                OrthologueData(
                    gene_id=gene,
                    species_id=species_id,
                    species_name=species_full_name,
                    orthogroup_id=orthogroup_id
                )
            )
    
    # Get the species tree
    species_tree = load_species_tree()
    
    return OrthologueSearchResponse(
        success=True,
        gene_id=gene_id,
        orthogroup_id=orthogroup_id,
        orthologues=orthologues,
        counts_by_species=counts_by_species,
        newick_tree=species_tree
    )

@router.get("/tree", response_model=Dict[str, Any])
async def get_orthologue_tree():
    """Get the species phylogenetic tree in Newick format"""
    try:
        species_tree = load_species_tree()
        return {
            "success": True,
            "newick": species_tree
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to load species tree: {str(e)}"
        }

@router.post("/search_taxonium", response_model=Dict[str, Any])
async def search_orthologues_taxonium(request: OrthologueSearchRequest):
    """Search for orthologues with Taxonium-compatible tree format"""
    # First get regular orthologue search results
    standard_response = await search_orthologues(request)
    
    if not standard_response.success:
        return {
            "success": False,
            "message": standard_response.message
        }
    
    try:
        # Parse the tree using ETE3
        tree_string = standard_response.newick_tree
        tree = Tree(tree_string, format=1)
        
        # Convert to Taxonium format
        taxonium_data = {
            "nodes": [],
            "metadata": {
                "colorings": [
                    {
                        "name": "orthologueCount",
                        "type": "continuous"
                    }
                ]
            }
        }
        
        # Create a map of species names to orthologue counts
        species_counts = {item.species_name: item.count for item in standard_response.counts_by_species}
        
        # Add node data in Taxonium format
        node_id = 0
        node_map = {}  # Map to keep track of node ids
        
        # Traverse the tree and build the nodes
        for node in tree.traverse("preorder"):
            # Create current node
            current_id = node_id
            node_id += 1
            node_map[node] = current_id
            
            # Get parent id if it exists
            parent_id = None
            if node.up and node.up in node_map:
                parent_id = node_map[node.up]
            
            # Get orthologue count if this is a leaf node with a species name
            orthologue_count = 0
            if node.is_leaf():
                # Try to map the node name to a full species name if needed
                species_mapping = load_species_mapping()
                node_name = node.name
                
                # Try different ways to match the node name to a species
                if node_name in species_counts:
                    orthologue_count = species_counts[node_name]
                elif node_name in species_mapping['newick_to_full']:
                    full_name = species_mapping['newick_to_full'][node_name]
                    if full_name in species_counts:
                        orthologue_count = species_counts[full_name]
            
            # Add node to Taxonium data
            taxonium_data["nodes"].append({
                "id": current_id,
                "parentId": parent_id,
                "name": node.name or "",
                "branch_length": node.dist,
                "orthologueCount": orthologue_count,
                "metadata": {
                    "support": getattr(node, "support", None),
                    "orthologueCount": orthologue_count
                }
            })
        
        # Merge with original orthologue data
        result = {
            "success": True,
            "gene_id": standard_response.gene_id,
            "orthogroup_id": standard_response.orthogroup_id,
            "orthologues": [ortho.dict() for ortho in standard_response.orthologues],
            "counts_by_species": [count.dict() for count in standard_response.counts_by_species],
            "newick_tree": tree_string,
            "taxonium_tree": taxonium_data
        }
        
        return result
    except Exception as e:
        logger.error(f"Error creating Taxonium format: {str(e)}")
        return {
            "success": False,
            "message": f"Error creating Taxonium format: {str(e)}",
            "regular_response": standard_response.dict()
        } 