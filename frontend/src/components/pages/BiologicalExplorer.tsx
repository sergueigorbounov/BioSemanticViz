import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  ButtonGroup,
  Button,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ViewListIcon from '@mui/icons-material/ViewList';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BiotechIcon from '@mui/icons-material/Biotech';
import SpeciesTree from '../visualizations/SpeciesTree';
import axios from 'axios';
import { SpeciesTreeData } from '../../types/biology';
import HierarchicalBioTree, { TreeNodeData } from '../visualizations/HierarchicalBioTree';
import TaxoniumViewer from '../visualizations/TaxoniumViewer';
import api from '../../services/api';

// Types for our biological entities
interface Species {
  id: string;
  name: string;
  taxonId: string;
  commonName?: string;
}

interface OrthoGroup {
  id: string;
  name: string;
  species: string[];
  genes: string[];
  description?: string;
}

interface Gene {
  id: string;
  label: string;
  speciesId: string;
  orthoGroupId: string;
}

enum ViewState {
  SPECIES_VIEW = 'species',
  ORTHOGROUP_VIEW = 'orthogroup',
  GENE_VIEW = 'gene',
  GENE_DETAILS = 'gene_details',
  HIERARCHY_VIEW = 'hierarchy',
  TAXONIUM_VIEW = 'taxonium'
}

// Create API client
const client = api;

