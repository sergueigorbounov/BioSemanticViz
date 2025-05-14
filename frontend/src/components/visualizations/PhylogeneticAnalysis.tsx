import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Snackbar,
  Alert,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tab,
  Tabs,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  uploadTreeFile,
  getExampleTree,
  PhyloNodeData
} from '../../api/phyloClient';
// Import API client for orthologue data
import { searchOrthologue } from '../../api/orthologueClient';
// Use our custom wrapper instead of importing directly
import TaxoniumViewer from './TaxoniumViewer';
// Import the simple Taxonium wrapper
import SimpleTaxoniumWrapper from './SimpleTaxoniumWrapper';
// Keep the iframe wrapper as a fallback
import TaxoniumIframeWrapper from './TaxoniumIframeWrapper';

interface NodeDetail {
  id: string;
  name?: string;
  branch_length?: number;
  orthogroups?: any[];
  [key: string]: any;
}

/**
 * Phylogenetic tree analysis component
 */
const PhylogeneticAnalysis: React.FC = () => {
  const [treeData, setTreeData] = useState<PhyloNodeData | null>(null);
  const [newickData, setNewickData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<'native' | 'taxonium' | 'professional'>('professional');
  const [treeType, setTreeType] = useState<'species' | 'gene'>('species');
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [loadingOrthogroups, setLoadingOrthogroups] = useState<boolean>(false);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);
    setSelectedNode(null); // Clear selected node when loading new tree

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      const result = await uploadTreeFile(formData);
      setTreeData(result.tree);
      setNewickData(result.newick);
    } catch (err: any) {
      setError(err.message || 'Failed to upload tree file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add a handler for loading example tree
  const handleLoadExample = async () => {
    setLoading(true);
    setError(null);
    setSelectedNode(null); // Clear selected node when loading new tree
    
    try {
      const result = await getExampleTree();
      setTreeData(result.tree);
      setNewickData(result.newick);
    } catch (err: any) {
      setError(err.message || 'Failed to load example tree');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle visualization mode change
  const handleVisualizationModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVisualizationMode(event.target.value as 'native' | 'taxonium' | 'professional');
  };

  // Handle tree type change
  const handleTreeTypeChange = (_event: React.SyntheticEvent, newValue: 'species' | 'gene') => {
    setTreeType(newValue);
    setSelectedNode(null); // Clear selected node when switching tree types
  };

  // Handle node selection
  const handleNodeSelect = async (node: any) => {
    if (!node) return;
    
    setSelectedNode({
      id: node.id,
      name: node.name,
      branch_length: node.branch_length,
      ...node
    });
    
    // Only load orthogroups for species tree nodes
    if (treeType === 'species' && node.id) {
      setLoadingOrthogroups(true);
      try {
        // Fetch orthogroups for the selected node
        const orthogroups = await searchOrthologue({ 
          species: node.name || node.id, 
          limit: 10 
        });
        
        // Update the selected node with orthogroups data
        setSelectedNode(prev => prev ? {
          ...prev,
          orthogroups: orthogroups.results
        } : null);
      } catch (err) {
        console.error('Failed to load orthogroups:', err);
      } finally {
        setLoadingOrthogroups(false);
      }
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Phylogenetic Tree Analysis
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload or Select a Tree
        </Typography>
        
        <Box sx={{ my: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={loading}
          >
            Upload Tree File
            <input
              type="file"
              accept=".nwk,.newick,.tree,.txt"
              hidden
              onChange={handleFileUpload}
            />
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleLoadExample}
            disabled={loading}
          >
            Load Example
          </Button>
          
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2">Processing...</Typography>
            </Box>
          )}
        </Box>
        
        {error && (
          <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Snackbar>
        )}
      </Paper>
      
      {treeData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <Typography variant="h6">Tree Visualization</Typography>
                
                <Box>
                  {/* Tree Type Selector */}
                  <Tabs
                    value={treeType}
                    onChange={handleTreeTypeChange}
                    sx={{ mr: 3, display: 'inline-flex' }}
                  >
                    <Tab value="species" label="Species Tree" />
                    <Tab value="gene" label="Gene Tree" />
                  </Tabs>
                  
                  {/* Visualization Mode Selector */}
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      name="visualization-mode"
                      value={visualizationMode}
                      onChange={handleVisualizationModeChange}
                    >
                      <FormControlLabel 
                        value="native" 
                        control={<Radio />} 
                        label="D3 Basic" 
                      />
                      <FormControlLabel 
                        value="taxonium" 
                        control={<Radio />} 
                        label="Taxonium Iframe" 
                      />
                      <FormControlLabel 
                        value="professional" 
                        control={<Radio />} 
                        label="Professional" 
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>
              </Box>
              
              <Box sx={{ height: 600, width: '100%', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                {visualizationMode === 'native' ? (
                  <TaxoniumViewer 
                    treeData={treeData}
                    width={1100}
                    height={580}
                    colorBy="none"
                  />
                ) : visualizationMode === 'taxonium' ? (
                  <TaxoniumIframeWrapper
                    treeData={treeData}
                    newick={newickData}
                    onNodeSelect={handleNodeSelect}
                    showMetadata={true}
                  />
                ) : (
                  <SimpleTaxoniumWrapper
                    treeData={treeData}
                    newick={newickData}
                    onNodeSelect={handleNodeSelect}
                    colorBy={treeType === 'species' ? 'clade' : 'name'}
                    config={{
                      showMetadata: true,
                      showLabels: true,
                      initialMaxNodes: 1000,
                      treePaintDate: true,
                      // Scientific visualization settings
                      scientificNotation: true,
                      branchWidthFactor: 2,
                      highlightSelectedPath: true
                    }}
                  />
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Node Details Panel */}
          {selectedNode && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Selected Node Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary">Basic Information</Typography>
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" display="inline">ID: </Typography>
                          <Typography variant="body2" display="inline">
                            {selectedNode.id || 'N/A'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" display="inline">Name: </Typography>
                          <Typography variant="body2" display="inline">
                            {selectedNode.name || 'Unnamed'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" display="inline">Branch Length: </Typography>
                          <Typography variant="body2" display="inline">
                            {selectedNode.branch_length?.toFixed(5) || 'N/A'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {treeType === 'species' && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" color="primary">Orthogroups</Typography>
                            {loadingOrthogroups && <CircularProgress size={20} />}
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          
                          {selectedNode.orthogroups ? (
                            selectedNode.orthogroups.length > 0 ? (
                              <Box component="ul" sx={{ pl: 2 }}>
                                {selectedNode.orthogroups.map((og: any, index: number) => (
                                  <Box component="li" key={index}>
                                    <Typography variant="body2">
                                      {og.id || og.name}: {og.gene_count || 0} genes
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2">No orthogroups found</Typography>
                            )
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {loadingOrthogroups ? 'Loading...' : 'Click on a node to see orthogroups'}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default PhylogeneticAnalysis; 