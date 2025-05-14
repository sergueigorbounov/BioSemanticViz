import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { OrthologueSearchResponse } from '../../api/orthologueClient';
import TaxoniumWrapper from '../phylogenetics/TaxoniumWrapper';

interface TaxoniumOrthologueViewProps {
  orthologues: OrthologueSearchResponse | null;
  newickTree: string | null;
  loading: boolean;
}

const TaxoniumOrthologueView: React.FC<TaxoniumOrthologueViewProps> = ({
  orthologues,
  loading,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!orthologues || !orthologues.success) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No orthologues data available for visualization</Typography>
      </Box>
    );
  }

  if (!orthologues.taxonium_tree) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Taxonium data is not available for this orthologues search.
          Please try a different search or use the phylogenetic tree view.
        </Alert>
      </Box>
    );
  }

  // Validate basic taxonium tree structure
  const isTaxoniumTreeValid = 
    typeof orthologues.taxonium_tree === 'object' && 
    (orthologues.taxonium_tree.nodes || Array.isArray(orthologues.taxonium_tree));

  if (!isTaxoniumTreeValid) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          The tree data structure is invalid. Please try using the phylogenetic tree view instead.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '600px', width: '100%' }}>
      <TaxoniumWrapper
        treeData={orthologues.taxonium_tree}
        initialSettings={{
          colorBy: 'none',
          nodeSize: 'none',
          searchTerm: '',
          showTransmissionLines: false,
        }}
      />
    </Box>
  );
};

export default TaxoniumOrthologueView; 