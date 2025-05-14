import React from 'react';
import { Tab, Tabs, Box } from '@mui/material';
import PhylogeneticTreeView from './PhylogeneticTreeView';
import TaxoniumOrthologueView from './TaxoniumOrthologueView';
import { OrthologueSearchResponse } from '../../api/orthologueClient';

interface OrthologueVisualizerProps {
  orthologues: OrthologueSearchResponse | null;
  newickTree: string | null;
  loading: boolean;
}

const OrthologueVisualizer: React.FC<OrthologueVisualizerProps> = ({ 
  orthologues, 
  newickTree,
  loading
}) => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Phylogenetic Tree" />
          <Tab label="Taxonium View" />
        </Tabs>
      </Box>
      <Box sx={{ pt: 2 }}>
        {tabValue === 0 && (
          <PhylogeneticTreeView 
            orthologues={orthologues} 
            newickTree={newickTree} 
            loading={loading} 
          />
        )}
        {tabValue === 1 && (
          <TaxoniumOrthologueView 
            orthologues={orthologues} 
            newickTree={newickTree} 
            loading={loading} 
          />
        )}
      </Box>
    </Box>
  );
};

export default OrthologueVisualizer; 