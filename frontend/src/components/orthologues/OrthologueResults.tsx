import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { OrthologueSearchResponse, OrthoSpeciesCount, OrthologueData } from '../../api/orthologueClient';
import PhylogeneticTreeView from './PhylogeneticTreeView';

// Create a context for species selection to improve synchronization
interface SpeciesSelectionContextType {
  selectedSpecies: string | null;
  setSelectedSpecies: (species: string | null) => void;
  isSpeciesSelected: (speciesName: string) => boolean;
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

const SpeciesSelectionContext = createContext<SpeciesSelectionContextType | undefined>(undefined);

// Create a hook to use the species selection context
const useSpeciesSelection = () => {
  const context = useContext(SpeciesSelectionContext);
  if (context === undefined) {
    throw new Error('useSpeciesSelection must be used within a SpeciesSelectionProvider');
  }
  return context;
};

// Create a provider component for the species selection context
const SpeciesSelectionProvider: React.FC<{ children: React.ReactNode, activeTab: number, setActiveTab: (tab: number) => void }> = ({ 
  children, 
  activeTab,
  setActiveTab 
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);

  // Helper to check if a species is selected (with normalization for comparison)
  const isSpeciesSelected = useCallback((speciesName: string): boolean => {
    if (!selectedSpecies) return false;
    
    // Normalize both strings for case-insensitive comparison
    const normalized1 = speciesName.toLowerCase().trim();
    const normalized2 = selectedSpecies.toLowerCase().trim();
    
    return normalized1 === normalized2 || 
           normalized1.includes(normalized2) || 
           normalized2.includes(normalized1);
  }, [selectedSpecies]);

  // Log when selectedSpecies changes for debugging
  useEffect(() => {
    console.log("SpeciesSelectionContext - selectedSpecies state:", selectedSpecies);
  }, [selectedSpecies]);

  const value = { selectedSpecies, setSelectedSpecies, isSpeciesSelected, activeTab, setActiveTab };
  return <SpeciesSelectionContext.Provider value={value}>{children}</SpeciesSelectionContext.Provider>;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`orthologue-tabpanel-${index}`}
      aria-labelledby={`orthologue-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface OrthologueResultsProps {
  results: OrthologueSearchResponse;
}

// Species Distribution Chips component
const SpeciesDistributionChips: React.FC<{ speciesCounts: OrthoSpeciesCount[] }> = ({ speciesCounts }) => {
  const { selectedSpecies, setSelectedSpecies, isSpeciesSelected, setActiveTab } = useSpeciesSelection();

  const handleSpeciesClick = useCallback((species: string) => {
    console.log(`Species chip clicked: ${species}`);
    
    // Toggle selection - if already selected, clear it
    setSelectedSpecies(selectedSpecies === species ? null : species);
    
    // If selecting a species (not clearing), navigate to tree tab (index 1)
    if (selectedSpecies !== species) {
      console.log("Navigating to tree tab after species selection");
      setActiveTab(1); // Switch to Tree tab
    }
  }, [selectedSpecies, setSelectedSpecies, setActiveTab]);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {speciesCounts
        .filter(s => s.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((species) => {
          const speciesName = species.species_name || species.species_id;
          const isSelected = isSpeciesSelected(speciesName);
          
          return (
            <Chip
              key={species.species_id}
              label={`${speciesName} (${species.count})`}
              size="small"
              onClick={() => handleSpeciesClick(speciesName)}
              color={isSelected ? "primary" : "default"}
              variant={isSelected ? "filled" : "outlined"}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#e3f2fd' }
              }}
            />
          );
        })}
    </Box>
  );
};

// Tree View wrapper component using the context
const TreeViewWrapper: React.FC<{ newickData: string, speciesCounts: OrthoSpeciesCount[] }> = ({ newickData, speciesCounts }) => {
  const { selectedSpecies, setSelectedSpecies } = useSpeciesSelection();
  const [treeData, setTreeData] = useState<boolean>(false);

  const handleTreeSpeciesSelected = useCallback((speciesName: string | null) => {
    console.log("Species selected from tree:", speciesName);
    setSelectedSpecies(speciesName);
  }, [setSelectedSpecies]);

  return (
    <PhylogeneticTreeView 
      newickData={newickData} 
      speciesCounts={speciesCounts}
      selectedSpecies={selectedSpecies}
      onSpeciesSelected={handleTreeSpeciesSelected}
      onTreeDataLoad={() => setTreeData(true)}
    />
  );
};

// Alignments table component using the context
const AlignmentsTable: React.FC<{ orthologues: OrthologueData[] }> = ({ orthologues }) => {
  const { selectedSpecies, setSelectedSpecies, isSpeciesSelected, setActiveTab } = useSpeciesSelection();

  const handleRowClick = useCallback((species: string) => {
    console.log(`Alignment row clicked: ${species}`);
    // Toggle selection - if already selected, clear it
    setSelectedSpecies(selectedSpecies === species ? null : species);
    
    // If selecting a species (not clearing), navigate to tree tab (index 1)
    if (selectedSpecies !== species) {
      console.log("Navigating to tree tab after row selection");
      setActiveTab(1); // Switch to Tree tab
    }
  }, [selectedSpecies, setSelectedSpecies, setActiveTab]);

  return (
    <TableContainer sx={{ maxHeight: '600px' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Species</TableCell>
            <TableCell>Gene ID</TableCell>
            <TableCell>Species ID</TableCell>
            <TableCell>Orthogroup</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orthologues.map((ortho, idx) => {
            const isSelected = isSpeciesSelected(ortho.species_name);
            
            return (
              <TableRow 
                key={idx}
                hover
                onClick={() => handleRowClick(ortho.species_name)}
                selected={isSelected}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : undefined
                }}
              >
                <TableCell>{ortho.species_name}</TableCell>
                <TableCell>{ortho.gene_id}</TableCell>
                <TableCell>{ortho.species_id}</TableCell>
                <TableCell>{ortho.orthogroup_id}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const OrthologueResults: React.FC<OrthologueResultsProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // Handle tab changes
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Calculate species with orthologues vs total species
  const speciesWithOrthologues = results.counts_by_species.filter(s => s.count > 0).length;
  const totalSpecies = results.counts_by_species.length;
  
  // Get the total number of orthologues (count of items in the array)
  const totalOrthologues = results.orthologues.length;

  return (
    <SpeciesSelectionProvider activeTab={activeTab} setActiveTab={setActiveTab}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="orthologue results tabs"
          >
            <Tab label="Summary" />
            <Tab label="Tree" />
            <Tab label="Alignments" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <TableContainer sx={{ maxHeight: '500px' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="subtitle1">
                      Summary of Orthologues
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2">
                      Total orthologues found: <strong>{totalOrthologues}</strong>
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2">
                      Species with orthologues: <strong>{speciesWithOrthologues}</strong> out of <strong>{totalSpecies}</strong> species
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Species Distribution
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Click on a species to highlight it in all views
                    </Typography>
                    <SpeciesDistributionChips speciesCounts={results.counts_by_species} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">
                      Details
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Query Gene</TableCell>
                  <TableCell colSpan={2}>
                    {results.gene_id}
                  </TableCell>
                </TableRow>
                {results.orthogroup_id && (
                  <TableRow>
                    <TableCell>Orthogroup</TableCell>
                    <TableCell colSpan={2}>{results.orthogroup_id}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ 
            height: '600px', 
            width: '100%', 
            position: 'relative',
            bgcolor: 'background.paper',
            boxShadow: 1,
            borderRadius: 1,
            p: 1
          }}>
            {results.newick_tree ? (
              <TreeViewWrapper 
                newickData={results.newick_tree}
                speciesCounts={results.counts_by_species}
              />
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>No phylogenetic tree data available</Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <AlignmentsTable orthologues={results.orthologues} />
        </TabPanel>
      </Box>
    </SpeciesSelectionProvider>
  );
};

export default OrthologueResults; 