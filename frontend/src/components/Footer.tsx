import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
        borderTop: '1px solid',
        borderColor: (theme) => theme.palette.grey[300],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}
          {' BioSemanticViz - Open Source Biological Data Visualization Platform'}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          <Link color="inherit" href="https://github.com/yourusername/BioSemanticViz" target="_blank" rel="noopener">
            GitHub
          </Link>
          {' | '}
          <Link color="inherit" href="#/documentation" target="_blank" rel="noopener">
            Documentation
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 