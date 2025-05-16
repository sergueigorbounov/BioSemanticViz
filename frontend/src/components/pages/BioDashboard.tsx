import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  Button,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  PieLabelRenderProps
} from 'recharts';

// Create API client with base URL
const apiClient = axios.create({
  baseURL: 'http://localhost:8002/api',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
});

interface DashboardStats {
  speciesCount: number;
  orthogroupCount: number;
  geneCount: number;
  annotationCount: number;
  speciesDistribution: Array<{ name: string; value: number }>;
  genesByOrthogroup: Array<{ name: string; genes: number }>;
  orthogroupConnectivity: Array<{ name: string; value: number }>;
  taxonomyDistribution: Array<{ name: string; value: number }>;
  goTermDistribution: { [category: string]: number };
}

const BioDashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#8dd1e1'
  ];

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get dashboard stats from the API
        const response = await apiClient.get('/dashboard/stats');
        
        if (response.data?.success) {
          setStats(response.data.data);
        } else {
          throw new Error(response.data?.message || 'Failed to load dashboard data');
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExportData = () => {
    if (!stats) return;
    
    // Create a JSON string of the stats
    const dataStr = JSON.stringify(stats, null, 2);
    
    // Create a download link and trigger it
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bio_dashboard_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Type-safe label renderer for pie chart
  const renderPieLabel = (props: PieLabelRenderProps) => {
    const { name, percent } = props;
    return `${name}: ${(percent ? (percent * 100).toFixed(0) : '0')}%`;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Biological Data Dashboard
          </Typography>
          <Button 
            variant="outlined"
            onClick={handleExportData}
            disabled={!stats}
          >
            Export Data
          </Button>
        </Box>
        
        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>Species</Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
                {stats?.speciesCount || 0}
              </Typography>
              <Typography variant="body2">Total species in database</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'secondary.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>Orthogroups</Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
                {stats?.orthogroupCount || 0}
              </Typography>
              <Typography variant="body2">Evolutionary conserved groups</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'success.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>Genes</Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
                {stats?.geneCount || 0}
              </Typography>
              <Typography variant="body2">Total gene entries</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'info.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>Annotations</Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
                {stats?.annotationCount || 0}
              </Typography>
              <Typography variant="body2">Functional annotations</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Tabs for different views */}
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Distribution" />
            <Tab label="Connectivity" />
            <Tab label="Ontology" />
          </Tabs>
          
          {/* Distribution Tab */}
          <Box sx={{ p: 3 }} hidden={activeTab !== 0}>
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardHeader title="Genes by Orthogroup" />
                    <CardContent sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats?.genesByOrthogroup || []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end"
                            height={80} 
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="genes" fill={theme.palette.primary.main} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardHeader title="Taxonomy Distribution" />
                    <CardContent sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats?.taxonomyDistribution || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={renderPieLabel}
                          >
                            {stats?.taxonomyDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
          
          {/* Connectivity Tab */}
          <Box sx={{ p: 3 }} hidden={activeTab !== 1}>
            {activeTab === 1 && (
              <Card>
                <CardHeader title="Orthogroup Connectivity" />
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    This chart shows the evolutionary connectivity between orthogroups across species.
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats?.orthogroupConnectivity || []}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill={theme.palette.secondary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
          
          {/* Ontology Tab */}
          <Box sx={{ p: 3 }} hidden={activeTab !== 2}>
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Gene Ontology Distribution" />
                    <CardContent>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom>
                          Distribution of Gene Ontology (GO) terms across different categories
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 3 }} />
                      <Grid container spacing={2}>
                        {stats && Object.entries(stats.goTermDistribution).map(([category, count], index) => (
                          <Grid item xs={12} md={4} key={category}>
                            <Box 
                              sx={{ 
                                p: 3, 
                                bgcolor: COLORS[index % COLORS.length] + '20', 
                                borderRadius: 2,
                                border: `1px solid ${COLORS[index % COLORS.length]}`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                              }}
                            >
                              <Typography variant="h5" gutterBottom fontWeight="bold">
                                {count}
                              </Typography>
                              <Chip 
                                label={category} 
                                variant="outlined" 
                                size="small"
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default BioDashboard; 