const BiologicalExplorer: React.FC = () => {
  // State management
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SPECIES_VIEW);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [selectedOrthogroup, setSelectedOrthogroup] = useState<OrthoGroup | null>(null);
  const [selectedGene, setSelectedGene] = useState<Gene | null>(null);
  
  const [speciesData, setSpeciesData] = useState<SpeciesTreeData | null>(null);
  const [orthogroups, setOrthogroups] = useState<OrthoGroup[]>([]);
  const [genes, setGenes] = useState<Gene[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Load initial species data
  useEffect(() => {
    const fetchSpeciesData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await client.get('/api/species-tree');
        setLoading(false);
        setSpeciesData(response.data);
      } catch (error) {
        console.error(error);
        setLoading(false);
        setError('Failed to load species tree data');
      }
    };

    fetchSpeciesData();
  }, []);
  
  // Handle species selection
  const handleSpeciesSelect = async (speciesId: string) => {
    setLoading(true);
    try {
      // First get the species details
      const speciesResponse = await client.get(`/api/species/${speciesId}`);
      if (speciesResponse.data?.success && speciesResponse.data.data.length > 0) {
        const species = speciesResponse.data.data[0];
        setSelectedSpecies(species);
        setCurrentView(ViewState.ORTHOGROUP_VIEW);
        
        // Then get the orthogroups
        const response = await client.get(`/api/species/${speciesId}/orthogroups`);
        if (response.data?.success) {
          setOrthogroups(response.data.data);
        } else {
          setError('No orthogroups found for this species');
        }
      } else {
        setError('Species not found');
      }
    } catch (err) {
      setError('Failed to load species and orthogroups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle orthogroup selection
  const handleOrthogroupSelect = async (orthogroupId: string) => {
    setLoading(true);
    try {
      // First get the orthogroup details
      const ogResponse = await client.get(`/api/orthogroup/${orthogroupId}`);
      if (ogResponse.data?.success && ogResponse.data.data.length > 0) {
        const orthogroup = ogResponse.data.data[0];
        setSelectedOrthogroup(orthogroup);
        setCurrentView(ViewState.GENE_VIEW);
        
        // Then get the genes
        const response = await client.get(`/api/orthogroup/${orthogroupId}/genes`);
        if (response.data?.success) {
          setGenes(response.data.data);
        } else {
          setError('No genes found for this orthogroup');
        }
      } else {
        setError('Orthogroup not found');
      }
    } catch (err) {
      setError('Failed to load orthogroup and genes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle gene selection
  const handleGeneSelect = async (geneId: string) => {
    setLoading(true);
    try {
      const response = await client.get(`/api/gene/${geneId}`);
      if (response.data?.success && response.data.data) {
        setSelectedGene(response.data.data);
        setCurrentView(ViewState.GENE_DETAILS);
      } else {
        setError('Gene not found');
      }
    } catch (err) {
      setError('Failed to load gene details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Navigate back to species view
  const resetToSpeciesView = () => {
    setCurrentView(ViewState.SPECIES_VIEW);
    setSelectedSpecies(null);
    setSelectedOrthogroup(null);
    setSelectedGene(null);
  };
  
  // Render breadcrumb navigation
  const renderBreadcrumbs = () => (
    <Breadcrumbs 
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 3 }}
    >
      <Link 
        color="inherit" 
        href="#"
        onClick={(e) => {
          e.preventDefault();
          resetToSpeciesView();
        }}
      >
        Species
      </Link>
      
      {selectedSpecies && (
        <Link
          color={currentView === ViewState.ORTHOGROUP_VIEW ? 'text.primary' : 'inherit'}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (selectedSpecies) {
              setCurrentView(ViewState.ORTHOGROUP_VIEW);
              setSelectedGene(null);
            }
          }}
        >
          {selectedSpecies.name} Orthogroups
        </Link>
      )}
      
      {selectedOrthogroup && (
        <Link
          color={currentView === ViewState.GENE_VIEW ? 'text.primary' : 'inherit'}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (selectedOrthogroup) {
              setCurrentView(ViewState.GENE_VIEW);
              setSelectedGene(null);
            }
          }}
        >
          {selectedOrthogroup.name} Genes
        </Link>
      )}
      
      {selectedGene && (
        <Typography color="text.primary">
          {selectedGene.label} Details
        </Typography>
      )}
    </Breadcrumbs>
  );

  // Prepare the initial tree data for the hierarchical view
  const prepareInitialTreeData = () => {
    if (!speciesData) return null;
    
    // Transform the species tree data to the format our component expects
    const transformNode = (node: any): TreeNodeData => {
      return {
        id: node.id,
        name: node.name,
        type: node.type || 'species',
        scientific_name: node.scientific_name,
        common_name: node.common_name,
        taxonomy_id: node.taxonomy_id,
        children: node.children ? node.children.map(transformNode) : [],
        _childrenLoaded: !!node.children?.length
      };
    };
    
    return transformNode(speciesData);
  };

  // Render content based on current view
  const renderContent = () => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    }
    
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    
    switch (currentView) {
      case ViewState.SPECIES_VIEW:
        return (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Species Tree</Typography>
            <SpeciesTree treeData={speciesData} onSpeciesSelect={handleSpeciesSelect} />
          </Paper>
        );
        
      case ViewState.ORTHOGROUP_VIEW:
        return (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Orthogroups for {selectedSpecies?.name}</Typography>
            {orthogroups.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {orthogroups.map((og) => (
                  <Paper 
                    key={og.id} 
                    sx={{ p: 2, mb: 2, cursor: 'pointer' }}
                    onClick={() => handleOrthogroupSelect(og.id)}
                  >
                    <Typography variant="subtitle1">{og.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(og as any).description || 'No description available'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        Species: {og.species.join(', ')} | Genes: {og.genes.length}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No orthogroups found for this species
              </Typography>
            )}
          </Paper>
        );
        
      case ViewState.GENE_VIEW:
        return (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Genes in {selectedOrthogroup?.name}</Typography>
            {genes.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {genes.map((gene) => (
                  <Paper 
                    key={gene.id} 
                    sx={{ p: 2, mb: 2, cursor: 'pointer' }}
                    onClick={() => handleGeneSelect(gene.id)}
                  >
                    <Typography variant="subtitle1">{gene.label}</Typography>
                    <Typography variant="body2">ID: {gene.id}</Typography>
                    <Typography variant="body2">Species: {gene.speciesId}</Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No genes found in this orthogroup
              </Typography>
            )}
          </Paper>
        );
        
      case ViewState.GENE_DETAILS:
        return (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>{selectedGene?.label} Details</Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="gene detail tabs">
                <Tab label="General Info" id="tab-0" />
                <Tab label="GO Terms" id="tab-1" />
                <Tab label="PO Terms" id="tab-2" />
                <Tab label="TO Terms" id="tab-3" />
              </Tabs>
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 0}>
              {activeTab === 0 && selectedGene && (
                <Box>
                  <Typography variant="body1">ID: {selectedGene.id}</Typography>
                  <Typography variant="body1">Species: {selectedGene.speciesId}</Typography>
                  <Typography variant="body1">Orthogroup: {selectedGene.orthoGroupId}</Typography>
                </Box>
              )}
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 1}>
              {activeTab === 1 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    This would display Gene Ontology terms
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 2}>
              {activeTab === 2 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    This would display Plant Ontology terms
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 3}>
              {activeTab === 3 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    This would display Trait Ontology terms
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        );
        
      case ViewState.HIERARCHY_VIEW:
        return (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Biological Hierarchy</Typography>
            {speciesData ? (
              <HierarchicalBioTree 
                initialData={prepareInitialTreeData() || {
                  id: 'root',
                  name: 'No Data Available',
                  type: 'species',
                  children: []
                }} 
                width={800} 
                height={600}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </Paper>
        );
        
      case ViewState.TAXONIUM_VIEW:
        return (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Phylogenetic Tree (Taxonium)</Typography>
            {speciesData ? (
              <TaxoniumViewer 
                treeData={prepareInitialTreeData() || {
                  id: 'root',
                  name: 'No Data Available',
                  children: []
                }} 
                width={800} 
                height={600}
                colorBy="species"
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </Paper>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Biological Explorer
        </Typography>
        
        {renderBreadcrumbs()}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <ButtonGroup variant="outlined" size="small">
            <Button 
              startIcon={<ViewListIcon />}
              variant={currentView !== ViewState.HIERARCHY_VIEW && currentView !== ViewState.TAXONIUM_VIEW ? "contained" : "outlined"}
              onClick={() => setCurrentView(ViewState.SPECIES_VIEW)}
            >
              Standard View
            </Button>
            <Button 
              startIcon={<AccountTreeIcon />}
              variant={currentView === ViewState.HIERARCHY_VIEW ? "contained" : "outlined"}
              onClick={() => setCurrentView(ViewState.HIERARCHY_VIEW)}
            >
              Hierarchy View
            </Button>
            <Button 
              startIcon={<BiotechIcon />}
              variant={currentView === ViewState.TAXONIUM_VIEW ? "contained" : "outlined"}
              onClick={() => setCurrentView(ViewState.TAXONIUM_VIEW)}
            >
              Phylogenetic View
            </Button>
          </ButtonGroup>
        </Box>
        
        {renderContent()}
      </Box>
    </Container>
  );
};

export default BiologicalExplorer; 