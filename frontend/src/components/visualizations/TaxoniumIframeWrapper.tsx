import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

interface TaxoniumIframeWrapperProps {
  treeData: any;
  newick: string;
}

const TaxoniumIframeWrapper: React.FC<TaxoniumIframeWrapperProps> = ({ treeData, newick }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);

  // Handle messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check - only accept messages from our iframe
      if (!event.origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'TAXONIUM_IFRAME_LOADED') {
        console.log('Taxonium iframe is loaded and ready');
        setIframeReady(true);
      } else if (event.data?.type === 'TAXONIUM_READY') {
        console.log('Taxonium component initialized with data');
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Send tree data to the iframe when it's ready and we have data
  useEffect(() => {
    if (iframeReady && treeData && newick && iframeRef.current) {
      const message = {
        type: 'INIT_TAXONIUM',
        treeData,
        newick
      };

      iframeRef.current.contentWindow?.postMessage(message, '*');
    }
  }, [iframeReady, treeData, newick]);

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {loading && (
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
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography>Loading Taxonium visualization...</Typography>
          </Box>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <iframe
        ref={iframeRef}
        src="http://localhost:3002"
        style={{
          width: '100%',
          height: '600px',
          border: 'none',
          overflow: 'hidden'
        }}
        title="Taxonium Tree Visualization"
      />
    </Box>
  );
};

export default TaxoniumIframeWrapper; 