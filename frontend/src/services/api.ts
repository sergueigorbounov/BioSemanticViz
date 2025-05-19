import axios, { AxiosResponse } from 'axios';
import { Gene, SpeciesTreeData } from '../types/biology';

// Get API URL from environment variables with fallback
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 
                   process.env.VITE_BACKEND_URL || 
                   'http://localhost:8002';

console.log('Using backend URL:', BACKEND_URL);

// Define API response types
export interface ProcessedData {
  id: string;
  nodes: Node[];
  edges: Edge[];
  metadata: Record<string, any>;
  statistics: Record<string, any>;
}

export interface Node {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

export interface Edge {
  source: string;
  target: string;
  type: string;
  label?: string;
}

export interface AnalysisResult {
  metrics?: Record<string, any>;
  centrality?: Record<string, any>;
  hierarchies?: Record<string, any>;
  clusters?: Record<string, any>;
  [key: string]: any;
}

export interface VisualizationResult {
  [key: string]: any;
}

// Create API client
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  timeout: 5000, // 5 seconds timeout (shorter to fail faster)
});

// Add a request interceptor to log all requests
apiClient.interceptors.request.use(
  config => {
    console.log(`API request to ${config.url}`, config);
    return config;
  },
  error => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to log all responses
apiClient.interceptors.response.use(
  response => {
    console.log(`API response from ${response.config.url}:`, response);
    return response;
  },
  error => {
    console.error('API response error:', error);
    return Promise.reject(error);
  }
);

// API methods
export const uploadData = async (file: File): Promise<ProcessedData> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response: AxiosResponse<ProcessedData> = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const analyzeData = async (
  dataId: string,
  analysisType: string,
  parameters: Record<string, any> = {}
): Promise<AnalysisResult> => {
  try {
    const response: AxiosResponse<AnalysisResult> = await apiClient.post('/analyze', {
      dataId: dataId,
      analysisType: analysisType,
      parameters: parameters
    });
    
    return response.data;
  } catch (error) {
    console.error('Error analyzing data:', error);
    throw error;
  }
};

export const visualizeData = async (
  dataId: string,
  vizType: string,
  parameters: Record<string, any> = {}
): Promise<VisualizationResult> => {
  try {
    const response: AxiosResponse<VisualizationResult> = await apiClient.post('/visualize', {
      dataId: dataId,
      visualizationType: vizType,
      parameters: parameters
    });
    
    return response.data;
  } catch (error) {
    console.error('Error visualizing data:', error);
    throw error;
  }
};

export const getExampleDatasets = async (): Promise<string[]> => {
  try {
    const response: AxiosResponse<string[]> = await apiClient.get('/examples');
    return response.data;
  } catch (error) {
    console.error('Error getting examples:', error);
    throw error;
  }
};

// New function to check if the backend is running
export const checkServerStatus = async (): Promise<boolean> => {
  try {
    // Try direct connection first
    const response = await fetch(`${BACKEND_URL}/status`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking server status:', error);
    return false;
  }
};

// Error handling helper
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    if (error.response.data && error.response.data.detail) {
      return `Server error: ${error.response.data.detail}`;
    }
    
    // Handle specific status codes
    switch (error.response.status) {
      case 400:
        return 'Invalid file format or missing parameters. Please check your input.';
      case 404:
        return 'The requested resource was not found on the server.';
      case 500:
        return 'Internal server error. The server encountered an unexpected condition.';
      default:
        return `Server error (${error.response.status}): ${error.response.statusText}`;
    }
  } else if (error.request) {
    // Request was made but no response
    return 'Cannot connect to the server. Please ensure the backend server is running and try again.';
  } else {
    // Something went wrong with the request setup
    return `Error: ${error.message || 'Unknown error occurred'}`;
  }
};

export const fetchSpeciesTree = async (): Promise<SpeciesTreeData> => {
  const response = await axios.get(`${BACKEND_URL}/api/species-tree`);
  return response.data;
};

export const fetchGeneDetails = async (geneId: string): Promise<Gene> => {
  const response = await axios.get(`${BACKEND_URL}/api/gene/${geneId}`);
  return response.data;
};

export const fetchOrthogroupGenes = async (orthogroupId: string): Promise<Gene[]> => {
  const response = await axios.get(`${BACKEND_URL}/api/orthogroup/${orthogroupId}`);
  return response.data;
}; 

export default apiClient; 