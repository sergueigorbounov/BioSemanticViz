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
  Divider,
  Alert
} from '@mui/material';
import { OrthologueSearchResponse, OrthoSpeciesCount } from '../../api/orthologueClient';
import OrthologueVisualizer from './OrthologueVisualizer';

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

// Define an OrthologueEntry type for rendering the table
interface OrthologueEntry {
  gene_id: string;
  species_name: string;
  species_id: string;
  orthogroup_id: string;
}

const OrthologueResults: React.FC<OrthologueResultsProps> = ({ results }) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (results.data) {
      setLoading(false);
    }
  }, [results]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // No data to display
  if (!results.success || !results.counts_by_species) {
    return (
      <Alert severity="info">
        No orthologue data available to display.
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Orthologue Information</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body1">
                  <strong>Orthogroup:</strong> {results.orthogroup_id || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Orthologues:</strong> {results.total_count || 0}
                </Typography>
                <Typography variant="body1">
                  <strong>Species Count:</strong> {results.counts_by_species?.length || 0}
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
                  .map((species: OrthoSpeciesCount, index: number) => (
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
          <Tab label="Species Summary" />
          <Tab label="Phylogenetic Tree" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Species Name</TableCell>
                  <TableCell>Species ID</TableCell>
                  <TableCell>Orthologue Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.counts_by_species.map((species: OrthoSpeciesCount, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{species.species_name}</TableCell>
                    <TableCell>{species.species_id}</TableCell>
                    <TableCell>{species.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: '600px', width: '100%' }}>
            <OrthologueVisualizer 
              orthologues={results}
              newickTree={results.data && results.data.length > 0 ? results.data[0] : null}
              loading={loading}
            />
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default OrthologueResults;