import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  uploadTreeFile,
  getExampleTree,
  PhyloNodeData
} from '../../api/phyloClient';
// Use our custom wrapper instead of importing directly
// import TaxoniumWrapper from './TaxoniumWrapper';
// Keep the native D3-based implementation as a fallback
import TaxoniumViewer from './TaxoniumViewer';
// Import the iframe wrapper
import TaxoniumIframeWrapper from './TaxoniumIframeWrapper';

/**
 * Phylogenetic tree analysis component
 */
const PhylogeneticAnalysis: React.FC = () => {
  const [treeData, setTreeData] = useState<PhyloNodeData | null>(null);
  const [newickData, setNewickData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<'native' | 'taxonium'>('native');

  // At the beginning of the component, add this to warn users not to use Taxonium
  useEffect(() => {
    console.log("Note: Taxonium option has React compatibility issues. Using the native D3 visualization is recommended.");
  }, []);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

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
    setVisualizationMode(event.target.value as 'native' | 'taxonium');
  };

  // For Taxonium component, we need to convert the tree structure into the format it expects
  const prepareTaxoniumData = () => {
    if (!treeData || !newickData) return null;
    
    // For Taxonium we need to format the data as a JSON representation of nodes in a specific format
    const formatTaxoniumData = (node: PhyloNodeData, parentId: string | null = null): any[] => {
      const result: any[] = [];
      
      // Create main node entry
      const nodeData = {
        id: node.id,
        name: node.name || node.id,
        parent: parentId,
        children: node.children?.map(child => child.id) || [],
        branch_length: node.length || 0, // Use length instead of branch_length
        x: 0, // Taxonium will calculate these positions
        y: 0,
      };
      
      result.push(nodeData);
      
      // Add all children recursively
      if (node.children) {
        for (const child of node.children) {
          result.push(...formatTaxoniumData(child, node.id));
        }
      }
      
      return result;
    };
    
    return formatTaxoniumData(treeData);
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
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Tree Visualization</Typography>
            
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
                  label="D3 Visualization" 
                />
                <FormControlLabel 
                  value="taxonium" 
                  control={<Radio />} 
                  label="Taxonium" 
                />
              </RadioGroup>
            </FormControl>
          </Box>
          
          <Box sx={{ height: 600, width: '100%', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
            {visualizationMode === 'native' ? (
              <TaxoniumViewer 
                treeData={treeData}
                width={1100}
                height={580}
                colorBy="none"
              />
            ) : (
              <TaxoniumIframeWrapper
                treeData={prepareTaxoniumData()}
                newick={newickData}
              />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default PhylogeneticAnalysis; 