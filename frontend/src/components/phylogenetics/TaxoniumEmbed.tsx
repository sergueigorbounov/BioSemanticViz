import React from 'react';
import { Box, Typography } from '@mui/material';
import TaxoniumWrapper from './TaxoniumWrapper';

interface TaxoniumEmbedProps {
  data: any;
  initialSettings?: {
    colorBy?: string;
    nodeSize?: string;
    searchTerm?: string;
    showTransmissionLines?: boolean;
  };
}

// This is a backward compatibility wrapper for any code that still uses the old TaxoniumEmbed component
export const TaxoniumEmbed: React.FC<TaxoniumEmbedProps> = ({ data, initialSettings }) => {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <TaxoniumWrapper
        treeData={data}
        initialSettings={{
          colorBy: initialSettings?.colorBy || 'none',
          nodeSize: initialSettings?.nodeSize || 'none',
          searchTerm: initialSettings?.searchTerm || '',
          showTransmissionLines: initialSettings?.showTransmissionLines || false,
        }}
      />
    </Box>
  );
};

export default TaxoniumEmbed; 