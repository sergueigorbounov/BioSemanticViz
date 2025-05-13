import React from 'react';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import OrthologueSearch from '../orthologues/OrthologueSearch';

const OrthologuePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gene Orthologue Search
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Search for orthologous genes across different species and visualize their phylogenetic relationships.
          Enter a gene ID to find its orthogroup members and view their distribution in the species tree.
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Paper elevation={2} sx={{ p: 0, mt: 3 }}>
          <OrthologueSearch />
        </Paper>
      </Box>
    </Container>
  );
};

export default OrthologuePage; 