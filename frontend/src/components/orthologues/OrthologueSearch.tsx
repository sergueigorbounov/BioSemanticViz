import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Alert, Grid, Paper, Autocomplete, Chip } from '@mui/material';
import { searchOrthologues, searchOrthologuesTaxonium, OrthologueSearchResponse } from '../../api/orthologueClient';
import { species, Species } from '../../data/species';
import OrthologueVisualizer from './OrthologueVisualizer';

const OrthologueSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<OrthologueSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newickTree, setNewickTree] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResult(null);
    
    try {
      // First make a regular search to get basic orthologue data
      const result = await searchOrthologues(searchTerm, selectedSpecies.length > 0 ? selectedSpecies : undefined);
      
      if (!result.success) {
        setError(result.message || 'Error searching orthologues');
        setSearchResult(null);
        setNewickTree(null);
      } else {
        // Then request Taxonium formatted data for visualization
        const taxoniumResult = await searchOrthologuesTaxonium(searchTerm, selectedSpecies.length > 0 ? selectedSpecies : undefined);
        
        if (taxoniumResult.success) {
          // If we got Taxonium data, merge it with the regular search results
          setSearchResult({
            ...result,
            taxonium_tree: taxoniumResult.taxonium_tree
          });
          
          // Get Newick tree from the result if available
          setNewickTree(taxoniumResult.data?.length ? taxoniumResult.data[0] : null);
        } else {
          // If we couldn't get Taxonium data but have regular data, that's fine
          setSearchResult(result);
          setNewickTree(null);
        }
      }
    } catch (err) {
      console.error('Error during orthologue search:', err);
      setError('An error occurred while searching. Please try again.');
      setSearchResult(null);
      setNewickTree(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSpeciesChange = (_: any, newValue: string[]) => {
    setSelectedSpecies(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Orthologue Search
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              label="Search for gene or protein"
              fullWidth
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="E.g. BRCA1, P53, insulin"
              margin="normal"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={species.map((s: Species) => s.name)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const tagProps = getTagProps({ index });
                  // Extract the key from tagProps
                  const { key, ...chipProps } = tagProps;
                  // Pass key directly to Chip
                  return (
                    <Chip
                      key={key}
                      label={option}
                      {...chipProps}
                      size="small"
                    />
                  );
                })
              }
              value={selectedSpecies}
              onChange={handleSpeciesChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Filter by species (optional)"
                  placeholder="Select species"
                  margin="normal"
                  fullWidth
                />
              )}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecies([]);
              setSearchResult(null);
              setError(null);
            }}
            disabled={loading}
          >
            Clear
          </Button>
        </Box>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {searchResult && searchResult.success && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Search Results
            </Typography>
            
            <Typography variant="body1">
              {searchResult.orthogroup_id ? (
                <>Orthogroup: <strong>{searchResult.orthogroup_id}</strong></>
              ) : (
                'No specific orthogroup found'
              )}
            </Typography>
            
            <Typography variant="body1">
              Total orthologues found: <strong>{searchResult.total_count || 0}</strong>
            </Typography>
          </Box>
          
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Phylogenetic Visualization
            </Typography>
            
            <OrthologueVisualizer
              orthologues={searchResult}
              newickTree={newickTree}
              loading={loading}
            />
          </Paper>
        </>
      )}
    </Box>
  );
};

export default OrthologueSearch; 