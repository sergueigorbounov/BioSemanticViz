import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import { searchOrthologues, OrthologueSearchResponse } from '../../api/orthologueClient';
import OrthologueResults from './OrthologueResults';

const OrthologueSearch: React.FC = () => {
  const [geneId, setGeneId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<OrthologueSearchResponse | null>(null);

  const handleSearch = async () => {
    if (!geneId) {
      setError('Please enter a gene ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const results = await searchOrthologues(geneId);
      setSearchResults(results);
      if (!results.success) {
        setError(results.message || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching for orthologues:', err);
      setError('Failed to search for orthologues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Orthologue Search
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Enter a gene ID to find orthologues and visualize their distribution across species.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={6}>
            <TextField
              fullWidth
              label="Gene ID"
              variant="outlined"
              value={geneId}
              onChange={(e) => setGeneId(e.target.value)}
              placeholder="e.g., Aco000536.1"
              InputProps={{
                endAdornment: loading ? (
                  <CircularProgress size={24} />
                ) : null,
              }}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={loading || !geneId}
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="textSecondary">
              Example gene IDs: Aco000536.1, AT1G01010.1, Traes_4AL_F00707FAF.1
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {searchResults && (
        <OrthologueResults results={searchResults} />
      )}
    </Box>
  );
};

export default OrthologueSearch; 