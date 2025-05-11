import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Chip, 
  CircularProgress 
} from '@mui/material';
import { Gene } from '../../types/biology';

interface GeneDetailsProps {
  gene: Gene | null;
}

const GeneDetails: React.FC<GeneDetailsProps> = ({ gene }) => {
  if (!gene) {
    return (
      <Paper sx={{ p: 3, height: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom color="textSecondary">
          No Gene Selected
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Select a gene from the tree to view its details
        </Typography>
      </Paper>
    );
  }

  const {
    id,
    name,
    symbol,
    species,
    description,
    sequence,
    functions = [],
    goTerms = [],
    orthogroups = [],
  } = gene;

  return (
    <Paper sx={{ p: 3, height: '600px', overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {symbol || name}
      </Typography>
      
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {id} • {species}
      </Typography>
      
      {description && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body2">
            {description}
          </Typography>
        </Box>
      )}
      
      {functions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Functions
          </Typography>
          <List disablePadding>
            {functions.map((func, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider component="li" />}
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText primary={func} />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
      
      {goTerms.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            GO Terms
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {goTerms.map((term, index) => (
              <Chip 
                key={index} 
                label={term.id} 
                size="small" 
                color={term.category === 'biological_process' ? 'success' : 
                       term.category === 'molecular_function' ? 'primary' : 
                       'secondary'} 
                title={term.name}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {orthogroups.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Orthogroups
          </Typography>
          <List disablePadding>
            {orthogroups.map((orthogroup, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider component="li" />}
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText 
                    primary={orthogroup.id} 
                    secondary={`${orthogroup.species_count} species, ${orthogroup.gene_count} genes`} 
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
      
      {sequence && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sequence
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              fontFamily: 'monospace', 
              fontSize: '0.75rem',
              maxHeight: '150px',
              overflow: 'auto',
              wordBreak: 'break-all'
            }}
          >
            {sequence}
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default GeneDetails; 