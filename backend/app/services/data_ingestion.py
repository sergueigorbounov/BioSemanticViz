import uuid
import os
import tempfile
from typing import Dict, Any, List
from fastapi import UploadFile
import rdflib
from rdflib import Graph, URIRef, Literal
from rdflib.namespace import RDF, RDFS, OWL

class DataIngestionService:
    """Service for processing and ingesting biological data files"""
    
    async def process_file(self, file: UploadFile) -> Dict[str, Any]:
        """Process uploaded data file"""
        # Generate a unique ID for this dataset
        dataset_id = str(uuid.uuid4())
        
        # Check file type and use appropriate parser
        if file.filename.endswith('.ttl'):
            return await self._process_ttl_file(file, dataset_id)
        elif file.filename.endswith('.rdf') or file.filename.endswith('.owl'):
            return await self._process_rdf_file(file, dataset_id)
        else:
            raise ValueError(f"Unsupported file format: {file.filename}")
    
    async def _process_ttl_file(self, file: UploadFile, dataset_id: str) -> Dict[str, Any]:
        """Process Turtle (TTL) file format"""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Write the uploaded file to a temporary file
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            
            try:
                # Parse the TTL file into an RDF graph
                g = Graph()
                g.parse(temp_file.name, format="turtle")
                
                # Extract nodes and relationships from the graph
                nodes, edges = self._extract_graph_elements(g)
                
                # Get statistics about the data
                statistics = self._calculate_statistics(g, nodes, edges)
                
                # Extract metadata from the graph
                metadata = self._extract_metadata(g)
                
                return {
                    "id": dataset_id,
                    "nodes": nodes,
                    "edges": edges,
                    "metadata": metadata,
                    "statistics": statistics
                }
            finally:
                # Clean up the temporary file
                os.unlink(temp_file.name)
    
    async def _process_rdf_file(self, file: UploadFile, dataset_id: str) -> Dict[str, Any]:
        """Process RDF/XML or OWL file formats"""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Write the uploaded file to a temporary file
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            
            try:
                # Parse the RDF file into an RDF graph
                g = Graph()
                g.parse(temp_file.name, format="xml")
                
                # Extract nodes and relationships from the graph
                nodes, edges = self._extract_graph_elements(g)
                
                # Get statistics about the data
                statistics = self._calculate_statistics(g, nodes, edges)
                
                # Extract metadata from the graph
                metadata = self._extract_metadata(g)
                
                return {
                    "id": dataset_id,
                    "nodes": nodes,
                    "edges": edges,
                    "metadata": metadata,
                    "statistics": statistics
                }
            finally:
                # Clean up the temporary file
                os.unlink(temp_file.name)
    
    def _extract_graph_elements(self, g: Graph) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Extract nodes and edges from RDF graph"""
        nodes = []
        edges = []
        
        # Track processed nodes to avoid duplicates
        processed_nodes = set()
        
        # Process all triples in the graph
        for s, p, o in g:
            # Process subject as a node
            if s not in processed_nodes and isinstance(s, URIRef):
                node_data = self._create_node_from_uri(g, s)
                if node_data:
                    nodes.append(node_data)
                    processed_nodes.add(s)
            
            # Process object as a node if it's a URI (not a literal)
            if isinstance(o, URIRef) and o not in processed_nodes:
                node_data = self._create_node_from_uri(g, o)
                if node_data:
                    nodes.append(node_data)
                    processed_nodes.add(o)
            
            # Process the relationship (edge)
            if isinstance(s, URIRef) and isinstance(o, (URIRef, Literal)):
                edge_data = {
                    "source": str(s),
                    "target": str(o),
                    "type": self._get_predicate_type(p),
                    "label": self._get_label(g, p),
                    "uri": str(p)
                }
                edges.append(edge_data)
        
        return nodes, edges
    
    def _create_node_from_uri(self, g: Graph, uri: URIRef) -> Dict[str, Any]:
        """Create a node dictionary from a URI reference"""
        # Get node type
        node_types = []
        for _, _, o in g.triples((uri, RDF.type, None)):
            if isinstance(o, URIRef):
                node_types.append(str(o))
        
        # Get node label
        label = self._get_label(g, uri)
        
        # Get additional properties
        properties = {}
        for p, o in g.predicate_objects(uri):
            if p not in [RDF.type, RDFS.label]:
                prop_name = self._get_label(g, p) or str(p).split('/')[-1].split('#')[-1]
                if isinstance(o, Literal):
                    properties[prop_name] = str(o)
                elif isinstance(o, URIRef):
                    properties[prop_name] = str(o)
        
        # Create and return the node data
        return {
            "id": str(uri),
            "label": label,
            "type": node_types[0] if node_types else "Unknown",
            "types": node_types,
            "properties": properties
        }
    
    def _get_label(self, g: Graph, uri: URIRef) -> str:
        """Get the label for a URI"""
        for _, _, o in g.triples((uri, RDFS.label, None)):
            if isinstance(o, Literal):
                return str(o)
        
        # If no label found, use the last part of the URI
        return str(uri).split('/')[-1].split('#')[-1]
    
    def _get_predicate_type(self, p: URIRef) -> str:
        """Get the type of a predicate"""
        if p == RDFS.subClassOf:
            return "subClassOf"
        elif p == OWL.equivalentClass:
            return "equivalentClass"
        elif p == RDFS.domain:
            return "domain"
        elif p == RDFS.range:
            return "range"
        else:
            # Extract the last part of the URI as the type
            return str(p).split('/')[-1].split('#')[-1]
    
    def _calculate_statistics(self, g: Graph, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate statistics about the graph"""
        # Count triplet types
        type_counts = {}
        for _, p, _ in g:
            p_type = self._get_predicate_type(p)
            type_counts[p_type] = type_counts.get(p_type, 0) + 1
        
        # Count node types
        node_type_counts = {}
        for node in nodes:
            node_type = node.get("type", "Unknown")
            node_type_counts[node_type] = node_type_counts.get(node_type, 0) + 1
        
        return {
            "triple_count": len(g),
            "node_count": len(nodes),
            "edge_count": len(edges),
            "predicate_types": type_counts,
            "node_types": node_type_counts
        }
    
    def _extract_metadata(self, g: Graph) -> Dict[str, Any]:
        """Extract metadata from the graph"""
        metadata = {
            "namespaces": {},
            "ontology_info": {}
        }
        
        # Extract namespaces
        for prefix, namespace in g.namespaces():
            metadata["namespaces"][prefix] = str(namespace)
        
        # Look for ontology declarations
        for s, p, o in g.triples((None, RDF.type, OWL.Ontology)):
            metadata["ontology_info"]["uri"] = str(s)
            
            # Extract ontology metadata
            for p2, o2 in g.predicate_objects(s):
                if isinstance(o2, Literal):
                    key = str(p2).split('/')[-1].split('#')[-1]
                    metadata["ontology_info"][key] = str(o2)
        
        return metadata 