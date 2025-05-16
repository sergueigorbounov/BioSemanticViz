import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { OrthologueSearchResponse } from '../../api/orthologueClient';
import PhylogeneticTreeView from './PhylogeneticTreeView';

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

const OrthologueResults: React.FC<OrthologueResultsProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<boolean>(false);
  
  // Track if selection came from a specific tab to avoid unnecessary tab switching
  const selectionSource = useRef<string | null>(null);
  
  // Handle tab changes
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Use useCallback to memoize the handler and improve performance
  const handleSpeciesClick = useCallback((species: string, source: string = 'summary') => {
    console.log(`Species selected from ${source}: ${species}`);
    selectionSource.current = source;
    
    // Toggle selection - if already selected, clear it
    setSelectedSpecies(prevSelected => {
      const newSelected = prevSelected === species ? null : species;
      console.log(`Species selection changed from ${prevSelected} to ${newSelected}`);
      
      // Switch to appropriate tab based on source, unless clearing selection
      if (newSelected !== null) {
        // If selection came from summary or alignments, show the tree
        if (source === 'summary' || source === 'alignments') {
          setActiveTab(1); // Switch to Tree tab
        }
        // If selection came from tree, show the alignments
        else if (source === 'tree' && activeTab !== 2) {
          setActiveTab(2); // Switch to Alignments tab
        }
      }
      
      return newSelected;
    });
  }, [activeTab]);
  
  // Handle species selection from the tree
  const handleTreeSpeciesSelected = useCallback((speciesName: string | null) => {
    console.log("Species selected from tree:", speciesName);
    if (speciesName) {
      handleSpeciesClick(speciesName, 'tree');
    } else {
      selectionSource.current = 'tree';
      setSelectedSpecies(null);
    }
  }, [handleSpeciesClick]);
  
  // Log when selectedSpecies changes for debugging
  useEffect(() => {
    console.log("OrthologueResults - selectedSpecies state:", selectedSpecies);
  }, [selectedSpecies]);

  // Calculate species with orthologues vs total species
  const speciesWithOrthologues = results.counts_by_species.filter(s => s.count > 0).length;
  const totalSpecies = results.counts_by_species.length;
  
  // Get the total number of orthologues (count of items in the array)
  const totalOrthologues = results.orthologues.length;

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

  return (
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
                    Click on a species to highlight it in the tree view
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {results.counts_by_species
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
                            onClick={() => handleSpeciesClick(speciesName, 'summary')}
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
            <PhylogeneticTreeView 
              newickData={results.newick_tree} 
              speciesCounts={results.counts_by_species}
              selectedSpecies={selectedSpecies}
              onSpeciesSelected={handleTreeSpeciesSelected}
              onTreeDataLoad={() => setTreeData(true)}
            />
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography>No phylogenetic tree data available</Typography>
            </Box>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
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
              {results.orthologues.map((ortho, idx) => {
                const isSelected = isSpeciesSelected(ortho.species_name);
                
                return (
                  <TableRow 
                    key={idx}
                    hover
                    onClick={() => handleSpeciesClick(ortho.species_name, 'alignments')}
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
      </TabPanel>
    </Box>
  );
};

export default OrthologueResults; 