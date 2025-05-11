import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Paper,
  Alert,
  AlertTitle,
} from '@mui/material';

const VisualizePage: React.FC = () => {
  const { dataId } = useParams<{ dataId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate data loading
    const fetchData = async () => {
      try {
        // In a real app, you would fetch data here
        // For example: const data = await visualizeData(dataId as string, 'network');
        console.log(`Loading visualization for dataset: ${dataId}`);
        
        // Simulate loading delay
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError('Error loading visualization data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [dataId]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading visualization...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Visualization
        </Typography>
        
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dataset ID: {dataId}
          </Typography>
          
          <Box 
            sx={{ 
              mt: 4, 
              height: '500px', 
              bgcolor: '#f5f5f5', 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body1" color="textSecondary">
              Visualization placeholder. Connect to a real data visualization API.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VisualizePage; 