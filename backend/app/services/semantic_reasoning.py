import networkx as nx
from typing import Dict, Any, List, Optional
from rdflib import Graph, URIRef, Literal
import numpy as np
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE

class SemanticReasoningService:
    """Service for analyzing and reasoning over biological data"""
    
    def analyze(self, data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze biological data using semantic reasoning techniques"""
        analysis_type = parameters.get("analysis_type", "basic")
        
        if analysis_type == "basic":
            return self._perform_basic_analysis(data)
        elif analysis_type == "hierarchical":
            return self._perform_hierarchical_analysis(data)
        elif analysis_type == "evolutionary":
            return self._perform_evolutionary_analysis(data, parameters)
        elif analysis_type == "functional":
            return self._perform_functional_analysis(data, parameters)
        elif analysis_type == "clustering":
            return self._perform_clustering_analysis(data, parameters)
        else:
            raise ValueError(f"Unsupported analysis type: {analysis_type}")
    
    def _perform_basic_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform basic analysis of the ontology structure"""
        # Create a networkx graph from the data
        G = self._create_networkx_graph(data)
        
        # Calculate basic graph metrics
        metrics = {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "density": nx.density(G),
            "connected_components": nx.number_connected_components(G),
        }
        
        # Find central nodes using different centrality measures
        try:
            degree_centrality = nx.degree_centrality(G)
            betweenness_centrality = nx.betweenness_centrality(G)
            closeness_centrality = nx.closeness_centrality(G)
            
            # Get top 10 nodes for each centrality measure
            top_degree = self._get_top_nodes(degree_centrality, data["nodes"], 10)
            top_betweenness = self._get_top_nodes(betweenness_centrality, data["nodes"], 10)
            top_closeness = self._get_top_nodes(closeness_centrality, data["nodes"], 10)
            
            centrality = {
                "degree": top_degree,
                "betweenness": top_betweenness,
                "closeness": top_closeness
            }
        except:
            centrality = {"error": "Unable to calculate centrality measures"}
        
        # Group edges by relationship type
        edge_types = self._group_edges_by_type(data["edges"])
        
        return {
            "metrics": metrics,
            "centrality": centrality,
            "edge_types": edge_types
        }
    
    def _perform_hierarchical_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze hierarchical relationships in the ontology"""
        # Create a directed graph for hierarchy analysis
        G = self._create_networkx_graph(data, directed=True)
        
        # Find all "subClassOf" relationships to build class hierarchy
        hierarchy_edges = [e for e in data["edges"] if e["type"] == "subClassOf"]
        
        # Build a hierarchy-specific graph
        H = nx.DiGraph()
        for edge in hierarchy_edges:
            H.add_edge(edge["source"], edge["target"])
        
        # Find root nodes (nodes with no parents in the hierarchy)
        root_nodes = [n for n in H.nodes() if H.out_degree(n) == 0]
        
        # Find leaf nodes (nodes with no children in the hierarchy)
        leaf_nodes = [n for n in H.nodes() if H.in_degree(n) == 0]
        
        # Calculate the depth of each node from the nearest root
        depths = {}
        for root in root_nodes:
            for node in nx.descendants(H, root):
                # Calculate the longest path from this root to the node
                paths = list(nx.all_simple_paths(H, root, node))
                if paths:
                    max_path_length = max(len(path) - 1 for path in paths)
                    depths[node] = min(depths.get(node, float('inf')), max_path_length)
        
        # Convert node IDs to node details
        node_map = {node["id"]: node for node in data["nodes"]}
        
        root_node_details = [node_map.get(node_id, {"id": node_id}) for node_id in root_nodes]
        leaf_node_details = [node_map.get(node_id, {"id": node_id}) for node_id in leaf_nodes[:100]]  # Limit to 100
        
        # Detect cycles in the hierarchy (should not exist in a proper ontology)
        cycles = list(nx.simple_cycles(H))
        
        return {
            "root_nodes": root_node_details,
            "leaf_nodes": leaf_node_details,
            "hierarchy_depth": max(depths.values()) if depths else 0,
            "node_depths": depths,
            "has_cycles": len(cycles) > 0,
            "cycles": cycles[:10] if cycles else []  # Return only first 10 cycles if any
        }
    
    def _perform_evolutionary_analysis(self, data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze evolutionary relationships in the biological data"""
        # Extract species-related information
        species_nodes = [node for node in data["nodes"] if "species" in node.get("types", [])]
        
        # If no explicit species nodes, look for nodes with taxonomic information
        if not species_nodes:
            species_nodes = [node for node in data["nodes"] if any(
                key in node.get("properties", {}) for key in ["taxon", "taxonomy", "species"])]
        
        # Create a species relationship graph based on common ancestors
        species_graph = self._create_species_relationship_graph(data, species_nodes)
        
        # Get ancestral relationships
        ancestor_relationships = self._extract_ancestral_relationships(data)
        
        # Get orthologous relationships (genes with common ancestry)
        orthology_groups = self._identify_orthology_groups(data, parameters)
        
        return {
            "species_count": len(species_nodes),
            "species_relationships": species_graph,
            "ancestral_patterns": ancestor_relationships,
            "orthology_groups": orthology_groups
        }
    
    def _perform_functional_analysis(self, data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze functional annotations and relationships"""
        # Create a graph representation
        G = self._create_networkx_graph(data)
        
        # Extract function-related nodes
        function_types = ["Function", "MolecularFunction", "BiologicalProcess", "CellularComponent"]
        function_nodes = [node for node in data["nodes"] 
                          if any(ftype in node.get("type", "") for ftype in function_types)]
        
        # Find functional annotations based on relationships
        functional_annotations = self._extract_functional_annotations(data)
        
        # Group functions by similarity
        functional_clusters = self._cluster_functions(function_nodes, data["edges"])
        
        # Generate functional predictions based on network structure
        predictions = self._predict_functions(data, G, parameters)
        
        return {
            "functional_annotations": functional_annotations,
            "function_clusters": functional_clusters,
            "functional_predictions": predictions
        }
    
    def _perform_clustering_analysis(self, data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Perform clustering analysis on the data"""
        # Create adjacency matrix from the graph
        G = self._create_networkx_graph(data)
        
        # Calculate network features for nodes
        node_features = self._calculate_node_features(G)
        
        # Determine optimal cluster count or use provided value
        k = parameters.get("cluster_count", 5)
        
        # Perform dimensionality reduction for visualization
        tsne_result = self._perform_dimensionality_reduction(node_features)
        
        # Perform clustering
        clusters = self._cluster_nodes(node_features, k)
        
        # Create cluster visualization data
        visualization_data = self._create_cluster_visualization(data["nodes"], tsne_result, clusters)
        
        # Analyze cluster properties
        cluster_properties = self._analyze_clusters(G, clusters)
        
        return {
            "cluster_count": k,
            "node_clusters": clusters,
            "cluster_properties": cluster_properties,
            "visualization": visualization_data
        }
    
    def _create_networkx_graph(self, data: Dict[str, Any], directed: bool = False) -> nx.Graph:
        """Create a NetworkX graph from the data"""
        if directed:
            G = nx.DiGraph()
        else:
            G = nx.Graph()
        
        # Add nodes
        for node in data["nodes"]:
            G.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})
        
        # Add edges
        for edge in data["edges"]:
            G.add_edge(edge["source"], edge["target"], **{k: v for k, v in edge.items() 
                                                     if k not in ["source", "target"]})
        
        return G
    
    def _get_top_nodes(self, centrality_scores: Dict[str, float], 
                      nodes: List[Dict[str, Any]], 
                      limit: int = 10) -> List[Dict[str, Any]]:
        """Get the top N nodes based on centrality scores"""
        # Create a map of node IDs to node details
        node_map = {node["id"]: node for node in nodes}
        
        # Get top nodes by centrality score
        top_nodes = sorted(centrality_scores.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        # Return node details with centrality score
        return [{
            **node_map.get(node_id, {"id": node_id}),
            "score": score
        } for node_id, score in top_nodes]
    
    def _group_edges_by_type(self, edges: List[Dict[str, Any]]) -> Dict[str, int]:
        """Group edges by relationship type and count them"""
        type_counts = {}
        for edge in edges:
            edge_type = edge.get("type", "Unknown")
            type_counts[edge_type] = type_counts.get(edge_type, 0) + 1
        
        return type_counts
    
    def _create_species_relationship_graph(self, data: Dict[str, Any], 
                                         species_nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create a graph representing relationships between species"""
        # Extract only species-related information for simplicity
        species_relationships = []
        
        # Create a map of species IDs for quick lookup
        species_ids = {node["id"] for node in species_nodes}
        
        # Look for direct relationships between species
        for edge in data["edges"]:
            if edge["source"] in species_ids and edge["target"] in species_ids:
                species_relationships.append({
                    "source": edge["source"],
                    "target": edge["target"],
                    "type": edge["type"]
                })
        
        return species_relationships
    
    def _extract_ancestral_relationships(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract ancestral relationships from the data"""
        # Look for specific relationships that indicate ancestry
        ancestry_types = ["hasAncestor", "evolvedFrom", "ancestralWith"]
        
        ancestry_relationships = []
        for edge in data["edges"]:
            if edge["type"] in ancestry_types:
                ancestry_relationships.append({
                    "source": edge["source"],
                    "target": edge["target"],
                    "type": edge["type"]
                })
        
        return {
            "count": len(ancestry_relationships),
            "relationships": ancestry_relationships[:100]  # Limit to 100 for response size
        }
    
    def _identify_orthology_groups(self, data: Dict[str, Any], 
                                 parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify groups of orthologous genes/proteins"""
        # This is a simplified implementation
        # In a real system, this would use advanced orthology detection algorithms
        
        # Look for orthology relationships
        orthology_edges = [edge for edge in data["edges"] 
                         if edge["type"] in ["orthologous", "orthologousTo"]]
        
        if not orthology_edges:
            return []
        
        # Create a graph of orthology relationships
        G = nx.Graph()
        for edge in orthology_edges:
            G.add_edge(edge["source"], edge["target"])
        
        # Find connected components - each is a potential orthology group
        orthology_groups = []
        for i, component in enumerate(nx.connected_components(G)):
            if i >= 100:  # Limit to 100 groups
                break
                
            members = list(component)
            orthology_groups.append({
                "id": f"group_{i}",
                "size": len(members),
                "members": members
            })
        
        return orthology_groups
    
    def _extract_functional_annotations(self, data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Extract functional annotations for entities"""
        # Look for relationships indicating functions
        function_relationships = [
            "hasFunction", "participatesIn", "involved_in", "enables",
            "function", "process", "component"
        ]
        
        entity_functions = {}
        for edge in data["edges"]:
            if edge["type"] in function_relationships:
                entity_id = edge["source"]
                function_id = edge["target"]
                
                if entity_id not in entity_functions:
                    entity_functions[entity_id] = []
                
                entity_functions[entity_id].append(function_id)
        
        # Limit the number of entities to return
        return {k: v for i, (k, v) in enumerate(entity_functions.items()) if i < 100}
    
    def _cluster_functions(self, function_nodes: List[Dict[str, Any]], 
                         edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Cluster functions based on similarity"""
        if not function_nodes:
            return []
        
        # Create a graph of function nodes
        G = nx.Graph()
        function_ids = {node["id"] for node in function_nodes}
        
        # Add function nodes
        for node in function_nodes:
            G.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})
        
        # Add edges between functions
        for edge in edges:
            if edge["source"] in function_ids and edge["target"] in function_ids:
                G.add_edge(edge["source"], edge["target"])
        
        # Find clusters using connected components
        clusters = []
        for i, component in enumerate(nx.connected_components(G)):
            if i >= 20:  # Limit to 20 clusters
                break
                
            members = list(component)
            clusters.append({
                "id": f"cluster_{i}",
                "size": len(members),
                "members": members[:50]  # Limit members to 50
            })
        
        return clusters
    
    def _predict_functions(self, data: Dict[str, Any], G: nx.Graph, 
                         parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Predict functions based on network structure"""
        # This is a simplified implementation
        # A real system would use more sophisticated prediction algorithms
        
        # Get entities that need function prediction
        target_id = parameters.get("target_entity")
        if not target_id:
            return []
        
        # Find neighbors of the target entity
        try:
            neighbors = list(G.neighbors(target_id))
        except nx.NetworkXError:
            return []
        
        # Find functions associated with neighbors
        function_types = ["Function", "MolecularFunction", "BiologicalProcess", "CellularComponent"]
        neighbor_functions = []
        
        for neighbor_id in neighbors:
            # Look for function relationships from this neighbor
            for edge in data["edges"]:
                if edge["source"] == neighbor_id and any(
                    ftype in edge.get("target_type", "") for ftype in function_types
                ):
                    target_node = next((n for n in data["nodes"] if n["id"] == edge["target"]), None)
                    if target_node:
                        neighbor_functions.append({
                            "function_id": target_node["id"],
                            "function_label": target_node.get("label", "Unknown Function"),
                            "confidence": 0.5  # Placeholder confidence score
                        })
        
        # Sort by confidence and limit results
        neighbor_functions.sort(key=lambda x: x["confidence"], reverse=True)
        return neighbor_functions[:10]  # Return top 10 predictions
    
    def _calculate_node_features(self, G: nx.Graph) -> Dict[str, List[float]]:
        """Calculate features for nodes to be used in clustering"""
        features = {}
        
        # Calculate degree centrality
        degree_centrality = nx.degree_centrality(G)
        
        # Try to calculate other centrality measures
        try:
            betweenness_centrality = nx.betweenness_centrality(G, k=min(100, len(G)))
        except:
            betweenness_centrality = {node: 0.0 for node in G.nodes()}
        
        try:
            closeness_centrality = nx.closeness_centrality(G)
        except:
            closeness_centrality = {node: 0.0 for node in G.nodes()}
        
        # Combine features
        for node in G.nodes():
            features[node] = [
                degree_centrality.get(node, 0.0),
                betweenness_centrality.get(node, 0.0),
                closeness_centrality.get(node, 0.0),
            ]
        
        return features
    
    def _perform_dimensionality_reduction(self, features: Dict[str, List[float]]) -> Dict[str, List[float]]:
        """Perform dimensionality reduction for visualization"""
        if not features:
            return {}
        
        # Convert features to numpy array
        nodes = list(features.keys())
        feature_matrix = np.array([features[node] for node in nodes])
        
        # Perform t-SNE
        try:
            tsne = TSNE(n_components=2, perplexity=min(30, max(3, len(features) // 5)))
            embedding = tsne.fit_transform(feature_matrix)
            
            # Convert back to dictionary
            result = {node: [float(embedding[i][0]), float(embedding[i][1])] for i, node in enumerate(nodes)}
            return result
        except:
            # Fallback if t-SNE fails
            return {node: [0.0, 0.0] for node in nodes}
    
    def _cluster_nodes(self, features: Dict[str, List[float]], k: int) -> Dict[str, int]:
        """Cluster nodes based on their features"""
        if not features or k <= 0:
            return {}
        
        # Convert features to numpy array
        nodes = list(features.keys())
        feature_matrix = np.array([features[node] for node in nodes])
        
        # Ensure we have enough samples for clustering
        actual_k = min(k, len(feature_matrix))
        if actual_k <= 0:
            return {}
        
        # Perform k-means clustering
        try:
            kmeans = KMeans(n_clusters=actual_k)
            clusters = kmeans.fit_predict(feature_matrix)
            
            # Convert to dictionary mapping node ID to cluster
            result = {node: int(cluster) for node, cluster in zip(nodes, clusters)}
            return result
        except:
            # Fallback if clustering fails
            return {node: 0 for node in nodes}
    
    def _create_cluster_visualization(self, nodes: List[Dict[str, Any]], 
                                   positions: Dict[str, List[float]], 
                                   clusters: Dict[str, int]) -> List[Dict[str, Any]]:
        """Create visualization data for clusters"""
        visualization_data = []
        
        # Create a node map for quick lookups
        node_map = {node["id"]: node for node in nodes}
        
        # Create visualization data for each node with position and cluster
        for node_id, cluster in clusters.items():
            node_data = node_map.get(node_id, {"id": node_id})
            position = positions.get(node_id, [0, 0])
            
            visualization_data.append({
                "id": node_id,
                "label": node_data.get("label", node_id),
                "type": node_data.get("type", "Unknown"),
                "cluster": cluster,
                "position": {
                    "x": position[0],
                    "y": position[1]
                }
            })
        
        return visualization_data
    
    def _analyze_clusters(self, G: nx.Graph, clusters: Dict[str, int]) -> Dict[str, Any]:
        """Analyze properties of the clusters"""
        if not clusters:
            return {}
        
        # Count nodes per cluster
        cluster_counts = {}
        for node, cluster in clusters.items():
            cluster_key = f"cluster_{cluster}"
            cluster_counts[cluster_key] = cluster_counts.get(cluster_key, 0) + 1
        
        # Calculate intra-cluster and inter-cluster edges
        intra_edges = {}
        inter_edges = {}
        
        for u, v in G.edges():
            if u in clusters and v in clusters:
                u_cluster = clusters[u]
                v_cluster = clusters[v]
                
                if u_cluster == v_cluster:
                    cluster_key = f"cluster_{u_cluster}"
                    intra_edges[cluster_key] = intra_edges.get(cluster_key, 0) + 1
                else:
                    # Create a sorted key for the cluster pair
                    cluster_pair = tuple(sorted([u_cluster, v_cluster]))
                    pair_key = f"cluster_{cluster_pair[0]}_cluster_{cluster_pair[1]}"
                    inter_edges[pair_key] = inter_edges.get(pair_key, 0) + 1
        
        return {
            "cluster_sizes": cluster_counts,
            "intra_cluster_edges": intra_edges,
            "inter_cluster_edges": inter_edges
        } 