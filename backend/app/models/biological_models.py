from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ExternalLink(BaseModel):
    """External database link"""
    database: str
    id: str
    url: str
    description: Optional[str] = None

class OntologyTerm(BaseModel):
    """Base class for ontology terms"""
    id: str
    name: str
    definition: Optional[str] = None
    uri: Optional[str] = None

class GOTerm(OntologyTerm):
    """Gene Ontology term"""
    aspect: str = Field(..., description="P: biological process, F: molecular function, C: cellular component")
    evidence_code: Optional[str] = None
    
class POTerm(OntologyTerm):
    """Plant Ontology term"""
    tissue_type: Optional[str] = None
    
class TOTerm(OntologyTerm):
    """Trait Ontology term"""
    trait_category: Optional[str] = None

class Species(BaseModel):
    """Species model"""
    id: str
    name: str
    taxon_id: str
    common_name: Optional[str] = None
    genome_assembly: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "id": "ath",
                "name": "Arabidopsis thaliana",
                "taxon_id": "3702",
                "common_name": "thale cress",
                "genome_assembly": "TAIR10"
            }
        }

class OrthoGroup(BaseModel):
    """Orthologous group model"""
    id: str
    name: str
    species: List[str]
    genes: List[str]
    description: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "id": "OG0000001",
                "name": "Photosystem II protein D1",
                "species": ["ath", "osa"],
                "genes": ["AT1G05010", "AT1G12345", "OS01G0123400"],
                "description": "Core protein of photosystem II"
            }
        }

class Gene(BaseModel):
    """Gene model with ontology terms"""
    id: str
    label: str
    species_id: str
    species_name: Optional[str] = None
    orthogroup_id: Optional[str] = None
    chromosome: Optional[str] = None
    start: Optional[int] = None
    end: Optional[int] = None
    strand: Optional[str] = None
    go_terms: Optional[List[GOTerm]] = None
    po_terms: Optional[List[POTerm]] = None
    to_terms: Optional[List[TOTerm]] = None
    external_links: Optional[List[ExternalLink]] = None
    uri: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "id": "AT1G05010",
                "label": "AHA1",
                "species_id": "ath",
                "species_name": "Arabidopsis thaliana",
                "orthogroup_id": "OG0000123",
                "chromosome": "1",
                "start": 1000,
                "end": 5000,
                "strand": "+",
                "go_terms": [
                    {
                        "id": "GO:0005515",
                        "name": "protein binding",
                        "definition": "Interacting selectively and non-covalently with any protein or protein complex.",
                        "aspect": "F",
                        "evidence_code": "IDA"
                    }
                ],
                "external_links": [
                    {
                        "database": "TAIR",
                        "id": "AT1G05010",
                        "url": "https://www.arabidopsis.org/servlets/TairObject?id=137151&type=locus"
                    }
                ]
            }
        }

# Response models
class SpeciesTreeNode(BaseModel):
    """Node in species tree visualization"""
    id: str
    name: str
    children: Optional[List['SpeciesTreeNode']] = None
    data: Optional[Dict[str, Any]] = None
    
SpeciesTreeNode.update_forward_refs()

class BiologicalResponse(BaseModel):
    """Base response model for biological data"""
    success: bool
    message: Optional[str] = None
    
class SpeciesResponse(BiologicalResponse):
    """Response with species data"""
    data: List[Species]
    
class OrthoGroupResponse(BiologicalResponse):
    """Response with orthogroup data"""
    data: List[OrthoGroup]
    species_id: Optional[str] = None
    
class GeneResponse(BiologicalResponse):
    """Response with gene data"""
    data: List[Gene]
    orthogroup_id: Optional[str] = None
    
class GeneDetailResponse(BiologicalResponse):
    """Response with detailed gene data"""
    data: Gene 