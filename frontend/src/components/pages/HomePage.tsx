import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  Alert,
  Snackbar,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DataObjectIcon from '@mui/icons-material/DataObject';
import BiotechIcon from '@mui/icons-material/Biotech';

const features = [
  {
    title: 'Semantic Data Ingestion',
    description: 'Upload and process RDF/TTL files with ontological information, extracting meaningful semantic relationships.',
    icon: <DataObjectIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Intelligent Reasoning',
    description: 'Analyze biological data using advanced hierarchical mapping and evolutionary relationship tracking.',
    icon: <BiotechIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Interactive Visualization',
    description: 'Explore complex biological structures through dynamic, interactive visualizations tailored to your data.',
    icon: <VisibilityIcon fontSize="large" color="primary" />,
  },
];

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showStatusAlert, setShowStatusAlert] = useState<boolean>(false);

  const handleUploadClick = () => {
      navigate('/upload');
  };

  const handleCloseAlert = () => {
    setShowStatusAlert(false);
  };

  return (
    <Container>
      {/* Server Status Alert - only show if explicitly needed */}
      <Snackbar 
        open={showStatusAlert} 
        autoHideDuration={10000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={handleCloseAlert}>
          Backend server is not running. Please start the backend server to use the application.
        </Alert>
      </Snackbar>

      {/* Hero Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            mb: 3,
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          BioSemanticViz
        </Typography>
        <Typography variant="h5" component="h2" color="textSecondary" sx={{ mb: 4, maxWidth: '800px' }}>
          Transform complex biological data into actionable insights through semantic reasoning and interactive visualization
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<CloudUploadIcon />}
          onClick={handleUploadClick}
          sx={{ borderRadius: '50px', px: 4 }}
        >
          Upload Data
        </Button>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 6 }}>
        <Typography variant="h3" component="h3" sx={{ mb: 5, textAlign: 'center' }}>
          Key Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography gutterBottom variant="h5" component="h3">
                    {feature.title}
                  </Typography>
                  <Typography>{feature.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Getting Started Section */}
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h3" sx={{ mb: 3 }}>
          Getting Started
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, maxWidth: '700px', mx: 'auto' }}>
          Start by uploading your biological data file in RDF/TTL format. Our platform will process the data, extract semantic relationships, and provide you with powerful visualization and analysis capabilities.
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={handleUploadClick}
          sx={{ m: 1 }}
        >
          Upload Data
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage; 