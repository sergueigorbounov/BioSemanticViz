from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union, Set
from ete3 import Tree
import json

class NodeMutation(BaseModel):
    """Mutation data for a node"""
    position: int
    ref: str
    alt: str
    gene: Optional[str] = None
    product: Optional[str] = None
    effect: Optional[str] = None

class PhyloNodeData(BaseModel):
    """Base model for phylogenetic node data"""
    id: str
    name: str
    branch_length: Optional[float] = None
    support: Optional[float] = None
    children: Optional[List['PhyloNodeData']] = None
    mutations: Optional[List[NodeMutation]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

# Handle recursive type definition in Pydantic v2
PhyloNodeData.update_forward_refs()

class TreeData(BaseModel):
    """Model for tree data"""
    newick: str
    outgroup: Optional[str] = None

def newick_to_dict(newick_str: str) -> PhyloNodeData:
    """Convert Newick string to dictionary representation"""
    try:
        tree = Tree(newick_str)
        
        def process_node(node):
            children = []
            for child in node.children:
                children.append(process_node(child))
                
            return PhyloNodeData(
                id=str(node.name or f"node_{id(node)}"),
                name=str(node.name or ""),
                branch_length=node.dist if node.dist != 0 else None,
                support=getattr(node, "support", None),
                children=children if children else None
            )
            
        return process_node(tree)
    except Exception as e:
        raise ValueError(f"Invalid Newick format: {str(e)}")

class PhyloRequest(BaseModel):
    """Request model for phylogenetic analysis"""
    newick_str: str
    format: Optional[str] = "newick"
    
class RerootRequest(BaseModel):
    """Request model for rerooting a tree"""
    newick_str: str
    outgroup: List[str]
    
class AnnotationRequest(BaseModel):
    """Request model for tree annotation"""
    newick_str: str
    annotations: Dict[str, Dict[str, Any]]
    
class CompareRequest(BaseModel):
    """Request model for tree comparison"""
    tree1_newick: str
    tree2_newick: str
    comparison_method: Optional[str] = "robinson-foulds"

class PhylogeneticNode(BaseModel):
    """Model for a node in a phylogenetic tree"""
    id: str
    name: str
    length: Optional[float] = None
    children: Optional[List['PhylogeneticNode']] = None
    metadata: Optional[Dict[str, Any]] = None

class PhyloTree(BaseModel):
    """Model for a phylogenetic tree"""
    nodes: Dict[str, PhylogeneticNode]
    root_id: str
    
class OrthoSpeciesCount(BaseModel):
    """Model for species orthologues count"""
    species_id: str
    species_name: str
    count: int
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata for visualization")

class OrthologueSearchRequest(BaseModel):
    """Request model for orthologue search"""
    gene_id: str

class OrthologueData(BaseModel):
    """Model for orthologue data"""
    gene_id: str
    species_id: str
    species_name: str
    orthogroup_id: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")

class OrthologueSearchResponse(BaseModel):
    """Response model for orthologue search"""
    success: bool
    gene_id: str
    orthogroup_id: Optional[str] = None
    orthologues: List[OrthologueData] = Field(default_factory=list)
    counts_by_species: List[OrthoSpeciesCount] = Field(default_factory=list)
    newick_tree: Optional[str] = None
    tree_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional tree metadata for visualization")
    message: Optional[str] = None 