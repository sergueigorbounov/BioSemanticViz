import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { OrthologueSearchResponse } from '../../api/orthologueClient';
import PhylogeneticTreeView from './PhylogeneticTreeView';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`orthologue-tabpanel-${index}`}
      aria-labelledby={`orthologue-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface OrthologueResultsProps {
  results: OrthologueSearchResponse;
}

const OrthologueResults: React.FC<OrthologueResultsProps> = ({ results }) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [treeData, setTreeData] = useState<any | null>(null);

  useEffect(() => {
    // Convert Newick tree data for visualization if available
    if (results.newick_tree) {
      // Simple mock tree structure - the PhylogeneticTreeView component 
      // should handle conversion from Newick to a proper tree structure
      setTreeData({
        newick: results.newick_tree,
        // This is just a placeholder - the component should handle actual conversion
        rootNode: { id: 'root', name: 'root' } 
      });
    }
  }, [results]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Gene Information</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body1">
                  <strong>Gene ID:</strong> {results.gene_id}
                </Typography>
                <Typography variant="body1">
                  <strong>Orthogroup:</strong> {results.orthogroup_id || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Orthologues:</strong> {results.orthologues.length}
                </Typography>
                <Typography variant="body1">
                  <strong>Species Count:</strong> {results.counts_by_species.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Species Distribution</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {results.counts_by_species
                  .sort((a, b) => b.count - a.count)
                  .map((species, index) => (
                    <Chip 
                      key={index}
                      label={`${species.species_name}: ${species.count}`}
                      color={species.count > 1 ? "primary" : "default"}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="orthologue results tabs"
        >
          <Tab label="Orthologues Table" />
          <Tab label="Phylogenetic Tree" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Gene ID</TableCell>
                  <TableCell>Species</TableCell>
                  <TableCell>Species ID</TableCell>
                  <TableCell>Orthogroup</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.orthologues.map((orthologue, index) => (
                  <TableRow key={index}>
                    <TableCell>{orthologue.gene_id}</TableCell>
                    <TableCell>{orthologue.species_name}</TableCell>
                    <TableCell>{orthologue.species_id}</TableCell>
                    <TableCell>{orthologue.orthogroup_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: '500px', width: '100%' }}>
            {treeData ? (
              <PhylogeneticTreeView 
                newickData={results.newick_tree || ''}
                speciesCounts={results.counts_by_species}
              />
            ) : (
              <Typography variant="body1">No phylogenetic tree data available</Typography>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default OrthologueResults; 