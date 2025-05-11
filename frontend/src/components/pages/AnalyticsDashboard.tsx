import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Interface definitions
interface Species {
  id: string;
  name: string;
  orthogroups: string[];
  genes: string[];
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
  name: string;
  species: string;
  orthogroup: string;
  sequence: string;
  functions: string[];
}

interface DashboardData {
  speciesCount: number;
  orthogroupCount: number;
  geneCount: number;
  speciesList: Species[];
  orthogroupList: OrthoGroup[];
  geneDistributionBySpecies: { name: string; value: number }[];
  orthogroupSizeDistribution: { name: string; value: number }[];
  genesByFunction: { name: string; value: number }[];
}

// Helper function to generate distribution data
const generateDistributionData = (orthogroups: OrthoGroup[]) => {
  const sizeDistribution: Record<string, number> = {};
  
  orthogroups.forEach(og => {
    const size = og.genes.length;
    const sizeCategory = 
      size <= 5 ? '1-5' :
      size <= 10 ? '6-10' :
      size <= 20 ? '11-20' :
      size <= 50 ? '21-50' : '50+';
    
    sizeDistribution[sizeCategory] = (sizeDistribution[sizeCategory] || 0) + 1;
  });
  
  return Object.entries(sizeDistribution).map(([name, value]) => ({ name, value }));
};

// Helper function to extract gene functions
const extractGeneFunctions = (genes: Gene[]) => {
  const functionCounts: Record<string, number> = {};
  
  genes.forEach(gene => {
    gene.functions.forEach(func => {
      functionCounts[func] = (functionCounts[func] || 0) + 1;
    });
  });
  
  return Object.entries(functionCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 functions
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [speciesRes, orthogroupsRes, genesRes] = await Promise.all([
          axios.get('/api/species'),
          axios.get('/api/orthogroups'),
          axios.get('/api/genes')
        ]);
        
        const species: Species[] = speciesRes.data.data;
        const orthogroups: OrthoGroup[] = orthogroupsRes.data.data;
        const genes: Gene[] = genesRes.data.data;
        
        // Create gene distribution by species
        const geneDistributionBySpecies = species.map(s => ({
          name: s.name,
          value: s.genes.length
        }));
        
        // Create orthogroup size distribution
        const orthogroupSizeDistribution = generateDistributionData(orthogroups);
        
        // Extract gene functions
        const genesByFunction = extractGeneFunctions(genes);
        
        setData({
          speciesCount: species.length,
          orthogroupCount: orthogroups.length,
          geneCount: genes.length,
          speciesList: species,
          orthogroupList: orthogroups,
          geneDistributionBySpecies,
          orthogroupSizeDistribution,
          genesByFunction
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">{error || 'No data available'}</Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Biological Data Analytics Dashboard
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Species
              </Typography>
              <Typography variant="h3">{data.speciesCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Orthogroups
              </Typography>
              <Typography variant="h3">{data.orthogroupCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Genes
              </Typography>
              <Typography variant="h3">{data.geneCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        {/* Gene Distribution by Species */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Genes by Species
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.geneDistributionBySpecies}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" name="Gene Count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Orthogroup Size Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Orthogroup Size Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.orthogroupSizeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.orthogroupSizeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Gene Functions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Gene Functions
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data.genesByFunction}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" name="Gene Count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalyticsDashboard; 