import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { fetchSpeciesTree } from '../../services/api';
import { SpeciesTreeData } from '../../types/biology';
import SpeciesTree from '../visualizations/SpeciesTree';

const BiologyHierarchyPage: React.FC = () => {
  const [treeData, setTreeData] = useState<SpeciesTreeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchSpeciesTree();
        setTreeData(data);
        setError(null);
      } catch (err) {
        setError('Error loading species hierarchy. Please try again later.');
        console.error('Error fetching species tree:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSpeciesSelect = (speciesId: string) => {
    console.log('Species selected:', speciesId);
    // In a real app, you would load detailed data for this species
  };

  const handleOrthogroupSelect = (orthogroupId: string) => {
    console.log('Orthogroup selected:', orthogroupId);
    // In a real app, you would load genes for this orthogroup
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Biological Data Hierarchy
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Explore the relationships between species, orthogroups, and genes in a hierarchical view
        </Typography>
      </Paper>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Paper>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Tree visualization */}
          <Grid item xs={12}>
            <SpeciesTree 
              treeData={treeData}
              onSpeciesSelect={handleSpeciesSelect}
              onOrthogroupSelect={handleOrthogroupSelect}
            />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default BiologyHierarchyPage; 