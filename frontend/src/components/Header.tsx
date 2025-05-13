import React from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';

// Define the navigation links
const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Upload', path: '/upload' },
  { name: 'Explorer', path: '/explorer' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Phylogenetics', path: '/phylo' },
  { name: 'Orthologues', path: '/orthologues' },
];

const Header: React.FC = () => {
  return (
    <AppBar position="static" sx={{ marginBottom: 2 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box display="flex" alignItems="center">
            <BiotechIcon sx={{ mr: 1, fontSize: '2rem' }} />
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              BioSemanticViz
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            {navLinks.map((link) => (
              <Button
                key={link.name}
                component={Link}
                to={link.path}
                sx={{ color: 'white', mx: 1 }}
              >
                {link.name}
            </Button>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 