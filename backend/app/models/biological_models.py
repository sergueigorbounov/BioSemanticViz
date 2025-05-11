from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union, ForwardRef

# Base models for biological entities
class GoTerm(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    description: Optional[str] = None

class ExternalLink(BaseModel):
    id: str
    db: str
    url: Optional[str] = None
    name: Optional[str] = None

class Species(BaseModel):
    id: str
    name: str
    common_name: Optional[str] = None
    taxonomy_id: Optional[str] = None
    description: Optional[str] = None

class OrthoGroup(BaseModel):
    id: str
    name: str
    species: List[str] = []
    genes: List[str] = []
    description: Optional[str] = None

class Gene(BaseModel):
    id: str
    name: str
    label: Optional[str] = None
    species_id: str
    species_name: Optional[str] = None
    orthogroup_id: Optional[str] = None
    description: Optional[str] = None
    sequence: Optional[str] = None
    functions: List[str] = []
    go_terms: List[GoTerm] = []
    external_links: List[ExternalLink] = []

# Dashboard models
class NameValuePair(BaseModel):
    name: str
    value: int

class GeneByOrthogroup(BaseModel):
    name: str
    genes: int

class DashboardData(BaseModel):
    speciesCount: int
    orthogroupCount: int
    geneCount: int
    annotationCount: int
    speciesDistribution: List[NameValuePair] = []
    genesByOrthogroup: List[GeneByOrthogroup] = []
    orthogroupConnectivity: List[NameValuePair] = []
    taxonomyDistribution: List[NameValuePair] = []
    goTermDistribution: Dict[str, int] = {}

class DashboardResponse(BaseModel):
    success: bool
    data: Optional[DashboardData] = None
    message: Optional[str] = None

# Forward reference for recursive model
SpeciesTreeNodeRef = ForwardRef('SpeciesTreeNode')

class SpeciesTreeNode(BaseModel):
    id: str
    name: str 
    scientific_name: Optional[str] = None
    common_name: Optional[str] = None
    taxonomy_id: Optional[int] = None
    type: str = "species"
    children: List[SpeciesTreeNodeRef] = []

# Update the forward reference
SpeciesTreeNode.update_forward_refs()

# Response models
class SpeciesResponse(BaseModel):
    success: bool
    data: List[Species] = []
    message: Optional[str] = None

class OrthoGroupResponse(BaseModel):
    success: bool
    data: List[OrthoGroup] = []
    message: Optional[str] = None
    species_id: Optional[str] = None

class GeneResponse(BaseModel):
    success: bool
    data: List[Gene] = []
    message: Optional[str] = None
    orthogroup_id: Optional[str] = None
    species_id: Optional[str] = None

class GeneDetailResponse(BaseModel):
    success: bool
    data: Optional[Gene] = None
    message: Optional[str] = None 