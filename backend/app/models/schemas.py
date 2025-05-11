from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union

class ProcessedDataResponse(BaseModel):
    """Response model for processed data"""
    id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    statistics: Dict[str, Any]

class AnalysisRequest(BaseModel):
    """Request model for data analysis"""
    data: Dict[str, Any]
    parameters: Dict[str, Any] = Field(default_factory=dict)

class VisualizationRequest(BaseModel):
    """Request model for visualization generation"""
    data: Dict[str, Any]
    viz_type: str = "phylogenetic_tree"
    parameters: Dict[str, Any] = Field(default_factory=dict)

class OntologyNode(BaseModel):
    """Model for ontology node"""
    id: str
    label: str
    type: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class OntologyRelationship(BaseModel):
    """Model for ontology relationship"""
    source: str
    target: str
    type: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class OntologyGraph(BaseModel):
    """Model for ontology graph"""
    nodes: List[OntologyNode]
    relationships: List[OntologyRelationship]
    metadata: Dict[str, Any] = Field(default_factory=dict)

class PredictionResult(BaseModel):
    """Model for prediction results"""
    node_id: str
    predictions: List[Dict[str, Any]]
    confidence: float
    explanation: Optional[str] = None 