import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import SimplifiedTreeView from './SimplifiedTreeView';

// Create a wrapper in plain JSX to avoid TypeScript issues
const TaxoniumWrapper = ({ treeData, initialSettings }) => {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef(null);

  // Force using the fallback implementation due to compatibility issues
  const useFallback = true;

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Validate treeData
    if (!treeData) {
      setError("No tree data provided");
      setIsLoaded(true);
      return;
    }
    
    try {
      // Quick validation - treeData should at least be an object
      if (typeof treeData !== 'object') {
        throw new Error("Tree data is not in a valid format");
      }
      
      // If it has a nodes array, check that it's not empty
      if (treeData.nodes && Array.isArray(treeData.nodes) && treeData.nodes.length === 0) {
        throw new Error("Tree data contains no nodes");
      }
      
      setIsLoaded(true);
    } catch (err) {
      console.error("Error validating tree data:", err);
      setError(err.message || "Invalid tree data format");
      setIsLoaded(true);
    }
  }, [treeData]);

  // Always use the fallback visualization for now
  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%' }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {!isLoaded ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography>Loading visualization...</Typography>
        </Box>
      ) : treeData ? (
        <SimplifiedTreeView treeData={treeData} />
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No phylogenetic tree data available to visualize.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TaxoniumWrapper; 