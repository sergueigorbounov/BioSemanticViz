import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Chip
} from '@mui/material';
import { Gene, GoTerm, Orthogroup, ExternalLink } from '../../types/biology';

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
    label,
    species_id,
    species_name,
    description,
    sequence,
    functions = [],
    go_terms = [],
    external_links = [],
  } = gene;

  return (
    <Paper sx={{ p: 3, height: '600px', overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {label || name || id}
      </Typography>
      
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {id} • {species_name || species_id}
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
      
      {functions && functions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Functions
          </Typography>
          <List disablePadding>
            {functions.map((func: string, index: number) => (
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
      
      {go_terms && go_terms.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            GO Terms
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {go_terms.map((term: GoTerm, index: number) => (
              <Chip 
                key={index} 
                label={term.id} 
                size="small" 
                color={term.aspect === 'P' ? 'success' : 
                       term.aspect === 'F' ? 'primary' : 
                       'secondary'} 
                title={term.name}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {external_links && external_links.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            External Links
          </Typography>
          <List disablePadding>
            {external_links.map((link: ExternalLink, index: number) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider component="li" />}
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText 
                    primary={link.database} 
                    secondary={
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.id}
                      </a>
                    } 
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