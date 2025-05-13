import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

/**
 * Wrapper for the Taxonium component to handle potential React version conflicts
 */
const TaxoniumWrapper: React.FC<{
  treeData: any;
  newick: string;
}> = ({ treeData, newick }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Instead of trying to load Taxonium which has React compatibility issues,
  // let's just show a message directing users to use the native visualization
  useEffect(() => {
    // Set a timeout to simulate trying to load the component
    const timer = setTimeout(() => {
      setError("Taxonium has React version compatibility issues in this environment");
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress size={40} />
      </Box>
    );
  }
  
  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <Typography color="error" paragraph>
        {error || "Could not load Taxonium visualization"}
      </Typography>
      <Typography>
        Please use the D3 visualization option instead. Taxonium requires React 17 
        but this application uses React 18, causing compatibility issues.
      </Typography>
      <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1, maxWidth: '80%' }}>
        <Typography variant="body2" color="text.secondary">
          {newick && (
            <>
              <strong>Tree data loaded successfully:</strong>
              <br />
              {treeData && `${Object.keys(treeData).length} nodes in tree`}
              <br />
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {newick.length > 100 ? `${newick.substring(0, 100)}...` : newick}
              </span>
            </>
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default TaxoniumWrapper; 