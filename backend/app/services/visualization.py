import json
from typing import Dict, Any, List, Optional
import networkx as nx
import tempfile
import os

class VisualizationService:
    """Service for generating visualizations for biological data"""
    
    def generate_visualization(self, data: Dict[str, Any], viz_type: str, 
                             parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization based on the data and parameters"""
        if viz_type == "phylogenetic_tree":
            return self._generate_phylogenetic_tree(data, parameters)
        elif viz_type == "network_graph":
            return self._generate_network_graph(data, parameters)
        elif viz_type == "hierarchy_visualization":
            return self._generate_hierarchy(data, parameters)
        elif viz_type == "cluster_visualization":
            return self._generate_cluster_viz(data, parameters)
        else:
            raise ValueError(f"Unsupported visualization type: {viz_type}")
    
    def _generate_phylogenetic_tree(self, data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a phylogenetic tree visualization"""
        # Extract relationships that define phylogenetic connections
        evolutionary_edges = [edge for edge in data["edges"] 
                             if edge["type"] in [
                                 "subClassOf", "evolvedFrom", "hasAncestor",
                                 "ancestralWith", "parentTaxon", "childTaxon"
                             ]]
        
        if not evolutionary_edges:
            return {"error": "No evolutionary relationships found in the data"}
        
        # Create a directed graph to represent evolutionary relationships
        G = nx.DiGraph()
        for edge in evolutionary_edges:
            G.add_edge(edge["source"], edge["target"])
        
        # Find root nodes (no incoming edges)
        root_nodes = [node for node in G.nodes() if G.in_degree(node) == 0]
        
        if not root_nodes:
            # If no root nodes found, pick nodes with highest out-degree
            if G.nodes():
                out_degrees = G.out_degree()
                root_nodes = [node for node, degree in sorted(out_degrees, key=lambda x: x[1], reverse=True)[:1]]
            else:
                return {"error": "No nodes found in tree graph"}
        
        # Create node map for quick lookup
        node_map = {node["id"]: node for node in data["nodes"]}
        
        # Build tree data
        tree_data = {
            "nodes": [],
            "links": []
        }
        
        # Add nodes
        for node_id in G.nodes():
            node_info = node_map.get(node_id, {"id": node_id, "label": node_id})
            tree_data["nodes"].append({
                "id": node_id,
                "name": node_info.get("label", node_id),
                "type": node_info.get("type", "Unknown")
            })
        
        # Add links
        for source, target in G.edges():
            tree_data["links"].append({
                "source": source,
                "target": target
            })
        
        return {
            "tree_data": tree_data,
            "format": "hierarchical_json",
            "node_count": len(tree_data["nodes"])
        }
    
    def _generate_network_graph(self, data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a network graph visualization"""
        # Filter nodes and edges based on parameters
        filter_node_types = parameters.get("node_types", [])
        filter_edge_types = parameters.get("edge_types", [])
        
        # Apply filters if specified
        filtered_nodes = data["nodes"]
        if filter_node_types:
            filtered_nodes = [node for node in data["nodes"] 
                             if any(ftype in node.get("type", "") for ftype in filter_node_types)]
        
        filtered_edges = data["edges"]
        if filter_edge_types:
            filtered_edges = [edge for edge in data["edges"] 
                             if edge.get("type", "") in filter_edge_types]
        
        # Create node ID set for quick lookup
        node_ids = {node["id"] for node in filtered_nodes}
        
        # Keep only edges connecting filtered nodes
        connecting_edges = [edge for edge in filtered_edges
                           if edge["source"] in node_ids and edge["target"] in node_ids]
        
        # Create graph layout
        G = nx.Graph()
        for node in filtered_nodes:
            G.add_node(node["id"])
        
        for edge in connecting_edges:
            G.add_edge(edge["source"], edge["target"])
        
        # Create layout positions using force-directed algorithm
        try:
            positions = nx.spring_layout(G)
            # Convert positions to list format
            pos_dict = {node: {"x": float(pos[0]), "y": float(pos[1])} 
                      for node, pos in positions.items()}
        except:
            # Fallback to grid layout if spring layout fails
            pos_dict = self._create_grid_layout(filtered_nodes)
        
        # Create visualization data
        viz_nodes = []
        for node in filtered_nodes:
            node_pos = pos_dict.get(node["id"], {"x": 0, "y": 0})
            viz_nodes.append({
                "id": node["id"],
                "label": node.get("label", node["id"]),
                "type": node.get("type", "Unknown"),
                "x": node_pos["x"],
                "y": node_pos["y"],
                "properties": node.get("properties", {})
            })
        
        viz_edges = []
        for edge in connecting_edges:
            viz_edges.append({
                "source": edge["source"],
                "target": edge["target"],
                "type": edge.get("type", "Unknown")
            })
        
        return {
            "nodes": viz_nodes,
            "edges": viz_edges,
            "format": "network",
            "filtered": {
                "original_node_count": len(data["nodes"]),
                "filtered_node_count": len(filtered_nodes),
                "original_edge_count": len(data["edges"]),
                "filtered_edge_count": len(connecting_edges)
            }
        }
    
    def _generate_hierarchy(self, data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a hierarchical visualization (like class hierarchy)"""
        # Find hierarchy relationships (typically subClassOf, partOf)
        hierarchy_types = ["subClassOf", "partOf", "isA"]
        hierarchy_edges = [edge for edge in data["edges"] 
                         if edge["type"] in hierarchy_types]
        
        if not hierarchy_edges:
            return {"error": "No hierarchical relationships found"}
        
        # Create a directed graph for hierarchy
        G = nx.DiGraph()
        for edge in hierarchy_edges:
            G.add_edge(edge["source"], edge["target"])
        
        # Find root nodes (no incoming edges)
        root_nodes = [node for node in G.nodes() if G.in_degree(node) == 0]
        
        if not root_nodes:
            # If no root nodes found, pick nodes with highest out-degree
            if G.nodes():
                out_degrees = G.out_degree()
                root_nodes = [node for node, degree in sorted(out_degrees, key=lambda x: x[1], reverse=True)[:1]]
            else:
                return {"error": "No nodes found in hierarchy graph"}
        
        # Create hierarchical data structure
        hierarchy_data = []
        for root in root_nodes:
            root_tree = self._build_hierarchy_tree(root, G, data["nodes"])
            hierarchy_data.append(root_tree)
        
        return {
            "hierarchies": hierarchy_data,
            "format": "tree",
            "root_count": len(root_nodes)
        }
    
    def _generate_cluster_viz(self, data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a cluster visualization"""
        # Check if clustering data is available
        if "clusters" not in parameters:
            return {"error": "No clustering data provided"}
        
        clusters = parameters["clusters"]
        
        # Create a color map for clusters
        color_map = self._generate_color_map(len(clusters))
        
        # Create node visualization data with cluster information
        nodes = []
        for node in data["nodes"]:
            node_id = node["id"]
            cluster = next((c for c in clusters if node_id in c["members"]), None)
            
            if cluster:
                cluster_id = cluster["id"]
                cluster_index = int(cluster_id.split("_")[-1]) if "_" in cluster_id else 0
                color = color_map[cluster_index % len(color_map)]
                
                nodes.append({
                    "id": node_id,
                    "label": node.get("label", node_id),
                    "cluster": cluster_id,
                    "color": color,
                    "size": 5  # Default size
                })
        
        # Create edge visualization data
        edges = []
        for edge in data["edges"]:
            source_id = edge["source"]
            target_id = edge["target"]
            
            source_node = next((n for n in nodes if n["id"] == source_id), None)
            target_node = next((n for n in nodes if n["id"] == target_id), None)
            
            if source_node and target_node:
                same_cluster = source_node.get("cluster") == target_node.get("cluster")
                
                edges.append({
                    "source": source_id,
                    "target": target_id,
                    "color": "#888888" if same_cluster else "#cccccc",
                    "width": 2 if same_cluster else 1
                })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "clusters": [{"id": c["id"], "size": len(c["members"])} for c in clusters],
            "format": "cluster_network"
        }
    
    def _build_hierarchy_tree(self, node_id: str, G: nx.DiGraph, 
                            nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Build a hierarchy tree starting from a node"""
        # Create a node map for quick lookup
        node_map = {node["id"]: node for node in nodes}
        
        # Get node info from the map
        node_info = node_map.get(node_id, {"id": node_id, "label": node_id})
        
        # Create tree node
        tree_node = {
            "id": node_id,
            "name": node_info.get("label", node_id),
            "children": []
        }
        
        # Get all children of the node
        for _, child in G.out_edges(node_id):
            child_tree = self._build_hierarchy_tree(child, G, nodes)
            tree_node["children"].append(child_tree)
        
        return tree_node
    
    def _create_grid_layout(self, nodes: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        """Create a grid layout for nodes"""
        positions = {}
        rows = int(len(nodes) ** 0.5) + 1
        
        for i, node in enumerate(nodes):
            row = i // rows
            col = i % rows
            positions[node["id"]] = {
                "x": float(col) * 100,
                "y": float(row) * 100
            }
        
        return positions
    
    def _generate_color_map(self, num_colors: int) -> List[str]:
        """Generate a list of distinct colors"""
        # Basic color list
        base_colors = [
            "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
            "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
        ]
        
        if num_colors <= len(base_colors):
            return base_colors[:num_colors]
        
        # If we need more colors, cycle through the base colors
        return [base_colors[i % len(base_colors)] for i in range(num_colors)] 