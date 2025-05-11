import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SelectChangeEvent,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { analyzeData, handleApiError } from '../../services/api';

// Analysis types
const ANALYSIS_TYPES = [
  { value: 'basic', label: 'Basic Network Analysis' },
  { value: 'hierarchical', label: 'Hierarchical Analysis' },
  { value: 'evolutionary', label: 'Evolutionary Analysis' },
  { value: 'functional', label: 'Functional Analysis' },
  { value: 'clustering', label: 'Clustering Analysis' },
];

interface AnalysisPageProps {}

const AnalysisPage: React.FC<AnalysisPageProps> = () => {
  const { dataId } = useParams<{ dataId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<string>('basic');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  // Load analysis data
  useEffect(() => {
    if (!dataId) {
      setError('No data ID provided');
      setLoading(false);
      return;
    }
    
    performAnalysis(analysisType);
  }, [dataId, analysisType]);
  
  const performAnalysis = async (type: string) => {
    if (!dataId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeData(dataId, type);
      setAnalysisResults(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };
  
  const handleAnalysisTypeChange = (event: SelectChangeEvent) => {
    setAnalysisType(event.target.value);
  };
  
  const handleVisualizeClick = () => {
    navigate(`/visualize/${dataId}`);
  };
  
  // Renders the appropriate analysis results based on the type
  const renderAnalysisResults = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
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
    
    if (!analysisResults) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No analysis results available
        </Alert>
      );
    }
    
    // Render results based on analysis type
    switch (analysisType) {
      case 'basic':
        return renderBasicAnalysis();
      case 'hierarchical':
        return renderHierarchicalAnalysis();
      case 'evolutionary':
        return renderEvolutionaryAnalysis();
      case 'functional':
        return renderFunctionalAnalysis();
      case 'clustering':
        return renderClusteringAnalysis();
      default:
        return (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Unknown analysis type: {analysisType}
          </Alert>
        );
    }
  };
  
  const renderBasicAnalysis = () => {
    const { metrics, centrality, edge_types } = analysisResults;
    
    return (
      <Grid container spacing={3}>
        {/* Graph Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Graph Metrics
              </Typography>
              {metrics && (
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Node Count" 
                      secondary={metrics.node_count || 0} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Edge Count" 
                      secondary={metrics.edge_count || 0} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Graph Density" 
                      secondary={(metrics.density || 0).toFixed(4)} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Connected Components" 
                      secondary={metrics.connected_components || 0} 
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Centrality Measures */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Centrality Measures
              </Typography>
              {centrality && centrality.degree && centrality.degree.length > 0 ? (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Degree Centrality (Top Nodes)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {centrality.degree.slice(0, 5).map((node: any, index: number) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText 
                              primary={node.label || node.id} 
                              secondary={`Score: ${node.score.toFixed(4)}`} 
                            />
                          </ListItem>
                          {index < 4 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No centrality data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Edge Types Distribution */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Relationship Types
              </Typography>
              {edge_types && Object.keys(edge_types).length > 0 ? (
                <Grid container spacing={2}>
                  {Object.entries(edge_types).map(([type, count]) => (
                    <Grid item xs={12} sm={6} md={4} key={type}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body1">{type}</Typography>
                          <Typography variant="h6" color="primary">{String(count)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No relationship type data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  const renderHierarchicalAnalysis = () => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Hierarchical Analysis Results
          </Typography>
          <pre style={{ overflowX: 'auto' }}>
            {JSON.stringify(analysisResults, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };
  
  const renderEvolutionaryAnalysis = () => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Evolutionary Analysis Results
          </Typography>
          <pre style={{ overflowX: 'auto' }}>
            {JSON.stringify(analysisResults, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };
  
  const renderFunctionalAnalysis = () => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Functional Analysis Results
          </Typography>
          <pre style={{ overflowX: 'auto' }}>
            {JSON.stringify(analysisResults, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };
  
  const renderClusteringAnalysis = () => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Clustering Analysis Results
          </Typography>
          <pre style={{ overflowX: 'auto' }}>
            {JSON.stringify(analysisResults, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Data Analysis
        </Typography>
        
        <Card sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="analysis-type-label">Analysis Type</InputLabel>
                <Select
                  labelId="analysis-type-label"
                  value={analysisType}
                  onChange={handleAnalysisTypeChange}
                  label="Analysis Type"
                  disabled={loading}
                >
                  {ANALYSIS_TYPES.map((type) => (
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
                startIcon={<VisibilityIcon />}
                onClick={handleVisualizeClick}
                disabled={loading || !dataId}
              >
                Visualize This Data
              </Button>
            </Grid>
          </Grid>
        </Card>
        
        <Box className="analysis-results">
          {renderAnalysisResults()}
        </Box>
      </Box>
    </Container>
  );
};

export default AnalysisPage; 