import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { uploadData, handleApiError } from '../../services/api';

const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check file type
      if (selectedFile.name.endsWith('.ttl') || 
          selectedFile.name.endsWith('.rdf') || 
          selectedFile.name.endsWith('.owl')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a valid ontology file (.ttl, .rdf, or .owl)');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check file type
      if (droppedFile.name.endsWith('.ttl') || 
          droppedFile.name.endsWith('.rdf') || 
          droppedFile.name.endsWith('.owl')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a valid ontology file (.ttl, .rdf, or .owl)');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Declare and initialize progressInterval so it's defined in the catch block
    let progressInterval: ReturnType<typeof setInterval> = undefined as unknown as ReturnType<typeof setInterval>;
    
    try {
      setUploading(true);
      setError(null);
      
      // Simulate upload progress (in a real app, you might get this from the upload request)
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Make direct XMLHttpRequest instead of using Axios
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:8001/upload', true);
      
      // Add CORS headers
      xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
      xhr.setRequestHeader('Access-Control-Allow-Methods', 'POST');
      xhr.setRequestHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      xhr.onload = function() {
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          // Navigate to visualization page with the dataset ID
          setTimeout(() => {
            navigate(`/visualize/${result.id}`);
          }, 500);
        } else {
          setError(`Server error: ${xhr.status} ${xhr.statusText}`);
        }
        setUploading(false);
      };
      
      xhr.onerror = function() {
        clearInterval(progressInterval);
        setUploadProgress(0);
        setError('Connection error. Please ensure the backend server is running.');
        setUploading(false);
      };
      
      xhr.timeout = 20000; // 20 seconds (increased timeout)
      xhr.ontimeout = function() {
        clearInterval(progressInterval);
        setUploadProgress(0);
        setError('Request timed out. Please try again.');
        setUploading(false);
      };
      
      xhr.send(formData);
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setError('An unexpected error occurred. Please try again.');
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: 4, pb: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Upload Your Biological Data
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        <Paper 
          elevation={1}
          sx={{ 
            p: 4, 
            borderRadius: 2,
            backgroundColor: '#fafafa',
            border: '1px solid #eaeaea'
          }}
        >
          <Box 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="upload-container"
            sx={{
              borderStyle: 'dashed',
              borderWidth: 2,
              borderRadius: 2,
              borderColor: file ? 'primary.main' : 'grey.400',
              p: 6,
              textAlign: 'center',
              cursor: 'pointer',
              mb: 3,
              transition: 'all 0.3s ease',
              bgcolor: file ? 'rgba(33, 150, 243, 0.04)' : 'transparent',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(33, 150, 243, 0.04)',
              }
            }}
          >
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              ref={fileInputRef}
              accept=".ttl,.rdf,.owl"
            />
            
            <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              {file ? file.name : 'Drag & Drop your file here'}
            </Typography>
            
            <Typography variant="body2" color="textSecondary">
              {file 
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
                : 'Supported formats: .ttl, .rdf, .owl'}
            </Typography>
            
            {!file && (
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse Files
              </Button>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {file && (
              <Button 
                variant="outlined" 
                onClick={handleCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
            )}
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={!file || uploading}
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {uploading ? `Uploading (${uploadProgress}%)` : 'Upload'}
            </Button>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            About Data Upload
          </Typography>
          
          <Typography variant="body2" paragraph>
            BioSemanticViz accepts biological data in RDF formats such as Turtle (.ttl), RDF/XML (.rdf), or OWL (.owl) files.
            These files typically contain ontological information with biological entities, relationships, and annotations.
          </Typography>
          
          <Typography variant="body2">
            Examples of suitable data include Gene Ontology annotations, protein-protein interaction networks,
            taxonomical hierarchies, or any biological data represented in semantic web formats.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default UploadPage; 