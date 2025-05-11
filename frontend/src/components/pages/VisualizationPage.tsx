import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  SelectChangeEvent,
} from '@mui/material';
import { visualizeData, handleApiError } from '../../services/api';
import PhylogeneticTree from '../visualizations/PhylogeneticTree';
import NetworkGraph from '../visualizations/NetworkGraph';

// Visualization types
const VIZ_TYPES = [
  { value: 'phylogenetic_tree', label: 'Phylogenetic Tree' },
  { value: 'network_graph', label: 'Network Graph' },
  { value: 'hierarchy_visualization', label: 'Hierarchy View' },
  { value: 'cluster_visualization', label: 'Cluster View' },
];

interface VisualizationPageProps {}

const VisualizationPage: React.FC<VisualizationPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vizType, setVizType] = useState<string>('phylogenetic_tree');
  const [visualizationData, setVisualizationData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  
  const loadVisualization = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await visualizeData(id, vizType);
      setVisualizationData(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id, vizType]);
  
  // Load visualization on component mount or when parameters change
  useEffect(() => {
    if (id) {
      loadVisualization();
    } else {
      setError('No data ID provided');
    }
  }, [id, vizType, loadVisualization]);
  
  const handleVisualizationTypeChange = (event: SelectChangeEvent) => {
    setVizType(event.target.value);
  };
  
  const handleTabChange = (_: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleAnalyzeClick = () => {
    navigate(`/analysis/${id}`);
  };
  
  // Render the appropriate visualization based on type
  const renderVisualization = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="500px">
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }
    
    if (!visualizationData) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No visualization data available
        </Alert>
      );
    }
    
    switch (vizType) {
      case 'phylogenetic_tree':
        return (
          <Box className="visualization-container">
            <PhylogeneticTree data={visualizationData.tree_data} />
          </Box>
        );
      case 'network_graph':
        return (
          <Box className="visualization-container">
            {visualizationData.nodes && visualizationData.edges ? (
              <NetworkGraph 
                nodes={visualizationData.nodes} 
                edges={visualizationData.edges} 
              />
            ) : (
              <Typography variant="body1" sx={{ p: 2 }}>
                Invalid network graph data format
              </Typography>
            )}
          </Box>
        );
      case 'hierarchy_visualization':
        // In a real implementation, this would render a hierarchy visualization component
        return (
          <Box className="visualization-container">
            <Typography variant="body1" sx={{ p: 2 }}>
              Hierarchy Visualization (Implementation not shown in this example)
            </Typography>
          </Box>
        );
      case 'cluster_visualization':
        // In a real implementation, this would render a cluster visualization component
        return (
          <Box className="visualization-container">
            <Typography variant="body1" sx={{ p: 2 }}>
              Cluster Visualization (Implementation not shown in this example)
            </Typography>
          </Box>
        );
      default:
        return (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Unknown visualization type: {vizType}
          </Alert>
        );
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Visualization
        </Typography>
        
        <Grid container spacing={3}>
          {/* Visualization Controls */}
          <Grid item xs={12}>
            <Card sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel id="viz-type-label">Visualization Type</InputLabel>
                    <Select
                      labelId="viz-type-label"
                      value={vizType}
                      onChange={handleVisualizationTypeChange}
                      label="Visualization Type"
                      disabled={loading}
                    >
                      {VIZ_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={8} textAlign="right">
                  <Button
                    variant="outlined"
                    onClick={handleAnalyzeClick}
                    disabled={loading || !id}
                  >
                    Analyze This Data
                  </Button>
                </Grid>
              </Grid>
            </Card>
          </Grid>
          
          {/* Visualization */}
          <Grid item xs={12}>
            {renderVisualization()}
          </Grid>
          
          {/* Details and Metadata */}
          {visualizationData && !loading && !error && (
            <Grid item xs={12}>
              <Card sx={{ mt: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab label="Details" />
                  <Tab label="Metadata" />
                  <Tab label="Statistics" />
                </Tabs>
                
                <Box sx={{ p: 3 }}>
                  {activeTab === 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Visualization Details
                      </Typography>
                      <Typography variant="body2">
                        Format: {visualizationData.format || 'Unknown'}
                      </Typography>
                      <Typography variant="body2">
                        Node Count: {visualizationData.node_count || 'Unknown'}
                      </Typography>
                    </Box>
                  )}
                  
                  {activeTab === 1 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Metadata
                      </Typography>
                      <pre>
                        {visualizationData.metadata ? 
                          JSON.stringify(visualizationData.metadata, null, 2) : 
                          'No metadata available'}
                      </pre>
                    </Box>
                  )}
                  
                  {activeTab === 2 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Statistics
                      </Typography>
                      <pre>
                        {visualizationData.statistics ? 
                          JSON.stringify(visualizationData.statistics, null, 2) : 
                          'No statistics available'}
                      </pre>
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default VisualizationPage; 