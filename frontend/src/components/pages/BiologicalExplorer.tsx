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
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { SpeciesTree } from '../visualizations/SpeciesTree';
import { api } from '../../services/api';

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
  GENE_DETAILS = 'gene_details'
}

const BiologicalExplorer: React.FC = () => {
  // State management
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SPECIES_VIEW);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [selectedOrthogroup, setSelectedOrthogroup] = useState<OrthoGroup | null>(null);
  const [selectedGene, setSelectedGene] = useState<Gene | null>(null);
  
  const [speciesData, setSpeciesData] = useState<Species[]>([]);
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
        const response = await api.get('/api/species-tree');
        setSpeciesData(response.data);
      } catch (err) {
        setError('Failed to load species data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeciesData();
  }, []);
  
  // Handle species selection
  const handleSpeciesSelect = async (species: Species) => {
    setSelectedSpecies(species);
    setCurrentView(ViewState.ORTHOGROUP_VIEW);
    
    setLoading(true);
    try {
      const response = await api.get(`/api/species/${species.id}/orthogroups`);
      setOrthogroups(response.data);
    } catch (err) {
      setError('Failed to load orthogroups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle orthogroup selection
  const handleOrthogroupSelect = async (orthogroup: OrthoGroup) => {
    setSelectedOrthogroup(orthogroup);
    setCurrentView(ViewState.GENE_VIEW);
    
    setLoading(true);
    try {
      const response = await api.get(`/api/orthogroup/${orthogroup.id}/genes`);
      setGenes(response.data);
    } catch (err) {
      setError('Failed to load genes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle gene selection
  const handleGeneSelect = (gene: Gene) => {
    setSelectedGene(gene);
    setCurrentView(ViewState.GENE_DETAILS);
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
            <SpeciesTree data={speciesData} onSpeciesSelect={handleSpeciesSelect} />
          </Paper>
        );
        
      // Placeholders for other views - would be implemented with actual components
      case ViewState.ORTHOGROUP_VIEW:
        return (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Orthogroups for {selectedSpecies?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              This would display orthogroups for the selected species
            </Typography>
            {/* Would be replaced with actual orthogroup list component */}
          </Paper>
        );
        
      case ViewState.GENE_VIEW:
        return (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Genes in {selectedOrthogroup?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              This would display genes in the selected orthogroup
            </Typography>
            {/* Would be replaced with actual gene list component */}
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
              {activeTab === 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    This would display general information about the selected gene
                  </Typography>
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
        {renderContent()}
      </Box>
    </Container>
  );
};

export default BiologicalExplorer; 