# BioSemanticViz Project Architecture

## 🎯 Project Overview

**Purpose**: A specialized biological data visualization platform for semantic ontological data  
**Tech Stack**: React/TypeScript (Frontend) + FastAPI/Flask (Backend)  
**Focus**: Species trees, orthogroups, gene hierarchies, and ontology term exploration

## 🏗️ Architecture Analysis

### Frontend Structure
```
frontend/
├── src/
│   ├── components/          # Well-organized React components
│   │   ├── biology/         # Specialized bio components
│   │   ├── pages/           # Page-level components
│   │   └── visualizations/  # D3.js visualizations
│   ├── services/           # API layer (clean separation)
│   ├── types/              # TypeScript definitions
│   └── router.tsx          # React Router v6 setup
```

**Strengths**:
- Modular component architecture
- Clean separation of concerns
- TypeScript for type safety
- Modern React patterns with hooks

### Backend Structure
```
backend/
├── app/
│   ├── api/               # API routes
│   ├── services/          # Business logic
│   ├── models/            # Data models
│   └── mock_data/         # Sample data
├── examples/              # Sample biological data
└── flask_app.py          # Simplified Flask fallback
```

**Observations**:
- Dual backend approach (FastAPI + Flask)
- Well-structured service layer
- RDF/OWL file processing capabilities

## 🔍 Key Components Analysis

### 1. **Data Ingestion Service**
- Supports .ttl, .rdf, .owl files
- Extracts nodes and edges
- Generates statistics
- Could use async file processing for large files

### 2. **Semantic Reasoning Service**
- Multiple analysis types (basic, hierarchical, evolutionary)
- Centrality calculations
- Clustering capabilities
- Some analysis methods return generic JSON structures

### 3. **Visualization Components**
- NetworkGraph - Interactive network visualization
- PhylogeneticTree - Hierarchical trees
- SpeciesTree - Species hierarchy
- Missing: Gene details view with GO/PO/TO terms

## 🎯 Alignment with Requirements

Based on the need for a **Species Tree → Gene Tree → Gene Details** flow:

### What's Good ✅
1. Species tree component exists
2. Basic data models for genes and ontology terms
3. API structure supports hierarchical navigation
4. Frontend routing for drill-down navigation

### What's Missing ❌
1. **Orthogroup-centric navigation**: Current implementation is visualization-focused
2. **GO/PO/TO term selector**: Not properly implemented
3. **Gene details with external links**: Partial implementation
4. **Hierarchical drill-down flow**: Not fully connected

## 🛠️ Immediate Improvements Needed

### 1. **Backend Data Model Enhancement**
```python
# Add to backend/app/models/biological_models.py
class OrthoGroup(BaseModel):
    id: str
    name: str
    species: List[str]
    genes: List[str]
    description: Optional[str]

class Gene(BaseModel):
    id: str
    label: str
    species_id: str
    orthogroup_id: str
    go_terms: List[GOTerm]
    po_terms: List[POTerm]
    to_terms: List[TOTerm]
    external_links: List[ExternalLink]
    uri: str
```

### 2. **API Route Refinement**
```python
# backend/app/api/biological_routes.py
@router.get("/species/{species_id}/orthogroups")
async def get_species_orthogroups(species_id: str):
    # Return orthogroups for specific species

@router.get("/orthogroup/{og_id}/genes")
async def get_orthogroup_genes(og_id: str):
    # Return genes in orthogroup

@router.get("/gene/{gene_id}/details")
async def get_gene_details(gene_id: str):
    # Full gene details with all terms and links
```

### 3. **Frontend Flow Implementation**
```tsx
// frontend/src/components/pages/BiologicalExplorer.tsx
const BiologicalExplorer = () => {
  const [currentView, setCurrentView] = useState('species');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [selectedOrthogroup, setSelectedOrthogroup] = useState(null);
  
  // Implement breadcrumb navigation
  // species → orthogroups → genes → gene details
};
```

## 🚀 Recommended Action Plan

### Phase 1: Core Functionality (1-2 weeks)
1. Fix the hierarchical data models
2. Implement proper API endpoints for drill-down navigation
3. Create the BiologicalExplorer component
4. Add proper term selectors (GO/PO/TO)

### Phase 2: Polish & Features (1 week)
1. Add breadcrumb navigation
2. Implement external link handling
3. Add search functionality across all levels
4. Improve error handling and loading states

### Phase 3: Optimization (Ongoing)
1. Performance optimization for large datasets
2. Add caching for frequently accessed data
3. Implement data export features

## 📊 Technical Debt Assessment

### High Priority 🔴
1. **Dual backend architecture**: Choose FastAPI or Flask, not both
2. **Missing type safety**: Some API responses lack proper typing
3. **Incomplete navigation flow**: Current implementation is too visualization-focused

### Medium Priority 🟡
1. **ESLint warnings**: Need to fix unused variables and missing dependencies
2. **Test coverage**: Missing unit and integration tests
3. **Error boundaries**: Need better error handling in React components

### Low Priority 🟢
1. **Documentation**: API documentation could be more comprehensive
2. **UI polish**: Some components need styling improvements
3. **Mobile responsiveness**: Not fully optimized for mobile

## 💡 Final Recommendations

1. **Focus on the biological workflow**: Prioritize species → orthogroup → gene → details navigation
2. **Simplify the backend**: Choose one framework (recommend FastAPI)
3. **Implement proper data models**: Use Pydantic for strict typing
4. **Build the drill-down UI**: Create a focused biological explorer
5. **Add comprehensive term handling**: Proper GO/PO/TO integration 