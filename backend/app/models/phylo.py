from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ete3 import Tree

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

# Needed for recursive type definition
PhyloNodeData.model_rebuild()

class TreeData(BaseModel):
    """Model for tree data"""
    newick: str
    outgroup: str

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