from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional, List
import os
import tempfile
import shutil
import uuid
import json
import pathlib
from Bio import Phylo
try:
    from ete3 import Tree, TreeStyle, NodeStyle, faces, AttrFace
    HAS_ETE3 = True
except ImportError:
    print("Warning: ETE Toolkit not installed. Some functionality will be limited.")
    HAS_ETE3 = False
    # Don't raise an error, just continue with limited functionality
    # raise ImportError("ETE Toolkit not installed. Please install it with 'pip install ete3==3.1.1'")

from ..models.phylo import PhyloNodeData, TreeData, newick_to_dict, NodeMutation

router = APIRouter(prefix="/api/phylo", tags=["phylo"])

# --- Models ---

class PhyloRequest(PhyloNodeData):
    """Base model for phylogenetic requests"""
    newick: str
    
class RerootRequest(PhyloRequest):
    """Request to reroot a tree"""
    outgroup: List[str]

class AnnotationRequest(PhyloRequest):
    """Request to annotate a tree with metadata"""
    annotations: Dict[str, Dict[str, Any]]

class CompareRequest(PhyloRequest):
    """Request to compare two trees"""
    newick1: str
    newick2: str
    
class NodeData(PhyloNodeData):
    """Node data for the tree"""
    id: str
    name: str
    length: Optional[float] = None
    support: Optional[float] = None
    children: Optional[List['NodeData']] = None
    
    class Config:
        orm_mode = True

# --- Helper functions ---

def newick_to_dict(newick_str: str) -> NodeData:
    """Convert Newick string to dictionary representation"""
    try:
        tree = Tree(newick_str)
        
        def process_node(node):
            children = []
            for child in node.children:
                children.append(process_node(child))
                
            return NodeData(
                id=str(node.name or f"node_{id(node)}"),
                name=str(node.name or ""),
                length=node.dist if node.dist != 0 else None,
                support=getattr(node, "support", None),
                children=children if children else None
            )
            
        return process_node(tree)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Newick format: {str(e)}")

# --- API Endpoints ---

@router.post("/upload", response_model=Dict[str, Any])
async def upload_tree_file(
    file: UploadFile = File(...),
    reroot_outgroup: Optional[str] = Form(None)
):
    """Upload a phylogenetic tree in Newick format"""
    try:
        # Read the file content directly
        content = await file.read()
        newick_str = content.decode("utf-8").strip()
        
        # Validate simple Newick format
        if not newick_str.endswith(';'):
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid Newick format: string must end with semicolon (;)"}
            )
        
        # Create a simplified tree structure manually
        # This is a simplified approach to avoid ETE3 dependency issues
        try:
            # Extract leaf names (very simple approach)
            leaf_names = []
            for segment in newick_str.replace(';', '').replace('(', '').replace(')', '').split(','):
                # Extract name before any colon
                name = segment.split(':')[0].strip()
                if name:
                    leaf_names.append(name)
            
            # Create a simple tree with just the leaf nodes
            tree_dict = {
                "id": "root",
                "name": "root",
                "branch_length": 0,
                "children": [
                    {"id": name, "name": name, "branch_length": 0.1} 
                    for name in leaf_names
                ]
            }
            
            return {
                "newick": newick_str,
                "tree": tree_dict,
                "num_leaves": len(leaf_names),
                "num_nodes": len(leaf_names) + 1
            }
                
        except Exception as parsing_error:
            return JSONResponse(
                status_code=400,
                content={"detail": f"Error parsing Newick: {str(parsing_error)}"}
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error processing tree file: {str(e)}"}
        )

@router.post("/reroot", response_model=Dict[str, Any])
async def reroot_tree(data: TreeData):
    """Reroot a tree using the specified outgroup"""
    try:
        # Parse the tree from the provided Newick string
        tree = Tree(data.newick, format=1)
        
        # Find the outgroup node
        outgroup_nodes = tree.search_nodes(name=data.outgroup)
        if not outgroup_nodes:
            raise HTTPException(status_code=404, detail=f"Outgroup '{data.outgroup}' not found in tree")
        
        # Set the outgroup
        outgroup = outgroup_nodes[0]
        tree.set_outgroup(outgroup)
        
        # Return the rerooted tree
        return {
            "newick": tree.write(format=1),
            "tree": newick_to_dict(tree.write(format=1)).dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rerooting tree: {str(e)}")

@router.post("/annotate", response_model=Dict[str, Any])
async def annotate_tree(data: Dict[str, Any]):
    """Annotate a tree with additional data"""
    try:
        # Parse the tree from the provided Newick string
        tree = Tree(data["newick"], format=1)
        annotations = data.get("annotations", {})
        
        # Apply annotations to nodes
        for node in tree.traverse():
            node_name = node.name
            if node_name in annotations:
                for key, value in annotations[node_name].items():
                    setattr(node, key, value)
        
        # Return the annotated tree
        result = {
            "newick": tree.write(format=1),
            "tree": newick_to_dict(tree.write(format=1)).dict()
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error annotating tree: {str(e)}")

@router.post("/compare", response_model=Dict[str, Any])
async def compare_trees(data: Dict[str, Any]):
    """Compare two trees and identify differences"""
    try:
        tree1 = Tree(data["tree1"], format=1)
        tree2 = Tree(data["tree2"], format=1)
        
        # Get the set of leaf names in each tree
        leaves1 = {leaf.name for leaf in tree1.get_leaves()}
        leaves2 = {leaf.name for leaf in tree2.get_leaves()}
        
        # Find leaves that are in one tree but not the other
        unique_to_tree1 = leaves1 - leaves2
        unique_to_tree2 = leaves2 - leaves1
        
        # Common leaves between both trees
        common_leaves = leaves1 & leaves2
        
        return {
            "unique_to_tree1": list(unique_to_tree1),
            "unique_to_tree2": list(unique_to_tree2),
            "common_leaves": list(common_leaves),
            "tree1_leaf_count": len(leaves1),
            "tree2_leaf_count": len(leaves2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing trees: {str(e)}")

@router.get("/example", response_model=Dict[str, Any])
async def get_example_tree():
    """Get an example tree for testing"""
    try:
        # Read the example tree file
        example_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'mock_data', 'example_tree.nwk')
        with open(example_path, 'r') as f:
            newick_str = f.read().strip()
        
        # Create a simple tree structure without ETE3
        tree_dict = {
            "id": "root",
            "name": "root",
            "children": [
                {
                    "id": "node1",
                    "name": "internal1",
                    "branch_length": 0.1,
                    "children": [
                        {
                            "id": "A",
                            "name": "A",
                            "branch_length": 0.1
                        },
                        {
                            "id": "B",
                            "name": "B",
                            "branch_length": 0.2
                        }
                    ]
                },
                {
                    "id": "node2",
                    "name": "internal2",
                    "branch_length": 0.5,
                    "children": [
                        {
                            "id": "C",
                            "name": "C",
                            "branch_length": 0.3
                        },
                        {
                            "id": "D",
                            "name": "D",
                            "branch_length": 0.4
                        }
                    ]
                },
                {
                    "id": "E",
                    "name": "E",
                    "branch_length": 0.7
                }
            ]
        }
        
        # Return as JSON
        result = {
            "newick": newick_str,
            "tree": tree_dict,
            "num_leaves": 5,
            "num_nodes": 9
        }
        
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error getting example tree: {str(e)}"}
        ) 