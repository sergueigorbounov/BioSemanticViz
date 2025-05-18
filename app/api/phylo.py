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
    print("ETE3 library successfully loaded!")
except ImportError:
    print("Warning: ETE Toolkit not installed. Some functionality will be limited.")
    HAS_ETE3 = False
    # Don't raise an error, just continue with limited functionality

from ..models.phylo import PhyloNodeData, TreeData, newick_to_dict, NodeMutation

router = APIRouter(prefix="/api/phylo", tags=["phylo"])

# --- Models --- 

# --- Helper functions ---

def newick_to_dict(newick_str: str) -> NodeData:
    """Convert Newick string to dictionary representation"""
    if HAS_ETE3:
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
    else:
        # Basic fallback implementation when ETE3 is not available
        # This is very simplistic and only works for basic trees
        try:
            # Create a simple representation
            leaf_names = []
            for segment in newick_str.replace(';', '').replace('(', '').replace(')', '').split(','):
                name = segment.split(':')[0].strip()
                if name:
                    leaf_names.append(name)
            
            # Return a basic node structure
            root = NodeData(
                id="root",
                name="root",
                children=[
                    NodeData(
                        id=name,
                        name=name,
                        length=0.1
                    ) for name in leaf_names
                ]
            )
            return root
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse Newick string: {str(e)}")

# --- End of Helper functions --- 

@router.post("/reroot", response_model=Dict[str, Any])
async def reroot_tree(data: TreeData):
    """Reroot a tree using the specified outgroup"""
    if not HAS_ETE3:
        raise HTTPException(status_code=501, detail="ETE3 not installed, rerooting not available")
    
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
    if not HAS_ETE3:
        raise HTTPException(status_code=501, detail="ETE3 not installed, annotation not available")
        
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
    if not HAS_ETE3:
        raise HTTPException(status_code=501, detail="ETE3 not installed, tree comparison not available")
        
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