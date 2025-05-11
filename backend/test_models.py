#!/usr/bin/env python3
"""
Test script to verify that our biological models can be imported and used.
"""

import sys
import os

# Add the current directory to the path so we can import the app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.models.biological_models import (
        Species, OrthoGroup, Gene, SpeciesTreeNode,
        GoTerm, ExternalLink,
        SpeciesResponse, OrthoGroupResponse, GeneResponse, GeneDetailResponse
    )
    print("✅ Successfully imported biological models")

    # Test creating a species
    species = Species(id="test", name="Test Species")
    print(f"✅ Created species: {species}")

    # Test creating a gene
    gene = Gene(id="gene1", name="Test Gene", species_id="test")
    print(f"✅ Created gene: {gene}")

    # Test creating a species tree node
    node = SpeciesTreeNode(id="node1", name="Test Node")
    print(f"✅ Created species tree node: {node}")

    # Test creating a response
    response = SpeciesResponse(success=True, data=[species])
    print(f"✅ Created species response: {response}")

except Exception as e:
    print(f"❌ Error importing or using models: {e}")
    import traceback
    traceback.print_exc() 