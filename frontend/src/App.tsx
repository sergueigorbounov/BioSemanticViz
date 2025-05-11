import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Container } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import BackendStatus from './components/BackendStatus';
// Define theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <BackendStatus />
        <Header />
        <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
          <Outlet />
        </Container>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App; 