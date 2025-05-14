import React, { useState } from 'react';
import { Box, CircularProgress, Typography, Paper, Alert } from '@mui/material';
import TaxoniumIframeWrapper from './TaxoniumIframeWrapper';

interface SimpleTaxoniumWrapperProps {
  treeData: any;
  newick: string;
  width?: string | number;
  height?: string | number;
  onNodeSelect?: (nodeData: any) => void;
  colorBy?: string;
  config?: any;
}

/**
 * A professional wrapper for Taxonium that uses the iframe approach
 * but with enhanced styling and features
 */
const SimpleTaxoniumWrapper: React.FC<SimpleTaxoniumWrapperProps> = ({ 
  treeData, 
  newick,
  width = '100%',
  height = '100%',
  onNodeSelect,
  colorBy = 'clade',
  config = {}
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle successful load
  const handleLoad = () => {
    setLoading(false);
  };

  // Handle error
  const handleError = (errorMsg: string) => {
    setLoading(false);
    setError(errorMsg);
  };

  return (
    <Box 
      sx={{ 
        width, 
        height, 
        position: 'relative',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      {/* Loading indicator */}
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 2
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Initializing scientific visualization...
          </Typography>
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 220, 220, 0.7)',
            zIndex: 2
          }}
        >
          <Paper elevation={3} sx={{ p: 3, maxWidth: '80%' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              Visualization Error
            </Alert>
            <Typography variant="body1">
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Try switching to the basic D3 visualization or check your data format.
            </Typography>
          </Paper>
        </Box>
      )}
      
      {/* Taxonium Component */}
      <TaxoniumIframeWrapper
        treeData={treeData}
        newick={newick}
        onNodeSelect={onNodeSelect}
        showMetadata={config?.showMetadata || true}
        height={height}
        onLoad={handleLoad}
        onError={(err) => handleError(err || "Failed to load visualization")}
      />
    </Box>
  );
};

export default SimpleTaxoniumWrapper; 